import { Page, expect, Locator } from "@playwright/test";

/**
 * Page Object for /profile/[username].
 *
 * The profile page is rendered by ProfileForm.tsx.  All selectors are based
 * on the actual DOM produced by that component — ids, roles, and text labels.
 */
export class ProfilePage {
  constructor(private readonly page: Page) {}

  // -------------------------------------------------------------------------
  // Navigation
  // -------------------------------------------------------------------------

  async goto(username: string) {
    await this.page.goto(`/profile/${username}`);
    await expect(this.page).toHaveURL(new RegExp(`/profile/${username}`));
  }

  /** Wait until the profile content has fully loaded (spinner gone, h1 visible). */
  async waitForLoad() {
    await expect(this.page).toHaveURL(/\/profile\//);
    await expect(this.page.locator("h1")).toBeVisible({ timeout: 10000 });
    // Also confirm the loading spinner is gone
    await expect(
      this.page.getByText("Profiel laden…")
    ).toBeHidden({ timeout: 10000 });
  }

  // -------------------------------------------------------------------------
  // Page heading
  // -------------------------------------------------------------------------

  getHeading(): Locator {
    return this.page.locator("h1");
  }

  // -------------------------------------------------------------------------
  // Read-only account info (inside <dl> / <dd> pairs)
  // -------------------------------------------------------------------------

  /** <dd> that follows the "Gebruikersnaam" label */
  getUsernameDisplay(): Locator {
    return this.page
      .locator("dl div")
      .filter({ has: this.page.locator("dt", { hasText: /gebruikersnaam/i }) })
      .locator("dd");
  }

  /** <dd> that follows the "E-mail" label */
  getEmailDisplay(): Locator {
    return this.page
      .locator("dl div")
      .filter({ has: this.page.locator("dt", { hasText: /e-mail/i }) })
      .locator("dd");
  }

  // -------------------------------------------------------------------------
  // Edit-form inputs
  // -------------------------------------------------------------------------

  getDisplayNameInput(): Locator {
    return this.page.locator("input#displayName");
  }

  getBioInput(): Locator {
    return this.page.locator("textarea#bio");
  }

  getLocationInput(): Locator {
    return this.page.locator("input#location");
  }

  getSaveButton(): Locator {
    return this.page.getByRole("button", { name: /opslaan/i });
  }

  // -------------------------------------------------------------------------
  // Alert / feedback banner  (role="alert" — used for both success and error)
  // -------------------------------------------------------------------------

  getAlertBanner(): Locator {
    return this.page.locator('[role="alert"]');
  }

  getSuccessAlert(): Locator {
    // Success alerts have the green colour class
    return this.page.locator('[role="alert"].text-green-700, [role="alert"].bg-green-50').or(
      this.page
        .locator('[role="alert"]')
        .filter({ hasText: /succesvol|opgeslagen|geupload/i })
    );
  }

  // -------------------------------------------------------------------------
  // Avatar
  // -------------------------------------------------------------------------

  getAvatarImage(): Locator {
    return this.page.locator(`img[alt*="Avatar"]`);
  }

  /** The file input for avatar upload — hidden via sr-only, so use force */
  getAvatarFileInput(): Locator {
    return this.page.locator("input#avatar-upload");
  }

  // -------------------------------------------------------------------------
  // Logout
  // -------------------------------------------------------------------------

  getLogoutButton(): Locator {
    return this.page.getByRole("button", { name: /uitloggen/i });
  }

  async clickLogout() {
    await this.getLogoutButton().click();
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  async fillEditForm(displayName: string, bio: string, location: string) {
    await this.getDisplayNameInput().fill(displayName);
    await this.getBioInput().fill(bio);
    await this.getLocationInput().fill(location);
  }

  async saveProfile() {
    await this.getSaveButton().click();
  }

  async uploadAvatar(filePath: string) {
    // The input is visually hidden (sr-only); setInputFiles works regardless.
    await this.getAvatarFileInput().setInputFiles(filePath);
  }
}
