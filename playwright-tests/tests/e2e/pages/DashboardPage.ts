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
    await expect(this.getHeading()).toBeVisible({ timeout: 10000 });
  }

  /**
   * Expected data-testid: "welcome-heading"
   * Fallback: h1 element
   */
  getHeading(): Locator {
    return this.page
      .getByTestId("welcome-heading")
      .or(this.page.locator("h1"));
  }

  /**
   * Expected data-testid: "profile-link"
   * Fallback: href-based then text-based link selectors
   */
  getProfileLink(): Locator {
    return this.page
      .getByTestId("profile-link")
      .or(this.page.locator('a[href*="/profile"]'))
      .or(this.page.getByRole("link", { name: /go to profile|mijn profiel|profiel/i }));
  }

  async clickProfileLink() {
    await this.getProfileLink().click();
  }

  /**
   * Expected data-testid: "admin-link"
   * Fallback: href-based then text-based link selectors
   */
  getAdminLink(): Locator {
    return this.page
      .getByTestId("admin-link")
      .or(this.page.locator('a[href*="/admin"]'))
      .or(this.page.getByRole("link", { name: /admin/i }));
  }

  async clickAdminLink() {
    await this.getAdminLink().click();
  }

  /**
   * Expected data-testid: "logout-button"
   * Fallback: button with logout text
   */
  getLogoutButton(): Locator {
    return this.page
      .getByTestId("logout-button")
      .or(this.page.getByRole("button", { name: /uitloggen|logout/i }));
  }

  async clickLogout() {
    await this.getLogoutButton().click();
  }
}
