import { test, expect } from "@playwright/test";

test.describe("Scam Tracker", () => {
  test("página inicial carrega e tem link para admin", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Scam Tracker/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Acessar painel/i })).toBeVisible();
  });

  test("página de login admin carrega", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.getByRole("heading", { name: /Acesso administrativo/i })).toBeVisible();
    await expect(page.getByLabel(/Senha/i)).toBeVisible();
  });

  test("rota de teste de conexão responde", async ({ request }) => {
    const res = await request.get("/api/test-db");
    const body = await res.json();
    if (res.ok()) {
      expect(body.ok).toBe(true);
      expect(body.method).toBe("neon-http");
    } else {
      expect([503, 500]).toContain(res.status());
      expect(body.error || body.message).toBeDefined();
    }
  });
});
