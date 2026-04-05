import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class RegisterPage extends BasePage {
  async goto() {
    await this.page.goto("/register");
  }

  async fillEmail(email: string) {
    await this.fillInput("email-input", email);
  }

  async fillUsername(username: string) {
    await this.fillInput("username-input", username);
  }

  async fillPassword(password: string) {
    await this.fillInput("password-input", password);
  }

  async fillConfirmPassword(password: string) {
    await this.fillInput("confirm-password-input", password);
  }

  async submit() {
    await this.clickButton("register-button");
  }

  async getError(): Promise<string | null> {
    try {
      const error = await this.page.getByTestId("register-error").textContent();
      return error;
    } catch {
      return null;
    }
  }

  async registerWith(email: string, username: string, password: string, confirmPassword: string) {
    await this.fillEmail(email);
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.fillConfirmPassword(confirmPassword);
    await this.submit();
  }
}
