# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: profile.spec.ts >> User Profile Page Flow >> 1. Login to Dashboard to Profile navigation >> dashboard has a Go to Profile link that navigates to /profile/user
- Location: tests/e2e/profile.spec.ts:116:9

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
  25  | // Helpers
  26  | // ---------------------------------------------------------------------------
  27  | 
  28  | /** Creates a minimal 1x1 PNG in a temp file and returns its path. */
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
  116 |     test("dashboard has a Go to Profile link that navigates to /profile/user", async ({ page }) => {
  117 |       await mockGetProfile(page, MOCK_PROFILE);
  118 |       await loginAsDefaultUser(page);
  119 | 
  120 |       const dashboardPage = new DashboardPage(page);
  121 |       await dashboardPage.waitForLoad();
  122 | 
  123 |       // The dashboard should have a link to the user's profile
  124 |       const profileLink = await dashboardPage.getProfileLink();
> 125 |       await expect(profileLink).toBeVisible({ timeout: 5000 });
      |                                 ^ Error: expect(locator).toBeVisible() failed
  126 | 
  127 |       await dashboardPage.clickProfileLink();
  128 | 
  129 |       await expect(page).toHaveURL(
  130 |         new RegExp(`/profile/${DEFAULT_USER.username}`),
  131 |         { timeout: 10000 }
  132 |       );
  133 | 
  134 |       // Profile page heading is visible
  135 |       const profilePage = new ProfilePage(page);
  136 |       await profilePage.waitForLoad();
  137 | 
  138 |       await expect(profilePage.getHeading()).toContainText(/profiel/i);
  139 | 
  140 |       // Username should be displayed
  141 |       await expect(profilePage.getUsernameDisplay()).toBeVisible({ timeout: 5000 });
  142 |       await expect(profilePage.getUsernameDisplay()).toContainText(DEFAULT_USER.username);
  143 |     });
  144 |   });
  145 | 
  146 |   // -------------------------------------------------------------------------
  147 |   // 2. Profile Display – all fields visible
  148 |   // -------------------------------------------------------------------------
  149 |   test.describe("2. Profile display", () => {
  150 |     test.beforeEach(async ({ page }) => {
  151 |       await mockGetProfile(page, MOCK_PROFILE);
  152 |       await page.goto(`/profile/${DEFAULT_USER.username}`);
  153 |       const profilePage = new ProfilePage(page);
  154 |       await profilePage.waitForLoad();
  155 |     });
  156 | 
  157 |     test("shows the page heading", async ({ page }) => {
  158 |       const profilePage = new ProfilePage(page);
  159 |       await expect(profilePage.getHeading()).toBeVisible();
  160 |       await expect(profilePage.getHeading()).toContainText(/profiel/i);
  161 |     });
  162 | 
  163 |     test("shows username in the account info section", async ({ page }) => {
  164 |       const profilePage = new ProfilePage(page);
  165 |       const usernameEl = profilePage.getUsernameDisplay();
  166 |       await expect(usernameEl).toBeVisible({ timeout: 5000 });
  167 |       await expect(usernameEl).toContainText(DEFAULT_USER.username);
  168 |     });
  169 | 
  170 |     test("shows email in the account info section", async ({ page }) => {
  171 |       const profilePage = new ProfilePage(page);
  172 |       const emailEl = profilePage.getEmailDisplay();
  173 |       await expect(emailEl).toBeVisible({ timeout: 5000 });
  174 |       await expect(emailEl).toContainText(MOCK_PROFILE.email);
  175 |     });
  176 | 
  177 |     test("shows edit form with displayName, bio, location inputs and save button", async ({ page }) => {
  178 |       const profilePage = new ProfilePage(page);
  179 |       await expect(profilePage.getDisplayNameInput()).toBeVisible({ timeout: 5000 });
  180 |       await expect(profilePage.getBioInput()).toBeVisible({ timeout: 5000 });
  181 |       await expect(profilePage.getLocationInput()).toBeVisible({ timeout: 5000 });
  182 |       await expect(profilePage.getSaveButton()).toBeVisible({ timeout: 5000 });
  183 |     });
  184 | 
  185 |     test("edit form inputs are populated with existing profile data", async ({ page }) => {
  186 |       const profilePage = new ProfilePage(page);
  187 |       await expect(profilePage.getDisplayNameInput()).toHaveValue(MOCK_PROFILE.displayName!);
  188 |       await expect(profilePage.getBioInput()).toHaveValue(MOCK_PROFILE.bio!);
  189 |       await expect(profilePage.getLocationInput()).toHaveValue(MOCK_PROFILE.location!);
  190 |     });
  191 | 
  192 |     test("shows avatar placeholder when no avatar is set", async ({ page }) => {
  193 |       // When avatarUrl is null, a <div> with initials is rendered, not an <img>
  194 |       const profilePage = new ProfilePage(page);
  195 |       // The avatar <img> should NOT be present since avatarUrl is null
  196 |       await expect(profilePage.getAvatarImage()).toHaveCount(0);
  197 | 
  198 |       // The placeholder div with the first letter of the username should be visible
  199 |       await expect(
  200 |         page.locator("div").filter({ hasText: /^U$/ }).first()
  201 |       ).toBeVisible({ timeout: 5000 });
  202 |     });
  203 | 
  204 |     test("shows avatar <img> when avatarUrl is set", async ({ page }) => {
  205 |       // Override mock with an avatar URL
  206 |       const profileWithAvatar = {
  207 |         ...MOCK_PROFILE,
  208 |         avatarUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  209 |       };
  210 | 
  211 |       // Unregister previous route and add a new one
  212 |       await page.unrouteAll();
  213 |       await mockGetProfile(page, profileWithAvatar);
  214 |       await page.goto(`/profile/${DEFAULT_USER.username}`);
  215 |       const profilePage = new ProfilePage(page);
  216 |       await profilePage.waitForLoad();
  217 | 
  218 |       const avatarImg = profilePage.getAvatarImage();
  219 |       await expect(avatarImg).toBeVisible({ timeout: 5000 });
  220 |       await expect(avatarImg).toHaveAttribute("src", profileWithAvatar.avatarUrl);
  221 |     });
  222 |   });
  223 | 
  224 |   // -------------------------------------------------------------------------
  225 |   // 3. Edit Profile
```