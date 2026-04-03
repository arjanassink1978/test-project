import { Page, Locator, expect } from "@playwright/test";

/**
 * Page Object for /register.
 * Uses data-testid as primary locator with semantic fallbacks.
 */
export class RegisterPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/register");
    await expect(this.page).toHaveURL(/\/register/);
  }

  async waitForLoad() {
    await expect(this.page).toHaveURL(/\/register/, { timeout: 5000 });
    await expect(this.getHeading()).toBeVisible({ timeout: 5000 });
  }

  getHeading(): Locator {
    return this.page
      .getByTestId("register-heading")
      .or(this.page.locator("h1"));
  }

  getEmailInput(): Locator {
    return this.page
      .getByTestId("email-input")
      .or(this.page.locator("input#email"));
  }

  getUsernameInput(): Locator {
    return this.page
      .getByTestId("username-input")
      .or(this.page.locator("input#username"));
  }

  getPasswordInput(): Locator {
    return this.page
      .getByTestId("password-input")
      .or(this.page.locator("input#password"));
  }

  getConfirmPasswordInput(): Locator {
    return this.page
      .getByTestId("confirm-password-input")
      .or(this.page.locator("input#confirmPassword"));
  }

  getSubmitButton(): Locator {
    return this.page
      .getByTestId("register-button")
      .or(this.page.getByRole("button", { name: /registreren|register/i }));
  }

  getErrorMessage(): Locator {
    return this.page
      .getByTestId("register-error")
      .or(
        this.page
          .locator('[role="alert"]')
          .filter({ hasNot: this.page.locator('[id="__next-route-announcer__"]') })
          .first()
      );
  }

  getLoginLink(): Locator {
    return this.page
      .getByTestId("login-link")
      .or(this.page.getByRole("link", { name: /inloggen|login/i }));
  }

  async fillForm(email: string, username: string, password: string, confirmPassword: string) {
    await this.getEmailInput().fill(email);
    await this.getUsernameInput().fill(username);
    await this.getPasswordInput().fill(password);
    await this.getConfirmPasswordInput().fill(confirmPassword);
  }

  async submit() {
    await this.getSubmitButton().click();
  }

  async register(email: string, username: string, password: string, confirmPassword?: string) {
    await this.goto();
    await this.fillForm(email, username, password, confirmPassword ?? password);
    await this.submit();
  }
}
