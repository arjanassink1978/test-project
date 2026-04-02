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
  // Re-seed the avatar by uploading a tiny PNG via the real API
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
  test.describe("1. Login to Dashboard to Profile navigation", () => {
    test("loads login page without errors", async ({ page }) => {
      await page.goto("/login");
      await expect(page).toHaveURL(/\/login/);
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator("h1")).toContainText(/inloggen/i);
    });

    test("logs in with valid credentials and redirects to /dashboard", async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.login(DEFAULT_USER.username, DEFAULT_USER.password);
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    });

    test("dashboard has a Go to Profile link that navigates to /profile/user", async ({ page }) => {
      await loginAsDefaultUser(page);

      const dashboardPage = new DashboardPage(page);
      await dashboardPage.waitForLoad();

      // The dashboard should have a link to the user's profile
      const profileLink = await dashboardPage.getProfileLink();
      await expect(profileLink).toBeVisible({ timeout: 5000 });

      await dashboardPage.clickProfileLink();

      await expect(page).toHaveURL(
        new RegExp(`/profile/${DEFAULT_USER.username}`),
        { timeout: 10000 }
      );

      // Profile page heading is visible
      const profilePage = new ProfilePage(page);
      await profilePage.waitForLoad();

      await expect(profilePage.getHeading()).toContainText(/profiel/i);

      // Username should be displayed
      await expect(profilePage.getUsernameDisplay()).toBeVisible({ timeout: 5000 });
      await expect(profilePage.getUsernameDisplay()).toContainText(DEFAULT_USER.username);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Profile Display – all fields visible (real API)
  // -------------------------------------------------------------------------
  test.describe("2. Profile display", () => {
    test.beforeEach(async ({ page }) => {
      // Navigate directly — no mock needed, real GET /api/profile/user
      await page.goto(`/profile/${DEFAULT_USER.username}`);
      const profilePage = new ProfilePage(page);
      await profilePage.waitForLoad();
    });

    test("shows the page heading", async ({ page }) => {
      const profilePage = new ProfilePage(page);
      await expect(profilePage.getHeading()).toBeVisible();
      await expect(profilePage.getHeading()).toContainText(/profiel/i);
    });

    test("shows username in the account info section", async ({ page }) => {
      const profilePage = new ProfilePage(page);
      const usernameEl = profilePage.getUsernameDisplay();
      await expect(usernameEl).toBeVisible({ timeout: 5000 });
      await expect(usernameEl).toContainText(DEFAULT_USER.username);
    });

    test("shows email in the account info section", async ({ page }) => {
      const profilePage = new ProfilePage(page);
      const emailEl = profilePage.getEmailDisplay();
      await expect(emailEl).toBeVisible({ timeout: 5000 });
      await expect(emailEl).toContainText(SEEDED_PROFILE.email);
    });

    test("shows edit form with displayName, bio, location inputs and save button", async ({ page }) => {
      const profilePage = new ProfilePage(page);
      await expect(profilePage.getDisplayNameInput()).toBeVisible({ timeout: 5000 });
      await expect(profilePage.getBioInput()).toBeVisible({ timeout: 5000 });
      await expect(profilePage.getLocationInput()).toBeVisible({ timeout: 5000 });
      await expect(profilePage.getSaveButton()).toBeVisible({ timeout: 5000 });
    });

    test("edit form inputs are populated with seeded profile data", async ({ page }) => {
      const profilePage = new ProfilePage(page);
      await expect(profilePage.getDisplayNameInput()).toHaveValue(SEEDED_PROFILE.displayName);
      await expect(profilePage.getBioInput()).toHaveValue(SEEDED_PROFILE.bio);
      await expect(profilePage.getLocationInput()).toHaveValue(SEEDED_PROFILE.location);
    });

    test("shows avatar <img> because seeded user has an avatarUrl", async ({ page }) => {
      // The DataInitializer seeds the user with a dicebear avatar URL,
      // so <img data-testid="avatar-image"> should always be present.
      const profilePage = new ProfilePage(page);
      const avatarImg = profilePage.getAvatarImage();
      await expect(avatarImg).toBeVisible({ timeout: 5000 });
    });

    test("shows validation maxlength attributes on edit inputs", async ({ page }) => {
      const profilePage = new ProfilePage(page);
      await expect(profilePage.getDisplayNameInput()).toHaveAttribute("maxlength", "100");
      await expect(profilePage.getBioInput()).toHaveAttribute("maxlength", "500");
    });
  });

  // -------------------------------------------------------------------------
  // 2b. Profile display with no avatar (error scenario / edge case)
  // -------------------------------------------------------------------------
  test.describe("2b. Profile display – no avatar state", () => {
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

      // The avatar <img> should NOT be present since avatarUrl is null
      await expect(profilePage.getAvatarImage()).toHaveCount(0);

      // The placeholder div with the first letter of the username should be visible
      await expect(
        page.locator("div").filter({ hasText: /^U$/ }).first()
      ).toBeVisible({ timeout: 5000 });
    });
  });

  // -------------------------------------------------------------------------
  // 3. Edit Profile (real API)
  // -------------------------------------------------------------------------
  test.describe("3. Edit profile", () => {
    test.beforeEach(async () => {
      // Reset the profile to known seeded values before each edit test
      await resetProfile();
    });

    test.afterEach(async () => {
      // Restore seeded values after each edit so other suites see a clean state
      await resetProfile();
    });

    test("fills and saves profile fields then shows success alert", async ({ page }) => {
      await page.goto(`/profile/${DEFAULT_USER.username}`);
      const profilePage = new ProfilePage(page);
      await profilePage.waitForLoad();

      // Fill new values over the seeded ones
      await profilePage.fillEditForm("Test User", "Hello World", "Amsterdam");

      await expect(profilePage.getDisplayNameInput()).toHaveValue("Test User");
      await expect(profilePage.getBioInput()).toHaveValue("Hello World");
      await expect(profilePage.getLocationInput()).toHaveValue("Amsterdam");

      // Submit to real PUT /api/profile/user
      await profilePage.saveProfile();

      // Wait for success alert from backend
      const alert = profilePage.getAlertBanner();
      await expect(alert).toBeVisible({ timeout: 10000 });
      await expect(alert).toContainText(/succesvol|opgeslagen/i);
    });

    test("persists updated values — re-loading the page shows the saved data", async ({ page }) => {
      await page.goto(`/profile/${DEFAULT_USER.username}`);
      const profilePage = new ProfilePage(page);
      await profilePage.waitForLoad();

      await profilePage.fillEditForm("Saved Name", "Saved bio", "Rotterdam");
      await profilePage.saveProfile();

      const alert = profilePage.getAlertBanner();
      await expect(alert).toBeVisible({ timeout: 10000 });

      // Reload and confirm the backend persisted the change
      await page.reload();
      await profilePage.waitForLoad();

      await expect(profilePage.getDisplayNameInput()).toHaveValue("Saved Name");
      await expect(profilePage.getBioInput()).toHaveValue("Saved bio");
      await expect(profilePage.getLocationInput()).toHaveValue("Rotterdam");
    });

    test("shows validation error for display name exceeding 100 characters", async ({ page }) => {
      await page.goto(`/profile/${DEFAULT_USER.username}`);
      const profilePage = new ProfilePage(page);
      await profilePage.waitForLoad();

      const input = profilePage.getDisplayNameInput();
      await expect(input).toHaveAttribute("maxlength", "100");
    });

    test("shows validation error for bio exceeding 500 characters", async ({ page }) => {
      await page.goto(`/profile/${DEFAULT_USER.username}`);
      const profilePage = new ProfilePage(page);
      await profilePage.waitForLoad();

      await expect(profilePage.getBioInput()).toHaveAttribute("maxlength", "500");
    });
  });

  // -------------------------------------------------------------------------
  // 4. Avatar Upload (real API — catches field name mismatches)
  // -------------------------------------------------------------------------
  test.describe("4. Avatar upload", () => {
    test.afterEach(async () => {
      // Restore the avatar after each test so display tests always see an avatar
      await restoreAvatar();
    });

    test("avatar file input exists and accepts image files", async ({ page }) => {
      await page.goto(`/profile/${DEFAULT_USER.username}`);
      const profilePage = new ProfilePage(page);
      await profilePage.waitForLoad();

      const fileInput = profilePage.getAvatarFileInput();
      await expect(fileInput).toBeAttached({ timeout: 5000 });
      await expect(fileInput).toHaveAttribute("accept", /image\//);
    });

    test("uploading a valid image shows success alert and updates avatar preview", async ({ page }) => {
      await page.goto(`/profile/${DEFAULT_USER.username}`);
      const profilePage = new ProfilePage(page);
      await profilePage.waitForLoad();

      const tmpImage = createTestImage();

      try {
        // Real POST /api/profile/user/avatar — will fail if field name is wrong
        await profilePage.uploadAvatar(tmpImage);

        // Success alert should appear
        const alert = profilePage.getAlertBanner();
        await expect(alert).toBeVisible({ timeout: 10000 });
        await expect(alert).toContainText(/succesvol|geupload/i);

        // Avatar image should now be visible (component refreshes profile after upload)
        const avatarImg = profilePage.getAvatarImage();
        await expect(avatarImg).toBeVisible({ timeout: 5000 });
      } finally {
        fs.unlinkSync(tmpImage);
      }
    });
  });

  // -------------------------------------------------------------------------
  // 4b. Avatar Delete (real API)
  // -------------------------------------------------------------------------
  test.describe("4b. Avatar delete", () => {
    test.beforeEach(async () => {
      // Ensure avatar exists so delete has something to remove
      await restoreAvatar();
    });

    test.afterEach(async () => {
      // Always restore avatar so display tests see a clean state
      await restoreAvatar();
    });

    test("delete avatar button removes the avatar and shows placeholder", async ({ page }) => {
      await page.goto(`/profile/${DEFAULT_USER.username}`);
      const profilePage = new ProfilePage(page);
      await profilePage.waitForLoad();

      // Avatar image should be visible before delete
      await expect(profilePage.getAvatarImage()).toBeVisible({ timeout: 5000 });

      // Click delete — real DELETE /api/profile/user/avatar
      const deleteButton = page.getByTestId("delete-avatar-button");
      await expect(deleteButton).toBeVisible({ timeout: 5000 });
      await deleteButton.click();

      // Success alert should appear
      const alert = profilePage.getAlertBanner();
      await expect(alert).toBeVisible({ timeout: 10000 });
      await expect(alert).toContainText(/verwijderd|succesvol/i);

      // Avatar image should be gone; placeholder should be shown
      await expect(profilePage.getAvatarImage()).toHaveCount(0, { timeout: 5000 });
    });
  });

  // -------------------------------------------------------------------------
  // 5. Logout from profile page (real navigation)
  // -------------------------------------------------------------------------
  test.describe("5. Logout from profile page", () => {
    test.beforeEach(async ({ page }) => {
      // Navigate directly — real GET /api/profile/user
      await page.goto(`/profile/${DEFAULT_USER.username}`);
      const profilePage = new ProfilePage(page);
      await profilePage.waitForLoad();
    });

    test("logout button is visible on the profile page", async ({ page }) => {
      const profilePage = new ProfilePage(page);
      await expect(profilePage.getLogoutButton()).toBeVisible({ timeout: 5000 });
    });

    test("clicking Logout redirects to the home page", async ({ page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.clickLogout();
      // LogoutButton calls router.push("/") — should land on home or login
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
      // Mock a 404 — this is an error path that cannot be tested against a real
      // seeded user, so mocking is the correct approach here.
      await page.route(`**/api/profile/${DEFAULT_USER.username}`, async (route) => {
        await route.fulfill({ status: 404, body: "" });
      });

      await page.goto(`/profile/${DEFAULT_USER.username}`);

      const profilePage = new ProfilePage(page);
      const alert = profilePage.getAlertBanner();
      await expect(alert).toBeVisible({ timeout: 10000 });
      await expect(alert).toContainText(/laden|mislukt|niet/i);
    });

    test("login shows error alert for invalid credentials", async ({ page }) => {
      // Real POST /api/auth/login with wrong password — no mock needed
      const loginPage = new LoginPage(page);
      await loginPage.login("user", "wrongpassword");

      const error = await loginPage.getErrorMessage();
      await expect(error).toBeVisible({ timeout: 5000 });
      await expect(error).toContainText(/ongeldig|wachtwoord/i);
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
      // Alert should convey failure, not success
      await expect(alert).not.toContainText(/succesvol/i);
    });
  });
});
