import { chromium } from "playwright";

const route = process.argv[2] ?? "/";
const texte = process.argv[3] ?? "L LCD Parc";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 320, height: 568 } });
await page.goto(`http://127.0.0.1:4173${route}`, { waitUntil: "networkidle" });
const info = await page.evaluate((cible) => {
  const sortie = [];
  for (const element of document.querySelectorAll("a")) {
    const texte = (element.textContent ?? "").trim();
    if (!texte.includes(cible)) continue;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    sortie.push({
      texte: texte.slice(0, 30),
      classe: (element.getAttribute("class") ?? "").slice(0, 120),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      minHeight: style.minHeight,
      display: style.display,
      padding: style.padding,
      parentClasse: (element.parentElement?.getAttribute("class") ?? "").slice(0, 80),
    });
  }
  return sortie;
}, texte);
console.log(JSON.stringify(info, null, 2));
await browser.close();