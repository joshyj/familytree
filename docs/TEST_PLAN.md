# FamilyRoots - Test Plan

## Document Information

**Product:** FamilyRoots Family Tree App
**Version:** MVP 1.0
**Last Updated:** January 2026

---

## 1. Introduction

### 1.1 Purpose
This test plan defines the testing strategy, scope, approach, and resources required to validate the FamilyRoots MVP. It ensures the application meets functional requirements, performs reliably, and delivers an excellent user experience across all target platforms.

### 1.2 Scope
Testing covers all MVP features (P0 and P1) as defined in the PRD:
- User authentication and accounts
- Family tree visualization
- Person profiles (CRUD operations)
- Photo upload and management
- Collaborative features (invitations, permissions)
- Comments system
- AI-powered features
- Search functionality
- Privacy and security controls

### 1.3 Out of Scope (MVP)
- DNA integration
- Historical record matching
- Video calling
- Printed book generation

---

## 2. Test Strategy

### 2.1 Testing Levels

| Level | Description | Responsibility |
|-------|-------------|----------------|
| Unit Testing | Individual functions and components | Developers |
| Integration Testing | API endpoints, service interactions | Developers + QA |
| System Testing | End-to-end user flows | QA Team |
| Acceptance Testing | Business requirements validation | QA + Product |
| Performance Testing | Load, stress, scalability | QA + DevOps |
| Security Testing | Vulnerability assessment | Security Team |
| Accessibility Testing | WCAG 2.1 AA compliance | QA + Accessibility |
| Usability Testing | User experience validation | UX + Product |

### 2.2 Testing Types

**Functional Testing**
- Feature verification against requirements
- Positive and negative test cases
- Boundary value analysis
- Error handling validation

**Non-Functional Testing**
- Performance and load testing
- Security and penetration testing
- Accessibility compliance
- Cross-browser/device compatibility
- Localization readiness

**Regression Testing**
- Automated test suite execution on each build
- Critical path verification
- Previously fixed bug verification

### 2.3 Test Environments

| Environment | Purpose | Data |
|-------------|---------|------|
| Development | Developer testing | Mock/synthetic |
| QA/Staging | Full QA testing | Anonymized production-like |
| UAT | User acceptance | Curated test scenarios |
| Production | Smoke tests only | Real user data |

---

## 3. Feature Test Cases

### 3.1 User Authentication & Accounts

#### TC-AUTH-001: User Registration
| ID | TC-AUTH-001 |
|----|-------------|
| **Description** | New user can create an account |
| **Preconditions** | User is not logged in |
| **Steps** | 1. Navigate to registration page<br>2. Enter valid email<br>3. Enter password meeting requirements<br>4. Confirm password<br>5. Accept terms<br>6. Submit form |
| **Expected Result** | Account created, verification email sent, user redirected to onboarding |
| **Priority** | P0 |

#### TC-AUTH-002: User Login
| ID | TC-AUTH-002 |
|----|-------------|
| **Description** | Existing user can log in |
| **Preconditions** | User has verified account |
| **Steps** | 1. Navigate to login page<br>2. Enter email<br>3. Enter password<br>4. Click login |
| **Expected Result** | User authenticated and redirected to dashboard |
| **Priority** | P0 |

#### TC-AUTH-003: Password Reset
| ID | TC-AUTH-003 |
|----|-------------|
| **Description** | User can reset forgotten password |
| **Preconditions** | User has existing account |
| **Steps** | 1. Click "Forgot Password"<br>2. Enter email<br>3. Open reset email<br>4. Click reset link<br>5. Enter new password<br>6. Confirm new password |
| **Expected Result** | Password updated, user can login with new password |
| **Priority** | P0 |

#### TC-AUTH-004: Invalid Login Attempts
| ID | TC-AUTH-004 |
|----|-------------|
| **Description** | System handles invalid credentials appropriately |
| **Preconditions** | None |
| **Steps** | 1. Enter invalid email/password combination<br>2. Attempt login multiple times |
| **Expected Result** | Error message displayed, account locked after 5 failed attempts |
| **Priority** | P0 |

#### TC-AUTH-005: Two-Factor Authentication
| ID | TC-AUTH-005 |
|----|-------------|
| **Description** | User can enable and use 2FA |
| **Preconditions** | User logged in |
| **Steps** | 1. Navigate to security settings<br>2. Enable 2FA<br>3. Scan QR code with authenticator app<br>4. Enter verification code<br>5. Log out and log back in |
| **Expected Result** | 2FA enabled, login requires verification code |
| **Priority** | P1 |

#### TC-AUTH-006: Session Management
| ID | TC-AUTH-006 |
|----|-------------|
| **Description** | Sessions expire appropriately |
| **Preconditions** | User logged in |
| **Steps** | 1. Login and note session<br>2. Leave inactive for configured timeout<br>3. Attempt action |
| **Expected Result** | Session expires, user prompted to re-authenticate |
| **Priority** | P1 |

---

### 3.2 Family Tree Visualization

#### TC-TREE-001: View Empty Tree
| ID | TC-TREE-001 |
|----|-------------|
| **Description** | New user sees empty tree with prompt to add self |
| **Preconditions** | User logged in, no profiles created |
| **Steps** | 1. Navigate to tree view |
| **Expected Result** | Empty state with CTA to "Add Yourself" |
| **Priority** | P0 |

#### TC-TREE-002: Basic Tree Rendering
| ID | TC-TREE-002 |
|----|-------------|
| **Description** | Tree displays with correct relationships |
| **Preconditions** | Tree has 10+ members with various relationships |
| **Steps** | 1. Navigate to tree view<br>2. Verify parent-child connections<br>3. Verify spousal connections<br>4. Verify sibling groupings |
| **Expected Result** | All relationships displayed correctly with proper lines/connections |
| **Priority** | P0 |

#### TC-TREE-003: Zoom and Pan
| ID | TC-TREE-003 |
|----|-------------|
| **Description** | User can zoom and pan the tree |
| **Preconditions** | Tree with multiple generations |
| **Steps** | 1. Use zoom controls to zoom in/out<br>2. Use mouse wheel/pinch to zoom<br>3. Click and drag to pan<br>4. Double-click to center on person |
| **Expected Result** | Smooth zoom/pan with no rendering issues |
| **Priority** | P0 |

#### TC-TREE-004: Click to Expand/Collapse
| ID | TC-TREE-004 |
|----|-------------|
| **Description** | Large branches can be collapsed/expanded |
| **Preconditions** | Tree with 50+ members |
| **Steps** | 1. Click collapse icon on a branch<br>2. Verify branch collapses<br>3. Click expand icon<br>4. Verify branch expands |
| **Expected Result** | Branches collapse/expand with animation, count badge shows hidden members |
| **Priority** | P0 |

#### TC-TREE-005: Click Person Node
| ID | TC-TREE-005 |
|----|-------------|
| **Description** | Clicking a person shows quick preview |
| **Preconditions** | Tree populated |
| **Steps** | 1. Click on any person node |
| **Expected Result** | Quick preview panel shows with name, dates, photo, and "View Profile" link |
| **Priority** | P0 |

#### TC-TREE-006: Visual Indicators
| ID | TC-TREE-006 |
|----|-------------|
| **Description** | Visual indicators display correctly |
| **Preconditions** | Tree with living/deceased members, with/without photos |
| **Steps** | 1. Observe nodes for living members<br>2. Observe nodes for deceased members<br>3. Observe nodes with photos<br>4. Observe nodes with comments |
| **Expected Result** | Distinct visual styling for each state |
| **Priority** | P1 |

#### TC-TREE-007: Responsive Layout
| ID | TC-TREE-007 |
|----|-------------|
| **Description** | Tree adapts to different screen sizes |
| **Preconditions** | Tree populated |
| **Steps** | 1. View on desktop (1920px)<br>2. View on tablet (768px)<br>3. View on mobile (375px) |
| **Expected Result** | Tree remains usable at all sizes, touch controls work on mobile |
| **Priority** | P0 |

#### TC-TREE-008: Large Tree Performance
| ID | TC-TREE-008 |
|----|-------------|
| **Description** | Tree performs well with many members |
| **Preconditions** | Tree with 500+ members |
| **Steps** | 1. Load tree view<br>2. Zoom and pan<br>3. Expand/collapse branches |
| **Expected Result** | Initial load < 3s, interactions remain smooth (60fps) |
| **Priority** | P1 |

#### TC-TREE-009: Color-Coded Branches
| ID | TC-TREE-009 |
|----|-------------|
| **Description** | Family branches have distinct colors |
| **Preconditions** | Tree with multiple family lines |
| **Steps** | 1. View tree with maternal/paternal branches |
| **Expected Result** | Different family lines have distinct colors, legend available |
| **Priority** | P1 |

---

### 3.3 Person Profiles

#### TC-PROF-001: Create New Profile
| ID | TC-PROF-001 |
|----|-------------|
| **Description** | User can add a new family member |
| **Preconditions** | User logged in with edit permissions |
| **Steps** | 1. Click "Add Person"<br>2. Enter required fields (name, birth date)<br>3. Add relationship to existing person<br>4. Save |
| **Expected Result** | Profile created, appears in tree at correct position |
| **Priority** | P0 |

#### TC-PROF-002: Edit Existing Profile
| ID | TC-PROF-002 |
|----|-------------|
| **Description** | User can edit profile information |
| **Preconditions** | Profile exists, user has edit permissions |
| **Steps** | 1. Open person profile<br>2. Click edit<br>3. Modify fields<br>4. Save |
| **Expected Result** | Changes saved, edit history updated |
| **Priority** | P0 |

#### TC-PROF-003: Delete Profile
| ID | TC-PROF-003 |
|----|-------------|
| **Description** | Admin can delete a profile |
| **Preconditions** | Profile exists, user is admin |
| **Steps** | 1. Open person profile<br>2. Click delete<br>3. Confirm deletion |
| **Expected Result** | Profile removed, relationships updated, delete logged |
| **Priority** | P0 |

#### TC-PROF-004: Required Field Validation
| ID | TC-PROF-004 |
|----|-------------|
| **Description** | System validates required fields |
| **Preconditions** | User creating new profile |
| **Steps** | 1. Attempt to save profile without name<br>2. Attempt to save with invalid date format |
| **Expected Result** | Validation errors displayed, save prevented |
| **Priority** | P0 |

#### TC-PROF-005: Add Life Events
| ID | TC-PROF-005 |
|----|-------------|
| **Description** | User can add life events to profile |
| **Preconditions** | Profile exists |
| **Steps** | 1. Open profile<br>2. Add life event (education, career, etc.)<br>3. Enter details and date<br>4. Save |
| **Expected Result** | Event added to timeline, displayed chronologically |
| **Priority** | P1 |

#### TC-PROF-006: Complex Relationships
| ID | TC-PROF-006 |
|----|-------------|
| **Description** | System handles complex family structures |
| **Preconditions** | None |
| **Steps** | 1. Create person with divorced parents<br>2. Add step-parents<br>3. Add half-siblings<br>4. Add adopted children |
| **Expected Result** | All relationships displayed correctly, no data corruption |
| **Priority** | P0 |

#### TC-PROF-007: Merge Duplicate Profiles
| ID | TC-PROF-007 |
|----|-------------|
| **Description** | Admin can merge duplicate profiles |
| **Preconditions** | Two profiles for same person exist |
| **Steps** | 1. Identify duplicate<br>2. Select profiles to merge<br>3. Choose which data to keep<br>4. Confirm merge |
| **Expected Result** | Single profile with combined data, relationships preserved |
| **Priority** | P1 |

---

### 3.4 Photo Upload & Management

#### TC-PHOTO-001: Single Photo Upload
| ID | TC-PHOTO-001 |
|----|-------------|
| **Description** | User can upload a photo to a profile |
| **Preconditions** | Profile exists, user has edit permissions |
| **Steps** | 1. Open profile<br>2. Click add photo<br>3. Select image file<br>4. Add caption (optional)<br>5. Save |
| **Expected Result** | Photo uploaded, thumbnail generated, appears in gallery |
| **Priority** | P0 |

#### TC-PHOTO-002: Bulk Photo Upload
| ID | TC-PHOTO-002 |
|----|-------------|
| **Description** | User can upload multiple photos at once |
| **Preconditions** | User logged in |
| **Steps** | 1. Navigate to gallery<br>2. Select multiple files (10+)<br>3. Upload |
| **Expected Result** | All photos uploaded with progress indicator |
| **Priority** | P1 |

#### TC-PHOTO-003: Drag and Drop Upload
| ID | TC-PHOTO-003 |
|----|-------------|
| **Description** | User can drag and drop photos |
| **Preconditions** | User on photo upload area |
| **Steps** | 1. Drag image from desktop<br>2. Drop on upload area |
| **Expected Result** | Photo uploaded successfully |
| **Priority** | P0 |

#### TC-PHOTO-004: Supported File Types
| ID | TC-PHOTO-004 |
|----|-------------|
| **Description** | System accepts valid image formats |
| **Preconditions** | None |
| **Steps** | 1. Upload JPG<br>2. Upload PNG<br>3. Upload HEIC<br>4. Upload WebP<br>5. Attempt upload of unsupported format |
| **Expected Result** | Valid formats accepted, unsupported formats rejected with message |
| **Priority** | P0 |

#### TC-PHOTO-005: Photo Size Limits
| ID | TC-PHOTO-005 |
|----|-------------|
| **Description** | System enforces photo size limits |
| **Preconditions** | None |
| **Steps** | 1. Upload photo under limit<br>2. Upload photo over limit (e.g., 50MB) |
| **Expected Result** | Under limit: success. Over limit: error with size guidance |
| **Priority** | P0 |

#### TC-PHOTO-006: Tag People in Photos
| ID | TC-PHOTO-006 |
|----|-------------|
| **Description** | User can tag family members in photos |
| **Preconditions** | Photo uploaded, profiles exist |
| **Steps** | 1. Open photo<br>2. Click to add tag<br>3. Draw region around face<br>4. Select person from list |
| **Expected Result** | Person tagged, photo appears on their profile |
| **Priority** | P1 |

#### TC-PHOTO-007: Set Profile Photo
| ID | TC-PHOTO-007 |
|----|-------------|
| **Description** | User can set main profile photo |
| **Preconditions** | Profile has multiple photos |
| **Steps** | 1. Open photo gallery for profile<br>2. Select a photo<br>3. Click "Set as profile photo" |
| **Expected Result** | Photo set as main, displayed in tree node |
| **Priority** | P0 |

#### TC-PHOTO-008: Delete Photo
| ID | TC-PHOTO-008 |
|----|-------------|
| **Description** | User can delete uploaded photos |
| **Preconditions** | Photo exists |
| **Steps** | 1. Open photo<br>2. Click delete<br>3. Confirm |
| **Expected Result** | Photo removed from storage and gallery |
| **Priority** | P0 |

---

### 3.5 Collaborative Features

#### TC-COLLAB-001: Invite via Email
| ID | TC-COLLAB-001 |
|----|-------------|
| **Description** | User can invite family members via email |
| **Preconditions** | User is tree admin |
| **Steps** | 1. Go to family settings<br>2. Click invite<br>3. Enter email address<br>4. Select role (Editor/Viewer)<br>5. Send |
| **Expected Result** | Invitation email sent with unique link |
| **Priority** | P0 |

#### TC-COLLAB-002: Accept Invitation
| ID | TC-COLLAB-002 |
|----|-------------|
| **Description** | Invited user can join family tree |
| **Preconditions** | Invitation sent |
| **Steps** | 1. Open invitation email<br>2. Click join link<br>3. Create account (if needed)<br>4. Accept invitation |
| **Expected Result** | User added to tree with assigned role |
| **Priority** | P0 |

#### TC-COLLAB-003: Role-Based Permissions - Viewer
| ID | TC-COLLAB-003 |
|----|-------------|
| **Description** | Viewer role has read-only access |
| **Preconditions** | User has Viewer role |
| **Steps** | 1. View tree<br>2. View profiles<br>3. Attempt to edit<br>4. Attempt to add person |
| **Expected Result** | View: allowed. Edit/Add: blocked with upgrade prompt |
| **Priority** | P0 |

#### TC-COLLAB-004: Role-Based Permissions - Editor
| ID | TC-COLLAB-004 |
|----|-------------|
| **Description** | Editor role can edit but not admin |
| **Preconditions** | User has Editor role |
| **Steps** | 1. Add new person<br>2. Edit existing profile<br>3. Attempt to delete profile<br>4. Attempt to change permissions |
| **Expected Result** | Add/Edit: allowed. Delete/Permissions: blocked |
| **Priority** | P0 |

#### TC-COLLAB-005: Role-Based Permissions - Admin
| ID | TC-COLLAB-005 |
|----|-------------|
| **Description** | Admin role has full access |
| **Preconditions** | User has Admin role |
| **Steps** | 1. Add/edit/delete profiles<br>2. Invite members<br>3. Change roles<br>4. Access moderation settings |
| **Expected Result** | All actions allowed |
| **Priority** | P0 |

#### TC-COLLAB-006: Edit History
| ID | TC-COLLAB-006 |
|----|-------------|
| **Description** | All edits are tracked with attribution |
| **Preconditions** | Profile has been edited |
| **Steps** | 1. Open profile<br>2. View edit history |
| **Expected Result** | List of changes with who, what, when |
| **Priority** | P1 |

#### TC-COLLAB-007: Rollback Changes
| ID | TC-COLLAB-007 |
|----|-------------|
| **Description** | Admin can rollback to previous version |
| **Preconditions** | Profile has edit history |
| **Steps** | 1. View edit history<br>2. Select previous version<br>3. Click restore<br>4. Confirm |
| **Expected Result** | Profile reverted, rollback logged |
| **Priority** | P1 |

#### TC-COLLAB-008: Concurrent Edit Conflict
| ID | TC-COLLAB-008 |
|----|-------------|
| **Description** | System handles simultaneous edits |
| **Preconditions** | Two users editing same profile |
| **Steps** | 1. User A opens profile for edit<br>2. User B opens same profile<br>3. User A saves changes<br>4. User B attempts to save |
| **Expected Result** | User B notified of conflict, can merge or overwrite |
| **Priority** | P1 |

#### TC-COLLAB-009: Family Code Join
| ID | TC-COLLAB-009 |
|----|-------------|
| **Description** | User can join via family code |
| **Preconditions** | Family code generated |
| **Steps** | 1. New user enters family code<br>2. Creates account<br>3. Joins tree |
| **Expected Result** | User added with default role (Viewer) |
| **Priority** | P1 |

---

### 3.6 Comments & Stories System

#### TC-COMMENT-001: Add Comment to Profile
| ID | TC-COMMENT-001 |
|----|-------------|
| **Description** | User can comment on a profile |
| **Preconditions** | Profile exists, user logged in |
| **Steps** | 1. Open profile<br>2. Navigate to comments section<br>3. Enter comment text<br>4. Submit |
| **Expected Result** | Comment posted with timestamp and author |
| **Priority** | P1 |

#### TC-COMMENT-002: Reply to Comment
| ID | TC-COMMENT-002 |
|----|-------------|
| **Description** | User can reply to existing comments |
| **Preconditions** | Comment exists |
| **Steps** | 1. Click reply on comment<br>2. Enter reply text<br>3. Submit |
| **Expected Result** | Reply threaded under original comment |
| **Priority** | P1 |

#### TC-COMMENT-003: @Mention User
| ID | TC-COMMENT-003 |
|----|-------------|
| **Description** | User can mention family members |
| **Preconditions** | Multiple users in tree |
| **Steps** | 1. Type @ in comment<br>2. Select user from autocomplete<br>3. Submit comment |
| **Expected Result** | Mention highlighted, mentioned user notified |
| **Priority** | P1 |

#### TC-COMMENT-004: Delete Own Comment
| ID | TC-COMMENT-004 |
|----|-------------|
| **Description** | User can delete their own comments |
| **Preconditions** | User has posted comment |
| **Steps** | 1. Find own comment<br>2. Click delete<br>3. Confirm |
| **Expected Result** | Comment removed |
| **Priority** | P1 |

#### TC-COMMENT-005: Add Story with Rich Text
| ID | TC-COMMENT-005 |
|----|-------------|
| **Description** | User can write formatted stories |
| **Preconditions** | User logged in |
| **Steps** | 1. Click "Add Story"<br>2. Use formatting (bold, italic, lists)<br>3. Add story title<br>4. Save |
| **Expected Result** | Story saved with formatting preserved |
| **Priority** | P1 |

#### TC-COMMENT-006: Feature a Story
| ID | TC-COMMENT-006 |
|----|-------------|
| **Description** | Admin can feature stories |
| **Preconditions** | Story exists, user is admin |
| **Steps** | 1. Open story<br>2. Click "Feature this story" |
| **Expected Result** | Story appears in featured section on dashboard |
| **Priority** | P2 |

---

### 3.7 AI-Powered Features

#### TC-AI-001: Relationship Calculator - Direct
| ID | TC-AI-001 |
|----|-------------|
| **Description** | AI explains direct relationships |
| **Preconditions** | Tree with multiple generations |
| **Steps** | 1. Select two people<br>2. Click "How are they related?" |
| **Expected Result** | Clear explanation: "John is Mary's grandfather" |
| **Priority** | P1 |

#### TC-AI-002: Relationship Calculator - Complex
| ID | TC-AI-002 |
|----|-------------|
| **Description** | AI explains complex relationships |
| **Preconditions** | Tree with cousins, in-laws |
| **Steps** | 1. Select second cousin once removed<br>2. Request relationship |
| **Expected Result** | Explanation with visual path and plain English description |
| **Priority** | P1 |

#### TC-AI-003: Natural Language Search
| ID | TC-AI-003 |
|----|-------------|
| **Description** | User can search using natural language |
| **Preconditions** | Tree populated with diverse data |
| **Steps** | 1. Enter "Who was born in Ireland?"<br>2. Enter "Show me all veterans"<br>3. Enter "People who died young" |
| **Expected Result** | Relevant results returned for each query |
| **Priority** | P1 |

#### TC-AI-004: AI Story Generation
| ID | TC-AI-004 |
|----|-------------|
| **Description** | AI generates biographical narrative |
| **Preconditions** | Profile with multiple data points |
| **Steps** | 1. Open profile<br>2. Click "Generate Story"<br>3. Select tone (formal/casual/children's) |
| **Expected Result** | Coherent narrative generated from facts, editable before save |
| **Priority** | P2 |

#### TC-AI-005: Information Gap Detection
| ID | TC-AI-005 |
|----|-------------|
| **Description** | AI identifies missing information |
| **Preconditions** | Profiles with incomplete data |
| **Steps** | 1. View profile or dashboard<br>2. Check for "Missing Info" suggestions |
| **Expected Result** | Prioritized list of missing fields with suggestions for who might know |
| **Priority** | P2 |

#### TC-AI-006: Photo Face Matching
| ID | TC-AI-006 |
|----|-------------|
| **Description** | AI suggests identity matches in photos |
| **Preconditions** | Untagged photos uploaded, profiles with photos exist |
| **Steps** | 1. Upload new photo with faces<br>2. View AI suggestions |
| **Expected Result** | Suggested matches displayed with confidence level |
| **Priority** | P2 |

#### TC-AI-007: AI Response Accuracy
| ID | TC-AI-007 |
|----|-------------|
| **Description** | AI responses are factually accurate |
| **Preconditions** | Tree with known data |
| **Steps** | 1. Ask various questions about tree data<br>2. Verify responses against actual data |
| **Expected Result** | AI responses match actual tree data, no hallucinations |
| **Priority** | P1 |

#### TC-AI-008: AI Feature Graceful Degradation
| ID | TC-AI-008 |
|----|-------------|
| **Description** | App works when AI service unavailable |
| **Preconditions** | AI service down |
| **Steps** | 1. Attempt AI features<br>2. Verify core functionality works |
| **Expected Result** | Friendly error message, non-AI features unaffected |
| **Priority** | P1 |

---

### 3.8 Search Functionality

#### TC-SEARCH-001: Search by Name
| ID | TC-SEARCH-001 |
|----|-------------|
| **Description** | User can find people by name |
| **Preconditions** | Tree populated |
| **Steps** | 1. Enter name in search<br>2. View results |
| **Expected Result** | Matching profiles displayed |
| **Priority** | P0 |

#### TC-SEARCH-002: Fuzzy Name Matching
| ID | TC-SEARCH-002 |
|----|-------------|
| **Description** | Search handles variations and typos |
| **Preconditions** | Profile with name "Katherine" |
| **Steps** | 1. Search "Catherine"<br>2. Search "Kathy"<br>3. Search "Kathrine" (typo) |
| **Expected Result** | All searches return Katherine |
| **Priority** | P1 |

#### TC-SEARCH-003: Search by Date
| ID | TC-SEARCH-003 |
|----|-------------|
| **Description** | User can search by birth/death date |
| **Preconditions** | Tree with date data |
| **Steps** | 1. Search "born 1950"<br>2. Search "died 1990s" |
| **Expected Result** | Relevant profiles returned |
| **Priority** | P1 |

#### TC-SEARCH-004: Search by Location
| ID | TC-SEARCH-004 |
|----|-------------|
| **Description** | User can search by place |
| **Preconditions** | Tree with location data |
| **Steps** | 1. Search "New York"<br>2. Search "Ireland" |
| **Expected Result** | Profiles with matching locations returned |
| **Priority** | P1 |

#### TC-SEARCH-005: Search Stories/Comments
| ID | TC-SEARCH-005 |
|----|-------------|
| **Description** | Search includes text content |
| **Preconditions** | Stories and comments exist |
| **Steps** | 1. Search for unique word in a story |
| **Expected Result** | Story/profile containing word returned |
| **Priority** | P1 |

#### TC-SEARCH-006: Empty Search Results
| ID | TC-SEARCH-006 |
|----|-------------|
| **Description** | System handles no results gracefully |
| **Preconditions** | None |
| **Steps** | 1. Search for non-existent name |
| **Expected Result** | "No results" message with suggestions |
| **Priority** | P0 |

---

### 3.9 Privacy & Security

#### TC-SEC-001: Private Tree Default
| ID | TC-SEC-001 |
|----|-------------|
| **Description** | New trees are private by default |
| **Preconditions** | User creates new tree |
| **Steps** | 1. Create tree<br>2. Check privacy settings<br>3. Attempt to access without auth |
| **Expected Result** | Tree private, not searchable, requires invitation |
| **Priority** | P0 |

#### TC-SEC-002: Hide Living Members
| ID | TC-SEC-002 |
|----|-------------|
| **Description** | Living members can be hidden from viewers |
| **Preconditions** | Tree with living members, viewer access granted |
| **Steps** | 1. Enable "Hide living members" setting<br>2. Access tree as viewer |
| **Expected Result** | Living members not visible to viewers |
| **Priority** | P1 |

#### TC-SEC-003: Sensitive Field Privacy
| ID | TC-SEC-003 |
|----|-------------|
| **Description** | Sensitive fields can be restricted |
| **Preconditions** | Profile with cause of death, adoption info |
| **Steps** | 1. Mark fields as private<br>2. View as different roles |
| **Expected Result** | Private fields only visible to appropriate roles |
| **Priority** | P1 |

#### TC-SEC-004: Data Export GEDCOM
| ID | TC-SEC-004 |
|----|-------------|
| **Description** | User can export tree data |
| **Preconditions** | Tree populated |
| **Steps** | 1. Go to settings<br>2. Click export<br>3. Select GEDCOM format<br>4. Download |
| **Expected Result** | Valid GEDCOM file downloaded with all data |
| **Priority** | P1 |

#### TC-SEC-005: Account Deletion
| ID | TC-SEC-005 |
|----|-------------|
| **Description** | User can delete their account |
| **Preconditions** | User account exists |
| **Steps** | 1. Go to account settings<br>2. Request deletion<br>3. Confirm with password<br>4. Complete deletion |
| **Expected Result** | Account removed, personal data deleted per policy |
| **Priority** | P1 |

#### TC-SEC-006: SQL Injection Prevention
| ID | TC-SEC-006 |
|----|-------------|
| **Description** | App prevents SQL injection |
| **Preconditions** | None |
| **Steps** | 1. Enter SQL injection payloads in all input fields<br>2. Submit forms |
| **Expected Result** | All payloads sanitized, no database errors |
| **Priority** | P0 |

#### TC-SEC-007: XSS Prevention
| ID | TC-SEC-007 |
|----|-------------|
| **Description** | App prevents cross-site scripting |
| **Preconditions** | None |
| **Steps** | 1. Enter script tags in input fields<br>2. View rendered output |
| **Expected Result** | Scripts escaped, not executed |
| **Priority** | P0 |

#### TC-SEC-008: HTTPS Enforcement
| ID | TC-SEC-008 |
|----|-------------|
| **Description** | All traffic uses HTTPS |
| **Preconditions** | None |
| **Steps** | 1. Attempt HTTP access |
| **Expected Result** | Redirected to HTTPS |
| **Priority** | P0 |

---

### 3.10 Onboarding Experience

#### TC-ONBOARD-001: New User Wizard
| ID | TC-ONBOARD-001 |
|----|-------------|
| **Description** | New users are guided through setup |
| **Preconditions** | New user first login |
| **Steps** | 1. Complete registration<br>2. Follow wizard prompts<br>3. Add self<br>4. Add parents |
| **Expected Result** | User has basic tree started, understands key features |
| **Priority** | P0 |

#### TC-ONBOARD-002: GEDCOM Import
| ID | TC-ONBOARD-002 |
|----|-------------|
| **Description** | User can import existing tree |
| **Preconditions** | Valid GEDCOM file |
| **Steps** | 1. Select import option<br>2. Upload GEDCOM file<br>3. Review import preview<br>4. Confirm import |
| **Expected Result** | All data imported correctly with relationships intact |
| **Priority** | P1 |

#### TC-ONBOARD-003: Skip Wizard
| ID | TC-ONBOARD-003 |
|----|-------------|
| **Description** | User can skip onboarding |
| **Preconditions** | New user |
| **Steps** | 1. Click skip on wizard |
| **Expected Result** | Wizard dismissed, user taken to empty tree |
| **Priority** | P0 |

#### TC-ONBOARD-004: Resume Wizard
| ID | TC-ONBOARD-004 |
|----|-------------|
| **Description** | Incomplete wizard can be resumed |
| **Preconditions** | User partially completed wizard |
| **Steps** | 1. Start wizard, complete 2 steps<br>2. Leave/logout<br>3. Return |
| **Expected Result** | Option to resume from last step |
| **Priority** | P1 |

---

## 4. Non-Functional Test Cases

### 4.1 Performance Testing

#### TC-PERF-001: Page Load Times
| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3s |
| Largest Contentful Paint | < 2.5s |

#### TC-PERF-002: API Response Times
| Endpoint Type | Target |
|---------------|--------|
| Read operations | < 200ms |
| Write operations | < 500ms |
| Search queries | < 1s |
| AI features | < 5s |

#### TC-PERF-003: Concurrent Users
| Load | Expected Behavior |
|------|-------------------|
| 100 concurrent users | No degradation |
| 500 concurrent users | < 20% slowdown |
| 1000 concurrent users | Graceful degradation |

#### TC-PERF-004: Media Upload Performance
| File Size | Expected Upload Time |
|-----------|---------------------|
| 1MB | < 3s |
| 5MB | < 10s |
| 20MB | < 30s |

### 4.2 Compatibility Testing

#### TC-COMPAT-001: Browser Support
| Browser | Versions |
|---------|----------|
| Chrome | Latest 2 versions |
| Firefox | Latest 2 versions |
| Safari | Latest 2 versions |
| Edge | Latest 2 versions |

#### TC-COMPAT-002: Mobile Device Support
| Platform | Versions |
|----------|----------|
| iOS | 15+ |
| Android | 10+ |

#### TC-COMPAT-003: Screen Resolutions
- 1920x1080 (Desktop)
- 1366x768 (Laptop)
- 768x1024 (Tablet)
- 375x667 (Mobile)
- 414x896 (Large Mobile)

### 4.3 Accessibility Testing

#### TC-A11Y-001: Screen Reader Compatibility
- VoiceOver (iOS/macOS)
- NVDA (Windows)
- TalkBack (Android)

#### TC-A11Y-002: Keyboard Navigation
- All interactive elements focusable
- Logical tab order
- Visible focus indicators
- No keyboard traps

#### TC-A11Y-003: Color Contrast
- All text meets WCAG 2.1 AA (4.5:1 minimum)
- Interactive elements distinguishable

#### TC-A11Y-004: Text Scaling
- App usable at 200% zoom
- Text reflows appropriately

---

## 5. Test Data Requirements

### 5.1 Test Accounts
| Role | Email | Purpose |
|------|-------|---------|
| Admin | admin@test.com | Full access testing |
| Editor | editor@test.com | Limited edit testing |
| Viewer | viewer@test.com | Read-only testing |
| New User | new@test.com | Onboarding testing |

### 5.2 Test Family Trees
| Tree Name | Size | Characteristics |
|-----------|------|-----------------|
| Small Tree | 10 people | Basic relationships |
| Medium Tree | 50 people | Multiple generations |
| Large Tree | 500 people | Performance testing |
| Complex Tree | 100 people | Divorces, adoptions, half-siblings |

### 5.3 Test Media
- 10 sample photos (various sizes: 100KB - 20MB)
- 5 documents (PDF, JPG scans)
- 1 invalid file type for error testing

---

## 6. Entry/Exit Criteria

### 6.1 Entry Criteria
- Code complete for feature under test
- Build deploys successfully to test environment
- Test data available
- Test environment stable

### 6.2 Exit Criteria
- All P0 test cases pass (100%)
- All P1 test cases pass (95%+)
- No critical or high severity bugs open
- Performance targets met
- Security scan completed with no critical vulnerabilities

---

## 7. Defect Management

### 7.1 Severity Levels
| Severity | Definition | Response |
|----------|------------|----------|
| Critical | App crash, data loss, security breach | Immediate fix |
| High | Major feature broken, no workaround | Fix before release |
| Medium | Feature issue with workaround | Fix in release if time |
| Low | Minor UI/UX issues | Backlog for future |

### 7.2 Bug Report Template
```
Title: [Brief description]
Severity: [Critical/High/Medium/Low]
Environment: [Browser, OS, Device]
Steps to Reproduce:
1.
2.
3.
Expected Result:
Actual Result:
Screenshots/Logs:
```

---

## 8. Test Schedule

| Phase | Activities | Duration |
|-------|-----------|----------|
| Test Planning | Review PRD, create test cases | Week 1 |
| Test Environment Setup | Configure environments, data | Week 2 |
| Unit/Integration Testing | Developer testing | Weeks 3-6 |
| System Testing | QA functional testing | Weeks 7-9 |
| Performance Testing | Load and stress testing | Week 10 |
| Security Testing | Vulnerability assessment | Week 10 |
| UAT | User acceptance testing | Weeks 11-12 |
| Regression | Final regression cycle | Week 13 |

---

## 9. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI service instability | High | Implement fallbacks, test graceful degradation |
| Large tree performance issues | High | Early performance testing, pagination |
| Complex relationship edge cases | Medium | Comprehensive test data with edge cases |
| Cross-browser inconsistencies | Medium | Automated cross-browser testing |
| Test environment data sync | Low | Automated data refresh scripts |

---

## 10. Tools and Infrastructure

### 10.1 Testing Tools
| Category | Tool |
|----------|------|
| Test Management | TestRail or Zephyr |
| Automation | Playwright or Cypress |
| API Testing | Postman or Insomnia |
| Performance | k6 or JMeter |
| Accessibility | axe DevTools, WAVE |
| Security | OWASP ZAP, Burp Suite |

### 10.2 CI/CD Integration
- Automated tests run on every PR
- Nightly full regression suite
- Performance tests on staging deploys
- Security scans weekly

---

## Appendix A: Test Case Traceability Matrix

| Requirement | Test Cases |
|-------------|------------|
| User Authentication | TC-AUTH-001 to TC-AUTH-006 |
| Tree Visualization | TC-TREE-001 to TC-TREE-009 |
| Person Profiles | TC-PROF-001 to TC-PROF-007 |
| Photo Management | TC-PHOTO-001 to TC-PHOTO-008 |
| Collaboration | TC-COLLAB-001 to TC-COLLAB-009 |
| Comments & Stories | TC-COMMENT-001 to TC-COMMENT-006 |
| AI Features | TC-AI-001 to TC-AI-008 |
| Search | TC-SEARCH-001 to TC-SEARCH-006 |
| Privacy & Security | TC-SEC-001 to TC-SEC-008 |
| Onboarding | TC-ONBOARD-001 to TC-ONBOARD-004 |
