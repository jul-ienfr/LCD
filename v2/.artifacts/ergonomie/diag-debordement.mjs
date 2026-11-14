import { chromium } from "playwright";

const route = process.argv[2] ?? "/design";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 320, height: 568 } });
await page.goto(`http://127.0.0.1:4173${route}`, { waitUntil: "networkidle" });
const info = await page.evaluate(() => {
  const largeur = document.documentElement.clientWidth;
  const coupe = (element) => {
    let noeud = element.parentElement;
    while (noeud) {
      const style = getComputedStyle(noeud);
      if (style.overflowX !== "visible") return true;
      noeud = noeud.parentElement;
    }
    return false;
  };
  const resultat = [];
  for (const element of document.querySelectorAll("body *")) {
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    if (rect.right <= largeur + 0.5) continue;
    if (coupe(element)) continue;
    resultat.push({
      tag: element.tagName.toLowerCase(),
      classe: (element.getAttribute("class") ?? "").slice(0, 100),
      right: Math.round(rect.right),
      width: Math.round(rect.width),
      texte: (element.textContent ?? "").trim().slice(0, 50),
    });
  }
  return {
    largeur,
    scroll: document.documentElement.scrollWidth,
    resultat: resultat.slice(0, 15),
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();