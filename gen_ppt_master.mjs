import pptxgen from "pptxgenjs";
import addPart1 from "./gen_ppt_part1.mjs";
import addPart2 from "./gen_ppt_part2.mjs";
import addPart3 from "./gen_ppt_part3.mjs";
import addPart4 from "./gen_ppt_part4.mjs";

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.author = "Shreyansh Dwivedi";
pres.title = "SmartGrid – Intelligent Home Power System";

console.log("Adding Part 1 (Slides 1-6)...");
addPart1(pres);
console.log("Adding Part 2 (Slides 7-12)...");
addPart2(pres);
console.log("Adding Part 3 (Slides 13-18)...");
addPart3(pres);
console.log("Adding Part 4 (Slides 19-23)...");
addPart4(pres);

await pres.writeFile({ fileName: "outputs/presentation.pptx" });
console.log("✅ Combined presentation saved: outputs/presentation.pptx (23 slides)");
