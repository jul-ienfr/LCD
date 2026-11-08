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
  expect(readyBody.rls).toBe("ok");

  const metrics = await request.get("/api/metrics");
  expect(metrics.status()).toBe(200);
  const metricsBody = await metrics.text();
  expect(metricsBody).toContain("lcd_up 1");
  expect(metricsBody).toContain("lcd_ready 1");
  expect(metricsBody).toContain("lcd_db_latency_ms");

  const accueil = await request.get("/");
  const entetes = accueil.headers();
  expect(entetes["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
  expect(entetes["x-content-type-options"]).toBe("nosniff");
  expect(entetes["x-frame-options"]).toBe("DENY");
  expect(entetes["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(entetes["permissions-policy"]).toContain("geolocation=()");
});
