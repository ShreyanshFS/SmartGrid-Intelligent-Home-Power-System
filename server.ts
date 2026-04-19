import 'dotenv/config';
import express from 'express';
import path from 'path';
import net from 'net';
import tls from 'tls';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

interface AlertDevice {
  name: string;
  watts: number;
  isOn: boolean;
  isAutoCut: boolean;
  isEssential: boolean;
}

interface AlertPayload {
  recipient: string;
  reason?: string;
  batteryPercent: number;
  mode: string;
  activeLoad: number;
  chargingWatts: number;
  netWatts: number;
  estimatedRuntime: string;
  timestamp: string;
  appliances: AlertDevice[];
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production' || process.argv.includes('--production');

app.use(express.json({ limit: '128kb' }));

const escapeHtml = (value: unknown) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const readSmtpLine = (socket: net.Socket | tls.TLSSocket) => new Promise<string>((resolve, reject) => {
  let buffer = '';
  const onData = (chunk: Buffer) => {
    buffer += chunk.toString('utf8');
    const lines = buffer.split(/\r?\n/).filter(Boolean);
    const last = lines[lines.length - 1];
    if (last && /^\d{3} /.test(last)) {
      cleanup();
      resolve(buffer);
    }
  };
  const onError = (error: Error) => {
    cleanup();
    reject(error);
  };
  const cleanup = () => {
    socket.off('data', onData);
    socket.off('error', onError);
  };
  socket.on('data', onData);
  socket.on('error', onError);
});

const smtpCommand = async (socket: net.Socket | tls.TLSSocket, command: string, okCodes: number[]) => {
  socket.write(`${command}\r\n`);
  const response = await readSmtpLine(socket);
  const code = Number(response.slice(0, 3));
  if (!okCodes.includes(code)) {
    throw new Error(`SMTP command failed (${code}): ${response.trim()}`);
  }
  return response;
};

const upgradeToTls = (socket: net.Socket, host: string) => new Promise<tls.TLSSocket>((resolve, reject) => {
  const secureSocket = tls.connect({ socket, servername: host }, () => resolve(secureSocket));
  secureSocket.once('error', reject);
});

const createAlertHtml = (payload: AlertPayload) => {
  const rows = payload.appliances.map(app => `
    <tr>
      <td>${escapeHtml(app.name)}</td>
      <td>${escapeHtml(app.watts)}W</td>
      <td style="background:${app.isOn && !app.isAutoCut ? '#d4edda' : '#f8d7da'};color:${app.isOn && !app.isAutoCut ? '#155724' : '#721c24'};">
        ${app.isOn && !app.isAutoCut ? 'ON' : 'OFF'}
      </td>
      <td>${app.isEssential ? 'Essential' : 'Regular'}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;color:#111827;">
  <h2>SmartGrid Alert Report</h2>
  <p><b>Reason:</b> ${escapeHtml(payload.reason || 'Manual SmartGrid alert')}</p>
  <p><b>Battery:</b> ${escapeHtml(payload.batteryPercent.toFixed(0))}%</p>
  <p><b>Mode:</b> ${escapeHtml(payload.mode)}</p>
  <p><b>Active Load:</b> ${escapeHtml(payload.activeLoad)}W</p>
  <p><b>Charge Input:</b> ${escapeHtml(payload.chargingWatts)}W</p>
  <p><b>Net Battery Flow:</b> ${escapeHtml(payload.netWatts)}W</p>
  <p><b>Estimated Runtime:</b> ${escapeHtml(payload.estimatedRuntime)}</p>
  <p><b>Timestamp:</b> ${escapeHtml(payload.timestamp)}</p>
  <table style="border-collapse:collapse;width:100%;margin-top:16px;">
    <tr>
      <th style="border:1px solid #111827;padding:8px;">Appliance</th>
      <th style="border:1px solid #111827;padding:8px;">Load</th>
      <th style="border:1px solid #111827;padding:8px;">Status</th>
      <th style="border:1px solid #111827;padding:8px;">Priority</th>
    </tr>
    ${rows}
  </table>
</body>
</html>`;
};

const sendEmailReport = async (payload: AlertPayload) => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER || process.env.GMAIL_SENDER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_PASSWORD;
  const from = process.env.SMTP_FROM || user;

  if (!user || !pass || !from) {
    throw new Error('SMTP sender is not configured. Set SMTP_USER and SMTP_PASS in .env.local.');
  }

  const html = createAlertHtml(payload);
  const subject = `SmartGrid Alert - ${payload.batteryPercent.toFixed(0)}% Battery`;
  const message = [
    `From: SmartGrid Alerts <${from}>`,
    `To: ${payload.recipient}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    html
  ].join('\r\n');

  let socket: net.Socket | tls.TLSSocket = net.connect(port, host);
  await readSmtpLine(socket);
  await smtpCommand(socket, `EHLO ${host}`, [250]);
  await smtpCommand(socket, 'STARTTLS', [220]);
  socket = await upgradeToTls(socket as net.Socket, host);
  await smtpCommand(socket, `EHLO ${host}`, [250]);
  await smtpCommand(socket, `AUTH PLAIN ${Buffer.from(`\0${user}\0${pass}`).toString('base64')}`, [235]);
  await smtpCommand(socket, `MAIL FROM:<${from}>`, [250]);
  await smtpCommand(socket, `RCPT TO:<${payload.recipient}>`, [250, 251]);
  await smtpCommand(socket, 'DATA', [354]);
  await smtpCommand(socket, `${message}\r\n.`, [250]);
  await smtpCommand(socket, 'QUIT', [221]);
  socket.end();
};

app.post('/api/send-alert', async (req, res) => {
  const payload = req.body as AlertPayload;
  if (!payload.recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.recipient)) {
    res.status(400).json({ error: 'Enter a valid recipient email address.' });
    return;
  }

  try {
    await sendEmailReport(payload);
    res.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send alert email.';
    res.status(500).json({ error: message });
  }
});

if (isProduction) {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
} else {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });
  app.use(vite.middlewares);
}

app.listen(port, '0.0.0.0', () => {
  console.log(`SmartGrid server running at http://127.0.0.1:${port}`);
});
