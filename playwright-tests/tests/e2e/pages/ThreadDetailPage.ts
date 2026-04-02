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

  /**
   * Returns the numeric vote score value from the thread-level vote-score element.
   */
  async getVoteScoreValue(): Promise<number> {
    const text = await this.getVoteScore().textContent();
    return Number(text?.trim() ?? "0");
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

  /**
   * reply-toggle-{id} is the inline "Reply/Cancel" button used to show or
   * hide the nested reply form for a given reply.
   */
  getReplyToggle(id: number): Locator {
    return this.page.getByTestId(`reply-toggle-${id}`);
  }

  /**
   * Returns the author header row for a reply.
   * Contains the avatar, username, and depth indicator.
   */
  getReplyAuthorRow(id: number): Locator {
    return this.page.getByTestId(`reply-author-${id}`);
  }

  /**
   * Returns the username text within the author row of a reply.
   * The author row (reply-author-{id}) wraps avatar + username span.
   */
  getReplyAuthorName(id: number): Locator {
    return this.page
      .getByTestId(`reply-author-${id}`)
      .locator("span")
      .first();
  }

  /**
   * Returns the vote-buttons badge element scoped to a specific reply item.
   * The badge is rendered at the top-right of the reply header row.
   */
  getReplyVoteBadge(id: number): Locator {
    return this.page
      .getByTestId(`reply-item-${id}`)
      .getByTestId("vote-buttons");
  }

  /**
   * Returns the upvote button scoped to a specific reply item.
   */
  getReplyUpvoteButton(id: number): Locator {
    return this.page
      .getByTestId(`reply-item-${id}`)
      .getByTestId("upvote-button");
  }

  /**
   * Returns the vote-score element scoped to a specific reply item.
   */
  getReplyVoteScore(id: number): Locator {
    return this.page
      .getByTestId(`reply-item-${id}`)
      .getByTestId("vote-score");
  }

  /**
   * Returns the numeric vote score value for a specific reply.
   */
  async getReplyVoteScoreValue(id: number): Promise<number> {
    const text = await this.getReplyVoteScore(id).textContent();
    return Number(text?.trim() ?? "0");
  }

  /**
   * Returns the collapse toggle button (–/+) for a nested reply.
   * This button appears in the left gutter only for depth > 0 replies
   * that have child replies. It is identified by its aria-label.
   */
  getCollapseToggle(id: number): Locator {
    return this.page
      .getByTestId(`reply-item-${id}`)
      .getByRole("button", { name: /collapse replies|expand replies/i })
      .first();
  }
}
