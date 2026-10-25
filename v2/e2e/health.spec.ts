import { expect, test } from "@playwright/test";

test("health live + readiness DB", async ({ request }) => {
  const health = await request.get("/api/health");
  expect(health.status()).toBe(200);
  const healthBody = await health.json();
  expect(healthBody.ok).toBe(true);
  expect(healthBody.version).toBe("0.1.0");

  const ready = await request.get("/api/ready");
  expect(ready.status()).toBe(200);
  const readyBody = await ready.json();
  expect(readyBody.ok).toBe(true);
  expect(readyBody.db).toBe("up");
  expect(readyBody.schema).toBe("ok");
});
