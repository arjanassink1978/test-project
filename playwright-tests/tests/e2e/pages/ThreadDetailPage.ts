import { Page, Locator } from "@playwright/test";

/**
 * Page Object for /forum/threads/[id] (thread detail page).
 * Uses data-testid as primary locator with semantic fallbacks.
 */
export class ThreadDetailPage {
  constructor(private readonly page: Page) {}

  async goto(threadId: number) {
    await this.page.goto(`/forum/threads/${threadId}`);
  }

  async waitForLoad() {
    await this.page.waitForURL(/\/forum\/threads\/\d+/, { timeout: 10000 });
    await this.getTitle().waitFor({ state: "visible", timeout: 10000 });
  }

  getTitle(): Locator {
    return this.page
      .getByTestId("thread-detail-title")
      .or(this.page.locator("h1"));
  }

  getDescription(): Locator {
    return this.page.getByTestId("thread-detail-desc");
  }

  getScore(): Locator {
    return this.page.getByTestId("thread-detail-score");
  }

  getAuthor(): Locator {
    return this.page.getByTestId("thread-detail-author");
  }

  getRepliesSection(): Locator {
    return this.page.getByTestId("replies-section");
  }

  getUpvoteButton(): Locator {
    return this.page
      .getByTestId("upvote-button")
      .first()
      .or(this.page.getByLabel("Upvote").first());
  }

  getDownvoteButton(): Locator {
    return this.page
      .getByTestId("downvote-button")
      .first()
      .or(this.page.getByLabel("Downvote").first());
  }

  getVoteScore(): Locator {
    return this.page.getByTestId("vote-score").first();
  }

  getReplyForm(): Locator {
    return this.page.getByTestId("reply-form");
  }

  getReplyContentInput(): Locator {
    return this.page.getByTestId("reply-content-input");
  }

  getReplySubmitButton(): Locator {
    return this.page
      .getByTestId("reply-submit-button")
      .or(this.page.getByRole("button", { name: /post reply/i }));
  }

  getReplyItem(id: number): Locator {
    return this.page.getByTestId(`reply-item-${id}`);
  }

  getReplyContent(id: number): Locator {
    return this.page.getByTestId(`reply-content-${id}`);
  }

  getReplyToggle(id: number): Locator {
    return this.page.getByTestId(`reply-toggle-${id}`);
  }
}
