import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class AdminPage extends BasePage {
  async goto() {
    await this.page.goto("/admin");
  }

  async clickUserManagementTab() {
    await this.clickButton("user-management-tab");
  }

  async clickCategoryManagementTab() {
    await this.clickButton("category-management-tab");
  }

  async searchUsers(query: string) {
    await this.fillInput("user-search-input", query);
    await this.page.waitForLoadState("networkidle");
  }

  async changeUserRole(userId: number, role: string) {
    await this.clickButton(`change-role-${role.toLowerCase()}-${userId}`);
  }

  async hasRoleConfirmDialog(): Promise<boolean> {
    try {
      await this.expectTestIdVisible("role-confirm-dialog");
      return true;
    } catch {
      return false;
    }
  }

  async clickAddCategory() {
    await this.clickButton("add-category-button");
  }

  async fillCategoryName(value: string) {
    await this.fillInput("category-name-input", value);
  }

  async fillCategoryDescription(value: string) {
    await this.fillInput("category-description-input", value);
  }

  async submitCategoryForm() {
    await this.clickButton("category-form-submit");
  }

  async cancelCategoryForm() {
    await this.clickButton("category-form-cancel");
  }

  async editCategory(categoryId: number) {
    await this.clickButton(`edit-category-${categoryId}`);
  }

  async deleteCategory(categoryId: number) {
    await this.clickButton(`delete-category-${categoryId}`);
  }

  async isCategoryFormVisible(): Promise<boolean> {
    try {
      await this.expectTestIdVisible("category-form");
      return true;
    } catch {
      return false;
    }
  }

  async getCategoryError(): Promise<string | null> {
    try {
      const error = await this.page.getByTestId("category-form-error").textContent();
      return error;
    } catch {
      return null;
    }
  }
}
