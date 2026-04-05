import { Page, Locator, expect } from "@playwright/test";

/**
 * Base class for all Page Objects.
 * Provides common navigation and load-wait patterns to reduce duplication.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /**
   * Navigate to the page. Subclasses override to define their specific route.
   * Example: `async goto() { await this.gotoRoute("/forum"); }`
   */
  abstract goto(): Promise<void>;

  /**
   * Wait for the page to fully load.
   * Default implementation: waits for URL match and heading visibility.
   * Subclasses override if they need custom loading logic.
   */
  async waitForLoad(): Promise<void> {
    await expect(this.page).toHaveURL(this.getRoutePattern(), { timeout: 10000 });
    await expect(this.getHeading()).toBeVisible({ timeout: 10000 });
  }

  /**
   * Get the expected heading element for the page.
   * Subclasses override to define their heading locator.
   */
  abstract getHeading(): Locator;

  /**
   * Get the regex pattern for this page's route.
   * Subclasses override to define their URL pattern.
   * Example: `/\/forum$/` for /forum, `/\/forum\/threads\/\d+/` for /forum/threads/[id]
   */
  protected abstract getRoutePattern(): RegExp;

  /**
   * Helper: Navigate to a simple static route.
   * Used by subclasses: `await this.gotoRoute("/forum")`
   */
  protected async gotoRoute(path: string): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Helper: Navigate to a dynamic route with parameters.
   * Used by subclasses: `await this.gotoDynamicRoute("/forum/threads", threadId)`
   */
  protected async gotoDynamicRoute(basePath: string, ...params: (string | number)[]): Promise<void> {
    const path = `${basePath}/${params.join("/")}`;
    await this.page.goto(path);
  }
}
