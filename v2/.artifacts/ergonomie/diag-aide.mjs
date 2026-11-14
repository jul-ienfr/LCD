import { chromium } from "playwright";

const b = await chromium.launch();
const p = await b.newPage();
await p.goto("http://127.0.0.1:4173/aide");
const liens = await p.$$eval("a", (as) =>
  as
    .filter((a) => /mentions/i.test(a.textContent ?? ""))
    .map((a) => [
      a.textContent.trim().slice(0, 40),
      a.getAttribute("href"),
      a.className.slice(0, 70),
    ]),
);
console.log(JSON.stringify(liens, null, 1));
await b.close();
