import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class NewThreadPage extends BasePage {
  async goto() {
    await this.page.goto("/forum/new");
  }

  async fillTitle(title: string) {
    await this.fillInput("thread-title-input", title);
  }

  async fillDescription(description: string) {
    await this.fillInput("thread-desc-input", description);
  }

  async selectCategory(categoryId: number) {
    await this.page.getByTestId("thread-category-select").selectOption(categoryId.toString());
  }

  async submit() {
    await this.clickButton("thread-submit-button");
  }

  async getError(): Promise<string | null> {
    try {
      const error = await this.page.getByTestId("thread-form-error").textContent();
      return error;
    } catch {
      return null;
    }
  }

  async getTitleCharCount(): Promise<string> {
    const text = await this.page.getByTestId("thread-title-counter").textContent();
    return text || "";
  }

  async getDescriptionCharCount(): Promise<string> {
    const text = await this.page.getByTestId("thread-desc-counter").textContent();
    return text || "";
  }
}
