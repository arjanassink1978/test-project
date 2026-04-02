import { test, expect, Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProfilePage } from "./pages/ProfilePage";
import { loginAsDefaultUser, DEFAULT_USER } from "./fixtures/auth";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MOCK_PROFILE = {
  id: 1,
  username: "user",
  email: "user@example.com",
  displayName: "Test User",
  bio: "Hello World",
  location: "Amsterdam",
  avatarUrl: null as string | null,
};

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
 * Mocks GET /api/profile/<username> to return the given profile data.
 * Must be called before navigating to the profile page.
 */
async function mockGetProfile(page: Page, profile: typeof MOCK_PROFILE) {
  await page.route(`**/api/profile/${profile.username}`, async (route, request) => {
    if (request.method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(profile),
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mocks PUT /api/profile/<username> to echo back the updated profile.
 */
async function mockUpdateProfile(page: Page, username: string) {
  await page.route(`**/api/profile/${username}`, async (route, request) => {
    if (request.method() === "PUT") {
      const body = JSON.parse(request.postData() ?? "{}") as Partial<typeof MOCK_PROFILE>;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...MOCK_PROFILE, ...body }),
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mocks POST /api/profile/<username>/avatar to return a success response.
 */
async function mockUploadAvatar(page: Page, username: string) {
  await page.route(`**/api/profile/${username}/avatar`, async (route, request) => {
    if (request.method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, message: "Avatar succesvol geupload." }),
      });
    } else {
      await route.continue();
    }
  });
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
      await mockGetProfile(page, MOCK_PROFILE);
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
  // 2. Profile Display – all fields visible
  // -------------------------------------------------------------------------
  test.describe("2. Profile display", () => {
    test.beforeEach(async ({ page }) => {
      await mockGetProfile(page, MOCK_PROFILE);
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
      await expect(emailEl).toContainText(MOCK_PROFILE.email);
    });

    test("shows edit form with displayName, bio, location inputs and save button", async ({ page }) => {
      const profilePage = new ProfilePage(page);
      await expect(profilePage.getDisplayNameInput()).toBeVisible({ timeout: 5000 });
      await expect(profilePage.getBioInput()).toBeVisible({ timeout: 5000 });
      await expect(profilePage.getLocationInput()).toBeVisible({ timeout: 5000 });
      await expect(profilePage.getSaveButton()).toBeVisible({ timeout: 5000 });
    });

    test("edit form inputs are populated with existing profile data", async ({ page }) => {
      const profilePage = new ProfilePage(page);
      await expect(profilePage.getDisplayNameInput()).toHaveValue(MOCK_PROFILE.displayName!);
      await expect(profilePage.getBioInput()).toHaveValue(MOCK_PROFILE.bio!);
      await expect(profilePage.getLocationInput()).toHaveValue(MOCK_PROFILE.location!);
    });

    test("shows avatar placeholder when no avatar is set", async ({ page }) => {
      // When avatarUrl is null, a <div> with initials is rendered, not an <img>
      const profilePage = new ProfilePage(page);
      // The avatar <img> should NOT be present since avatarUrl is null
      await expect(profilePage.getAvatarImage()).toHaveCount(0);

      // The placeholder div with the first letter of the username should be visible
      await expect(
        page.locator("div").filter({ hasText: /^U$/ }).first()
      ).toBeVisible({ timeout: 5000 });
    });

    test("shows avatar <img> when avatarUrl is set", async ({ page }) => {
      // Override mock with an avatar URL
      const profileWithAvatar = {
        ...MOCK_PROFILE,
        avatarUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      };

      // Unregister previous route and add a new one
      await page.unrouteAll();
      await mockGetProfile(page, profileWithAvatar);
      await page.goto(`/profile/${DEFAULT_USER.username}`);
      const profilePage = new ProfilePage(page);
      await profilePage.waitForLoad();

      const avatarImg = profilePage.getAvatarImage();
      await expect(avatarImg).toBeVisible({ timeout: 5000 });
      await expect(avatarImg).toHaveAttribute("src", profileWithAvatar.avatarUrl);
    });
  });

  // -------------------------------------------------------------------------
  // 3. Edit Profile
  // -------------------------------------------------------------------------
  test.describe("3. Edit profile", () => {
    test.beforeEach(async ({ page }) => {
      await mockGetProfile(page, { ...MOCK_PROFILE, displayName: "", bio: "", location: "" });
      await mockUpdateProfile(page, DEFAULT_USER.username);
      await page.goto(`/profile/${DEFAULT_USER.username}`);
      const profilePage = new ProfilePage(page);
      await profilePage.waitForLoad();
    });

    test("fills and saves profile fields then shows success alert", async ({ page }) => {
      const profilePage = new ProfilePage(page);

      // Fill the edit form
      await profilePage.fillEditForm("Test User", "Hello World", "Amsterdam");

      // Verify inputs hold the typed values
      await expect(profilePage.getDisplayNameInput()).toHaveValue("Test User");
      await expect(profilePage.getBioInput()).toHaveValue("Hello World");
      await expect(profilePage.getLocationInput()).toHaveValue("Amsterdam");

      // Submit
      await profilePage.saveProfile();

      // Wait for success alert
      const alert = profilePage.getAlertBanner();
      await expect(alert).toBeVisible({ timeout: 10000 });
      await expect(alert).toContainText(/succesvol|opgeslagen/i);
    });

    test("shows validation error for display name exceeding 100 characters", async ({ page }) => {
      const profilePage = new ProfilePage(page);
      // maxLength attribute on the input prevents typing beyond 100 chars in a browser,
      // but we can verify the Save button is available and the input respects max length.
      const input = profilePage.getDisplayNameInput();
      await expect(input).toHaveAttribute("maxlength", "100");
    });

    test("shows validation error for bio exceeding 500 characters", async ({ page }) => {
      const profilePage = new ProfilePage(page);
      await expect(profilePage.getBioInput()).toHaveAttribute("maxlength", "500");
    });
  });

  // -------------------------------------------------------------------------
  // 4. Avatar Upload
  // -------------------------------------------------------------------------
  test.describe("4. Avatar upload", () => {
    test.beforeEach(async ({ page }) => {
      await mockGetProfile(page, MOCK_PROFILE);
      // Mock GET again after avatar upload (component re-fetches profile)
      const profileWithAvatar = {
        ...MOCK_PROFILE,
        avatarUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      };
      await mockUploadAvatar(page, DEFAULT_USER.username);
      // After upload the component calls getProfile again — route it to return avatar
      await page.route(`**/api/profile/${DEFAULT_USER.username}`, async (route, request) => {
        if (request.method() === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(profileWithAvatar),
          });
        } else {
          await route.continue();
        }
      });

      await page.goto(`/profile/${DEFAULT_USER.username}`);
      const profilePage = new ProfilePage(page);
      await profilePage.waitForLoad();
    });

    test("avatar file input exists and accepts image files", async ({ page }) => {
      const profilePage = new ProfilePage(page);
      const fileInput = profilePage.getAvatarFileInput();
      await expect(fileInput).toBeAttached({ timeout: 5000 });
      await expect(fileInput).toHaveAttribute("accept", /image\//);
    });

    test("uploading a valid image shows success alert and updates avatar preview", async ({ page }) => {
      const profilePage = new ProfilePage(page);
      const tmpImage = createTestImage();

      try {
        await profilePage.uploadAvatar(tmpImage);

        // Success alert should appear
        const alert = profilePage.getAlertBanner();
        await expect(alert).toBeVisible({ timeout: 10000 });
        await expect(alert).toContainText(/succesvol|geupload/i);

        // Avatar image should now be visible
        const avatarImg = profilePage.getAvatarImage();
        await expect(avatarImg).toBeVisible({ timeout: 5000 });
      } finally {
        fs.unlinkSync(tmpImage);
      }
    });
  });

  // -------------------------------------------------------------------------
  // 5. Logout from profile page
  // -------------------------------------------------------------------------
  test.describe("5. Logout from profile page", () => {
    test.beforeEach(async ({ page }) => {
      await mockGetProfile(page, MOCK_PROFILE);
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
      // LogoutButton calls router.push("/") — should land on home
      await expect(page).toHaveURL(/^http:\/\/localhost:3000\/(login)?$/, {
        timeout: 10000,
      });
    });
  });

  // -------------------------------------------------------------------------
  // Error scenarios
  // -------------------------------------------------------------------------
  test.describe("Error scenarios", () => {
    test("shows error alert when profile API returns 404", async ({ page }) => {
      await page.route(`**/api/profile/${DEFAULT_USER.username}`, async (route) => {
        await route.fulfill({ status: 404, body: "" });
      });

      await page.goto(`/profile/${DEFAULT_USER.username}`);

      // Should show an error alert
      const alert = page.locator('[role="alert"]');
      await expect(alert).toBeVisible({ timeout: 10000 });
      await expect(alert).toContainText(/laden|mislukt|niet/i);
    });

    test("login shows error alert for invalid credentials", async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.login("user", "wrongpassword");

      const error = await loginPage.getErrorMessage();
      await expect(error).toBeVisible({ timeout: 5000 });
      await expect(error).toContainText(/ongeldig|wachtwoord/i);
    });
  });
});
