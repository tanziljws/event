# Flow User Biasa ke Organizer - Panduan Lengkap

## 📖 Ringkasan

Dokumen ini menjelaskan bagaimana seorang user biasa (PARTICIPANT) dapat menjadi Organizer dan membuat event di platform ini.

---

## 🔄 Flow Lengkap

### 1. **User Biasa (PARTICIPANT)**
- User mendaftar sebagai PARTICIPANT
- User dapat melihat dan mendaftar event
- User **TIDAK** dapat membuat event

### 2. **Upgrade Request**
User melakukan upgrade dengan mengirim request ke endpoint:
```
POST /api/upgrade/business
```

**Data yang diperlukan:**
- `organizerType`: INDIVIDUAL, COMMUNITY, SMALL_BUSINESS, atau INSTITUTION
- Data profile sesuai dengan organizerType:
  - **INDIVIDUAL**: NIK, alamat pribadi, nomor telepon, portfolio
  - **COMMUNITY**: Nama komunitas, jenis komunitas, contact person, dokumen legal
  - **SMALL_BUSINESS**: Nama bisnis, NPWP, dokumen legal, logo
  - **INSTITUTION**: Nama institusi, AKTA, SIUP, contact person

### 3. **Auto-Assignment ke Agent**
Setelah upgrade request:
1. Sistem otomatis mengubah role user menjadi `ORGANIZER`
2. Sistem mengubah verificationStatus menjadi `PENDING`
3. Sistem membuat profile sesuai dengan organizerType
4. Sistem **otomatis** mengassign organizer ke agent Operations (OPS_AGENT atau OPS_SENIOR_AGENT)
5. Agent menerima notifikasi untuk review organizer

**Algoritma Auto-Assignment:**
- Sistem menggunakan `SmartAssignmentService`
- Sistem memilih agent dengan workload terendah (WORKLOAD_BASED strategy)
- Jika tidak ada agent available, request ditambahkan ke queue

### 4. **Agent Verification**
Agent Operations melakukan verifikasi:
1. Agent melihat list organizers yang assigned ke mereka
2. Agent review profile dan dokumen organizer
3. Agent dapat:
   - **Approve**: Mengubah verificationStatus menjadi `APPROVED`
   - **Reject**: Mengubah verificationStatus menjadi `REJECTED` dengan alasan

**Endpoint:**
- Approve: `POST /api/organizers/:organizerId/approve`
- Reject: `POST /api/organizers/:organizerId/reject`

### 5. **Organizer Approved**
Setelah approval:
1. verificationStatus menjadi `APPROVED`
2. verifiedAt di-set ke waktu sekarang
3. Organizer menerima email notifikasi approval
4. Organizer **DAPAT** membuat event
5. Organizer dapat manage event, registrations, payments

### 6. **Organizer Rejected**
Jika rejected:
1. verificationStatus menjadi `REJECTED`
2. rejectedReason di-set dengan alasan penolakan
3. Organizer menerima email notifikasi rejection
4. Organizer **TIDAK DAPAT** membuat event
5. Organizer dapat mengajukan ulang setelah memperbaiki data

---

## 🏢 Hubungan Department, Teams, dan Organizer

### **Department**
Department adalah struktur organisasi internal untuk mengelola staff:
- **CUSTOMER_SUCCESS**: Menangani customer support
- **OPERATIONS**: Menangani event operations dan verifikasi organizer
- **FINANCE**: Menangani financial management

**Hierarchy:**
- HEAD (Kepala Departemen)
- SENIOR_AGENT (Senior Agent)
- AGENT (Agent)

### **Teams**
Teams adalah grup spesialis untuk menangani ticket berdasarkan kategori:
- **PAYMENT_FINANCE**: Menangani payment issues
- **TECHNICAL_SUPPORT**: Menangani technical issues
- **GENERAL_SUPPORT**: Menangani general inquiries

**Auto-Assignment:**
- Ticket dibuat dari contact form
- Sistem mencari team yang memiliki kategori sesuai dengan ticket
- Sistem mengassign ticket ke team member secara random

### **Organizer**
Organizer adalah user eksternal yang dapat membuat event setelah verifikasi:
- Organizer harus di-verify oleh agent Operations
- Organizer dapat membuat event setelah approval
- Organizer dapat manage event, registrations, payments

**Relationship:**
- Organizer → Agent (Operations): Untuk verifikasi
- Organizer → Event: Untuk membuat dan manage event
- Organizer → OrganizerRevenue: Untuk tracking revenue

---

## 🔗 Hubungan Antar Komponen

### 1. **User → Department**
- User memiliki `department` (CUSTOMER_SUCCESS, OPERATIONS, FINANCE)
- User memiliki `role` (CS_HEAD, OPS_AGENT, etc.)
- User memiliki `userPosition` (HEAD, SENIOR_AGENT, AGENT)

### 2. **User → Team**
- User dapat menjadi member dari beberapa team
- User memiliki `teamMemberships` (TeamMember[])
- Team member memiliki `role` (MEMBER, LEAD, ADMIN)

### 3. **Team → DepartmentTicket**
- Team memiliki `categories` untuk auto-assignment
- Ticket memiliki `category` yang dicocokkan dengan team categories
- Ticket di-assign ke team member melalui `TeamAssignment`

### 4. **User → Organizer**
- User dengan `role = ORGANIZER` adalah organizer
- Organizer memiliki `organizerType` (INDIVIDUAL, COMMUNITY, SMALL_BUSINESS, INSTITUTION)
- Organizer memiliki `verificationStatus` (PENDING, APPROVED, REJECTED)
- Organizer memiliki `assignedTo` (Agent ID untuk verifikasi)

### 5. **Organizer → Agent (Operations)**
- Organizer di-assign ke agent Operations untuk verifikasi
- Agent dapat approve/reject organizer
- Agent dapat melihat list organizers yang assigned ke mereka

### 6. **Organizer → Event**
- Organizer dapat membuat event setelah approval
- Event memiliki `createdBy` (Organizer ID)
- Event memiliki `status` (DRAFT, UNDER_REVIEW, APPROVED, PUBLISHED)

---

## 📊 Diagram Flow

### Flow User Biasa ke Organizer
```
PARTICIPANT
    ↓
Upgrade Request (POST /api/upgrade/business)
    ↓
ORGANIZER (PENDING)
    ↓
Auto-Assignment ke Agent (SmartAssignmentService)
    ↓
Agent Verification
    ↓
    ├── Approve → ORGANIZER (APPROVED) → Can Create Event
    └── Reject → ORGANIZER (REJECTED) → Cannot Create Event
```

### Flow Ticket Auto-Assignment
```
Contact Form
    ↓
Create DepartmentTicket
    ↓
Get Ticket Category
    ↓
Find Team by Category
    ↓
Get Team Members
    ↓
Assign to Team Member (Random)
    ↓
Ticket Assigned
```

### Flow Organizer Auto-Assignment
```
User Upgrade to ORGANIZER
    ↓
SmartAssignmentService.assignToBestAgent()
    ↓
Get Available Agents (OPS_AGENT, OPS_SENIOR_AGENT)
    ↓
Calculate Workload for Each Agent
    ↓
Select Best Agent (WORKLOAD_BASED)
    ↓
Assign to Agent
    ↓
Organizer Assigned
```

---

## 🔍 Detail Teknis

### 1. **Smart Assignment Service**
**Location**: `backend/src/services/smartAssignmentService.js`

**Strategies:**
- **WORKLOAD_BASED**: Memilih agent dengan workload terendah
- **ROUND_ROBIN**: Round-robin assignment
- **SKILL_BASED**: Berdasarkan skill agent (future)
- **ADVANCED**: Advanced scoring algorithm

**Process:**
1. Get available agents
2. Calculate workload untuk setiap agent
3. Select best agent berdasarkan strategy
4. Assign organizer ke agent
5. Update user.assignedTo dan user.assignedAt
6. Send notification
7. Log assignment history

### 2. **Team Auto-Assignment**
**Location**: `backend/src/routes/departments.js`

**Process:**
1. Get ticket category
2. Find team dengan categories yang match
3. Get team members
4. Assign ticket ke random team member
5. Create TeamAssignment record
6. Update ticket.assignedTo

### 3. **Organizer Verification**
**Location**: `backend/src/routes/organizers.js`

**Process:**
1. Agent review organizer profile
2. Agent approve/reject organizer
3. Update verificationStatus
4. Send email notification
5. Log audit trail

---

## 📝 Contoh Request/Response

### 1. Upgrade Request
**Request:**
```json
POST /api/upgrade/business
{
  "organizerType": "INDIVIDUAL",
  "nik": "1234567890123456",
  "personalAddress": "Jl. Contoh No. 123",
  "personalPhone": "081234567890",
  "portfolio": ["https://example.com/portfolio1", "https://example.com/portfolio2"],
  "socialMedia": {
    "instagram": "@username",
    "linkedin": "username"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account upgraded successfully. Your organizer account is pending admin approval.",
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "fullName": "User Name",
      "role": "ORGANIZER",
      "organizerType": "INDIVIDUAL",
      "verificationStatus": "PENDING",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

### 2. Agent Approve Organizer
**Request:**
```json
POST /api/organizers/:organizerId/approve
```

**Response:**
```json
{
  "success": true,
  "message": "Organizer approved successfully",
  "data": {
    "organizer": {
      "id": "organizer-id",
      "email": "organizer@example.com",
      "fullName": "Organizer Name",
      "role": "ORGANIZER",
      "organizerType": "INDIVIDUAL",
      "verificationStatus": "APPROVED",
      "verifiedAt": "2024-01-02T00:00:00Z"
    }
  }
}
```

### 3. Agent Reject Organizer
**Request:**
```json
POST /api/organizers/:organizerId/reject
{
  "reason": "Document tidak lengkap"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Organizer rejected successfully",
  "data": {
    "organizer": {
      "id": "organizer-id",
      "email": "organizer@example.com",
      "fullName": "Organizer Name",
      "role": "ORGANIZER",
      "organizerType": "INDIVIDUAL",
      "verificationStatus": "REJECTED",
      "rejectedReason": "Document tidak lengkap"
    }
  }
}
```

---

## 🎯 Kesimpulan

1. **User biasa (PARTICIPANT)** dapat upgrade ke **Organizer** melalui endpoint `/api/upgrade/business`
2. **Organizer** otomatis di-assign ke **Agent Operations** untuk verifikasi
3. **Agent Operations** dapat approve/reject organizer
4. **Organizer yang approved** dapat membuat event
5. **Teams** digunakan untuk auto-assignment ticket berdasarkan kategori
6. **Departments** mengelola staff internal dengan hierarchy

---

## 📚 Referensi

- Schema: `backend/prisma/schema.prisma`
- Smart Assignment: `backend/src/services/smartAssignmentService.js`
- Upgrade Route: `backend/src/routes/upgrade.js`
- Organizer Route: `backend/src/routes/organizers.js`
- Department Route: `backend/src/routes/departments.js`
- Teams Route: `backend/src/routes/teams.js`
- Auth Service: `backend/src/services/authService.js`

