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

  test('TC-PHOTO-001: Photo Upload UI on Edit Page', async ({ page }) => {
    const testEmail = `photo-ui${Date.now()}@example.com`;

    // Register
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

    await page.fill('input[name="firstName"]', 'Photo');
    await page.fill('input[name="lastName"]', 'Test');
    await page.locator('button[type="submit"]').click();

    // Wait for person detail page
    await expect(page.locator('text=Photo Test')).toBeVisible({ timeout: 5000 });

    // Click edit button
    await page.locator('header button').nth(1).click();
    await expect(page.locator('h1')).toContainText('Edit Person', { timeout: 5000 });

    // Should see Take Photo and Gallery buttons
    await expect(page.locator('button:has-text("Take Photo")')).toBeVisible();
    await expect(page.locator('button:has-text("Gallery")')).toBeVisible();
  });

  test('TC-PHOTO-002: Upload Photo via Gallery', async ({ page }) => {
    const testEmail = `photo-upload${Date.now()}@example.com`;

    // Register
    await page.goto('/register');
    await page.fill('input[placeholder="Full Name"]', testName);
    await page.fill('input[placeholder="Email"]', testEmail);
    await page.fill('input[placeholder*="Password"]', testPassword);
    await page.fill('input[placeholder="Confirm Password"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 5000 });

    // Add a person
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'Upload');
    await page.fill('input[name="lastName"]', 'Test');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('text=Upload Test')).toBeVisible({ timeout: 5000 });

    // Go to edit page
    await page.locator('header button').nth(1).click();
    await expect(page.locator('h1')).toContainText('Edit Person', { timeout: 5000 });

    // Create a small test image (1x1 red pixel PNG)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
    const testImageBuffer = Buffer.from(testImageBase64, 'base64');

    // Make the hidden file input visible and set file
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[type="file"]');
      inputs.forEach(input => (input as HTMLInputElement).removeAttribute('hidden'));
    });

    // Set file on the gallery input (second one, without capture)
    const galleryInput = page.locator('input[type="file"]').nth(1);
    await galleryInput.setInputFiles({
      name: 'test-photo.png',
      mimeType: 'image/png',
      buffer: testImageBuffer,
    });

    // Should see photo preview (look for img with data: src)
    await expect(page.locator('img[src^="data:"]')).toBeVisible({ timeout: 10000 });
  });

  test('TC-PHOTO-003: Photo Displays in Person Detail', async ({ page }) => {
    const testEmail = `photo-detail${Date.now()}@example.com`;

    // Register
    await page.goto('/register');
    await page.fill('input[placeholder="Full Name"]', testName);
    await page.fill('input[placeholder="Email"]', testEmail);
    await page.fill('input[placeholder*="Password"]', testPassword);
    await page.fill('input[placeholder="Confirm Password"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 5000 });

    // Add a person
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'DetailPhoto');
    await page.fill('input[name="lastName"]', 'Person');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('text=DetailPhoto Person')).toBeVisible({ timeout: 5000 });

    // Go to edit page and upload photo
    await page.locator('header button').nth(1).click();
    await expect(page.locator('h1')).toContainText('Edit Person', { timeout: 5000 });

    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
    const testImageBuffer = Buffer.from(testImageBase64, 'base64');

    // Make the hidden file input visible and set file
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[type="file"]');
      inputs.forEach(input => (input as HTMLInputElement).removeAttribute('hidden'));
    });

    // Set file on the gallery input (second one, without capture)
    const galleryInput = page.locator('input[type="file"]').nth(1);
    await galleryInput.setInputFiles({
      name: 'detail-photo.png',
      mimeType: 'image/png',
      buffer: testImageBuffer,
    });

    // Wait for photo to be added in edit form (look for img with data: src)
    await expect(page.locator('img[src^="data:"]')).toBeVisible({ timeout: 10000 });

    // Save changes
    await page.locator('button[type="submit"]').click();

    // Should be on person detail page with photo as avatar
    await expect(page.locator('text=DetailPhoto Person')).toBeVisible({ timeout: 5000 });

    // The avatar should be an img element with data URL
    await expect(page.locator('img[src^="data:"]')).toBeVisible({ timeout: 5000 });
  });

  test('TC-CYCLE-001: Prevent Parent-Child Cycle', async ({ page }) => {
    const testEmail = `cycle${Date.now()}@example.com`;

    // Register
    await page.goto('/register');
    await page.fill('input[placeholder="Full Name"]', testName);
    await page.fill('input[placeholder="Email"]', testEmail);
    await page.fill('input[placeholder*="Password"]', testPassword);
    await page.fill('input[placeholder="Confirm Password"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 5000 });

    // Add parent person
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await expect(page.locator('h1')).toContainText('Add Person', { timeout: 5000 });
    await page.fill('input[name="firstName"]', 'Parent');
    await page.fill('input[name="lastName"]', 'Person');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('text=Parent Person')).toBeVisible({ timeout: 5000 });

    // Go back to home and add child
    await page.click('nav >> text=Home');
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 5000 });

    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await expect(page.locator('h1')).toContainText('Add Person', { timeout: 5000 });
    await page.fill('input[name="firstName"]', 'Child');
    await page.fill('input[name="lastName"]', 'Person');

    // Select Parent Person as a parent using the dropdown
    await page.selectOption('select#addParent', { label: 'Parent Person' });

    // Submit the form
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('h1:has-text("Child Person")')).toBeVisible({ timeout: 5000 });

    // Now go to tree and find Parent Person to edit
    await page.click('nav >> text=Tree');
    await expect(page.locator('h1')).toContainText('Family Tree', { timeout: 5000 });

    // Click on Parent Person in the tree (look for the person card)
    await page.locator('text=Parent Person').first().click();
    await expect(page.locator('h1:has-text("Parent Person")')).toBeVisible({ timeout: 5000 });

    // Click edit button (second button in header)
    await page.locator('header button').nth(1).click();
    await expect(page.locator('h1')).toContainText('Edit Person', { timeout: 5000 });

    // Verify Child Person is NOT in the parents dropdown (cycle prevention)
    // The dropdown for adding parents should not have Child Person as an option
    const parentDropdown = page.locator('select#addParent');
    const options = await parentDropdown.locator('option').allTextContents();
    expect(options).not.toContain('Child Person');
  });

  test('TC-CYCLE-002: Spouse Excluded from Parents List', async ({ page }) => {
    const testEmail = `spouse-parent${Date.now()}@example.com`;

    // Register
    await page.goto('/register');
    await page.fill('input[placeholder="Full Name"]', testName);
    await page.fill('input[placeholder="Email"]', testEmail);
    await page.fill('input[placeholder*="Password"]', testPassword);
    await page.fill('input[placeholder="Confirm Password"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 5000 });

    // Add first person (will be spouse)
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await expect(page.locator('h1')).toContainText('Add Person', { timeout: 5000 });
    await page.fill('input[name="firstName"]', 'Spouse');
    await page.fill('input[name="lastName"]', 'Person');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('text=Spouse Person')).toBeVisible({ timeout: 5000 });

    // Add second person and select first as spouse
    await page.click('nav >> text=Home');
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 5000 });

    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await expect(page.locator('h1')).toContainText('Add Person', { timeout: 5000 });
    await page.fill('input[name="firstName"]', 'Main');
    await page.fill('input[name="lastName"]', 'Person');

    // Select Spouse Person as spouse using the new dropdown
    await page.selectOption('select#addSpouse', { label: 'Spouse Person' });

    // Verify Spouse Person is NOT in the parents dropdown list
    // After selecting as spouse, they should not appear in parents dropdown
    const parentDropdown = page.locator('select#addParent');
    const options = await parentDropdown.locator('option').allTextContents();
    expect(options).not.toContain('Spouse Person');
  });

  test('TC-REL-001: Add Multiple Spouses with Different Statuses', async ({ page }) => {
    const testEmail = `multi-spouse${Date.now()}@example.com`;

    // Register
    await page.goto('/register');
    await page.fill('input[placeholder="Full Name"]', testName);
    await page.fill('input[placeholder="Email"]', testEmail);
    await page.fill('input[placeholder*="Password"]', testPassword);
    await page.fill('input[placeholder="Confirm Password"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 5000 });

    // Add first spouse
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'First');
    await page.fill('input[name="lastName"]', 'Spouse');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('text=First Spouse')).toBeVisible({ timeout: 5000 });

    // Add second spouse
    await page.click('nav >> text=Home');
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'Second');
    await page.fill('input[name="lastName"]', 'Spouse');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('text=Second Spouse')).toBeVisible({ timeout: 5000 });

    // Add main person with both spouses
    await page.click('nav >> text=Home');
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'Main');
    await page.fill('input[name="lastName"]', 'Person');

    // Add first spouse
    await page.selectOption('select#addSpouse', { label: 'First Spouse' });

    // Verify first spouse was added to the relationship list (at least 1 row exists)
    await expect(page.locator('[class*="relationshipRow"]')).toHaveCount(1, { timeout: 5000 });

    // Add second spouse
    await page.selectOption('select#addSpouse', { label: 'Second Spouse' });

    // Verify second spouse was added (now 2 rows)
    await expect(page.locator('[class*="relationshipRow"]')).toHaveCount(2, { timeout: 5000 });

    // Change first spouse status to divorced (find the row containing First Spouse and its select)
    const firstSpouseRow = page.locator('[class*="relationshipRow"]').filter({ hasText: 'First Spouse' });
    await firstSpouseRow.locator('[class*="relationshipSelect"]').selectOption('divorced');

    // Submit and verify
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('h1:has-text("Main Person")')).toBeVisible({ timeout: 5000 });
  });

  test('TC-REL-002: Add Step-Parent Relationship', async ({ page }) => {
    const testEmail = `step-parent${Date.now()}@example.com`;

    // Register
    await page.goto('/register');
    await page.fill('input[placeholder="Full Name"]', testName);
    await page.fill('input[placeholder="Email"]', testEmail);
    await page.fill('input[placeholder*="Password"]', testPassword);
    await page.fill('input[placeholder="Confirm Password"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 5000 });

    // Add biological parent
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'Bio');
    await page.fill('input[name="lastName"]', 'Parent');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('text=Bio Parent')).toBeVisible({ timeout: 5000 });

    // Add step parent
    await page.click('nav >> text=Home');
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'Step');
    await page.fill('input[name="lastName"]', 'Parent');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('text=Step Parent')).toBeVisible({ timeout: 5000 });

    // Add child with both parents
    await page.click('nav >> text=Home');
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'Child');
    await page.fill('input[name="lastName"]', 'Person');

    // Add biological parent
    await page.selectOption('select#addParent', { label: 'Bio Parent' });

    // Verify parent was added (1 row exists)
    await expect(page.locator('[class*="relationshipRow"]')).toHaveCount(1, { timeout: 5000 });

    // Add step parent
    await page.selectOption('select#addParent', { label: 'Step Parent' });

    // Verify second parent was added (now 2 rows)
    await expect(page.locator('[class*="relationshipRow"]')).toHaveCount(2, { timeout: 5000 });

    // Change step parent type to "step"
    const stepParentRow = page.locator('[class*="relationshipRow"]').filter({ hasText: 'Step Parent' });
    await stepParentRow.locator('[class*="relationshipSelect"]').selectOption('step');

    // Submit
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('h1:has-text("Child Person")')).toBeVisible({ timeout: 5000 });

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
    const testEmail = `ex-spouse${Date.now()}@example.com`;

    // Register
    await page.goto('/register');
    await page.fill('input[placeholder="Full Name"]', testName);
    await page.fill('input[placeholder="Email"]', testEmail);
    await page.fill('input[placeholder*="Password"]', testPassword);
    await page.fill('input[placeholder="Confirm Password"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 5000 });

    // Add spouse
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'Ex');
    await page.fill('input[name="lastName"]', 'Spouse');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('text=Ex Spouse')).toBeVisible({ timeout: 5000 });

    // Add main person with spouse
    await page.click('nav >> text=Home');
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'Main');
    await page.fill('input[name="lastName"]', 'Person');

    // Add spouse as current
    await page.selectOption('select#addSpouse', { label: 'Ex Spouse' });

    // Submit
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('h1:has-text("Main Person")')).toBeVisible({ timeout: 5000 });

    // Edit and change to divorced
    await page.locator('header button').nth(1).click();
    await expect(page.locator('h1')).toContainText('Edit Person', { timeout: 5000 });

    // Change status to divorced
    const spouseRow = page.locator('[class*="relationshipRow"]').filter({ hasText: 'Ex Spouse' });
    await spouseRow.locator('[class*="relationshipSelect"]').selectOption('divorced');

    // Save changes
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('h1:has-text("Main Person")')).toBeVisible({ timeout: 5000 });

    // Go to tree and verify ex-spouse is shown with broken heart icon
    await page.click('nav >> text=Tree');
    await expect(page.locator('h1')).toContainText('Family Tree', { timeout: 5000 });

    // Both persons should be visible in the tree
    await expect(page.locator('text=Main Person')).toBeVisible();
    await expect(page.locator('text=Ex Spouse')).toBeVisible();
  });

  test('TC-REL-004: Remove Spouse from Relationship', async ({ page }) => {
    const testEmail = `remove-spouse${Date.now()}@example.com`;

    // Register
    await page.goto('/register');
    await page.fill('input[placeholder="Full Name"]', testName);
    await page.fill('input[placeholder="Email"]', testEmail);
    await page.fill('input[placeholder*="Password"]', testPassword);
    await page.fill('input[placeholder="Confirm Password"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 5000 });

    // Add spouse
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'Remove');
    await page.fill('input[name="lastName"]', 'Me');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('text=Remove Me')).toBeVisible({ timeout: 5000 });

    // Add main person with spouse
    await page.click('nav >> text=Home');
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'Keep');
    await page.fill('input[name="lastName"]', 'Person');

    // Add spouse
    await page.selectOption('select#addSpouse', { label: 'Remove Me' });

    // Verify spouse was added (1 row exists)
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
    const testEmail = `adoptive${Date.now()}@example.com`;

    // Register
    await page.goto('/register');
    await page.fill('input[placeholder="Full Name"]', testName);
    await page.fill('input[placeholder="Email"]', testEmail);
    await page.fill('input[placeholder*="Password"]', testPassword);
    await page.fill('input[placeholder="Confirm Password"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 5000 });

    // Add adoptive parent
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'Adoptive');
    await page.fill('input[name="lastName"]', 'Parent');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('text=Adoptive Parent')).toBeVisible({ timeout: 5000 });

    // Add child with adoptive parent
    await page.click('nav >> text=Home');
    await page.locator('button').filter({ hasText: 'Add Person' }).click();
    await page.fill('input[name="firstName"]', 'Adopted');
    await page.fill('input[name="lastName"]', 'Child');

    // Add parent and set as adoptive
    await page.selectOption('select#addParent', { label: 'Adoptive Parent' });

    // Verify parent was added (1 row exists)
    await expect(page.locator('[class*="relationshipRow"]')).toHaveCount(1, { timeout: 5000 });

    // Change to adoptive
    const parentRow = page.locator('[class*="relationshipRow"]').filter({ hasText: 'Adoptive Parent' });
    await parentRow.locator('[class*="relationshipSelect"]').selectOption('adoptive');

    // Submit
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('h1:has-text("Adopted Child")')).toBeVisible({ timeout: 5000 });

    // Verify in edit view
    await page.locator('header button').nth(1).click();
    await expect(page.locator('h1')).toContainText('Edit Person', { timeout: 5000 });

    // Verify parent is listed as adoptive
    const adoptiveParentRow = page.locator('[class*="relationshipRow"]').filter({ hasText: 'Adoptive Parent' });
    await expect(adoptiveParentRow.locator('[class*="relationshipSelect"]')).toHaveValue('adoptive');
  });
});
