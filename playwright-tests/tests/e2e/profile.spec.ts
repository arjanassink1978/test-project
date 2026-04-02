import { test, expect, Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProfilePage } from "./pages/ProfilePage";
import { loginAsDefaultUser, DEFAULT_USER } from "./fixtures/auth";

// ---------------------------------------------------------------------------
// Constants – reflect the real seeded user from DataInitializer
// ---------------------------------------------------------------------------

const SEEDED_PROFILE = {
  username: "user",
  email: "user@example.com",
  displayName: "Demo User",
  bio: "Software developer and coffee enthusiast",
  location: "Amsterdam, Netherlands",
};

// Backend base URL used for direct API calls in setup/teardown helpers
const API_BASE = "http://localhost:8080";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Creates a minimal 1x1 PNG in a temp file and returns its path. */
function createTestImage(): string {
  // Minimal valid 1×1 red PNG (67 bytes — well-formed, accepted by most image processors)
  const PNG_1X1 = Buffer.from(
    "89504e470d0a1a0a0000000d49484452000000010000000108020000009001" +
      "2e00000000c49444154789c6260f8cfc00000000200019e21bc330000000049454e44ae426082",
    "hex"
  );
  const tmpFile = path.join(os.tmpdir(), `test-avatar-${Date.now()}.png`);
  fs.writeFileSync(tmpFile, PNG_1X1);
  return tmpFile;
}

/**
 * Resets the seeded user's profile fields to the initial seeded values via
 * a direct API call. Call this in beforeEach for tests that mutate profile data.
 */
async function resetProfile(): Promise<void> {
  const response = await fetch(`${API_BASE}/api/profile/${DEFAULT_USER.username}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      displayName: SEEDED_PROFILE.displayName,
      bio: SEEDED_PROFILE.bio,
      location: SEEDED_PROFILE.location,
    }),
  });

  if (!response.ok) {
    throw new Error(`resetProfile failed: ${response.status}`);
  }
}

/**
 * Restores the seeded avatar via a direct API call, so avatar-related tests
 * always start from a known state (avatar present).
 */
async function restoreAvatar(): Promise<void> {
  const PNG_1X1 = Buffer.from(
    "89504e470d0a1a0a0000000d49484452000000010000000108020000009001" +
      "2e00000000c49444154789c6260f8cfc00000000200019e21bc330000000049454e44ae426082",
    "hex"
  );
  const formData = new FormData();
  formData.append("file", new Blob([PNG_1X1], { type: "image/png" }), "avatar.png");
  const response = await fetch(`${API_BASE}/api/profile/${DEFAULT_USER.username}/avatar`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`restoreAvatar failed: ${response.status}`);
  }
}

/**
 * Deletes the avatar via a direct API call (resets to no-avatar state).
 */
async function deleteAvatarViaApi(): Promise<void> {
  const response = await fetch(`${API_BASE}/api/profile/${DEFAULT_USER.username}/avatar`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`deleteAvatarViaApi failed: ${response.status}`);
  }
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

test.describe("User Profile Page Flow", () => {
  // -------------------------------------------------------------------------
  // 1. Login → Dashboard → Navigate to Profile
  // -------------------------------------------------------------------------
  test.describe("1. Login to dashboard to profile navigation", () => {
    test("logs in with valid credentials and navigates from dashboard to profile", async ({ page }) => {
      // Step 1: login
      const loginPage = new LoginPage(page);
      await loginPage.login(DEFAULT_USER.username, DEFAULT_USER.password);
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

      // Step 2: click the profile link on the dashboard
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.waitForLoad();

      const profileLink = await dashboardPage.getProfileLink();
      await expect(profileLink).toBeVisible({ timeout: 5000 });

      await dashboardPage.clickProfileLink();

      // Step 3: verify we land on the profile page with the correct heading
      await expect(page).toHaveURL(
        new RegExp(`/profile/${DEFAULT_USER.username}`),
        { timeout: 10000 }
      );

      const profilePage = new ProfilePage(page);
      await profilePage.waitForLoad();

      await expect(profilePage.getHeading()).toContainText(/profiel/i);
      await expect(profilePage.getUsernameDisplay()).toContainText(DEFAULT_USER.username);
    });

    test("login page loads and rejects invalid credentials", async ({ page }) => {
      await page.goto("/login");
      await expect(page).toHaveURL(/\/login/);
      await expect(page.locator("h1")).toBeVisible();

      // Try invalid credentials
      const loginPage = new LoginPage(page);
      await loginPage.login("user", "wrongpassword");

      const error = await loginPage.getErrorMessage();
      await expect(error).toBeVisible({ timeout: 5000 });
      await expect(error).toContainText(/ongeldig|wachtwoord/i);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Profile display flow — all fields visible on page load
  // -------------------------------------------------------------------------
  test.describe("2. Profile display flow", () => {
    test("profile page shows account info, edit form, and avatar after load", async ({ page }) => {
      await page.goto(`/profile/${DEFAULT_USER.username}`);
      const profilePage = new ProfilePage(page);
      await profilePage.waitForLoad();

      // Heading
      await expect(profilePage.getHeading()).toContainText(/profiel/i);

      // Account info section
      await expect(profilePage.getUsernameDisplay()).toContainText(DEFAULT_USER.username);
      await expect(profilePage.getEmailDisplay()).toContainText(SEEDED_PROFILE.email);

      // Edit form inputs populated with seeded values
      await expect(profilePage.getDisplayNameInput()).toHaveValue(SEEDED_PROFILE.displayName);
      await expect(profilePage.getBioInput()).toHaveValue(SEEDED_PROFILE.bio);
      await expect(profilePage.getLocationInput()).toHaveValue(SEEDED_PROFILE.location);
      await expect(profilePage.getSaveButton()).toBeVisible();

      // Avatar present (seeded user has avatarUrl)
      await expect(profilePage.getAvatarImage()).toBeVisible({ timeout: 5000 });
    });

    test("shows avatar placeholder when no avatar is set", async ({ page }) => {
      // Mock GET so the frontend receives a profile with no avatarUrl.
      // This is an edge-case path (not the seeded default) — mocking is appropriate.
      await page.route(`**/api/profile/${DEFAULT_USER.username}`, async (route, request) => {
        if (request.method() === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              id: 1,
              username: DEFAULT_USER.username,
              email: SEEDED_PROFILE.email,
              displayName: SEEDED_PROFILE.displayName,
              bio: SEEDED_PROFILE.bio,
              location: SEEDED_PROFILE.location,
              avatarUrl: null,
            }),
          });
        } else {
          await route.continue();
        }
      });

      await page.goto(`/profile/${DEFAULT_USER.username}`);
      const profilePage = new ProfilePage(page);
      await profilePage.waitForLoad();

      await expect(profilePage.getAvatarImage()).toHaveCount(0);
      await expect(
        page.locator("div").filter({ hasText: /^U$/ }).first()
      ).toBeVisible({ timeout: 5000 });
    });
  });

  // -------------------------------------------------------------------------
  // 3. Edit profile flow (real API)
  // -------------------------------------------------------------------------
  test.describe("3. Edit profile flow", () => {
    test.beforeEach(async () => {
      await resetProfile();
    });

    test.afterEach(async () => {
      await resetProfile();
    });

    test("fills edit form, saves, sees success alert, and data persists after reload", async ({ page }) => {
      await page.goto(`/profile/${DEFAULT_USER.username}`);
      const profilePage = new ProfilePage(page);
      await profilePage.waitForLoad();

      // Fill new values
      await profilePage.fillEditForm("Saved Name", "Saved bio", "Rotterdam");

      await expect(profilePage.getDisplayNameInput()).toHaveValue("Saved Name");
      await expect(profilePage.getBioInput()).toHaveValue("Saved bio");
      await expect(profilePage.getLocationInput()).toHaveValue("Rotterdam");

      // Submit to real PUT /api/profile/user
      await profilePage.saveProfile();

      const alert = profilePage.getAlertBanner();
      await expect(alert).toBeVisible({ timeout: 10000 });
      await expect(alert).toContainText(/succesvol|opgeslagen/i);

      // Reload and confirm backend persisted the change
      await page.reload();
      await profilePage.waitForLoad();

      await expect(profilePage.getDisplayNameInput()).toHaveValue("Saved Name");
      await expect(profilePage.getBioInput()).toHaveValue("Saved bio");
      await expect(profilePage.getLocationInput()).toHaveValue("Rotterdam");
    });
  });

  // -------------------------------------------------------------------------
  // 3b. Profile constraint error flows
  // -------------------------------------------------------------------------
  test.describe("3b. Profile constraint error flows", () => {
    test("displayName input enforces max 100 character limit via maxlength attribute", async ({ page }) => {
      // CONSTRAINT: displayName max 100 chars — must match backend validation
      await page.goto(`/profile/${DEFAULT_USER.username}`);
      const profilePage = new ProfilePage(page);
      await profilePage.waitForLoad();

      // The input must have maxlength="100" so the browser blocks oversized input
      await expect(profilePage.getDisplayNameInput()).toHaveAttribute("maxlength", "100");

      // Verify that typing 101 chars is capped at 100 by the browser
      const over100 = "B".repeat(101);
      await profilePage.getDisplayNameInput().fill(over100);
      const actualValue = await profilePage.getDisplayNameInput().inputValue();
      expect(actualValue.length).toBeLessThanOrEqual(100);
    });

    test("bio input enforces max 500 character limit via maxlength attribute", async ({ page }) => {
      // CONSTRAINT: bio max 500 chars — must match backend validation
      await page.goto(`/profile/${DEFAULT_USER.username}`);
      const profilePage = new ProfilePage(page);
      await profilePage.waitForLoad();

      await expect(profilePage.getBioInput()).toHaveAttribute("maxlength", "500");

      const over500 = "C".repeat(501);
      await profilePage.getBioInput().fill(over500);
      const actualValue = await profilePage.getBioInput().inputValue();
      expect(actualValue.length).toBeLessThanOrEqual(500);
    });

    test("shows error alert when profile update API returns 500", async ({ page }) => {
      await page.goto(`/profile/${DEFAULT_USER.username}`);
      const profilePage = new ProfilePage(page);
      await profilePage.waitForLoad();

      // Mock only the PUT to return 500 — simulates a server error on save
      await page.route(`**/api/profile/${DEFAULT_USER.username}`, async (route, request) => {
        if (request.method() === "PUT") {
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ message: "Internal Server Error" }),
          });
        } else {
          await route.continue();
        }
      });

      await profilePage.fillEditForm("Will Fail", "bio", "city");
      await profilePage.saveProfile();

      const alert = profilePage.getAlertBanner();
      await expect(alert).toBeVisible({ timeout: 10000 });
      await expect(alert).not.toContainText(/succesvol/i);
    });
  });

  // -------------------------------------------------------------------------
  // 4. Avatar upload flow (real API — catches field name mismatches)
  // -------------------------------------------------------------------------
  test.describe("4. Avatar upload flow", () => {
    test.afterEach(async () => {
      await restoreAvatar();
    });

    test("uploading a valid image shows success alert and updates avatar preview", async ({ page }) => {
      await page.goto(`/profile/${DEFAULT_USER.username}`);
      const profilePage = new ProfilePage(page);
      await profilePage.waitForLoad();

      // Verify file input exists and accepts images
      const fileInput = profilePage.getAvatarFileInput();
      await expect(fileInput).toBeAttached({ timeout: 5000 });
      await expect(fileInput).toHaveAttribute("accept", /image\//);

      const tmpImage = createTestImage();

      try {
        // Real POST /api/profile/user/avatar — will fail if field name is wrong
        await profilePage.uploadAvatar(tmpImage);

        const alert = profilePage.getAlertBanner();
        await expect(alert).toBeVisible({ timeout: 10000 });
        await expect(alert).toContainText(/succesvol|geupload/i);

        // Avatar image should now be visible
        await expect(profilePage.getAvatarImage()).toBeVisible({ timeout: 5000 });
      } finally {
        fs.unlinkSync(tmpImage);
      }
    });

    test("avatar > 5MB shows error — upload rejected", async ({ page }) => {
      // CONSTRAINT: avatar max 5MB — must match backend validation
      await page.goto(`/profile/${DEFAULT_USER.username}`);
      const profilePage = new ProfilePage(page);
      await profilePage.waitForLoad();

      // Create a file that exceeds the 5MB limit (5 * 1024 * 1024 + 1 bytes)
      const oversizeBytes = 5 * 1024 * 1024 + 1;
      const tmpFile = path.join(os.tmpdir(), `oversize-avatar-${Date.now()}.png`);
      const oversizeBuffer = Buffer.alloc(oversizeBytes, 0);
      // Write minimal PNG header so it looks like a PNG file
      const PNG_HEADER = Buffer.from("89504e47", "hex");
      PNG_HEADER.copy(oversizeBuffer, 0);
      fs.writeFileSync(tmpFile, oversizeBuffer);

      try {
        await profilePage.uploadAvatar(tmpFile);

        // After uploading an oversized file, either:
        // a) The frontend blocks it before sending (shows error immediately)
        // b) The backend rejects it (413 / 400) and the frontend shows an error alert
        const alert = profilePage.getAlertBanner();
        await expect(alert).toBeVisible({ timeout: 10000 });
        await expect(alert).not.toContainText(/succesvol|geupload/i);
      } finally {
        fs.unlinkSync(tmpFile);
      }
    });
  });

  // -------------------------------------------------------------------------
  // 4b. Avatar delete flow (real API)
  // -------------------------------------------------------------------------
  test.describe("4b. Avatar delete flow", () => {
    test.beforeEach(async () => {
      await restoreAvatar();
    });

    test.afterEach(async () => {
      await restoreAvatar();
    });

    test("delete avatar button removes the avatar and shows placeholder", async ({ page }) => {
      await page.goto(`/profile/${DEFAULT_USER.username}`);
      const profilePage = new ProfilePage(page);
      await profilePage.waitForLoad();

      await expect(profilePage.getAvatarImage()).toBeVisible({ timeout: 5000 });

      const deleteButton = page.getByTestId("delete-avatar-button");
      await expect(deleteButton).toBeVisible({ timeout: 5000 });
      await deleteButton.click();

      const alert = profilePage.getAlertBanner();
      await expect(alert).toBeVisible({ timeout: 10000 });
      await expect(alert).toContainText(/verwijderd|succesvol/i);

      await expect(profilePage.getAvatarImage()).toHaveCount(0, { timeout: 5000 });
    });
  });

  // -------------------------------------------------------------------------
  // 5. Logout flow from profile page
  // -------------------------------------------------------------------------
  test.describe("5. Logout flow", () => {
    test("logout button visible on profile page and clicking it redirects to home/login", async ({ page }) => {
      await page.goto(`/profile/${DEFAULT_USER.username}`);
      const profilePage = new ProfilePage(page);
      await profilePage.waitForLoad();

      // Verify logout button is present
      await expect(profilePage.getLogoutButton()).toBeVisible({ timeout: 5000 });

      // Perform logout
      await profilePage.clickLogout();

      // Should land on home or login page
      await expect(page).toHaveURL(/^http:\/\/localhost:3000\/(login)?$/, {
        timeout: 10000,
      });
    });
  });

  // -------------------------------------------------------------------------
  // Error scenarios — mocks kept intentionally for 4xx/5xx paths
  // -------------------------------------------------------------------------
  test.describe("Error scenarios", () => {
    test("shows error alert when profile API returns 404", async ({ page }) => {
      await page.route(`**/api/profile/${DEFAULT_USER.username}`, async (route) => {
        await route.fulfill({ status: 404, body: "" });
      });

      await page.goto(`/profile/${DEFAULT_USER.username}`);

      const profilePage = new ProfilePage(page);
      const alert = profilePage.getAlertBanner();
      await expect(alert).toBeVisible({ timeout: 10000 });
      await expect(alert).toContainText(/laden|mislukt|niet/i);
    });
  });
});
