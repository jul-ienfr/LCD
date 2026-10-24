import { gzipSync } from "node:zlib";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const path = process.env.MEASURE_PATH ?? "/voyageur";
const html = await (await fetch(`${base}${path}`)).text();
const srcs = [
  ...new Set(
    [...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map((m) => m[1]),
  ),
];

let total = 0;
const rows = [];
for (const src of srcs) {
  const response = await fetch(`${base}${src}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  const gzip = gzipSync(buffer).length;
  total += gzip;
  rows.push({ src: src.split("/").pop(), raw: buffer.length, gzip });
}

console.log(
  JSON.stringify(
    {
      base,
      path,
      count: srcs.length,
      totalGzip: total,
      totalGzipKo: Number((total / 1024).toFixed(1)),
      rows,
    },
    null,
    2,
  ),
);
