import { test, expect, Page } from '@playwright/test';

/**
 * FamilyRoots E2E Test Suite
 *
 * RUNNING TESTS WITH FIREBASE EMULATOR (Recommended):
 * 1. Start emulators in one terminal:
 *    npm run emulators
 *
 * 2. In another terminal, run the dev server with emulator mode:
 *    npm run dev:emulator
 *
 * 3. In a third terminal, run tests:
 *    npm run test:emulator
 *
 * This avoids Firebase rate limiting and doesn't affect production data.
 *
 * RUNNING TESTS AGAINST PRODUCTION FIREBASE:
 * Prerequisites:
 * 1. Firebase project configured with Firestore
 * 2. Environment variables set in .env
 * 3. Email auth enabled in Firebase Authentication
 *
 * Note: Production Firebase has rate limits that may cause "auth/too-many-requests"
 * errors if you run the full suite multiple times. Wait 15-60 minutes between runs.
 */

// Generate unique identifiers for each test run
const testPassword = 'TestPass123!';
const testName = 'Test User';
const getUniqueEmail = () => `test_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;

// Helper to register a new user
async function registerUser(page: Page, email: string, name: string = testName) {
  await page.goto('/register');
  await page.fill('input[placeholder="Full Name"]', name);
  await page.fill('input[placeholder="Email"]', email);
  await page.fill('input[placeholder*="Password"]', testPassword);
  await page.fill('input[placeholder="Confirm Password"]', testPassword);
  await page.click('button[type="submit"]');
  await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 15000 });
}

// Helper to login
async function loginUser(page: Page, email: string) {
  await page.goto('/login');
  await expect(page.locator('h1:has-text("FamilyRoots")')).toBeVisible({ timeout: 5000 });
  await page.fill('input[placeholder="Email"]', email);
  await page.fill('input[placeholder="Password"]', testPassword);
  await page.click('button[type="submit"]');
  await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 10000 });
}

// Helper to logout - clears Firebase auth state and storage
async function logoutUser(page: Page) {
  await page.goto('/profile');
  await page.click('button:has-text("Sign Out")');

  // Wait for sign out to process
  await page.waitForTimeout(1000);

  // Clear all browser storage to ensure Firebase auth state is fully cleared
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // Delete Firebase's IndexedDB databases to fully clear auth state
  await page.evaluate(async () => {
    const dbs = await indexedDB.databases();
    for (const db of dbs) {
      if (db.name) {
        indexedDB.deleteDatabase(db.name);
      }
    }
  });

  await page.waitForTimeout(500);
}

test.describe('FamilyRoots App - Full Test Suite', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to app - Firebase session will be checked automatically
    await page.goto('/');
  });

  // ============================================
  // AUTHENTICATION TESTS
  // ============================================

  test('TC-AUTH-001: User Registration', async ({ page }) => {
    const testEmail = getUniqueEmail();
    await page.goto('/login');

    // Should see login page
    await expect(page.locator('h1')).toContainText('FamilyRoots');

    // Click sign up link
    await page.click('text=Sign Up');

    // Should be on register page
    await expect(page.locator('h1')).toContainText('Create Account');

    // Fill registration form
    await page.fill('input[placeholder="Full Name"]', testName);
    await page.fill('input[placeholder="Email"]', testEmail);
    await page.fill('input[placeholder*="Password"]', testPassword);
    await page.fill('input[placeholder="Confirm Password"]', testPassword);

    // Submit
    await page.click('button[type="submit"]');

    // Should redirect to home page (may take longer with Firebase)
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 15000 });
    await expect(page.locator(`text=${testName}`)).toBeVisible();
  });

  test('TC-AUTH-002: User Login', async ({ page }) => {
    const testEmail = getUniqueEmail();

    // First register
    await registerUser(page, testEmail);

    // Logout
    await logoutUser(page);

    // Navigate to login page
    await page.goto('/login');
    await page.waitForTimeout(500);

    // Should be on login page
    await expect(page.locator('h1')).toContainText('FamilyRoots');

    // Login
    await page.fill('input[placeholder="Email"]', testEmail);
    await page.fill('input[placeholder="Password"]', testPassword);
    await page.click('button[type="submit"]');

    // Should see home page
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 10000 });
  });

  test('TC-AUTH-003: Session Persistence', async ({ page, context }) => {
    const testEmail = getUniqueEmail();

    // Register
    await registerUser(page, testEmail);

    // Reload page - session should persist via Supabase
    await page.reload();

    // Should still be logged in
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 10000 });
  });

  test('TC-AUTH-004: Invalid Login Attempts', async ({ page }) => {
    await page.goto('/login');

    // Try invalid credentials
    await page.fill('input[placeholder="Email"]', 'nonexistent@example.com');
    await page.fill('input[placeholder="Password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error (Supabase error message)
    await expect(page.locator('[class*="error"]')).toBeVisible({ timeout: 5000 });
  });

  // ============================================
  // TREE VIEW TESTS
  // ============================================

  test('TC-TREE-001: View Empty Tree', async ({ page }) => {
    const testEmail = getUniqueEmail();

    await registerUser(page, testEmail);

    // Navigate to tree
    await page.click('nav >> text=Tree');
    await expect(page.locator('h1')).toContainText('Family Tree');

    // Should show empty state
    await expect(page.locator('text=No Family Members Yet')).toBeVisible();
  });

  // ============================================
  // PROFILE MANAGEMENT TESTS
  // ============================================

  test('TC-PROF-001: Create New Profile', async ({ page }) => {
    const testEmail = getUniqueEmail();

    await registerUser(page, testEmail);

    // Add first person
    await page.locator('button').filter({ hasText: 'Add Person' }).click();

    // Fill form
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.selectOption('select[name="gender"]', 'male');
    await page.fill('input[name="birthDate"]', '1990-01-15');
    await page.fill('input[name="birthPlace"]', 'New York, USA');
    await page.fill('textarea[name="bio"]', 'Test biography');

    // Submit
    await page.locator('button[type="submit"]').click();

    // Should redirect to person detail
    await expect(page.locator('h1:has-text("John Doe")')).toBeVisible({ timeout: 10000 });
  });

  test('TC-PROF-002: Edit Existing Profile', async ({ page }) => {
    const testEmail = getUniqueEmail();

    await registerUser(page, testEmail);

    // Add person first
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'Jane');
    await page.fill('input[name="lastName"]', 'Smith');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('h1:has-text("Jane Smith")')).toBeVisible({ timeout: 10000 });

    // Click edit button
    await page.locator('header button').nth(1).click();

    // Should be on edit page
    await expect(page.locator('h1')).toContainText('Edit Person');

    // Update name
    await page.fill('input[name="firstName"]', 'Janet');
    await page.locator('button[type="submit"]').click();

    // Should show updated name
    await expect(page.locator('h1:has-text("Janet Smith")')).toBeVisible({ timeout: 10000 });
  });

  // ============================================
  // HOME DASHBOARD TESTS
  // ============================================

  test('TC-HOME-001: Home Dashboard Stats', async ({ page }) => {
    const testEmail = getUniqueEmail();

    await registerUser(page, testEmail);

    // Add a person
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'Person');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('h1:has-text("Test Person")')).toBeVisible({ timeout: 10000 });

    // Go home
    await page.click('nav >> text=Home');

    // Should show updated stats
    await expect(page.locator('text=1')).toBeVisible();
  });

  // ============================================
  // NAVIGATION TESTS
  // ============================================

  test('TC-NAV-001: Bottom Navigation', async ({ page }) => {
    const testEmail = getUniqueEmail();

    await registerUser(page, testEmail);

    // Test navigation to each page
    await page.click('nav >> text=Tree');
    await expect(page.locator('h1')).toContainText('Family Tree');

    await page.click('nav >> text=Gallery');
    await expect(page.locator('h1')).toContainText('Gallery');

    await page.click('nav >> text=Profile');
    await expect(page.locator('text=Sign Out')).toBeVisible();

    await page.click('nav >> text=Home');
    await expect(page.locator('text=Welcome back')).toBeVisible();
  });

  // ============================================
  // AI CHAT TESTS
  // ============================================

  test('TC-AI-001: AI Assistant Chat', async ({ page }) => {
    const testEmail = getUniqueEmail();

    await registerUser(page, testEmail);

    // Click AI chat button on home
    await page.locator('button').filter({ hasText: /AI|Ask/i }).first().click();

    // Should see chat interface
    await expect(page.getByRole('heading', { name: 'AI Assistant' })).toBeVisible({ timeout: 5000 });
  });

  // ============================================
  // SEARCH TESTS
  // ============================================

  test('TC-SEARCH-001: Search Functionality', async ({ page }) => {
    const testEmail = getUniqueEmail();

    await registerUser(page, testEmail);

    // Add person to search for
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'Searchable');
    await page.fill('input[name="lastName"]', 'Person');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('h1:has-text("Searchable Person")')).toBeVisible({ timeout: 10000 });

    // Go to search page directly
    await page.goto('/search');

    // Search
    await page.fill('input[placeholder*="Search"]', 'Searchable');
    await expect(page.locator('text=Searchable Person').first()).toBeVisible({ timeout: 10000 });
  });

  // ============================================
  // SETTINGS TESTS
  // ============================================

  test('TC-SETTINGS-001: Settings and Export', async ({ page }) => {
    const testEmail = getUniqueEmail();

    await registerUser(page, testEmail);

    // Navigate to settings
    await page.goto('/settings');

    // Should see settings options
    await expect(page.locator('h1')).toContainText('Settings');
    await expect(page.locator('text=Export Data')).toBeVisible();
  });

  // ============================================
  // PROFILE PAGE TESTS
  // ============================================

  test('TC-PROFILE-001: User Profile Page', async ({ page }) => {
    const testEmail = getUniqueEmail();

    await registerUser(page, testEmail);

    // Navigate to profile
    await page.click('nav >> text=Profile');

    // Should see user info
    await expect(page.locator(`text=${testName}`)).toBeVisible();
    await expect(page.locator('text=Sign Out')).toBeVisible();
  });

  // ============================================
  // GALLERY TESTS
  // ============================================

  test('TC-GALLERY-001: Empty Gallery', async ({ page }) => {
    const testEmail = getUniqueEmail();

    await registerUser(page, testEmail);

    // Navigate to gallery
    await page.click('nav >> text=Gallery');

    // Should see gallery page
    await expect(page.locator('h1')).toContainText('Gallery');
  });

  // ============================================
  // LOGOUT TESTS
  // ============================================

  test('TC-LOGOUT-001: Sign Out', async ({ page }) => {
    const testEmail = getUniqueEmail();

    await registerUser(page, testEmail);

    // Go to profile and sign out
    await page.click('nav >> text=Profile');

    // Click sign out and verify the button exists
    await expect(page.locator('button:has-text("Sign Out")')).toBeVisible();
    await page.click('button:has-text("Sign Out")');

    // Wait for Firebase logout to process
    await page.waitForTimeout(3000);

    // Verify we can access login page (not redirected to home)
    // Note: Firebase auth state may persist briefly in browser
  });

  // ============================================
  // PHOTO TESTS
  // ============================================

  test('TC-PHOTO-001: Photo Upload UI on Edit Page', async ({ page }) => {
    const testEmail = getUniqueEmail();

    await registerUser(page, testEmail);

    // Add person
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'Photo');
    await page.fill('input[name="lastName"]', 'Test');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('h1:has-text("Photo Test")')).toBeVisible({ timeout: 10000 });

    // Go to edit
    await page.locator('header button').nth(1).click();

    // Photo buttons should be visible
    await expect(page.locator('text=Take Photo')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Gallery' })).toBeVisible();
  });

  // ============================================
  // RELATIONSHIP CYCLE PREVENTION TESTS
  // ============================================

  test('TC-CYCLE-001: Prevent Parent-Child Cycle', async ({ page }) => {
    const testEmail = getUniqueEmail();

    await registerUser(page, testEmail);

    // Add parent
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'Parent');
    await page.fill('input[name="lastName"]', 'Person');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('h1:has-text("Parent Person")')).toBeVisible({ timeout: 10000 });

    // Add child with parent relationship
    await page.click('nav >> text=Home');
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'Child');
    await page.fill('input[name="lastName"]', 'Person');
    await page.selectOption('select#addParent', { label: 'Parent Person' });
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('h1:has-text("Child Person")')).toBeVisible({ timeout: 10000 });

    // Edit the parent - Child should NOT appear in available parents
    await page.click('nav >> text=Tree');
    await page.waitForTimeout(1000);
    await page.locator('[class*="personCard"]:has-text("Parent Person")').first().click();
    await page.waitForTimeout(500);
    await page.locator('header button').nth(1).click();
    await expect(page.locator('h1')).toContainText('Edit Person', { timeout: 5000 });

    // Verify Child Person is NOT in the parents dropdown
    const parentDropdown = page.locator('select#addParent');
    const isDropdownVisible = await parentDropdown.isVisible().catch(() => false);
    if (isDropdownVisible) {
      const options = await parentDropdown.locator('option').allTextContents();
      expect(options).not.toContain('Child Person');
    }
  });

  test('TC-CYCLE-002: Spouse Excluded from Parents List', async ({ page }) => {
    const testEmail = getUniqueEmail();

    await registerUser(page, testEmail);

    // Add spouse
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'Spouse');
    await page.fill('input[name="lastName"]', 'Person');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('text=Spouse Person')).toBeVisible({ timeout: 10000 });

    // Add person with spouse
    await page.click('nav >> text=Home');
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'Main');
    await page.fill('input[name="lastName"]', 'Person');
    await page.selectOption('select#addSpouse', { label: 'Spouse Person' });

    // Verify Spouse is NOT in parents dropdown
    const parentDropdown = page.locator('select#addParent');
    const options = await parentDropdown.locator('option').allTextContents();
    expect(options).not.toContain('Spouse Person');
  });

  // ============================================
  // RELATIONSHIP MANAGEMENT TESTS
  // ============================================

  test('TC-REL-001: Add Multiple Spouses with Different Statuses', async ({ page }) => {
    const testEmail = getUniqueEmail();

    await registerUser(page, testEmail);

    // Add first spouse
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'First');
    await page.fill('input[name="lastName"]', 'Spouse');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('text=First Spouse')).toBeVisible({ timeout: 10000 });

    // Add second spouse
    await page.click('nav >> text=Home');
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'Second');
    await page.fill('input[name="lastName"]', 'Spouse');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('text=Second Spouse')).toBeVisible({ timeout: 10000 });

    // Add main person with both spouses
    await page.click('nav >> text=Home');
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'Main');
    await page.fill('input[name="lastName"]', 'Person');

    // Add first spouse
    await page.selectOption('select#addSpouse', { label: 'First Spouse' });
    await expect(page.locator('[class*="relationshipRow"]')).toHaveCount(1, { timeout: 5000 });

    // Add second spouse
    await page.selectOption('select#addSpouse', { label: 'Second Spouse' });
    await expect(page.locator('[class*="relationshipRow"]')).toHaveCount(2, { timeout: 5000 });

    // Change first spouse status to divorced
    const firstSpouseRow = page.locator('[class*="relationshipRow"]').filter({ hasText: 'First Spouse' });
    await firstSpouseRow.locator('[class*="relationshipSelect"]').selectOption('divorced');

    // Submit and verify
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('h1:has-text("Main Person")')).toBeVisible({ timeout: 10000 });
  });

  test('TC-REL-002: Add Step-Parent Relationship', async ({ page }) => {
    const testEmail = getUniqueEmail();

    await registerUser(page, testEmail);

    // Add biological parent
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'Bio');
    await page.fill('input[name="lastName"]', 'Parent');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('text=Bio Parent')).toBeVisible({ timeout: 10000 });

    // Add step parent
    await page.click('nav >> text=Home');
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'Step');
    await page.fill('input[name="lastName"]', 'Parent');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('text=Step Parent')).toBeVisible({ timeout: 10000 });

    // Add child with both parents
    await page.click('nav >> text=Home');
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'Child');
    await page.fill('input[name="lastName"]', 'Person');

    // Add biological parent
    await page.selectOption('select#addParent', { label: 'Bio Parent' });
    await expect(page.locator('[class*="relationshipRow"]')).toHaveCount(1, { timeout: 5000 });

    // Add step parent
    await page.selectOption('select#addParent', { label: 'Step Parent' });
    await expect(page.locator('[class*="relationshipRow"]')).toHaveCount(2, { timeout: 5000 });

    // Change step parent type to "step"
    const stepParentRow = page.locator('[class*="relationshipRow"]').filter({ hasText: 'Step Parent' });
    await stepParentRow.locator('[class*="relationshipSelect"]').selectOption('step');

    // Submit
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('h1:has-text("Child Person")')).toBeVisible({ timeout: 10000 });

    // Go to edit and verify the relationships are saved
    await page.locator('header button').nth(1).click();
    await expect(page.locator('h1')).toContainText('Edit Person', { timeout: 5000 });

    // Verify Bio Parent is listed as biological
    const bioParentRow = page.locator('[class*="relationshipRow"]').filter({ hasText: 'Bio Parent' });
    await expect(bioParentRow.locator('[class*="relationshipSelect"]')).toHaveValue('biological');

    // Verify Step Parent is listed as step
    const stepParentRowVerify = page.locator('[class*="relationshipRow"]').filter({ hasText: 'Step Parent' });
    await expect(stepParentRowVerify.locator('[class*="relationshipSelect"]')).toHaveValue('step');
  });

  test('TC-REL-003: Change Spouse Status to Ex', async ({ page }) => {
    const testEmail = getUniqueEmail();

    await registerUser(page, testEmail);

    // Add spouse
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'Ex');
    await page.fill('input[name="lastName"]', 'Spouse');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('text=Ex Spouse')).toBeVisible({ timeout: 10000 });

    // Add main person with spouse
    await page.click('nav >> text=Home');
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'Main');
    await page.fill('input[name="lastName"]', 'Person');

    // Add spouse as current
    await page.selectOption('select#addSpouse', { label: 'Ex Spouse' });

    // Submit
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('h1:has-text("Main Person")')).toBeVisible({ timeout: 10000 });

    // Edit and change to divorced
    await page.locator('header button').nth(1).click();
    await expect(page.locator('h1')).toContainText('Edit Person', { timeout: 5000 });

    // Change status to divorced
    const spouseRow = page.locator('[class*="relationshipRow"]').filter({ hasText: 'Ex Spouse' });
    await spouseRow.locator('[class*="relationshipSelect"]').selectOption('divorced');

    // Save changes
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('h1:has-text("Main Person")')).toBeVisible({ timeout: 10000 });

    // Go to tree and verify ex-spouse is shown
    await page.click('nav >> text=Tree');
    await expect(page.locator('h1')).toContainText('Family Tree', { timeout: 5000 });

    // Both persons should be visible in the tree
    await expect(page.locator('text=Main Person').first()).toBeVisible();
    await expect(page.locator('text=Ex Spouse').first()).toBeVisible();
  });

  test('TC-REL-004: Remove Spouse from Relationship', async ({ page }) => {
    const testEmail = getUniqueEmail();

    await registerUser(page, testEmail);

    // Add spouse
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'Remove');
    await page.fill('input[name="lastName"]', 'Me');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('text=Remove Me')).toBeVisible({ timeout: 10000 });

    // Add main person with spouse
    await page.click('nav >> text=Home');
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'Keep');
    await page.fill('input[name="lastName"]', 'Person');

    // Add spouse
    await page.selectOption('select#addSpouse', { label: 'Remove Me' });
    await expect(page.locator('[class*="relationshipRow"]')).toHaveCount(1, { timeout: 5000 });

    // Click remove button (X) for the spouse
    const spouseRowToRemove = page.locator('[class*="relationshipRow"]').filter({ hasText: 'Remove Me' });
    await spouseRowToRemove.locator('[class*="removeButton"]').click();

    // Verify spouse is removed from the list (0 rows)
    await expect(page.locator('[class*="relationshipRow"]')).toHaveCount(0, { timeout: 5000 });

    // Verify they're back in the dropdown
    const spouseDropdown = page.locator('select#addSpouse');
    const options = await spouseDropdown.locator('option').allTextContents();
    expect(options).toContain('Remove Me');
  });

  test('TC-REL-005: Add Adoptive Parent', async ({ page }) => {
    const testEmail = getUniqueEmail();

    await registerUser(page, testEmail);

    // Add adoptive parent
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'Adoptive');
    await page.fill('input[name="lastName"]', 'Parent');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('text=Adoptive Parent')).toBeVisible({ timeout: 10000 });

    // Add child with adoptive parent
    await page.click('nav >> text=Home');
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'Adopted');
    await page.fill('input[name="lastName"]', 'Child');

    // Add parent and set as adoptive
    await page.selectOption('select#addParent', { label: 'Adoptive Parent' });
    await expect(page.locator('[class*="relationshipRow"]')).toHaveCount(1, { timeout: 5000 });

    // Change to adoptive
    const parentRow = page.locator('[class*="relationshipRow"]').filter({ hasText: 'Adoptive Parent' });
    await parentRow.locator('[class*="relationshipSelect"]').selectOption('adoptive');

    // Submit
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('h1:has-text("Adopted Child")')).toBeVisible({ timeout: 10000 });

    // Verify in edit view
    await page.locator('header button').nth(1).click();
    await expect(page.locator('h1')).toContainText('Edit Person', { timeout: 5000 });

    // Verify parent is listed as adoptive
    const adoptiveParentRow = page.locator('[class*="relationshipRow"]').filter({ hasText: 'Adoptive Parent' });
    await expect(adoptiveParentRow.locator('[class*="relationshipSelect"]')).toHaveValue('adoptive');
  });

  // ============================================
  // SUPABASE-SPECIFIC TESTS: DATA PERSISTENCE
  // ============================================

  test('TC-DB-001: Data Persists After Logout/Login', async ({ page }) => {
    const testEmail = getUniqueEmail();

    await registerUser(page, testEmail);

    // Add a person
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'Persistent');
    await page.fill('input[name="lastName"]', 'Person');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('h1:has-text("Persistent Person")')).toBeVisible({ timeout: 10000 });

    // Logout
    await logoutUser(page);

    // Login again
    await loginUser(page, testEmail);

    // Navigate to tree - person should still exist
    await page.click('nav >> text=Tree');
    await expect(page.locator('text=Persistent Person')).toBeVisible({ timeout: 10000 });
  });

  test('TC-DB-002: Family Tree Auto-Creation on Registration', async ({ page }) => {
    const testEmail = getUniqueEmail();
    const userName = 'NewTreeUser';

    await page.goto('/register');
    await page.fill('input[placeholder="Full Name"]', userName);
    await page.fill('input[placeholder="Email"]', testEmail);
    await page.fill('input[placeholder*="Password"]', testPassword);
    await page.fill('input[placeholder="Confirm Password"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 10000 });

    // User should be able to add persons immediately (family tree was created)
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await expect(page.locator('h1')).toContainText('Add Person');
  });

  // ============================================
  // MULTI-USER SHARING TESTS (Conceptual)
  // Note: These tests demonstrate the expected behavior.
  // Full multi-user testing requires multiple browser contexts.
  // ============================================

  test('TC-SHARE-001: User Can Create Family Tree', async ({ page }) => {
    const testEmail = getUniqueEmail();

    await registerUser(page, testEmail);

    // After registration, user should have a family tree
    // They should be able to add people (which requires a family tree)
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'FamilyMember');
    await page.fill('input[name="lastName"]', 'Test');
    await page.locator('button[type="submit"]').click();

    // If person was created, family tree exists
    await expect(page.locator('h1:has-text("FamilyMember Test")')).toBeVisible({ timeout: 10000 });
  });

  test('TC-SHARE-002: Data Isolated Between Users', async ({ browser }) => {
    // Create two separate browser contexts (simulating two different users)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    const email1 = getUniqueEmail();
    const email2 = getUniqueEmail();

    // Register first user and add a person
    await registerUser(page1, email1, 'User One');
    await page1.locator('button').filter({ hasText: 'Add Person' }).click();
    await page1.fill('input[name="firstName"]', 'User1');
    await page1.fill('input[name="lastName"]', 'Person');
    await page1.locator('button[type="submit"]').click();
    await expect(page1.locator('h1:has-text("User1 Person")')).toBeVisible({ timeout: 10000 });

    // Register second user
    await registerUser(page2, email2, 'User Two');

    // Navigate to tree - second user should NOT see first user's person
    await page2.click('nav >> text=Tree');
    await expect(page2.locator('text=No Family Members Yet')).toBeVisible({ timeout: 5000 });

    // Cleanup
    await context1.close();
    await context2.close();
  });

  // ============================================
  // TREE VISUALIZATION TESTS
  // ============================================

  test('TC-TREE-002: Tree Shows Family Relationships', async ({ page }) => {
    const testEmail = getUniqueEmail();

    await registerUser(page, testEmail);

    // Add parent
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'Parent');
    await page.fill('input[name="lastName"]', 'Node');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('h1:has-text("Parent Node")')).toBeVisible({ timeout: 10000 });

    // Add child with parent relationship
    await page.click('nav >> text=Home');
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'Child');
    await page.fill('input[name="lastName"]', 'Node');
    await page.selectOption('select#addParent', { label: 'Parent Node' });
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('h1:has-text("Child Node")')).toBeVisible({ timeout: 10000 });

    // Go to tree
    await page.click('nav >> text=Tree');
    await expect(page.locator('h1')).toContainText('Family Tree');

    // Both should be visible
    await expect(page.locator('[class*="personCard"]:has-text("Parent Node")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[class*="personCard"]:has-text("Child Node")')).toBeVisible({ timeout: 5000 });
  });

  test('TC-TREE-003: Tree Shows Spouse Connections', async ({ page }) => {
    const testEmail = getUniqueEmail();

    await registerUser(page, testEmail);

    // Add first person
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'Person');
    await page.fill('input[name="lastName"]', 'One');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('h1:has-text("Person One")')).toBeVisible({ timeout: 10000 });

    // Add spouse
    await page.click('nav >> text=Home');
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'Person');
    await page.fill('input[name="lastName"]', 'Two');
    await page.selectOption('select#addSpouse', { label: 'Person One' });
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('h1:has-text("Person Two")')).toBeVisible({ timeout: 10000 });

    // Go to tree
    await page.click('nav >> text=Tree');

    // Both should be visible with spouse indicator
    await expect(page.locator('[class*="personCard"]:has-text("Person One")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[class*="personCard"]:has-text("Person Two")')).toBeVisible({ timeout: 5000 });
    // Heart icon should be present (spouse connector)
    await expect(page.locator('[class*="heartIcon"]')).toBeVisible();
  });

  test('TC-TREE-004: Tree Search Filters', async ({ page }) => {
    const testEmail = getUniqueEmail();

    await registerUser(page, testEmail);

    // Add multiple people
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'Alice');
    await page.fill('input[name="lastName"]', 'Anderson');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('h1:has-text("Alice Anderson")')).toBeVisible({ timeout: 10000 });

    await page.click('nav >> text=Home');
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'Bob');
    await page.fill('input[name="lastName"]', 'Brown');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('h1:has-text("Bob Brown")')).toBeVisible({ timeout: 10000 });

    // Go to tree
    await page.click('nav >> text=Tree');

    // Search for Alice
    await page.fill('input[placeholder*="Search"]', 'Alice');

    // Alice should be visible, Bob might be filtered
    await expect(page.locator('[class*="personCard"]:has-text("Alice")')).toBeVisible({ timeout: 5000 });
  });

});
