import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class DashboardPage extends BasePage {
  async goto() {
    await this.page.goto("/dashboard");
  }

  async clickLogout() {
    await this.clickButton("logout-button");
  }

  async clickProfileLink() {
    await this.clickButton("profile-link");
  }

  async clickForumLink() {
    await this.clickButton("forum-link");
  }

  async clickAdminLink() {
    await this.clickButton("admin-link");
  }

  async hasAdminLink(): Promise<boolean> {
    try {
      await this.expectTestIdVisible("admin-link");
      return true;
    } catch {
      return false;
    }
  }

  async isWelcomingHeadingVisible(): Promise<boolean> {
    try {
      await this.expectTestIdVisible("welcome-heading");
      return true;
    } catch {
      return false;
    }
  }
}
