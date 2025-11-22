# Organizer Registration & Operations Department Acceptance Logic Review

## 📋 Overview

This document reviews the complete business logic for organizer registration and the acceptance/rejection workflow handled by the Operations Department.

---

## 🔄 Complete Flow Diagram

```
PARTICIPANT User
    ↓
Request Organizer Upgrade (/api/upgrade/business)
    ↓
Submit Profile Data (INDIVIDUAL/COMMUNITY/SMALL_BUSINESS/INSTITUTION)
    ↓
User Status: role=PARTICIPANT, organizerType=<type>, verificationStatus=PENDING
    ↓
Auto-Assignment to OPS_AGENT (Smart Assignment Service)
    ↓
Operations Department Review
    ├── OPS_AGENT: Can view assigned organizers only
    ├── OPS_HEAD: Can view all organizers
    └── SUPER_ADMIN: Can view all organizers
    ↓
Agent Reviews Profile & Documents
    ↓
Decision Point
    ├── APPROVE → role=ORGANIZER, verificationStatus=APPROVED
    └── REJECT → role=PARTICIPANT, verificationStatus=REJECTED (with reason)
    ↓
Email Notification Sent
    ↓
Audit Log Created
```

---

## 🎯 Key Business Logic Components

### 1. **Organizer Registration Request** (`/api/upgrade/business`)

**Location**: `backend/src/routes/upgrade.js`

#### Validation Rules:
- ✅ User must be `PARTICIPANT` role
- ✅ Cannot have existing `PENDING` request
- ✅ `organizerType` must be one of: `INDIVIDUAL`, `COMMUNITY`, `SMALL_BUSINESS`, `INSTITUTION`
- ✅ Business name/address/phone required for non-INDIVIDUAL types
- ✅ NIK validation (16 digits) for INDIVIDUAL type
- ✅ Portfolio and social media optional

#### State Changes:
```javascript
// User remains PARTICIPANT until approved
{
  role: 'PARTICIPANT',           // Stays as PARTICIPANT
  organizerType: '<TYPE>',        // Set to requested type
  verificationStatus: 'PENDING'  // Set to PENDING
}
```

#### Profile Creation:
- Creates/updates appropriate profile table based on `organizerType`:
  - `INDIVIDUAL` → `IndividualProfile`
  - `COMMUNITY` → `CommunityProfile`
  - `SMALL_BUSINESS` → `BusinessProfile`
  - `INSTITUTION` → `InstitutionProfile`

#### Auto-Assignment:
```javascript
// Automatically assigns to best available OPS_AGENT
smartAssignmentService.assignToBestAgent('ORGANIZER', userId, 'NORMAL')
```

**Key Point**: User remains `PARTICIPANT` until explicitly approved by Operations team.

---

### 2. **Smart Assignment Service**

**Location**: `backend/src/services/smartAssignmentService.js`

#### Assignment Strategy:
- **Default**: `WORKLOAD_BASED` (lowest workload first)
- **Alternatives**: `ROUND_ROBIN`, `SKILL_BASED`, `ADVANCED`

#### Capacity Management:
- **Max Capacity**: 20 assignments per agent
- **Workload Calculation**: 
  - Events (DRAFT status) + Organizers (PENDING status)
  - Formula: `eventsCount + organizersCount`

#### Assignment Process:
1. Get all available `OPS_AGENT` and `OPS_SENIOR_AGENT` users
2. Calculate workload for each agent
3. Filter agents with capacity < 20
4. Select agent with lowest workload
5. Update user: `assignedTo = agentId`, `assignedAt = now()`
6. Send notification to agent
7. Log assignment history

#### Queue System:
- If no available agents → Add to `AssignmentQueue`
- Queue processed periodically
- Priority-based processing (URGENT > HIGH > NORMAL > LOW)

---

### 3. **Operations Department Access Control**

**Location**: `backend/src/routes/organizers.js`

#### Role-Based Permissions:

| Role | Can View | Can Approve | Can Reject | Notes |
|------|----------|-------------|------------|-------|
| `SUPER_ADMIN` | All organizers | ✅ | ✅ | Full access |
| `OPS_HEAD` | All organizers | ✅ | ✅ | Full visibility, can approve/reject any |
| `OPS_AGENT` | Assigned only | ✅ | ❌ | Can only approve, cannot reject |

#### Agent Restrictions:
```javascript
// OPS_AGENT can only view organizers assigned to them
if (userRole === 'OPS_AGENT') {
  where.assignedTo = userId  // Filter by assignment
}

// OPS_HEAD has full visibility
if (userRole === 'OPS_HEAD') {
  // No additional filtering - full visibility
}
```

#### Approval Restrictions:
```javascript
// OPS_AGENT can only approve organizers assigned to them
if (userRole === 'OPS_AGENT') {
  const organizer = await prisma.user.findFirst({
    where: {
      id: organizerId,
      organizerType: { not: null },
      assignedTo: req.user.id,      // Must be assigned to agent
      verificationStatus: 'PENDING'  // Must be pending
    }
  });
}
```

**Key Point**: Only `OPS_HEAD` and `SUPER_ADMIN` can reject organizers. `OPS_AGENT` can only approve.

---

### 4. **Organizer Verification Logic**

**Location**: `backend/src/services/authService.js` → `verifyOrganizer()`

#### Pre-Verification Checks:
```javascript
// Must have organizerType
if (!organizer.organizerType) {
  throw new Error('User does not have organizer request');
}

// Must be PENDING status
if (organizer.verificationStatus !== 'PENDING') {
  throw new Error(`Organizer request is already ${organizer.verificationStatus}`);
}
```

#### Approval Logic:
```javascript
if (action === 'approve') {
  updateData = {
    role: 'ORGANIZER',              // Change role to ORGANIZER
    verificationStatus: 'APPROVED', // Set status to APPROVED
    verifiedAt: new Date(),         // Record verification timestamp
    rejectedReason: null            // Clear any rejection reason
  };
}
```

#### Rejection Logic:
```javascript
if (action === 'reject') {
  updateData = {
    verificationStatus: 'REJECTED', // Set status to REJECTED
    rejectedReason: reason,         // Store rejection reason
    verifiedAt: null                // No verification timestamp
    // role remains PARTICIPANT
  };
}
```

#### Post-Verification Actions:
1. ✅ Send email notification (approval/rejection)
2. ✅ Log audit trail
3. ✅ Update user record

**Key Point**: Only upon approval does the user's role change from `PARTICIPANT` to `ORGANIZER`.

---

### 5. **Frontend Operations Dashboard**

**Location**: `frontend/src/app/(department)/department/operations/organizers/`

#### Features:
- ✅ List all organizer requests (filtered by role)
- ✅ Search by name, email, business name
- ✅ Filter by status (PENDING, APPROVED, REJECTED)
- ✅ Filter by date (Today, This Week, This Month, All)
- ✅ View detailed organizer information
- ✅ Approve/Reject actions (role-based)

#### UI Restrictions:
```typescript
// Only OPS_HEAD and SUPER_ADMIN can see reject button
{(user?.role === 'OPS_HEAD' || user?.role === 'SUPER_ADMIN') && (
  <Button onClick={handleReject}>Reject</Button>
)}
```

#### Document Review:
- ✅ View uploaded documents (legal documents, certificates)
- ✅ Download documents
- ✅ View portfolio links
- ✅ View social media links

---

## 🔍 Critical Business Rules

### Rule 1: User Role Progression
```
PARTICIPANT (no organizerType)
    ↓
PARTICIPANT (organizerType set, verificationStatus=PENDING)
    ↓
    ├── APPROVED → ORGANIZER (verificationStatus=APPROVED)
    └── REJECTED → PARTICIPANT (verificationStatus=REJECTED)
```

**Important**: User remains `PARTICIPANT` until explicitly approved. Cannot create events until `ORGANIZER` role.

### Rule 2: Assignment Ownership
- Organizers are assigned to specific agents
- Agents can only view/manage their assigned organizers
- OPS_HEAD can view/manage all organizers
- Assignment happens automatically via Smart Assignment Service

### Rule 3: Approval vs Rejection Permissions
- **OPS_AGENT**: Can approve assigned organizers only
- **OPS_HEAD**: Can approve/reject any organizer
- **SUPER_ADMIN**: Can approve/reject any organizer

### Rule 4: Rejection Requirements
- Rejection reason is **mandatory**
- Rejection reason is stored in `rejectedReason` field
- Rejected organizers remain as `PARTICIPANT` with `verificationStatus=REJECTED`
- Rejected organizers can re-apply (no blocking mechanism)

### Rule 5: Document Verification
- Documents are stored in profile-specific fields (`documents` array)
- Documents can be uploaded during registration
- Documents are visible to agents during review
- No automatic document validation (manual review required)

---

## ⚠️ Potential Issues & Recommendations

### Issue 1: No Re-application Blocking
**Current Behavior**: Rejected organizers can immediately re-apply
**Recommendation**: 
- Add cooldown period (e.g., 30 days) before re-application
- Track rejection count
- Require different documents if previously rejected

### Issue 2: Agent Capacity Management
**Current Behavior**: Max 20 assignments per agent
**Recommendation**:
- Add real-time capacity monitoring
- Alert when agent approaches capacity
- Auto-reassignment for overloaded agents

### Issue 3: Document Validation
**Current Behavior**: No automatic document validation
**Recommendation**:
- Add document type validation (PDF, JPG, PNG only)
- Add file size limits
- Add document format verification (e.g., NIK format check)

### Issue 4: Rejection Reason Quality
**Current Behavior**: Free-text rejection reason
**Recommendation**:
- Add predefined rejection reasons (dropdown)
- Require minimum character count
- Add rejection reason templates

### Issue 5: Assignment Strategy
**Current Behavior**: Workload-based only
**Recommendation**:
- Add skill-based assignment (agents specialize in certain organizer types)
- Add geographic assignment (assign based on location)
- Add performance-based assignment (assign to best-performing agents)

### Issue 6: Email Notifications
**Current Behavior**: Email sent after approval/rejection
**Recommendation**:
- Add email notification when assigned to agent
- Add reminder emails for pending requests
- Add escalation emails for overdue requests

---

## 📊 Database Schema Impact

### User Model Changes:
```prisma
model User {
  role              UserRole           @default(PARTICIPANT)
  organizerType     OrganizerType?     // Set during upgrade request
  verificationStatus VerificationStatus @default(PENDING)
  verifiedAt        DateTime?          // Set on approval
  rejectedReason    String?            // Set on rejection
  assignedTo        String?            // Assigned agent ID
  assignedAt        DateTime?         // Assignment timestamp
}
```

### Profile Models:
- `IndividualProfile` - For INDIVIDUAL type
- `CommunityProfile` - For COMMUNITY type
- `BusinessProfile` - For SMALL_BUSINESS type
- `InstitutionProfile` - For INSTITUTION type

All profiles include:
- `documents` field (array of document URLs)
- Profile-specific fields (NIK, NPWP, legal documents, etc.)

---

## 🔐 Security Considerations

### Access Control:
- ✅ Role-based access control enforced
- ✅ Agent can only view assigned organizers
- ✅ Agent can only approve assigned organizers
- ✅ Rejection requires OPS_HEAD or SUPER_ADMIN

### Data Validation:
- ✅ Input validation on registration
- ✅ Organizer type validation
- ✅ Document URL validation
- ⚠️ No document content validation

### Audit Trail:
- ✅ Assignment history logged
- ✅ Approval/rejection logged
- ✅ Audit log includes user, action, timestamp, reason

---

## 🎯 Summary

### Current Implementation Strengths:
1. ✅ Clear role progression (PARTICIPANT → ORGANIZER)
2. ✅ Automatic assignment to agents
3. ✅ Workload-based capacity management
4. ✅ Role-based access control
5. ✅ Document review capability
6. ✅ Email notifications
7. ✅ Audit trail

### Areas for Improvement:
1. ⚠️ Add re-application cooldown
2. ⚠️ Enhance document validation
3. ⚠️ Add skill-based assignment
4. ⚠️ Improve rejection reason quality
5. ⚠️ Add escalation mechanisms
6. ⚠️ Add performance metrics

### Key Takeaways:
- **User remains PARTICIPANT until approved** - This is intentional and correct
- **Auto-assignment works well** - Smart assignment service handles workload distribution
- **Role-based permissions are clear** - OPS_AGENT has limited access, OPS_HEAD has full access
- **Document review is manual** - No automatic validation, requires agent review
- **Rejection requires reason** - Good practice, but could be improved with templates

---

**Last Updated**: Based on codebase review
**Reviewed Files**:
- `backend/src/routes/upgrade.js`
- `backend/src/routes/organizers.js`
- `backend/src/services/authService.js`
- `backend/src/services/smartAssignmentService.js`
- `frontend/src/app/(department)/department/operations/organizers/page.tsx`
- `frontend/src/app/(department)/department/operations/organizers/[id]/page.tsx`

