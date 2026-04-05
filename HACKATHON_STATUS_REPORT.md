# Hackathon Status Analysis Report

## Summary
Test/seed hackathons are created with **pending** status, not approved. Only **approved** hackathons are visible to users, which is why no hackathons are returned by the getHackathons endpoint.

---

## 1. Schema Default Status

**File**: [server/database/hackathon.js](server/database/hackathon.js#L29-L32)

```javascript
status: {
  type: String,
  enum: ["pending", "approved", "rejected", "cancelled"],
  default: "pending"
}
```

**Finding**: New hackathons are created with `status: "pending"` by default.

---

## 2. Test Data Initialization

### Seed Files
**File**: [src/database/seed.sql](src/database/seed.sql)

Only seeds **hackathon_sources** (the API data sources), NOT actual test hackathons:
- Devpost Hackathons
- TopCoder Challenges
- Quira Quests

**No test hackathons are created in seed.sql.**

### Setup Scripts
**File**: [setup-test-accounts.ps1](setup-test-accounts.ps1)

Only creates test **user accounts**:
- admin@hackhunt.com (Admin role)
- organizer@hackhunt.com (Organizer role)
- user@hackhunt.com (User role)

**No test hackathons are created by this script.**

### Mock Data
**File**: [src/data/mockData.js](src/data/mockData.js)

Contains frontend mock data for UI testing with statuses like `"upcoming"` and `"ongoing"`, but this is NOT stored in the database.

---

## 3. How Hackathons Are Created

**File**: [server/utils/controllers/hackathonController.js](server/utils/controllers/hackathonController.js#L148)

When an organizer creates a hackathon:

1. **Creation** (line 148-220): `Hackathon.create()` is called
   - No explicit status is set
   - MongoDB schema default applies: `status: "pending"`
   - Activity logged: "submitted for admin approval"

2. **Status becomes "pending"** by default ✓

3. **Update** (line 292): If an organizer edits a hackathon:
   - `hackathon.status = "pending"` is explicitly set
   - Hackathon is sent back for admin approval

---

## 4. Query Filtering - The Real Issue

**File**: [server/services/hackathonService.js](server/services/hackathonService.js#L66-L67)

```javascript
const fetchHackathons = async ({
  ...
  approvalStatus = "approved"  // ← DEFAULT FILTERS FOR APPROVED ONLY
} = {}) => {
  const query = {};

  if (approvalStatus) {
    query.status = approvalStatus;  // ← ONLY returns "approved" hackathons
  }
  ...
}
```

**Finding**: The getHackathons endpoint automatically filters for `approvalStatus: "approved"` only.

**File**: [server/utils/controllers/hackathonController.js](server/utils/controllers/hackathonController.js#L50-L56)

```javascript
const getHackathons = async (req, res) => {
  ...
  const hackathons = await fetchHackathons({
    search,
    status,
    type,
    approvalStatus: "approved"  // ← HARD-CODED FILTER
  });
  ...
}
```

**Finding**: Even if hackathons exist, **only approved ones are returned to users**.

---

## 5. Admin Approval Workflow

**File**: [server/utils/controllers/hackathonController.js](server/utils/controllers/hackathonController.js#L440+)

Admins can approve hackathons via `updateHackathonApproval` endpoint:
- Changes `status` from "pending" → "approved"
- Sets `approvedAt` timestamp
- Sets `approvedBy` admin ID

**File**: [server/utils/controllers/adminController.js](server/utils/controllers/adminController.js#L109)

Admins can see counts of approved hackathons:
```javascript
const approvedHackathons = await Hackathon.countDocuments({ status: "approved" });
```

---

## Current Status Flow

```
Organizer Creates Hackathon
         ↓
Status = "pending" (default)
         ↓
HIDDEN from users (getHackathons filters for "approved" only)
         ↓
Admin must APPROVE via updateHackathonApproval
         ↓
Status = "approved"
         ↓
NOW VISIBLE to users
```

---

## Why No Hackathons Are Returned

| Status | Reason |
|--------|--------|
| No seed hackathons created | seed.sql only seeds sources, not hackathons |
| No setup script creates them | setup-test-accounts.ps1 only creates users |
| getHackathons filters "approved" only | approvalStatus hardcoded to "approved" |
| **NEW HACKATHONS ARE PENDING** | Status defaults to "pending", not "approved" |

---

## Solution Required

To fix this issue, you need to:

1. **Option A**: Create test hackathons manually and have admin approve them
2. **Option B**: Create a seed script that creates hackathons with `status: "approved"`
3. **Option C**: Modify getHackathons to show pending hackathons (if this is the intended behavior change)

Currently, test data initialization **does not create any hackathons in the database**.
