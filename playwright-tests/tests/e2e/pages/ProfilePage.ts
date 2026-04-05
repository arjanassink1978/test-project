import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class ProfilePage extends BasePage {
  async goto(username: string) {
    await this.page.goto(`/profile/${username}`);
  }

  async getUsername(): Promise<string> {
    const text = await this.page.getByTestId("profile-username").textContent();
    return text || "";
  }

  async getEmail(): Promise<string> {
    const text = await this.page.getByTestId("profile-email").textContent();
    return text || "";
  }

  async fillDisplayName(value: string) {
    await this.fillInput("display-name-input", value);
  }

  async fillBio(value: string) {
    await this.fillInput("bio-input", value);
  }

  async fillLocation(value: string) {
    await this.fillInput("location-input", value);
  }

  async saveProfile() {
    await this.clickButton("save-button");
  }

  async uploadAvatar(filePath: string) {
    await this.page.getByTestId("avatar-upload-input").setInputFiles(filePath);
  }

  async deleteAvatar() {
    await this.page.locator("[data-testid='delete-avatar-button']").click();
  }

  async hasAvatarImage(): Promise<boolean> {
    try {
      const src = await this.page.getByTestId("avatar-image").getAttribute("src");
      return src !== null && src !== "" && !src.includes("placeholder");
    } catch {
      return false;
    }
  }

  async getAlertMessage(): Promise<string | null> {
    try {
      const text = await this.page.getByTestId("profile-alert").textContent();
      return text;
    } catch {
      return null;
    }
  }

  async isAlertVisible(): Promise<boolean> {
    try {
      await this.expectTestIdVisible("profile-alert");
      return true;
    } catch {
      return false;
    }
  }

  async clickLogout() {
    await this.clickButton("logout-button");
  }
}
