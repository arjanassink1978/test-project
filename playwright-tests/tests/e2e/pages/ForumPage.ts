import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class ForumPage extends BasePage {
  async goto() {
    await this.page.goto("/forum");
  }

  async clickNewThread() {
    await this.clickButton("new-thread-button");
  }

  async filterByCategory(categoryId: number) {
    await this.clickButton(`category-option-${categoryId}`);
  }

  async clearCategoryFilter() {
    await this.clickButton("category-option-all");
  }

  async setSort(value: string) {
    await this.page.getByTestId("sort-select").selectOption(value);
  }

  async search(query: string) {
    await this.fillInput("search-input", query);
    await this.page.waitForLoadState("networkidle");
  }

  async clickThread(threadId: number) {
    await this.page.getByTestId(`thread-item-${threadId}`).click();
  }

  async getThreadTitle(threadId: number): Promise<string> {
    const text = await this.page.getByTestId(`thread-title-${threadId}`).textContent();
    return text || "";
  }

  async getThreadScore(threadId: number): Promise<string> {
    const text = await this.page.getByTestId(`thread-score-${threadId}`).textContent();
    return text || "";
  }

  async clickLoadMore() {
    await this.clickButton("load-more-button");
  }

  async hasLoadMoreButton(): Promise<boolean> {
    try {
      await this.expectTestIdVisible("load-more-button");
      return true;
    } catch {
      return false;
    }
  }

  async isNewThreadButtonVisible(): Promise<boolean> {
    try {
      await this.expectTestIdVisible("new-thread-button");
      return true;
    } catch {
      return false;
    }
  }
}
