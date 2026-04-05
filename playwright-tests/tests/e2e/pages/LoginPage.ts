import { Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class LoginPage extends BasePage {
  protected getRoutePattern(): RegExp {
    return /\/login$/;
  }

  async goto() {
    await this.gotoRoute("/login");
  }

  getHeading(): Locator {
    // Login page may not have a visible h1 heading, so provide a fallback
    return this.page.locator("h1");
  }

  /**
   * Expected data-testid: "username-input"
   * Fallback: input with id="username"
   */
  getUsernameInput(): Locator {
    return this.page
      .getByTestId("username-input")
      .or(this.page.locator("#username"));
  }

  /**
   * Expected data-testid: "password-input"
   * Fallback: input with id="password"
   */
  getPasswordInput(): Locator {
    return this.page
      .getByTestId("password-input")
      .or(this.page.locator("#password"));
  }

  /**
   * Expected data-testid: "login-button"
   * Fallback: submit button by role
   */
  getSubmitButton(): Locator {
    return this.page
      .getByTestId("login-button")
      .or(this.page.getByRole("button", { name: /inloggen|login|submit/i }))
      .or(this.page.locator('button[type="submit"]'));
  }

  async fillUsername(username: string) {
    await this.getUsernameInput().fill(username);
  }

  async fillPassword(password: string) {
    await this.getPasswordInput().fill(password);
  }

  async submit() {
    await this.getSubmitButton().click();
  }

  async login(username: string, password: string) {
    await this.goto();
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.submit();
  }

  /**
   * Expected data-testid: "login-error"
   * Fallback: role="alert" excluding the Next.js route announcer
   */
  getErrorMessage(): Locator {
    return this.page
      .getByTestId("login-error")
      .or(
        this.page
          .locator('[role="alert"]')
          .filter({ hasNot: this.page.locator('[id="__next-route-announcer__"]') })
          .first()
      );
  }
}
