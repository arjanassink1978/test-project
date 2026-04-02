import { Page, Locator } from "@playwright/test";

/**
 * Page Object for /forum (forum index page).
 * Uses data-testid as primary locator with semantic fallbacks.
 */
export class ForumPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/forum");
  }

  async waitForLoad() {
    await this.page.waitForURL(/\/forum/, { timeout: 10000 });
    await this.getHeading().waitFor({ state: "visible", timeout: 10000 });
  }

  getHeading(): Locator {
    return this.page
      .getByTestId("forum-heading")
      .or(this.page.locator("h1"));
  }

  getForumLink(): Locator {
    return this.page
      .getByTestId("forum-link")
      .or(this.page.locator('a[href="/forum"]'));
  }

  getNewThreadButton(): Locator {
    return this.page
      .getByTestId("new-thread-button")
      .or(this.page.getByRole("button", { name: /new thread|nieuw/i }));
  }

  getCategoryFilter(): Locator {
    return this.page.getByTestId("category-filter");
  }

  getCategoryOption(id: number | "all"): Locator {
    return this.page.getByTestId(`category-option-${id}`);
  }

  getSortSelect(): Locator {
    return this.page
      .getByTestId("sort-select")
      .or(this.page.locator("select"));
  }

  getSearchInput(): Locator {
    return this.page
      .getByTestId("search-input")
      .or(this.page.locator('input[type="search"]'));
  }

  getThreadList(): Locator {
    return this.page.getByTestId("thread-list");
  }

  getThreadItem(id: number): Locator {
    return this.page.getByTestId(`thread-item-${id}`);
  }

  getThreadTitle(id: number): Locator {
    return this.page.getByTestId(`thread-title-${id}`);
  }

  getThreadScore(id: number): Locator {
    return this.page.getByTestId(`thread-score-${id}`);
  }

  getLoadMoreButton(): Locator {
    return this.page
      .getByTestId("load-more-button")
      .or(this.page.getByRole("button", { name: /load more/i }));
  }

  /** Clicks the New Thread button and waits for navigation to /forum/new. */
  async clickNewThreadButton(): Promise<void> {
    await this.getNewThreadButton().click();
    await this.page.waitForURL(/\/forum\/new/, { timeout: 5000 });
  }

  /**
   * Selects a sort order in the sort select dropdown.
   * @param value — "newest" or "popular"
   */
  async selectSort(value: "newest" | "popular"): Promise<void> {
    await this.getSortSelect().selectOption(value);
  }

  /**
   * Selects a category in the category filter.
   * @param id — numeric category ID or "all"
   */
  async selectCategory(id: number | "all"): Promise<void> {
    await this.getCategoryOption(id).click();
  }
}
