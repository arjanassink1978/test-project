# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: profile.spec.ts >> User Profile Page Flow >> 1. Login to Dashboard to Profile navigation >> dashboard has a Go to Profile link that navigates to /profile/user
- Location: tests/e2e/profile.spec.ts:118:9

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="profile-link"]').or(locator('a[href*="/profile"]')).or(getByRole('link', { name: /go to profile|mijn profiel|profiel/i }))
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('[data-testid="profile-link"]').or(locator('a[href*="/profile"]')).or(getByRole('link', { name: /go to profile|mijn profiel|profiel/i }))

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]:
    - img [ref=e8]
  - alert [ref=e11]
  - main [ref=e12]:
    - generic [ref=e13]:
      - generic [ref=e14]:
        - img [ref=e16]
        - heading "Welkom! U bent ingelogd." [level=1] [ref=e18]
        - paragraph [ref=e19]: U heeft succesvol ingelogd op de applicatie.
      - button "Uitloggen" [ref=e20]:
        - img [ref=e21]
        - text: Uitloggen
```

# Test source

```ts
  29  | function createTestImage(): string {
  30  |   // Minimal valid 1×1 red PNG (67 bytes — well-formed, accepted by most image processors)
  31  |   const PNG_1X1 = Buffer.from(
  32  |     "89504e470d0a1a0a0000000d49484452000000010000000108020000009001" +
  33  |       "2e00000000c49444154789c6260f8cfc00000000200019e21bc330000000049454e44ae426082",
  34  |     "hex"
  35  |   );
  36  |   const tmpFile = path.join(os.tmpdir(), `test-avatar-${Date.now()}.png`);
  37  |   fs.writeFileSync(tmpFile, PNG_1X1);
  38  |   return tmpFile;
  39  | }
  40  | 
  41  | /**
  42  |  * Mocks GET /api/profile/<username> to return the given profile data.
  43  |  * Must be called before navigating to the profile page.
  44  |  */
  45  | async function mockGetProfile(page: Page, profile: typeof MOCK_PROFILE) {
  46  |   await page.route(`**/api/profile/${profile.username}`, async (route, request) => {
  47  |     if (request.method() === "GET") {
  48  |       await route.fulfill({
  49  |         status: 200,
  50  |         contentType: "application/json",
  51  |         body: JSON.stringify(profile),
  52  |       });
  53  |     } else {
  54  |       await route.continue();
  55  |     }
  56  |   });
  57  | }
  58  | 
  59  | /**
  60  |  * Mocks PUT /api/profile/<username> to echo back the updated profile.
  61  |  */
  62  | async function mockUpdateProfile(page: Page, username: string) {
  63  |   await page.route(`**/api/profile/${username}`, async (route, request) => {
  64  |     if (request.method() === "PUT") {
  65  |       const body = JSON.parse(request.postData() ?? "{}") as Partial<typeof MOCK_PROFILE>;
  66  |       await route.fulfill({
  67  |         status: 200,
  68  |         contentType: "application/json",
  69  |         body: JSON.stringify({ ...MOCK_PROFILE, ...body }),
  70  |       });
  71  |     } else {
  72  |       await route.continue();
  73  |     }
  74  |   });
  75  | }
  76  | 
  77  | /**
  78  |  * Mocks POST /api/profile/<username>/avatar to return a success response.
  79  |  */
  80  | async function mockUploadAvatar(page: Page, username: string) {
  81  |   await page.route(`**/api/profile/${username}/avatar`, async (route, request) => {
  82  |     if (request.method() === "POST") {
  83  |       await route.fulfill({
  84  |         status: 200,
  85  |         contentType: "application/json",
  86  |         body: JSON.stringify({ success: true, message: "Avatar succesvol geupload." }),
  87  |       });
  88  |     } else {
  89  |       await route.continue();
  90  |     }
  91  |   });
  92  | }
  93  | 
  94  | // ---------------------------------------------------------------------------
  95  | // Suite
  96  | // ---------------------------------------------------------------------------
  97  | 
  98  | test.describe("User Profile Page Flow", () => {
  99  |   // -------------------------------------------------------------------------
  100 |   // 1. Login → Dashboard → Navigate to Profile
  101 |   // -------------------------------------------------------------------------
  102 |   test.describe("1. Login to Dashboard to Profile navigation", () => {
  103 |     test("loads login page without errors", async ({ page }) => {
  104 |       await page.goto("/login");
  105 |       await expect(page).toHaveURL(/\/login/);
  106 |       await expect(page.locator("h1")).toBeVisible();
  107 |       await expect(page.locator("h1")).toContainText(/inloggen/i);
  108 |     });
  109 | 
  110 |     test("logs in with valid credentials and redirects to /dashboard", async ({ page }) => {
  111 |       const loginPage = new LoginPage(page);
  112 |       await loginPage.login(DEFAULT_USER.username, DEFAULT_USER.password);
  113 |       await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  114 |     });
  115 | 
  116 |     // This test will fail until Issue #4 adds a profile link to the dashboard.
  117 |     // test.fail() inside the test body marks it as an expected failure so CI does not block.
  118 |     test("dashboard has a Go to Profile link that navigates to /profile/user", async ({ page }) => {
  119 |       // Remove this line once the profile link is added to DashboardPage
  120 |       test.fail(true, "Dashboard profile link not yet implemented (Issue #4)");
  121 |       await mockGetProfile(page, MOCK_PROFILE);
  122 |       await loginAsDefaultUser(page);
  123 | 
  124 |       const dashboardPage = new DashboardPage(page);
  125 |       await dashboardPage.waitForLoad();
  126 | 
  127 |       // The dashboard should have a link to the user's profile
  128 |       const profileLink = await dashboardPage.getProfileLink();
> 129 |       await expect(profileLink).toBeVisible({ timeout: 5000 });
      |                                 ^ Error: expect(locator).toBeVisible() failed
  130 | 
  131 |       await dashboardPage.clickProfileLink();
  132 | 
  133 |       await expect(page).toHaveURL(
  134 |         new RegExp(`/profile/${DEFAULT_USER.username}`),
  135 |         { timeout: 10000 }
  136 |       );
  137 | 
  138 |       // Profile page heading is visible
  139 |       const profilePage = new ProfilePage(page);
  140 |       await profilePage.waitForLoad();
  141 | 
  142 |       await expect(profilePage.getHeading()).toContainText(/profiel/i);
  143 | 
  144 |       // Username should be displayed
  145 |       await expect(profilePage.getUsernameDisplay()).toBeVisible({ timeout: 5000 });
  146 |       await expect(profilePage.getUsernameDisplay()).toContainText(DEFAULT_USER.username);
  147 |     });
  148 |   });
  149 | 
  150 |   // -------------------------------------------------------------------------
  151 |   // 2. Profile Display – all fields visible
  152 |   // -------------------------------------------------------------------------
  153 |   test.describe("2. Profile display", () => {
  154 |     test.beforeEach(async ({ page }) => {
  155 |       await mockGetProfile(page, MOCK_PROFILE);
  156 |       await page.goto(`/profile/${DEFAULT_USER.username}`);
  157 |       const profilePage = new ProfilePage(page);
  158 |       await profilePage.waitForLoad();
  159 |     });
  160 | 
  161 |     test("shows the page heading", async ({ page }) => {
  162 |       const profilePage = new ProfilePage(page);
  163 |       await expect(profilePage.getHeading()).toBeVisible();
  164 |       await expect(profilePage.getHeading()).toContainText(/profiel/i);
  165 |     });
  166 | 
  167 |     test("shows username in the account info section", async ({ page }) => {
  168 |       const profilePage = new ProfilePage(page);
  169 |       const usernameEl = profilePage.getUsernameDisplay();
  170 |       await expect(usernameEl).toBeVisible({ timeout: 5000 });
  171 |       await expect(usernameEl).toContainText(DEFAULT_USER.username);
  172 |     });
  173 | 
  174 |     test("shows email in the account info section", async ({ page }) => {
  175 |       const profilePage = new ProfilePage(page);
  176 |       const emailEl = profilePage.getEmailDisplay();
  177 |       await expect(emailEl).toBeVisible({ timeout: 5000 });
  178 |       await expect(emailEl).toContainText(MOCK_PROFILE.email);
  179 |     });
  180 | 
  181 |     test("shows edit form with displayName, bio, location inputs and save button", async ({ page }) => {
  182 |       const profilePage = new ProfilePage(page);
  183 |       await expect(profilePage.getDisplayNameInput()).toBeVisible({ timeout: 5000 });
  184 |       await expect(profilePage.getBioInput()).toBeVisible({ timeout: 5000 });
  185 |       await expect(profilePage.getLocationInput()).toBeVisible({ timeout: 5000 });
  186 |       await expect(profilePage.getSaveButton()).toBeVisible({ timeout: 5000 });
  187 |     });
  188 | 
  189 |     test("edit form inputs are populated with existing profile data", async ({ page }) => {
  190 |       const profilePage = new ProfilePage(page);
  191 |       await expect(profilePage.getDisplayNameInput()).toHaveValue(MOCK_PROFILE.displayName!);
  192 |       await expect(profilePage.getBioInput()).toHaveValue(MOCK_PROFILE.bio!);
  193 |       await expect(profilePage.getLocationInput()).toHaveValue(MOCK_PROFILE.location!);
  194 |     });
  195 | 
  196 |     test("shows avatar placeholder when no avatar is set", async ({ page }) => {
  197 |       // When avatarUrl is null, a <div> with initials is rendered, not an <img>
  198 |       const profilePage = new ProfilePage(page);
  199 |       // The avatar <img> should NOT be present since avatarUrl is null
  200 |       await expect(profilePage.getAvatarImage()).toHaveCount(0);
  201 | 
  202 |       // The placeholder div with the first letter of the username should be visible
  203 |       await expect(
  204 |         page.locator("div").filter({ hasText: /^U$/ }).first()
  205 |       ).toBeVisible({ timeout: 5000 });
  206 |     });
  207 | 
  208 |     test("shows avatar <img> when avatarUrl is set", async ({ page }) => {
  209 |       // Override mock with an avatar URL
  210 |       const profileWithAvatar = {
  211 |         ...MOCK_PROFILE,
  212 |         avatarUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  213 |       };
  214 | 
  215 |       // Unregister previous route and add a new one
  216 |       await page.unrouteAll();
  217 |       await mockGetProfile(page, profileWithAvatar);
  218 |       await page.goto(`/profile/${DEFAULT_USER.username}`);
  219 |       const profilePage = new ProfilePage(page);
  220 |       await profilePage.waitForLoad();
  221 | 
  222 |       const avatarImg = profilePage.getAvatarImage();
  223 |       await expect(avatarImg).toBeVisible({ timeout: 5000 });
  224 |       await expect(avatarImg).toHaveAttribute("src", profileWithAvatar.avatarUrl);
  225 |     });
  226 |   });
  227 | 
  228 |   // -------------------------------------------------------------------------
  229 |   // 3. Edit Profile
```