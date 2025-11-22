# Analisis Arsitektur: Department, Teams, dan Organizer

## 📋 Daftar Isi
1. [Overview](#overview)
2. [Struktur Department](#struktur-department)
3. [Struktur Teams](#struktur-teams)
4. [Struktur Organizer](#struktur-organizer)
5. [Flow User Biasa ke Organizer](#flow-user-biasa-ke-organizer)
6. [Hubungan Antar Komponen](#hubungan-antar-komponen)
7. [Auto-Assignment System](#auto-assignment-system)
8. [Diagram Arsitektur](#diagram-arsitektur)

---

## Overview

Sistem ini memiliki tiga komponen utama:
- **Departments**: Struktur organisasi untuk mengelola staff internal
- **Teams**: Grup spesialis untuk menangani ticket berdasarkan kategori
- **Organizer**: User yang dapat membuat dan mengelola event setelah verifikasi

---

## Struktur Department

### 1. OrganizationDepartment Model
```prisma
model OrganizationDepartment {
  id          String   @id
  name        String   @unique
  description String?
  headId      String?  // User ID yang menjadi kepala departemen
  isActive    Boolean  @default(true)
  head        User?    @relation("DepartmentHead")
}
```

### 2. Department Enum
```prisma
enum Department {
  CUSTOMER_SUCCESS  // Customer Support
  OPERATIONS        // Event Operations
  FINANCE          // Financial Management
  ORGANIZER        // Organizer Management
  PARTICIPANT      // Regular Users
}
```

### 3. User Roles dalam Department
```prisma
enum UserRole {
  // Customer Success
  CS_HEAD
  CS_SENIOR_AGENT
  CS_AGENT
  
  // Operations
  OPS_HEAD
  OPS_SENIOR_AGENT
  OPS_AGENT
  
  // Finance
  FINANCE_HEAD
  FINANCE_SENIOR_AGENT
  FINANCE_AGENT
  
  // External
  ORGANIZER
  PARTICIPANT
  
  // System
  SUPER_ADMIN
}
```

### 4. User Position
```prisma
enum UserPosition {
  SUPER_ADMIN
  HEAD
  SENIOR_AGENT
  AGENT
  ORGANIZER
  PARTICIPANT
}
```

### 5. Hierarchy Department
```
SUPER_ADMIN
  ├── CUSTOMER_SUCCESS
  │   ├── CS_HEAD
  │   ├── CS_SENIOR_AGENT
  │   └── CS_AGENT
  ├── OPERATIONS
  │   ├── OPS_HEAD
  │   ├── OPS_SENIOR_AGENT
  │   └── OPS_AGENT
  └── FINANCE
      ├── FINANCE_HEAD
      ├── FINANCE_SENIOR_AGENT
      └── FINANCE_AGENT
```

---

## Struktur Teams

### 1. Team Model
```prisma
model Team {
  id          String           @id
  name        String           @unique
  description String?
  teamType    TeamType         // PAYMENT_FINANCE, TECHNICAL_SUPPORT, GENERAL_SUPPORT
  categories  String[]         // Array kategori untuk auto-assignment
  isActive    Boolean          @default(true)
  assignments TeamAssignment[] // Ticket assignments
  members     TeamMember[]     // Team members
}
```

### 2. Team Types
```prisma
enum TeamType {
  PAYMENT_FINANCE      // Menangani payment issues
  TECHNICAL_SUPPORT    // Menangani technical issues
  GENERAL_SUPPORT      // Menangani general inquiries
}
```

### 3. Team Member
```prisma
model TeamMember {
  id       String   @id
  teamId   String   // Team ID
  userId   String   // User ID
  role     String   @default("MEMBER") // MEMBER, LEAD, ADMIN
  isActive Boolean  @default(true)
  team     Team     @relation
  user     User     @relation
}
```

### 4. Team Assignment
```prisma
model TeamAssignment {
  id             String           @id
  ticketId       String           @unique // DepartmentTicket ID
  teamId         String           // Team ID
  assignedBy     String           // User ID yang assign
  assignedAt     DateTime         @default(now())
  isAutoAssigned Boolean          @default(false)
  team           Team             @relation
  ticket         DepartmentTicket @relation
}
```

### 5. Team Categories (untuk Auto-Assignment)
```typescript
// Kategori yang dapat ditangani oleh team
const categories = [
  'TECHNICAL_ISSUE',
  'PAYMENT_ISSUE',
  'GENERAL_INQUIRY',
  'EVENT_MANAGEMENT',
  'MARKETING_INQUIRY',
  'BRAND_MANAGEMENT',
  'PROMOTIONAL_SUPPORT',
  'CUSTOMER_SUPPORT',
  'ORGANIZER_SUPPORT',
  'FINANCE_QUERY',
  'HR_SUPPORT',
  'EMPLOYEE_QUERY',
  'PAYROLL_ISSUE'
];
```

---

## Struktur Organizer

### 1. User sebagai Organizer
```prisma
model User {
  id                 String               @id
  role               UserRole             @default(PARTICIPANT)
  organizerType      OrganizerType?       // INDIVIDUAL, COMMUNITY, SMALL_BUSINESS, INSTITUTION
  verificationStatus VerificationStatus   @default(PENDING) // PENDING, APPROVED, REJECTED
  verifiedAt         DateTime?
  rejectedReason     String?
  assignedTo         String?              // Agent ID untuk verifikasi
  assignedAt         DateTime?
  
  // Profile berdasarkan organizerType
  individualProfile    IndividualProfile?
  communityProfile     CommunityProfile?
  businessProfile      BusinessProfile?
  institutionProfile   InstitutionProfile?
  
  // Relations
  createdEvents        Event[]
  organizerRevenue     OrganizerRevenue[]
}
```

### 2. Organizer Types
```prisma
enum OrganizerType {
  INDIVIDUAL        // Organizer perorangan
  COMMUNITY         // Organizer komunitas
  SMALL_BUSINESS    // Organizer bisnis kecil
  INSTITUTION       // Organizer institusi
}
```

### 3. Verification Status
```prisma
enum VerificationStatus {
  PENDING    // Menunggu verifikasi
  APPROVED   // Sudah diverifikasi
  REJECTED   // Ditolak
}
```

### 4. Organizer Profiles
```prisma
// Individual Profile
model IndividualProfile {
  userId          String   @unique
  nik             String?
  personalAddress String?
  personalPhone   String?
  portfolio       String[]
  socialMedia     Json?
}

// Community Profile
model CommunityProfile {
  userId           String   @unique
  communityName    String
  communityType    String?
  communityAddress String?
  communityPhone   String?
  contactPerson    String?
  legalDocument    String?
  website          String?
  socialMedia      Json?
}

// Business Profile
model BusinessProfile {
  userId          String   @unique
  businessName    String
  businessType    String?
  businessAddress String?
  businessPhone   String?
  npwp            String?
  legalDocument   String?
  logo            String?
  portfolio       String[]
  socialMedia     Json?
}

// Institution Profile
model InstitutionProfile {
  userId             String   @unique
  institutionName    String
  institutionType    String?
  institutionAddress String?
  institutionPhone   String?
  contactPerson      String?
  akta               String?
  siup               String?
  website            String?
  socialMedia        Json?
}
```

---

## Flow User Biasa ke Organizer

### 1. Initial State: PARTICIPANT
```typescript
User {
  role: 'PARTICIPANT'
  organizerType: null
  verificationStatus: null
  assignedTo: null
}
```

### 2. Upgrade Request
**Endpoint**: `POST /api/upgrade/business`

**Request Body**:
```json
{
  "organizerType": "INDIVIDUAL" | "COMMUNITY" | "SMALL_BUSINESS" | "INSTITUTION",
  "businessName": "Nama Bisnis" (optional),
  "businessAddress": "Alamat" (optional),
  "businessPhone": "No. Telepon" (optional),
  "nik": "NIK" (optional, untuk INDIVIDUAL),
  "personalAddress": "Alamat" (optional, untuk INDIVIDUAL),
  "personalPhone": "No. Telepon" (optional, untuk INDIVIDUAL),
  "portfolio": ["url1", "url2"] (optional),
  "socialMedia": { "links": [...] } (optional)
}
```

**Process**:
1. Validasi user adalah PARTICIPANT
2. Update user role menjadi ORGANIZER
3. Set organizerType
4. Set verificationStatus menjadi PENDING
5. Create profile berdasarkan organizerType
6. Auto-assign ke agent menggunakan SmartAssignmentService
7. Send notification ke agent

**After Upgrade**:
```typescript
User {
  role: 'ORGANIZER'
  organizerType: 'INDIVIDUAL' | 'COMMUNITY' | 'SMALL_BUSINESS' | 'INSTITUTION'
  verificationStatus: 'PENDING'
  assignedTo: 'agent-id' // Auto-assigned
  assignedAt: '2024-01-01T00:00:00Z'
}
```

### 3. Auto-Assignment ke Agent
**Service**: `SmartAssignmentService.assignToBestAgent('ORGANIZER', userId, 'NORMAL')`

**Process**:
1. Get available agents (OPS_AGENT, OPS_SENIOR_AGENT)
2. Calculate workload untuk setiap agent
3. Select agent dengan workload terendah (WORKLOAD_BASED strategy)
4. Assign organizer ke agent
5. Update user.assignedTo dan user.assignedAt
6. Send notification ke agent
7. Log assignment history

**If no available agents**:
- Add to AssignmentQueue
- Process queue later when agents become available

### 4. Agent Verification
**Agent Dashboard**: `/department/operations/organizers`

**Process**:
1. Agent melihat list organizers yang assigned ke mereka
2. Agent review organizer profile dan documents
3. Agent dapat:
   - **Approve**: Set verificationStatus = APPROVED
   - **Reject**: Set verificationStatus = REJECTED, provide rejectedReason

**Endpoint**: `POST /api/organizers/:organizerId/approve` atau `/api/organizers/:organizerId/reject`

**After Approval**:
```typescript
User {
  role: 'ORGANIZER'
  organizerType: 'INDIVIDUAL'
  verificationStatus: 'APPROVED'
  verifiedAt: '2024-01-02T00:00:00Z'
  assignedTo: 'agent-id'
}
```

**After Rejection**:
```typescript
User {
  role: 'ORGANIZER'
  organizerType: 'INDIVIDUAL'
  verificationStatus: 'REJECTED'
  rejectedReason: 'Document tidak lengkap'
  assignedTo: 'agent-id'
}
```

### 5. Organizer dapat membuat Event
**After Approval**:
- Organizer dapat create event
- Event status: DRAFT → UNDER_REVIEW → APPROVED → PUBLISHED
- Event tidak perlu approval dari operations (auto-approved)
- Organizer dapat manage event, registrations, payments

---

## Hubungan Antar Komponen

### 1. User → Department
```
User {
  department: Department (CUSTOMER_SUCCESS, OPERATIONS, FINANCE)
  role: UserRole (CS_HEAD, OPS_AGENT, etc.)
  userPosition: UserPosition (HEAD, SENIOR_AGENT, AGENT)
  managerId: String? (User ID manager)
}
```

### 2. User → Team
```
User {
  teamMemberships: TeamMember[] {
    teamId: String
    role: "MEMBER" | "LEAD" | "ADMIN"
  }
}
```

### 3. Team → DepartmentTicket
```
DepartmentTicket {
  department: Department
  category: TicketCategory
  teamAssignment: TeamAssignment {
    teamId: String
    isAutoAssigned: Boolean
  }
}
```

### 4. User → Organizer
```
User {
  role: 'ORGANIZER'
  organizerType: OrganizerType
  verificationStatus: VerificationStatus
  assignedTo: String (Agent ID)
  individualProfile | communityProfile | businessProfile | institutionProfile
}
```

### 5. Organizer → Agent (Operations)
```
Organizer (User) {
  assignedTo: Agent (User with role OPS_AGENT or OPS_SENIOR_AGENT)
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
}
```

### 6. Organizer → Event
```
Organizer (User) {
  createdEvents: Event[] {
    createdBy: Organizer ID
    status: EventStatus
  }
}
```

---

## Auto-Assignment System

### 1. Ticket Auto-Assignment (DepartmentTicket → Team)
**Trigger**: Ticket dibuat dari contact form

**Process**:
1. Get ticket category
2. Find team dengan categories yang match
3. Get team members
4. Assign ticket ke random team member
5. Create TeamAssignment record
6. Update ticket.assignedTo

**Code Location**: `backend/src/routes/departments.js`

```javascript
// Auto-assign ticket based on category
const teamConfigs = await getTeamConfigurations();
const assignedTeam = findTeamByCategory(category);
const availableMembers = await getTeamMembers(assignedTeam.id);
const randomMember = availableMembers[Math.floor(Math.random() * availableMembers.length)];

await prisma.departmentTicket.update({
  where: { id: ticket.id },
  data: { assignedTo: randomMember.id }
});
```

### 2. Organizer Auto-Assignment (Organizer → Agent)
**Trigger**: User upgrade ke ORGANIZER atau register sebagai ORGANIZER

**Service**: `SmartAssignmentService.assignToBestAgent('ORGANIZER', userId, 'NORMAL')`

**Strategies**:
- **WORKLOAD_BASED**: Select agent dengan workload terendah
- **ROUND_ROBIN**: Round-robin assignment
- **SKILL_BASED**: Based on agent skills (future)
- **ADVANCED**: Advanced scoring algorithm

**Process**:
1. Get available agents (OPS_AGENT, OPS_SENIOR_AGENT)
2. Calculate workload untuk setiap agent
3. Select best agent berdasarkan strategy
4. Assign organizer ke agent
5. Update user.assignedTo dan user.assignedAt
6. Send notification
7. Log assignment history

**Code Location**: `backend/src/services/smartAssignmentService.js`

### 3. Event Auto-Assignment (Event → Agent)
**Note**: Event tidak perlu approval dari operations, jadi tidak ada auto-assignment untuk event.

---

## Diagram Arsitektur

### 1. User Hierarchy
```
SUPER_ADMIN
  │
  ├── CUSTOMER_SUCCESS
  │   ├── CS_HEAD
  │   ├── CS_SENIOR_AGENT
  │   └── CS_AGENT
  │
  ├── OPERATIONS
  │   ├── OPS_HEAD
  │   ├── OPS_SENIOR_AGENT
  │   └── OPS_AGENT
  │
  └── FINANCE
      ├── FINANCE_HEAD
      ├── FINANCE_SENIOR_AGENT
      └── FINANCE_AGENT
```

### 2. Team Structure
```
Team (PAYMENT_FINANCE)
  ├── TeamMember (User: CS_AGENT, role: MEMBER)
  ├── TeamMember (User: CS_AGENT, role: LEAD)
  └── TeamAssignment (DepartmentTicket: payment-issue-123)

Team (TECHNICAL_SUPPORT)
  ├── TeamMember (User: CS_AGENT, role: MEMBER)
  └── TeamAssignment (DepartmentTicket: technical-issue-456)
```

### 3. Organizer Flow
```
PARTICIPANT (User)
  │
  ├── Upgrade Request
  │   └── POST /api/upgrade/business
  │
  ├── Auto-Assignment
  │   └── SmartAssignmentService.assignToBestAgent()
  │
  ├── Agent Verification
  │   ├── Approve → APPROVED
  │   └── Reject → REJECTED
  │
  └── ORGANIZER (APPROVED)
      └── Can create Events
```

### 4. Assignment Flow
```
DepartmentTicket (category: PAYMENT_ISSUE)
  │
  ├── Find Team by Category
  │   └── Team (PAYMENT_FINANCE, categories: ['PAYMENT_ISSUE'])
  │
  ├── Get Team Members
  │   └── TeamMember (User: CS_AGENT)
  │
  └── Assign to Team Member
      └── ticket.assignedTo = teamMember.userId
```

### 5. Organizer Assignment Flow
```
User (role: ORGANIZER, verificationStatus: PENDING)
  │
  ├── SmartAssignmentService.assignToBestAgent()
  │   ├── Get Available Agents (OPS_AGENT, OPS_SENIOR_AGENT)
  │   ├── Calculate Workload
  │   ├── Select Best Agent (WORKLOAD_BASED)
  │   └── Assign to Agent
  │
  ├── Agent Reviews
  │   ├── Approve → verificationStatus: APPROVED
  │   └── Reject → verificationStatus: REJECTED
  │
  └── Organizer Can Create Events (if APPROVED)
```

---

## Kesimpulan

1. **Departments** mengelola staff internal dengan hierarchy (HEAD → SENIOR_AGENT → AGENT)
2. **Teams** mengelola assignment ticket berdasarkan kategori dengan auto-assignment
3. **Organizer** adalah user eksternal yang perlu verifikasi dari agent operations sebelum dapat membuat event
4. **Auto-Assignment** menggunakan SmartAssignmentService untuk assign organizer ke agent berdasarkan workload
5. **Flow**: PARTICIPANT → Upgrade Request → Auto-Assignment → Agent Verification → APPROVED → Can Create Events

---

## File References

- Schema: `backend/prisma/schema.prisma`
- Smart Assignment: `backend/src/services/smartAssignmentService.js`
- Upgrade Route: `backend/src/routes/upgrade.js`
- Organizer Route: `backend/src/routes/organizers.js`
- Department Route: `backend/src/routes/departments.js`
- Teams Route: `backend/src/routes/teams.js`
- Auth Service: `backend/src/services/authService.js`

