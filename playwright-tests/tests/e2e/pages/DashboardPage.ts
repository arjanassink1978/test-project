import { Page, expect, Locator } from "@playwright/test";

/**
 * Page Object for /dashboard.
 *
 * Currently the dashboard shows a welcome message and a logout button.
 * Issue #4 requires adding a "Go to Profile" link — this Page Object
 * targets both existing content and the expected profile link.
 */
export class DashboardPage {
  constructor(private readonly page: Page) {}

  async waitForLoad() {
    await expect(this.page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(this.page.locator("h1")).toBeVisible({ timeout: 10000 });
  }

  getHeading(): Locator {
    return this.page.locator("h1");
  }

  /**
   * Attempts to find a profile navigation link on the dashboard.
   * Tries data-testid first, then href-based, then text-based selectors.
   */
  getProfileLink(): Locator {
    // Priority: data-testid → href contains "/profile" → link text
    return this.page
      .locator('[data-testid="profile-link"]')
      .or(this.page.locator('a[href*="/profile"]'))
      .or(this.page.getByRole("link", { name: /go to profile|mijn profiel|profiel/i }));
  }

  async clickProfileLink() {
    await this.getProfileLink().click();
  }

  getLogoutButton(): Locator {
    return this.page
      .locator('[data-testid="logout-button"]')
      .or(this.page.getByRole("button", { name: /uitloggen|logout/i }));
  }

  async clickLogout() {
    await this.getLogoutButton().click();
  }
}
