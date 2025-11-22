# Migration Plan: Flow Improvement

## Changes Overview

### 1. Customer Success → Customer Service
- Rename `CUSTOMER_SUCCESS` to `CUSTOMER_SERVICE` in Department enum
- Update all references in backend and frontend
- Ensure all support/help flows go to customer_service

### 2. Remove Senior Agent
- Remove `CS_SENIOR_AGENT`, `OPS_SENIOR_AGENT`, `FINANCE_SENIOR_AGENT` from UserRole enum
- Remove `SENIOR_AGENT` from UserPosition enum
- Update all references to only use HEAD and AGENT
- Update UI modals and forms

### 3. Improve Organizer Registration Flow
- Add file upload support (PDF, DOCS) for documents
- User remains PARTICIPANT until approved
- Only set organizerType and verificationStatus = PENDING
- After approval, change role to ORGANIZER
- Operations can view uploaded documents

## Schema Changes

### Department Enum
```prisma
enum Department {
  CUSTOMER_SERVICE  // Changed from CUSTOMER_SUCCESS
  OPERATIONS
  FINANCE
  ORGANIZER
  PARTICIPANT
}
```

### UserRole Enum
```prisma
enum UserRole {
  SUPER_ADMIN
  CS_HEAD
  CS_AGENT        // Removed CS_SENIOR_AGENT
  OPS_HEAD
  OPS_AGENT       // Removed OPS_SENIOR_AGENT
  FINANCE_HEAD
  FINANCE_AGENT   // Removed FINANCE_SENIOR_AGENT
  ORGANIZER
  PARTICIPANT
}
```

### UserPosition Enum
```prisma
enum UserPosition {
  SUPER_ADMIN
  HEAD
  AGENT          // Removed SENIOR_AGENT
  ORGANIZER
  PARTICIPANT
}
```

### Profile Models - Add Documents Field
```prisma
model IndividualProfile {
  // ... existing fields
  documents      String[]   // Array of document URLs (PDF, DOCS)
}

model CommunityProfile {
  // ... existing fields
  documents      String[]   // Array of document URLs (PDF, DOCS)
}

model BusinessProfile {
  // ... existing fields
  documents      String[]   // Array of document URLs (PDF, DOCS)
}

model InstitutionProfile {
  // ... existing fields
  documents      String[]   // Array of document URLs (PDF, DOCS)
}
```

## Flow Changes

### Organizer Registration Flow
1. User (PARTICIPANT) submits upgrade request with documents
2. System sets:
   - `organizerType` = selected type
   - `verificationStatus` = PENDING
   - `role` = PARTICIPANT (unchanged)
3. System creates profile with uploaded documents
4. System auto-assigns to Operations agent
5. Agent reviews documents and profile
6. Agent approves → `role` = ORGANIZER, `verificationStatus` = APPROVED
7. Agent rejects → `verificationStatus` = REJECTED, user remains PARTICIPANT

## File Upload Changes

### Upload Route
- Add support for PDF and DOC files
- Increase file size limit to 10MB for documents
- Store documents in `uploads/documents/` directory
- Return document URLs for storage in profile

## UI Changes

### Department Management
- Remove "Senior Agent" option from forms
- Only show HEAD and AGENT positions
- Update department hierarchy display

### Organizer Registration
- Add file upload component for documents
- Show document preview/upload status
- Display uploaded documents in operations review page

## Migration Steps

1. Update schema.prisma
2. Run `prisma db push` or create migration
3. Update backend routes and services
4. Update frontend components
5. Update UI modals and forms
6. Test all flows
7. Update documentation

