import { test, expect } from '@playwright/test';

// Generate unique email for each test run
const testPassword = 'password123';
const testName = 'Test User';

test.describe('FamilyRoots App - Full Test Suite', () => {

  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test to start fresh
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test('TC-AUTH-001: User Registration', async ({ page }) => {
    const testEmail = `test${Date.now()}@example.com`;
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

    // Should redirect to home page
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 5000 });
    await expect(page.locator(`text=${testName}`)).toBeVisible();
  });

  test('TC-AUTH-002: User Login', async ({ page }) => {
    const testEmail = `login${Date.now()}@example.com`;

    // First register
    await page.goto('/register');
    await page.fill('input[placeholder="Full Name"]', testName);
    await page.fill('input[placeholder="Email"]', testEmail);
    await page.fill('input[placeholder*="Password"]', testPassword);
    await page.fill('input[placeholder="Confirm Password"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 5000 });

    // Logout by clearing storage and refreshing
    await page.evaluate(() => {
      localStorage.removeItem('familyroots-storage');
    });
    await page.reload();

    // Should be redirected to login
    await expect(page.locator('h1')).toContainText('FamilyRoots');

    // Login
    await page.fill('input[placeholder="Email"]', testEmail);
    await page.fill('input[placeholder="Password"]', testPassword);
    await page.click('button[type="submit"]');

    // Should see home page
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 5000 });
  });

  test('TC-AUTH-004: Invalid Login Attempts', async ({ page }) => {
    await page.goto('/login');

    // Try invalid credentials
    await page.fill('input[placeholder="Email"]', 'invalid@example.com');
    await page.fill('input[placeholder="Password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
  });

  test('TC-TREE-001: View Empty Tree', async ({ page }) => {
    const testEmail = `tree${Date.now()}@example.com`;

    // Register and go to tree
    await page.goto('/register');
    await page.fill('input[placeholder="Full Name"]', testName);
    await page.fill('input[placeholder="Email"]', testEmail);
    await page.fill('input[placeholder*="Password"]', testPassword);
    await page.fill('input[placeholder="Confirm Password"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 5000 });

    // Navigate to tree using nav
    await page.click('nav >> text=Tree');

    // Should show empty state
    await expect(page.locator('text=No Family Members Yet')).toBeVisible();
    await expect(page.locator('text=Add First Person')).toBeVisible();
  });

  test('TC-PROF-001: Create New Profile', async ({ page }) => {
    const testEmail = `profile${Date.now()}@example.com`;

    // Register
    await page.goto('/register');
    await page.fill('input[placeholder="Full Name"]', testName);
    await page.fill('input[placeholder="Email"]', testEmail);
    await page.fill('input[placeholder*="Password"]', testPassword);
    await page.fill('input[placeholder="Confirm Password"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 5000 });

    // Click Add Person quick action button
    await page.locator('button').filter({ hasText: 'Add Person' }).click();

    // Should be on add person page
    await expect(page.locator('h1')).toContainText('Add Person', { timeout: 5000 });

    // Fill person details
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="nickname"]', 'Johnny');
    await page.selectOption('select[name="gender"]', 'male');
    await page.fill('input[name="birthDate"]', '1980-05-15');
    await page.fill('input[name="birthPlace"]', 'New York, USA');
    await page.fill('textarea[name="bio"]', 'A beloved family member.');

    // Save - click submit button
    await page.locator('button[type="submit"]').click();

    // Should redirect to person detail
    await expect(page.locator('text=John Doe')).toBeVisible({ timeout: 5000 });
  });

  test('TC-PROF-002: Edit Existing Profile', async ({ page }) => {
    const testEmail = `edit${Date.now()}@example.com`;

    // Register and add person
    await page.goto('/register');
    await page.fill('input[placeholder="Full Name"]', testName);
    await page.fill('input[placeholder="Email"]', testEmail);
    await page.fill('input[placeholder*="Password"]', testPassword);
    await page.fill('input[placeholder="Confirm Password"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 5000 });

    // Add person
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await expect(page.locator('h1')).toContainText('Add Person', { timeout: 5000 });

    await page.fill('input[name="firstName"]', 'Jane');
    await page.fill('input[name="lastName"]', 'Smith');
    await page.locator('button[type="submit"]').click();

    // Wait for navigation to person detail
    await expect(page.locator('h1:has-text("Jane Smith")')).toBeVisible({ timeout: 5000 });

    // Click edit button in header actions (first button in headerActions div)
    await page.locator('header button').nth(1).click();

    // Wait for edit page
    await expect(page.locator('h1')).toContainText('Edit Person', { timeout: 5000 });

    // Update name
    await page.fill('input[name="lastName"]', 'Johnson');
    await page.locator('button[type="submit"]').click();

    // Should show updated name
    await expect(page.locator('text=Jane Johnson')).toBeVisible({ timeout: 5000 });
  });

  test('TC-HOME-001: Home Dashboard Stats', async ({ page }) => {
    const testEmail = `stats${Date.now()}@example.com`;

    // Register
    await page.goto('/register');
    await page.fill('input[placeholder="Full Name"]', testName);
    await page.fill('input[placeholder="Email"]', testEmail);
    await page.fill('input[placeholder*="Password"]', testPassword);
    await page.fill('input[placeholder="Confirm Password"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for home page to load
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 5000 });

    // Should show stats with specific text in stat cards
    await expect(page.locator('text=Members').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Photos').first()).toBeVisible();
    await expect(page.locator('text=Stories').first()).toBeVisible();

    // Should show quick actions
    await expect(page.locator('button').filter({ hasText: 'Add Person' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'View Tree' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'AI Assistant' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'Settings' })).toBeVisible();
  });

  test('TC-NAV-001: Bottom Navigation', async ({ page }) => {
    const testEmail = `nav${Date.now()}@example.com`;

    // Register
    await page.goto('/register');
    await page.fill('input[placeholder="Full Name"]', testName);
    await page.fill('input[placeholder="Email"]', testEmail);
    await page.fill('input[placeholder*="Password"]', testPassword);
    await page.fill('input[placeholder="Confirm Password"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 5000 });

    // Check nav items exist
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('nav >> text=Home')).toBeVisible();
    await expect(page.locator('nav >> text=Tree')).toBeVisible();
    await expect(page.locator('nav >> text=Gallery')).toBeVisible();
    await expect(page.locator('nav >> text=Profile')).toBeVisible();

    // Navigate to Tree
    await page.click('nav >> text=Tree');
    await expect(page.locator('h1')).toContainText('Family Tree');

    // Navigate to Gallery
    await page.click('nav >> text=Gallery');
    await expect(page.locator('h1')).toContainText('Photo Gallery');

    // Navigate to Profile
    await page.click('nav >> text=Profile');
    await expect(page.locator(`text=${testName}`)).toBeVisible();

    // Navigate back to Home
    await page.click('nav >> text=Home');
    await expect(page.locator('text=Welcome back')).toBeVisible();
  });

  test('TC-AI-001: AI Assistant Chat', async ({ page }) => {
    const testEmail = `ai${Date.now()}@example.com`;

    // Register
    await page.goto('/register');
    await page.fill('input[placeholder="Full Name"]', testName);
    await page.fill('input[placeholder="Email"]', testEmail);
    await page.fill('input[placeholder*="Password"]', testPassword);
    await page.fill('input[placeholder="Confirm Password"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 5000 });

    // Go to AI Assistant via quick action
    await page.locator('button').filter({ hasText: 'AI Assistant' }).click();

    // Should see AI chat
    await expect(page.locator('h1')).toContainText('AI Assistant');
    await expect(page.locator('text=Online')).toBeVisible();

    // Should have initial message
    await expect(page.locator(`text=Hello ${testName}`)).toBeVisible();

    // Send a message
    await page.fill('textarea', 'How many members are in my family tree?');
    await page.locator('button').filter({ has: page.locator('svg') }).last().click();

    // Wait for response
    await expect(page.locator('text=0 member')).toBeVisible({ timeout: 10000 });
  });

  test('TC-SEARCH-001: Search Functionality', async ({ page }) => {
    const testEmail = `search${Date.now()}@example.com`;

    // Register and add a person
    await page.goto('/register');
    await page.fill('input[placeholder="Full Name"]', testName);
    await page.fill('input[placeholder="Email"]', testEmail);
    await page.fill('input[placeholder*="Password"]', testPassword);
    await page.fill('input[placeholder="Confirm Password"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 5000 });

    // Add a person first
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await expect(page.locator('h1')).toContainText('Add Person', { timeout: 5000 });

    await page.fill('input[name="firstName"]', 'Robert');
    await page.fill('input[name="lastName"]', 'Williams');
    await page.locator('button[type="submit"]').click();

    // Wait for person detail page
    await expect(page.locator('text=Robert Williams')).toBeVisible({ timeout: 5000 });

    // Navigate to home directly (nav is hidden on person detail page)
    await page.goto('/');
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 5000 });

    // Click search button in header
    await page.locator('header button').click();

    // Should be on search page
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible({ timeout: 5000 });

    // Search for the person
    await page.fill('input[placeholder*="Search"]', 'Robert');

    // Should find the person
    await expect(page.locator('text=Robert Williams')).toBeVisible({ timeout: 5000 });
  });

  test('TC-SETTINGS-001: Settings and Export', async ({ page }) => {
    const testEmail = `settings${Date.now()}@example.com`;

    // Register
    await page.goto('/register');
    await page.fill('input[placeholder="Full Name"]', testName);
    await page.fill('input[placeholder="Email"]', testEmail);
    await page.fill('input[placeholder*="Password"]', testPassword);
    await page.fill('input[placeholder="Confirm Password"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 5000 });

    // Go to Settings via quick action button
    await page.locator('button').filter({ hasText: 'Settings' }).click();

    // Should see settings page
    await expect(page.locator('h1')).toContainText('Settings', { timeout: 5000 });

    // Should see preference options
    await expect(page.locator('text=Notifications')).toBeVisible();
    await expect(page.locator('text=Dark Mode')).toBeVisible();
    await expect(page.locator('text=Language')).toBeVisible();

    // Should see data management
    await expect(page.locator('text=Export Data')).toBeVisible();
    await expect(page.locator('text=Import Data')).toBeVisible();
    await expect(page.locator('text=Clear All Data')).toBeVisible();

    // Should see version
    await expect(page.locator('text=FamilyRoots v1.0.0')).toBeVisible();
  });

  test('TC-PROFILE-001: User Profile Page', async ({ page }) => {
    const testEmail = `userprofile${Date.now()}@example.com`;

    // Register
    await page.goto('/register');
    await page.fill('input[placeholder="Full Name"]', testName);
    await page.fill('input[placeholder="Email"]', testEmail);
    await page.fill('input[placeholder*="Password"]', testPassword);
    await page.fill('input[placeholder="Confirm Password"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 5000 });

    // Go to Profile
    await page.click('nav >> text=Profile');

    // Should see user info
    await expect(page.locator(`h1:has-text("${testName}")`)).toBeVisible();

    // Should see stats
    await expect(page.locator('text=Members').first()).toBeVisible();
    await expect(page.locator('text=Photos').first()).toBeVisible();
    await expect(page.locator('text=Stories').first()).toBeVisible();

    // Should see sign out button
    await expect(page.locator('text=Sign Out')).toBeVisible();
  });

  test('TC-GALLERY-001: Empty Gallery', async ({ page }) => {
    const testEmail = `gallery${Date.now()}@example.com`;

    // Register
    await page.goto('/register');
    await page.fill('input[placeholder="Full Name"]', testName);
    await page.fill('input[placeholder="Email"]', testEmail);
    await page.fill('input[placeholder*="Password"]', testPassword);
    await page.fill('input[placeholder="Confirm Password"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 5000 });

    // Go to Gallery
    await page.click('nav >> text=Gallery');

    // Should show empty state
    await expect(page.locator('h1')).toContainText('Photo Gallery');
    await expect(page.locator('text=No Photos Yet')).toBeVisible();
    await expect(page.locator('text=0 photos')).toBeVisible();
  });

  test('TC-LOGOUT-001: Sign Out', async ({ page }) => {
    const testEmail = `logout${Date.now()}@example.com`;

    // Register
    await page.goto('/register');
    await page.fill('input[placeholder="Full Name"]', testName);
    await page.fill('input[placeholder="Email"]', testEmail);
    await page.fill('input[placeholder*="Password"]', testPassword);
    await page.fill('input[placeholder="Confirm Password"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 5000 });

    // Go to Profile
    await page.click('nav >> text=Profile');

    // Click Sign Out
    page.on('dialog', dialog => dialog.accept()); // Accept confirmation
    await page.click('text=Sign Out');

    // Should be on login page
    await expect(page.locator('h1')).toContainText('FamilyRoots');
    await expect(page.locator('text=Sign In')).toBeVisible();
  });
});
