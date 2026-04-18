import subprocess
import sys
import os
import platform

def check_installation():
    print("--- SmartGrid System Dependency Check ---")
    node_installed = False
    
    # 1. Check for Node.js
    try:
        node_version = subprocess.check_output(['node', '-v']).decode().strip()
        print(f"[SUCCESS] Node.js is installed: {node_version}")
        node_installed = True
    except (FileNotFoundError, subprocess.CalledProcessError):
        print("[MISSING] Node.js is NOT found.")

    if not node_installed:
        if platform.system() == 'Darwin':  # macOS
            print("\nWould you like to automatically install Node.js and npm via Homebrew? (y/n)")
            choice = input().lower()
            if choice == 'y':
                try:
                    # Check for brew
                    subprocess.check_output(['brew', '-v'])
                    print("Homebrew found. Installing Node.js...")
                    subprocess.check_call(['brew', 'install', 'node'])
                    node_installed = True
                except (FileNotFoundError, subprocess.CalledProcessError):
                    print("Homebrew is not installed. Would you like to install Homebrew first? (y/n)")
                    h_choice = input().lower()
                    if h_choice == 'y':
                        print("Installing Homebrew (requires sudo/password)...")
                        cmd = '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
                        subprocess.call(cmd, shell=True)
                        print("Now installing Node.js...")
                        subprocess.call('brew install node', shell=True)
                        node_installed = True
                    else:
                        print("Please install Node.js manually from: https://nodejs.org/")
            else:
                print("Automatic installation skipped.")
        else:
            print(f"Please install Node.js manually for your OS ({platform.system()}) at https://nodejs.org/")
            
    return node_installed

def install_dependencies():
    print("\n--- Installing Project Libraries (package.json) ---")
    try:
        subprocess.check_call(['npm', 'install'])
        print("\n[SUCCESS] Libraries installed successfully.")
        
        print("\n--- Setup Complete ---")
        print("To start SmartGrid, run:")
        print("   npm run dev")
    except subprocess.CalledProcessError:
        print("\n[ERROR] Library installation failed. Try running 'npm install' manually.")

if __name__ == "__main__":
    if check_installation():
        print("\nNode.js and npm are ready.")
        choice = input("Would you like to install remaining project libraries? (y/n): ")
        if choice.lower() == 'y':
            install_dependencies()
    else:
        print("\nExiting. Please ensure Node.js is installed before running this script.")
