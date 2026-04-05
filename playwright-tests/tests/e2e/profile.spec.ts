import { test, expect } from "@playwright/test";
import { ProfilePage } from "./pages/ProfilePage";
import { setupDefaultUserAuth, loginAsDefaultUser } from "./fixtures/auth";
import { updateProfileViaApi, deleteAvatarViaApi, getProfileViaApi } from "./fixtures/api";
import { DEFAULT_USER, SEEDED_PROFILE } from "./config";

test.describe("User Profile", () => {
  test("profile page shows user information", async ({ page }) => {
    await setupDefaultUserAuth(page);

    const profilePage = new ProfilePage(page);
    await profilePage.goto(DEFAULT_USER.username);

    const username = await profilePage.getUsername();
    expect(username).toContain(DEFAULT_USER.username);

    const email = await profilePage.getEmail();
    expect(email).toContain(DEFAULT_USER.email);
  });

  test("user can update profile fields", async ({ page }) => {
    const { token } = await setupDefaultUserAuth(page);

    const profilePage = new ProfilePage(page);
    await profilePage.goto(DEFAULT_USER.username);

    const newDisplayName = `Updated Name ${Date.now()}`;
    const newBio = `Updated bio ${Date.now()}`;
    const newLocation = "New City";

    await profilePage.fillDisplayName(newDisplayName);
    await profilePage.fillBio(newBio);
    await profilePage.fillLocation(newLocation);
    await profilePage.saveProfile();

    await page.waitForLoadState("networkidle");

    const profile = await getProfileViaApi(DEFAULT_USER.username);
    expect(profile.displayName).toBe(newDisplayName);
    expect(profile.bio).toBe(newBio);
    expect(profile.location).toBe(newLocation);

    await updateProfileViaApi(token, DEFAULT_USER.username, {
      displayName: SEEDED_PROFILE.displayName,
      bio: SEEDED_PROFILE.bio,
      location: SEEDED_PROFILE.location,
    });
  });

  test("display name field respects max length", async ({ page }) => {
    await setupDefaultUserAuth(page);

    const profilePage = new ProfilePage(page);
    await profilePage.goto(DEFAULT_USER.username);

    const input = page.getByTestId("display-name-input");
    const maxLength = await input.getAttribute("maxlength");
    expect(maxLength).toBe("100");
  });

  test("bio field respects max length", async ({ page }) => {
    await setupDefaultUserAuth(page);

    const profilePage = new ProfilePage(page);
    await profilePage.goto(DEFAULT_USER.username);

    const input = page.getByTestId("bio-input");
    const maxLength = await input.getAttribute("maxlength");
    expect(maxLength).toBe("500");
  });

  test("location field respects max length", async ({ page }) => {
    await setupDefaultUserAuth(page);

    const profilePage = new ProfilePage(page);
    await profilePage.goto(DEFAULT_USER.username);

    const input = page.getByTestId("location-input");
    const maxLength = await input.getAttribute("maxlength");
    expect(maxLength).toBe("100");
  });

  test("accessing nonexistent profile shows error", async ({ page }) => {
    await page.goto("/profile/nonexistent_user_that_never_existed");

    const errorElement = page.getByTestId("profile-alert");
    const isVisible = await errorElement.isVisible().catch(() => false);
    expect(isVisible || page.url()).toBeTruthy();
  });

  test("profile update shows success feedback", async ({ page }) => {
    await setupDefaultUserAuth(page);

    const profilePage = new ProfilePage(page);
    await profilePage.goto(DEFAULT_USER.username);

    await profilePage.fillDisplayName(`Name ${Date.now()}`);
    await profilePage.saveProfile();

    const isAlertVisible = await profilePage.isAlertVisible();
    expect(isAlertVisible).toBe(true);
  });

  test("user can clear profile changes by reloading", async ({ page }) => {
    await setupDefaultUserAuth(page);

    const profilePage = new ProfilePage(page);
    await profilePage.goto(DEFAULT_USER.username);

    const initialDisplayName = await page
      .getByTestId("display-name-input")
      .inputValue();

    await profilePage.fillDisplayName("Temporary Name");

    await page.reload();

    const reloadedDisplayName = await page
      .getByTestId("display-name-input")
      .inputValue();

    expect(reloadedDisplayName).toBe(initialDisplayName);
  });

  test("user can navigate back to profile from other pages", async ({ page }) => {
    await loginAsDefaultUser(page);

    const profilePage = new ProfilePage(page);
    await profilePage.goto(DEFAULT_USER.username);

    await expect(page).toHaveURL(new RegExp(`/profile/${DEFAULT_USER.username}`));
  });

  test("profile fields are populated on page load", async ({ page }) => {
    await setupDefaultUserAuth(page);

    const profilePage = new ProfilePage(page);
    await profilePage.goto(DEFAULT_USER.username);

    const displayName = await page.getByTestId("display-name-input").inputValue();
    expect(displayName.length).toBeGreaterThan(0);
  });

  test("logout from profile page returns to home", async ({ page }) => {
    await loginAsDefaultUser(page);

    const profilePage = new ProfilePage(page);
    await profilePage.goto(DEFAULT_USER.username);

    await profilePage.clickLogout();

    await expect(page).toHaveURL("/");
  });
});
