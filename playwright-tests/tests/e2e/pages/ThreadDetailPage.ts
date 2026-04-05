import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class ThreadDetailPage extends BasePage {
  async gotoThread(threadId: number) {
    await this.page.goto(`/forum/threads/${threadId}`);
  }

  async getThreadTitle(): Promise<string> {
    const text = await this.page.getByTestId("thread-detail-title").textContent();
    return text || "";
  }

  async getThreadDescription(): Promise<string> {
    const text = await this.page.getByTestId("thread-detail-desc").textContent();
    return text || "";
  }

  async getThreadScore(): Promise<string> {
    const text = await this.page.getByTestId("thread-detail-score").textContent();
    return text || "";
  }

  async getThreadAuthor(): Promise<string> {
    const text = await this.page.getByTestId("thread-detail-author").textContent();
    return text || "";
  }

  async fillReplyContent(content: string) {
    await this.fillInput("reply-content-input", content);
  }

  async submitReply() {
    await this.clickButton("reply-submit-button");
  }

  async upvote() {
    await this.clickButton("upvote-button");
  }

  async downvote() {
    await this.clickButton("downvote-button");
  }

  async getVoteScore(): Promise<string> {
    const text = await this.page.getByTestId("vote-score").textContent();
    return text || "";
  }

  async toggleReply(replyId: number) {
    await this.clickButton(`reply-toggle-${replyId}`);
  }

  async getReplyContent(replyId: number): Promise<string> {
    const text = await this.page.getByTestId(`reply-content-${replyId}`).textContent();
    return text || "";
  }

  async isReplyFormVisible(): Promise<boolean> {
    try {
      await this.expectTestIdVisible("reply-form");
      return true;
    } catch {
      return false;
    }
  }

  async clickForumLink() {
    await this.page.getByTestId("forum-link").click();
  }

  async closeThreadButtonExists(): Promise<boolean> {
    try {
      const element = this.page.locator("[data-testid*='close-thread']").first();
      return element.isVisible();
    } catch {
      return false;
    }
  }
}
