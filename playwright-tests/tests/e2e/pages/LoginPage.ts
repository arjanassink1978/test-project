import { Page, expect } from "@playwright/test";

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/login");
    await expect(this.page).toHaveURL(/\/login/);
  }

  async fillUsername(username: string) {
    await this.page.locator("#username").fill(username);
  }

  async fillPassword(password: string) {
    await this.page.locator("#password").fill(password);
  }

  async submit() {
    await this.page.locator('button[type="submit"]').click();
  }

  async login(username: string, password: string) {
    await this.goto();
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.submit();
  }

  getErrorMessage() {
    // Exclude the Next.js route announcer which also uses role="alert"
    return this.page
      .locator('[role="alert"]')
      .filter({ hasNot: this.page.locator('[id="__next-route-announcer__"]') })
      .first();
  }
}
