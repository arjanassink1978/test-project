import { Page, expect } from "@playwright/test";
import { FRONTEND_BASE, TIMEOUTS } from "../config";

export class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(path: string) {
    await this.page.goto(`${FRONTEND_BASE}${path}`);
  }

  async waitForLoad() {
    await this.page.waitForLoadState("networkidle");
  }

  async getErrorMessage(): Promise<string | null> {
    const errorElements = await this.page.locator("[role='alert']").all();
    if (errorElements.length === 0) return null;
    return await errorElements[0].textContent();
  }

  async fillInput(testId: string, value: string) {
    await this.page.getByTestId(testId).fill(value);
  }

  async clickButton(testId: string) {
    await this.page.getByTestId(testId).click();
  }

  async expectTestIdVisible(testId: string) {
    await expect(this.page.getByTestId(testId)).toBeVisible({
      timeout: TIMEOUTS.DEFAULT,
    });
  }

  async expectTestIdNotVisible(testId: string) {
    await expect(this.page.getByTestId(testId)).not.toBeVisible();
  }

  async expectTestIdToHaveText(testId: string, text: string) {
    await expect(this.page.getByTestId(testId)).toContainText(text);
  }
}
