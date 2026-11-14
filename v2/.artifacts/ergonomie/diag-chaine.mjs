import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 320, height: 568 } });
await page.goto("http://127.0.0.1:4173/design", { waitUntil: "networkidle" });
const chaine = await page.evaluate(() => {
  const table = document.querySelector("table.ui-tableau");
  const sortie = [];
  let noeud = table;
  while (noeud && noeud !== document.documentElement) {
    const style = getComputedStyle(noeud);
    sortie.push({
      tag: noeud.tagName.toLowerCase(),
      classe: (noeud.getAttribute("class") ?? "").slice(0, 80),
      width: Math.round(noeud.getBoundingClientRect().width),
      display: style.display,
      minWidth: style.minWidth,
      overflowX: style.overflowX,
      gridTemplateColumns: style.gridTemplateColumns,
      padding: `${style.paddingLeft}/${style.paddingRight}`,
    });
    noeud = noeud.parentElement;
  }
  return sortie;
});
console.log(JSON.stringify(chaine, null, 2));
await browser.close();