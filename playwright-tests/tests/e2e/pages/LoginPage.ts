import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class LoginPage extends BasePage {
  async goto() {
    await this.page.goto("/login");
  }

  async fillUsername(username: string) {
    await this.fillInput("username-input", username);
  }

  async fillPassword(password: string) {
    await this.fillInput("password-input", password);
  }

  async submit() {
    await this.clickButton("login-button");
  }

  async getError(): Promise<string | null> {
    try {
      const error = await this.page.getByTestId("login-error").textContent();
      return error;
    } catch {
      return null;
    }
  }

  async loginWith(username: string, password: string) {
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.submit();
  }
}
