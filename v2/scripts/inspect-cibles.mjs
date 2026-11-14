import { chromium } from "@playwright/test";

const base = process.env.BASE_URL ?? "http://127.0.0.1:4173";
const route = process.argv[2] ?? "/";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 320, height: 568 } });
const page = await context.newPage();
await page.goto(`${base}${route}`, { waitUntil: "load" });
const result = await page.evaluate(() =>
  [...document.querySelectorAll("a,input,select,textarea,button,summary")]
    .map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        tag: element.tagName,
        type: element.getAttribute("type") ?? "",
        name: element.getAttribute("name") ?? "",
        cls: element.className?.toString().slice(0, 80) ?? "",
        h: Math.round(rect.height),
        w: Math.round(rect.width),
        html: element.outerHTML.slice(0, 160),
      };
    })
    .filter((item) => item.h > 0 && (item.h < 44 || item.w < 44)),
);
console.log(JSON.stringify(result, null, 1));
await browser.close();
