import { Page, expect, Locator } from "@playwright/test";

/**
 * Page Object for /profile/[username].
 *
 * The profile page is rendered by ProfileForm.tsx.  All selectors use
 * data-testid as the primary strategy with semantic fallbacks via .or().
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

  /** Wait until the profile content has fully loaded (spinner gone, heading visible). */
  async waitForLoad() {
    await expect(this.page).toHaveURL(/\/profile\//);
    await expect(this.getHeading()).toBeVisible({ timeout: 10000 });
    // Also confirm the loading spinner is gone
    await expect(
      this.page.getByText("Profiel laden…")
    ).toBeHidden({ timeout: 10000 });
  }

  // -------------------------------------------------------------------------
  // Page heading
  // -------------------------------------------------------------------------

  /**
   * Expected data-testid: "profile-heading"
   * Fallback: h1 element
   */
  getHeading(): Locator {
    return this.page
      .getByTestId("profile-heading")
      .or(this.page.locator("h1"));
  }

  // -------------------------------------------------------------------------
  // Read-only account info
  // -------------------------------------------------------------------------

  /**
   * Expected data-testid: "profile-username"
   * Fallback: <dd> that follows the "Gebruikersnaam" label in a <dl>
   */
  getUsernameDisplay(): Locator {
    return this.page
      .getByTestId("profile-username")
      .or(
        this.page
          .locator("dl div")
          .filter({ has: this.page.locator("dt", { hasText: /gebruikersnaam/i }) })
          .locator("dd")
      );
  }

  /**
   * Expected data-testid: "profile-email"
   * Fallback: <dd> that follows the "E-mail" label in a <dl>
   */
  getEmailDisplay(): Locator {
    return this.page
      .getByTestId("profile-email")
      .or(
        this.page
          .locator("dl div")
          .filter({ has: this.page.locator("dt", { hasText: /e-mail/i }) })
          .locator("dd")
      );
  }

  // -------------------------------------------------------------------------
  // Edit-form inputs
  // -------------------------------------------------------------------------

  /**
   * Expected data-testid: "display-name-input"
   * Fallback: input with id="displayName"
   */
  getDisplayNameInput(): Locator {
    return this.page
      .getByTestId("display-name-input")
      .or(this.page.locator("input#displayName"));
  }

  /**
   * Expected data-testid: "bio-input"
   * Fallback: textarea with id="bio"
   */
  getBioInput(): Locator {
    return this.page
      .getByTestId("bio-input")
      .or(this.page.locator("textarea#bio"));
  }

  /**
   * Expected data-testid: "location-input"
   * Fallback: input with id="location"
   */
  getLocationInput(): Locator {
    return this.page
      .getByTestId("location-input")
      .or(this.page.locator("input#location"));
  }

  /**
   * Expected data-testid: "save-button"
   * Fallback: button with save/opslaan text
   */
  getSaveButton(): Locator {
    return this.page
      .getByTestId("save-button")
      .or(this.page.getByRole("button", { name: /opslaan|save/i }));
  }

  // -------------------------------------------------------------------------
  // Alert / feedback banner
  // Next.js also renders a route announcer with role="alert" (id="__next-route-announcer__")
  // so we filter that out explicitly in the fallback.
  // -------------------------------------------------------------------------

  /**
   * Expected data-testid: "profile-alert"
   * Fallback: role="alert" excluding the Next.js route announcer
   */
  getAlertBanner(): Locator {
    return this.page
      .getByTestId("profile-alert")
      .or(
        this.page
          .locator('[role="alert"]')
          .filter({ hasNot: this.page.locator('[id="__next-route-announcer__"]') })
          .first()
      );
  }

  /**
   * Expected data-testid: "profile-alert" filtered by success text
   * Fallback: role="alert" with success text, excluding route announcer
   */
  getSuccessAlert(): Locator {
    return this.page
      .getByTestId("profile-alert")
      .filter({ hasText: /succesvol|opgeslagen|geupload/i })
      .or(
        this.page
          .locator('[role="alert"]')
          .filter({ hasNot: this.page.locator('[id="__next-route-announcer__"]') })
          .filter({ hasText: /succesvol|opgeslagen|geupload/i })
          .first()
      );
  }

  // -------------------------------------------------------------------------
  // Avatar
  // -------------------------------------------------------------------------

  /**
   * Expected data-testid: "avatar-image"
   * Fallback: img element with alt text containing "Avatar"
   */
  getAvatarImage(): Locator {
    return this.page
      .getByTestId("avatar-image")
      .or(this.page.locator(`img[alt*="Avatar"]`));
  }

  /**
   * Expected data-testid: "avatar-upload-input"
   * Fallback: file input with id="avatar-upload" (visually hidden, use force)
   */
  getAvatarFileInput(): Locator {
    return this.page
      .getByTestId("avatar-upload-input")
      .or(this.page.locator("input#avatar-upload"));
  }

  // -------------------------------------------------------------------------
  // Logout
  // -------------------------------------------------------------------------

  /**
   * Expected data-testid: "logout-button"
   * Fallback: button with uitloggen/logout text
   */
  getLogoutButton(): Locator {
    return this.page
      .getByTestId("logout-button")
      .or(this.page.getByRole("button", { name: /uitloggen|logout/i }));
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
