# 📜 ANALISIS LENGKAP SISTEM SERTIFIKAT (CERTIFICATE SYSTEM)

## 🎯 RINGKASAN EKSEKUTIF

Sistem sertifikat di NusaEvent adalah sistem otomatis yang menghasilkan sertifikat PDF setelah peserta menghadiri event. Sistem ini menggunakan template-based generation dengan Puppeteer untuk konversi HTML ke PDF, mendukung template global dan event-specific, serta memiliki fitur verifikasi dan email notification.

---

## 📊 ARSITEKTUR & TEKNOLOGI

### **Backend Stack**
- **Runtime:** Node.js + Express.js
- **Database:** PostgreSQL (Prisma ORM)
- **PDF Generation:** Puppeteer (HTML → PDF)
- **Template Engine:** HTML + CSS (Dynamic template replacement)
- **Email Service:** Brevo (Sendinblue)
- **File Storage:** Local filesystem (`/uploads/certificates/`)

### **Frontend Stack**
- **Framework:** Next.js 14 (React)
- **UI Components:** Tailwind CSS + Custom Components
- **Certificate Editor:** Canvas-based editor dengan drag & drop
- **PDF Viewer:** Browser native PDF viewer

### **Mobile App Stack**
- **Framework:** Flutter
- **PDF Viewer:** External browser (url_launcher)
- **State Management:** flutter_bloc

---

## 🗄️ DATABASE SCHEMA

### **1. Certificate Model**
```prisma
model Certificate {
  id                String            @id @default(uuid())
  registrationId    String            @unique
  certificateNumber String            @unique  // Format: CERT-{timestamp}-{random}
  certificateUrl    String            // Path: /uploads/certificates/{filename}
  verificationHash  String?           // SHA256 hash untuk verifikasi
  issuedAt          DateTime          @default(now())
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  registration      EventRegistration @relation(...)
  
  @@index([certificateNumber])
  @@index([issuedAt])
}
```

**Key Points:**
- ✅ One-to-one relationship dengan `EventRegistration`
- ✅ Unique `certificateNumber` untuk verifikasi
- ✅ `certificateUrl` menyimpan path file PDF
- ✅ `verificationHash` untuk keamanan verifikasi

### **2. CertificateTemplate Model (Event-Specific)**
```prisma
model CertificateTemplate {
  id              String   @id @default(uuid())
  eventId         String   @unique
  backgroundImage String?  // URL atau path ke background image
  backgroundSize  String   @default("cover")  // cover, contain, stretch
  elements        Json     // Array of element objects
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  event           Event    @relation(...)
}
```

**Element Structure (JSON):**
```json
{
  "elements": [
    {
      "type": "text",
      "text": "[Nama Peserta]",
      "isDynamic": true,
      "dynamicType": "user_name",
      "position": { "x": 400, "y": 300 },
      "fontSize": 32,
      "fontFamily": "Dancing Script",
      "color": "#2c3e50",
      "fontWeight": "bold",
      "textAlign": "center"
    },
    {
      "type": "signature",
      "text": "John Doe",
      "title": "Chief Executive Officer",
      "position": { "x": 200, "y": 500 },
      "fontSize": 16,
      "fontFamily": "Playfair Display",
      "color": "#2c3e50"
    }
  ]
}
```

### **3. GlobalCertificateTemplate Model**
```prisma
model GlobalCertificateTemplate {
  id              String   @id @default(uuid())
  name            String
  description     String?
  backgroundImage String?
  backgroundSize  String   @default("cover")
  elements        Json     // Same structure as CertificateTemplate
  isDefault       Boolean  @default(false)  // Hanya satu yang bisa default
  isActive        Boolean  @default(true)
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  creator         User     @relation(...)
  
  @@index([isDefault])
  @@index([isActive])
}
```

**Template Priority:**
1. **Event-Specific Template** (jika ada) → Digunakan untuk event tersebut
2. **Global Default Template** (jika `isDefault = true`) → Fallback untuk semua event
3. **Error** → Jika tidak ada template, generation gagal

---

## 🔄 ALUR LENGKAP SERTIFIKAT

### **FASE 1: PERSIAPAN TEMPLATE** 🎨

#### **1.1. Global Template Creation (SUPER_ADMIN)**
```
POST /api/global-certificate-templates
Headers: Authorization: Bearer <super-admin-token>
Body: {
  name: "Template Premium",
  description: "Template untuk event premium",
  backgroundImage: "/uploads/templates/bg-premium.jpg",
  backgroundSize: "cover",
  elements: [...],
  isDefault: true,
  isActive: true
}
```

**Service:** `globalCertificateTemplateService.createGlobalCertificateTemplate()`
**Controller:** `globalCertificateTemplateController.createGlobalCertificateTemplate()`

**Fitur:**
- ✅ Multiple global templates
- ✅ Set default template (hanya satu yang bisa default)
- ✅ Enable/disable templates
- ✅ Template usage statistics

#### **1.2. Event-Specific Template (Admin/Organizer)**
```
POST /api/admin/certificate-templates/:eventId
Headers: Authorization: Bearer <admin-token>
Body: {
  backgroundImage: "/uploads/templates/bg-event-custom.jpg",
  backgroundSize: "cover",
  elements: [...]
}
```

**Service:** `certificateTemplateService.saveCertificateTemplate()`
**Controller:** `certificateTemplateController.saveCertificateTemplate()`

**Priority Logic:**
```javascript
// Di certificateService.js line 63-73
const certificateTemplate = 
  await prisma.certificateTemplate.findUnique({ where: { eventId } })
  || await prisma.globalCertificateTemplate.findFirst({
      where: { isDefault: true, isActive: true }
    });
```

#### **1.3. Enable Certificate Generation di Event**
```javascript
// Saat create/update event
{
  generateCertificate: true,  // ✅ Enable certificate generation
}
```

**Database:** `Event.generateCertificate` (Boolean)

---

### **FASE 2: REGISTRASI & ATTENDANCE** 🎫

#### **2.1. Participant Registration**
```
Participant → Register Event → Payment → Ticket Generated
```

**Database Records:**
- `EventRegistration` created dengan `hasAttended: false`
- `Ticket` created dengan QR code
- `Payment` created

#### **2.2. QR Code Scanning untuk Attendance**

**2.2.1. Self-Scan (Participant)**
```
POST /api/events/scan-qr
Body: { qrCodeData: "REG-TOKEN-XXXXX" }
```

**2.2.2. Admin/Organizer Check-in**
```
POST /api/events/admin/check-in
POST /api/events/organizer/check-in
Body: {
  eventId: "uuid",
  qrCodeData: "REG-TOKEN-XXXXX"
}
```

**Yang Terjadi:**
```javascript
// Update EventRegistration
{
  hasAttended: true,  // ✅ CRITICAL: Harus true untuk generate certificate
  attendedAt: new Date()
}
```

**⚠️ REQUIREMENT:** `hasAttended = true` adalah **MANDATORY** untuk certificate generation!

---

### **FASE 3: CERTIFICATE GENERATION** 📜

#### **3.1. Trigger Generation**

**3.1.1. Manual Generation (Participant)**
```
POST /api/certificates/generate/:registrationId
Headers: Authorization: Bearer <participant-token>
```

**Validasi:**
- ✅ Registration exists
- ✅ `hasAttended = true` (MUST!)
- ✅ Event `generateCertificate = true`
- ✅ Certificate belum ada (unique per registration)

**Controller:** `certificateController.generateCertificate()`
**Service:** `certificateService.generateCertificate()`

**3.1.2. Bulk Generation (Admin/Organizer)**
```
POST /api/certificates/bulk-generate/:eventId
Headers: Authorization: Bearer <admin-token>
```

**Yang Dilakukan:**
- Loop semua registrations dengan `hasAttended = true`
- Generate certificate untuk yang belum punya
- Batch processing dengan error handling

**Controller:** `certificateController.bulkGenerateCertificates()`
**Service:** `certificateService.bulkGenerateCertificates()`

---

#### **3.2. Proses Generation (Internal)**

**Step-by-Step Process:**

**1. VALIDASI REGISTRATION**
```javascript
const registration = await prisma.eventRegistration.findFirst({
  where: {
    id: registrationId,
    participantId,
    hasAttended: true, // ⚠️ MUST HAVE ATTENDED
  },
  include: {
    event: { ... },
    participant: { ... }
  }
});
```

**2. CHECK CERTIFICATE EXISTS**
```javascript
const existing = await prisma.certificate.findUnique({
  where: { registrationId }
});

if (existing) {
  throw new Error('Certificate already generated');
}
```

**3. CHECK EVENT HAS CERTIFICATE ENABLED**
```javascript
const event = await prisma.event.findUnique({
  where: { id: registration.event.id },
  select: { generateCertificate: true }
});

if (!event?.generateCertificate) {
  throw new Error('Certificate generation not enabled');
}
```

**4. GET TEMPLATE (Priority)**
```javascript
// Priority: Event-specific > Global default
const template = await prisma.certificateTemplate.findUnique({
  where: { eventId: registration.event.id }
}) || await prisma.globalCertificateTemplate.findFirst({
  where: { isDefault: true, isActive: true }
});
```

**5. GENERATE CERTIFICATE NUMBER**
```javascript
const certificateNumber = await certificatePdfService.generateCertificateNumber();
// Format: CERT-{timestamp}-{random}
// Example: CERT-L3K9M2P-QX7A
```

**6. PREPARE CERTIFICATE DATA**
```javascript
const certificateData = {
  participantName: registration.participant.fullName,
  eventTitle: registration.event.title,
  eventDate: formatDate(registration.event.eventDate),
  eventLocation: registration.event.location,
  certificateNumber,
  signerName: extractFromTemplate(template, 'signature'),
  signerTitle: extractFromTemplate(template, 'signature.title'),
  verificationUrl: `${FRONTEND_URL}/certificates/verify/${certificateNumber}`,
  template: {
    backgroundImage: template.backgroundImage,
    backgroundSize: template.backgroundSize,
    elements: template.elements
  }
};
```

**7. GENERATE PDF dengan Puppeteer**
```javascript
const pdfResult = await certificatePdfService.generateCertificatePdf(certificateData);
// Output: { filename, filePath, certificateUrl, pdfBuffer }
```

**Puppeteer Process:**
- Launch headless browser
- Load HTML template dengan data
- Replace placeholders dengan actual data
- Render dengan Google Fonts
- Generate PDF (A4 format)
- Save ke `/uploads/certificates/`

**8. SAVE TO DATABASE**
```javascript
const certificate = await prisma.certificate.create({
  data: {
    registrationId,
    certificateNumber,
    certificateUrl: pdfResult.certificateUrl,
    verificationHash: `sha256:${Date.now().toString(36)}`
  }
});
```

**9. UPDATE REGISTRATION**
```javascript
await prisma.eventRegistration.update({
  where: { id: registrationId },
  data: { certificateUrl: pdfResult.certificateUrl }
});
```

**10. SEND NOTIFICATION EMAIL**
```javascript
await emailTemplates.sendCertificateNotification(
  registration.participant.email,
  registration.event,
  pdfResult.certificateUrl,
  registration.participant.fullName,
  certificateNumber
);
```

---

## 📡 API ENDPOINTS

### **Public Routes**
```
GET  /api/certificates/search/:token          # Search by registration token
GET  /api/certificates/verify/:certificateNumber  # Verify certificate
```

### **Participant Routes**
```
POST /api/certificates/generate/:registrationId   # Generate certificate
GET  /api/certificates/my                          # Get user certificates
GET  /api/certificates/download-url/:certificateId # Get download URL
GET  /api/certificates/download/:certificateId    # Download certificate
```

### **Admin Routes**
```
POST /api/certificates/bulk-generate/:eventId      # Bulk generate
```

### **Template Management Routes**

**Global Templates (SUPER_ADMIN):**
```
GET    /api/global-certificate-templates           # List all
GET    /api/global-certificate-templates/default    # Get default
GET    /api/global-certificate-templates/:id        # Get by ID
POST   /api/global-certificate-templates           # Create
PUT    /api/global-certificate-templates/:id       # Update
DELETE /api/global-certificate-templates/:id       # Delete
PATCH  /api/global-certificate-templates/:id/set-default  # Set default
GET    /api/global-certificate-templates/:id/stats # Usage stats
```

**Event Templates (Admin/Organizer):**
```
GET    /api/admin/certificate-templates            # List all
GET    /api/admin/certificate-templates/events     # Events with template status
GET    /api/admin/certificate-templates/:eventId   # Get by event
POST   /api/admin/certificate-templates/:eventId   # Create/Update
PUT    /api/admin/certificate-templates/:eventId   # Update
DELETE /api/admin/certificate-templates/:eventId   # Delete
```

---

## 🎨 TEMPLATE SYSTEM

### **Template Types**

**1. Static Template (Fallback)**
- File: `backend/src/templates/certificates/certificate-template.html`
- Menggunakan placeholder replacement: `{{participantName}}`, `{{eventTitle}}`, dll
- Google Fonts untuk styling

**2. Dynamic Template (Database)**
- Stored di `CertificateTemplate` atau `GlobalCertificateTemplate`
- JSON-based elements dengan position, styling, dll
- Support dynamic text replacement: `[Nama Peserta]` → actual name

### **Template Elements**

**Text Element:**
```json
{
  "type": "text",
  "text": "[Nama Peserta]",
  "isDynamic": true,
  "dynamicType": "user_name",  // user_name, event_name
  "position": { "x": 400, "y": 300 },
  "fontSize": 32,
  "fontFamily": "Dancing Script",
  "color": "#2c3e50",
  "fontWeight": "bold",
  "textAlign": "center"
}
```

**Signature Element:**
```json
{
  "type": "signature",
  "text": "John Doe",
  "title": "Chief Executive Officer",
  "position": { "x": 200, "y": 500 },
  "fontSize": 16,
  "fontFamily": "Playfair Display",
  "color": "#2c3e50"
}
```

### **Template Generation Process**

**1. Read Template**
```javascript
// certificatePdfService.js line 59
const template = await fs.readFile(this.templatePath, 'utf8');
```

**2. Replace Placeholders**
```javascript
// certificatePdfService.js line 112-150
if (data.template) {
  return this.generateDynamicTemplate(data);  // Dynamic from DB
} else {
  return this.replaceTemplatePlaceholders(template, data);  // Static
}
```

**3. Generate HTML**
```javascript
// certificatePdfService.js line 152-269
generateDynamicTemplate(data) {
  // Generate HTML dengan background image
  // Position elements berdasarkan JSON
  // Apply fonts, colors, styling
  return htmlContent;
}
```

**4. Render dengan Puppeteer**
```javascript
// certificatePdfService.js line 33-110
await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
await page.evaluateHandle('document.fonts.ready');  // Wait for fonts
const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
```

---

## 📱 FRONTEND IMPLEMENTATION

### **1. My Certificates Page**
**File:** `frontend/src/app/(dashboard)/my-certificates/page.tsx`

**Features:**
- ✅ List semua sertifikat user
- ✅ Search & filter
- ✅ Pagination
- ✅ Download certificate
- ✅ Certificate preview card dengan design menarik
- ✅ Empty state handling

**API Call:**
```typescript
ApiService.getUserCertificates({
  page: 1,
  limit: 10,
  sortBy: 'issuedAt',
  sortOrder: 'desc',
  search: searchQuery
})
```

### **2. Certificate Template Editor**
**File:** `frontend/src/components/certificate/CanvasEditor.tsx`

**Features:**
- ✅ Drag & drop elements
- ✅ Text element editor
- ✅ Image element editor
- ✅ Position adjustment
- ✅ Font selection (Google Fonts)
- ✅ Color picker
- ✅ Background image upload
- ✅ Preview dengan user data

**Element Types:**
- Text elements (dynamic & static)
- Signature elements
- Image elements
- Background customization

### **3. Admin Template Management**
**Files:**
- `frontend/src/app/(admin)/admin/certificate-templates/page.tsx`
- `frontend/src/app/(admin)/admin/certificate-templates/global/page.tsx`

**Features:**
- ✅ Create/Edit global templates
- ✅ Set default template
- ✅ Template preview
- ✅ Template usage statistics

---

## 📱 MOBILE APP IMPLEMENTATION

### **1. Certificates Page**
**File:** `mobileapp/lib/features/certificates/pages/certificates_page.dart`

**Features:**
- ✅ List semua sertifikat user
- ✅ Search functionality
- ✅ View certificate (open in browser)
- ✅ Download certificate
- ✅ Empty state handling

**Service:** `mobileapp/lib/shared/services/certificate_service.dart`

**API Methods:**
```dart
getUserCertificates({page, limit, search})
getCertificateUrl(certificateUrl)  // Construct full URL
```

### **2. Certificate Model**
**File:** `mobileapp/lib/shared/models/certificate_model.dart`

**Structure:**
```dart
class CertificateModel {
  final String id;
  final String certificateNumber;
  final String certificateUrl;
  final DateTime issuedAt;
  final RegistrationModel registration;  // Includes event & participant
}
```

---

## 🔐 VERIFICATION SYSTEM

### **1. Certificate Verification**
```
GET /api/certificates/verify/:certificateNumber
```

**Process:**
```javascript
const certificate = await prisma.certificate.findUnique({
  where: { certificateNumber },
  include: {
    registration: {
      include: {
        event: { ... },
        participant: { ... }
      }
    }
  }
});

return {
  valid: true,
  certificate: {
    certificateNumber,
    participantName,
    eventTitle,
    eventDate,
    issuedAt,
    verificationHash
  }
};
```

**Frontend Verification Page:**
- Public page untuk verify certificate
- Display certificate details
- Show verification status

### **2. Search by Token**
```
GET /api/certificates/search/:token
```

**Process:**
- Search certificate menggunakan registration token
- Return certificate details jika found

---

## 📧 EMAIL NOTIFICATIONS

### **Certificate Ready Notification**
**Template:** `backend/src/templates/email/certificate-notification.hbs`

**Trigger:**
- Setelah certificate berhasil di-generate
- Send ke participant email

**Content:**
- Event title
- Participant name
- Certificate download link
- Certificate number
- Verification URL

**Service:** `emailTemplates.sendCertificateNotification()`

---

## ⚠️ POTENTIAL ISSUES & LIMITATIONS

### **1. File Storage (Railway Ephemeral Filesystem)**
**Issue:** Railway filesystem adalah ephemeral, file hilang saat restart.

**Current Solution:**
- File disimpan di `/uploads/certificates/`
- URL: `/uploads/certificates/{filename}`

**Recommended Solution:**
- ✅ Migrate ke cloud storage (AWS S3, Google Cloud Storage, dll)
- ✅ Store file URL di database
- ✅ Implement file cleanup untuk old certificates

### **2. Puppeteer Dependencies**
**Issue:** Puppeteer memerlukan Chromium binary yang besar.

**Current Solution:**
- Lazy loading Puppeteer
- Error handling jika Puppeteer tidak available

**Recommended Solution:**
- ✅ Consider alternative: PDFKit, jsPDF, atau external PDF service
- ✅ Docker image dengan Chromium pre-installed
- ✅ Separate service untuk PDF generation

### **3. Template Editor Complexity**
**Issue:** Canvas editor mungkin kompleks untuk non-technical users.

**Current Solution:**
- Drag & drop interface
- Visual editor dengan preview

**Recommended Solution:**
- ✅ Template presets/designs
- ✅ Template marketplace
- ✅ WYSIWYG editor improvements

### **4. Certificate Number Generation**
**Current Format:** `CERT-{timestamp}-{random}`

**Potential Issue:**
- Collision risk (sangat rendah)
- Not human-readable

**Recommended Solution:**
- ✅ Sequential numbering dengan prefix
- ✅ Include event ID atau date
- ✅ Format: `CERT-{eventId}-{sequence}`

### **5. Bulk Generation Performance**
**Issue:** Bulk generation bisa lambat untuk event besar.

**Current Solution:**
- Sequential processing dengan error handling

**Recommended Solution:**
- ✅ Queue system (Bull, RabbitMQ)
- ✅ Background job processing
- ✅ Progress tracking
- ✅ Batch processing dengan chunking

### **6. Template Priority Logic**
**Current:** Event-specific > Global default

**Potential Issue:**
- Jika event template dihapus, fallback ke global
- Tidak ada warning jika template tidak ada

**Recommended Solution:**
- ✅ Validation saat create event
- ✅ Warning jika template tidak available
- ✅ Auto-fallback dengan notification

---

## 🚀 RECOMMENDED IMPROVEMENTS

### **1. Cloud Storage Integration**
```javascript
// Example: AWS S3
const s3 = new AWS.S3();
await s3.upload({
  Bucket: 'certificates',
  Key: filename,
  Body: pdfBuffer,
  ContentType: 'application/pdf'
}).promise();
```

### **2. Queue System untuk Bulk Generation**
```javascript
// Example: Bull Queue
const certificateQueue = new Bull('certificate-generation');

certificateQueue.process(async (job) => {
  const { registrationId, participantId } = job.data;
  return await certificateService.generateCertificate(registrationId, participantId);
});

// Enqueue
await certificateQueue.add({ registrationId, participantId });
```

### **3. Certificate Preview sebelum Generate**
- Preview certificate dengan sample data
- Allow participant to preview sebelum generate
- Customize certificate (jika allowed)

### **4. Certificate Analytics**
- Track certificate generation rate
- Certificate download statistics
- Template usage analytics
- Verification statistics

### **5. Digital Signature**
- Implement digital signature untuk certificate
- Blockchain verification (optional)
- QR code di certificate untuk quick verification

### **6. Certificate Expiry**
- Optional expiry date untuk certificates
- Renewal mechanism
- Expiry notifications

### **7. Multi-language Support**
- Support multiple languages di certificate
- Template per language
- Dynamic language selection

---

## 📂 FILE STRUCTURE

### **Backend**
```
backend/src/
├── services/
│   ├── certificateService.js              # Main certificate logic
│   ├── certificatePdfService.js           # PDF generation dengan Puppeteer
│   ├── certificateTemplateService.js      # Event-specific templates
│   └── globalCertificateTemplateService.js # Global templates
├── controllers/
│   ├── certificateController.js
│   ├── certificateTemplateController.js
│   └── globalCertificateTemplateController.js
├── routes/
│   ├── certificates.js
│   ├── certificateTemplates.js
│   └── globalCertificateTemplates.js
├── templates/
│   ├── certificates/
│   │   └── certificate-template.html     # Static template fallback
│   └── email/
│       ├── certificate-notification.hbs
│       └── certificate-ready.hbs
└── uploads/
    └── certificates/                      # Generated PDF files
```

### **Frontend**
```
frontend/src/
├── app/
│   ├── (dashboard)/
│   │   └── my-certificates/
│   │       └── page.tsx                  # User certificates page
│   ├── (admin)/
│   │   └── admin/
│   │       ├── certificate-templates/
│   │       │   ├── page.tsx              # Event templates
│   │       │   └── global/
│   │       │       └── page.tsx          # Global templates
│   │       └── certificate-template/
│   │           └── page.tsx             # Template editor
│   └── (public)/
│       └── certificates/
│           └── verify/
│               └── [certificateNumber]/
│                   └── page.tsx         # Verification page
└── components/
    └── certificate/
        ├── CanvasEditor.tsx             # Template editor
        └── ElementProperties.tsx        # Element properties panel
```

### **Mobile App**
```
mobileapp/lib/
├── features/
│   └── certificates/
│       ├── pages/
│       │   └── certificates_page.dart
│       └── widgets/
│           └── certificates_header.dart
├── shared/
│   ├── services/
│   │   └── certificate_service.dart
│   └── models/
│       └── certificate_model.dart
```

---

## 🔍 DEBUGGING & TROUBLESHOOTING

### **Common Issues**

**1. Certificate Generation Fails**
- Check: `hasAttended = true`?
- Check: `generateCertificate = true` di event?
- Check: Template exists (global atau event-specific)?
- Check: Puppeteer available?
- Check: File permissions untuk `/uploads/certificates/`

**2. PDF Generation Fails**
- Check: Puppeteer installation
- Check: Chromium binary available
- Check: Memory limits (Puppeteer memerlukan memory)
- Check: Template HTML valid
- Check: Fonts loading (wait for `document.fonts.ready`)

**3. Template Not Found**
- Check: Global default template exists?
- Check: Event-specific template exists?
- Check: Template `isActive = true`?
- Check: Template `isDefault = true` untuk global?

**4. File Not Found (404)**
- Check: File exists di `/uploads/certificates/`
- Check: Static file serving configured
- Check: File permissions
- **Railway Issue:** Files hilang karena ephemeral filesystem

---

## 📝 SUMMARY

### **Key Features:**
✅ Automatic certificate generation setelah attendance
✅ Template-based system (global + event-specific)
✅ PDF generation dengan Puppeteer
✅ Certificate verification system
✅ Email notifications
✅ Bulk generation untuk admin
✅ Frontend & mobile app support

### **Key Requirements:**
⚠️ `hasAttended = true` adalah MANDATORY
⚠️ `generateCertificate = true` di event
⚠️ Template harus ada (global default atau event-specific)
⚠️ Puppeteer harus available untuk PDF generation

### **Key Limitations:**
⚠️ Railway ephemeral filesystem (file hilang saat restart)
⚠️ Puppeteer dependencies besar
⚠️ Bulk generation bisa lambat untuk event besar
⚠️ No cloud storage integration (current)

### **Recommended Next Steps:**
1. ✅ Migrate ke cloud storage (S3, GCS, dll)
2. ✅ Implement queue system untuk bulk generation
3. ✅ Add certificate analytics
4. ✅ Improve template editor UX
5. ✅ Add digital signature support
6. ✅ Implement certificate expiry (optional)

---

**Last Updated:** 2025-01-26
**Version:** 1.0.0

