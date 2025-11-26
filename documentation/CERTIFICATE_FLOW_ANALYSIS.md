# 📜 ANALISIS ALUR LENGKAP SISTEM SERTIFIKAT (CERTIFICATE FLOW)

## 🎯 RINGKASAN EKSEKUTIF

Sistem sertifikat di NusaEvent adalah sistem otomatis yang menghasilkan sertifikat PDF setelah peserta menghadiri event. Sistem ini menggunakan template-based generation dengan Puppeteer untuk konversi HTML ke PDF.

---

## 📋 ALUR LENGKAP SERTIFIKAT

### **FASE 1: PERSIAPAN EVENT & TEMPLATE** 🎨

#### 1.1. Global Certificate Template (Admin Level)
```
┌─────────────────────────────────────────────────────────┐
│ SUPER_ADMIN membuat Global Certificate Template        │
├─────────────────────────────────────────────────────────┤
│ • POST /api/global-certificate-templates               │
│ • Background image, elements (text, signature)         │
│ • Bisa set sebagai template default                    │
│ • Digunakan jika event tidak punya template spesifik   │
└─────────────────────────────────────────────────────────┘
```

**Service:** `globalCertificateTemplateService.js`
**Controller:** `globalCertificateTemplateController.js`
**Route:** `/api/global-certificate-templates`

**Fitur:**
- ✅ Multiple global templates
- ✅ Set default template
- ✅ Enable/disable templates
- ✅ Template usage statistics

#### 1.2. Event-Specific Template (Optional)
```
┌─────────────────────────────────────────────────────────┐
│ Admin/Organizer membuat template untuk event spesifik  │
├─────────────────────────────────────────────────────────┤
│ • POST /api/admin/certificate-templates/:eventId       │
│ • Override global template untuk event tertentu        │
│ • Custom background, elements, styling                 │
└─────────────────────────────────────────────────────────┘
```

**Service:** `certificateTemplateService.js`
**Controller:** `certificateTemplateController.js`
**Route:** `/api/admin/certificate-templates/:eventId`

#### 1.3. Enable Certificate Generation di Event
```javascript
// Saat create/update event
{
  generateCertificate: true,  // ✅ Enable certificate generation
  certificateTemplateUrl: "...", // Optional: custom template
}
```

**Database:** `Event.generateCertificate` (Boolean)

---

### **FASE 2: REGISTRASI & ATTENDANCE** 🎫

#### 2.1. Participant Register untuk Event
```
Participant → Register Event → Payment → Ticket Generated
```

**Database Records:**
- `EventRegistration` created
- `Ticket` created dengan QR code
- `Payment` created

#### 2.2. QR Code Scanning untuk Attendance

**2.2.1. Self-Scan (Participant)**
```
POST /api/events/scan-qr
{
  qrCodeData: "REG-TOKEN-XXXXX"
}
```

**2.2.2. Admin/Organizer Check-in**
```
POST /api/events/admin/check-in
POST /api/events/organizer/check-in
{
  eventId: "uuid",
  qrCodeData: "REG-TOKEN-XXXXX"
}
```

**Service:** `ticketService.scanQRCodeForAttendance()`

**Yang Terjadi:**
```javascript
// Update EventRegistration
{
  hasAttended: true,        // ✅ Attendance marked
  attendanceTime: DateTime, // Waktu scan
  attendedAt: DateTime      // Timestamp
}
```

**File:** `backend/src/services/ticketService.js` (line 457)

---

### **FASE 3: GENERASI SERTIFIKAT** 🎓

#### 3.1. Trigger Generation (Manual)

**3.1.1. Participant Generate Sendiri**
```
POST /api/certificates/generate/:registrationId
Headers: Authorization: Bearer <token>
```

**Validasi:**
- ✅ Registration exists
- ✅ `hasAttended = true` (MUST!)
- ✅ Event `generateCertificate = true`
- ✅ Certificate belum ada (unique per registration)

**Controller:** `certificateController.generateCertificate()`
**Service:** `certificateService.generateCertificate()`

#### 3.1.2. Bulk Generation (Admin/Organizer)
```
POST /api/certificates/bulk-generate/:eventId
Headers: Authorization: Bearer <admin-token>
```

**Yang Dilakukan:**
- Loop semua registrations dengan `hasAttended = true`
- Generate certificate untuk yang belum punya
- Batch processing dengan error handling

**Controller:** `certificateController.bulkGenerateCertificates()`

---

#### 3.2. Proses Generation (Internal)

**Step-by-Step Process:**

```javascript
// 1. VALIDASI REGISTRATION
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

// 2. CHECK CERTIFICATE EXISTS
const existing = await prisma.certificate.findUnique({
  where: { registrationId }
});

// 3. CHECK EVENT HAS CERTIFICATE ENABLED
const event = await prisma.event.findUnique({
  where: { id: registration.event.id },
  select: { generateCertificate: true }
});

if (!event?.generateCertificate) {
  throw new Error('Certificate generation not enabled');
}

// 4. GET TEMPLATE
// Priority: Event-specific template > Global default template
const template = await prisma.certificateTemplate.findUnique({
  where: { eventId: registration.event.id }
}) || await prisma.globalCertificateTemplate.findFirst({
  where: { isDefault: true, isActive: true }
});

// 5. GENERATE CERTIFICATE NUMBER
const certificateNumber = await certificatePdfService.generateCertificateNumber();
// Format: CERT-{timestamp}-{random}

// 6. PREPARE CERTIFICATE DATA
const certificateData = {
  participantName: registration.participant.fullName,
  eventTitle: registration.event.title,
  eventDate: formatDate(registration.event.eventDate),
  eventLocation: registration.event.location,
  certificateNumber,
  signerName: extractFromTemplate(template, 'signature'),
  signerTitle: extractFromTemplate(template, 'signature.title'),
  template: {
    backgroundImage: template.backgroundImage,
    backgroundSize: template.backgroundSize,
    elements: template.elements
  }
};

// 7. GENERATE PDF
const pdfResult = await certificatePdfService.generateCertificatePdf(certificateData);
// Output: { filename, filePath, certificateUrl, pdfBuffer }

// 8. SAVE TO DATABASE
const certificate = await prisma.certificate.create({
  data: {
    registrationId,
    certificateNumber,
    certificateUrl: pdfResult.certificateUrl,
    verificationHash: `sha256:${Date.now().toString(36)}`
  }
});

// 9. UPDATE REGISTRATION
await prisma.eventRegistration.update({
  where: { id: registrationId },
  data: { certificateUrl: pdfResult.certificateUrl }
});

// 10. SEND NOTIFICATION EMAIL
await emailTemplates.sendCertificateNotification(
  participant.email,
  event,
  certificateUrl,
  participant.fullName,
  certificateNumber
);
```

**Service:** `certificateService.js` (line 9-183)
**PDF Service:** `certificatePdfService.js`

---

#### 3.3. PDF Generation dengan Puppeteer

**Technology Stack:**
- **Puppeteer**: Headless browser untuk HTML → PDF
- **HTML Template**: Dynamic template dengan placeholders
- **Google Fonts**: Custom font support (Dancing Script, Ephesis, dll)

**Proses:**
```javascript
// 1. Launch Puppeteer
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

// 2. Create Page
const page = await browser.newPage();
await page.setViewport({ width: 800, height: 600 });

// 3. Load Template
const template = await fs.readFile('certificate-template.html', 'utf8');
const htmlContent = replaceTemplatePlaceholders(template, certificateData);

// 4. Set Content & Wait for Fonts
await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
await page.evaluateHandle('document.fonts.ready');

// 5. Generate PDF
const pdfBuffer = await page.pdf({
  format: 'A4',
  printBackground: true,
  margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' }
});

// 6. Save File
const filename = `certificate_${certificateNumber}_${Date.now()}.pdf`;
const filePath = path.join('uploads/certificates', filename);
await fs.writeFile(filePath, pdfBuffer);

// 7. Close Browser
await browser.close();
```

**Template Types:**

1. **Static Template** (Fallback)
   - File: `backend/src/templates/certificates/certificate-template.html`
   - Placeholders: `{{participantName}}`, `{{eventTitle}}`, etc.

2. **Dynamic Template** (From Database)
   - Background image URL
   - Elements array (text, signature with position, styling)
   - Dynamic text replacement: `[Nama Peserta]` → actual name

**File:** `certificatePdfService.js` (line 33-110)

---

### **FASE 4: PENYIMPANAN & AKSES** 📁

#### 4.1. File Storage

**Location:**
```
backend/uploads/certificates/
  └── certificate_CERT-XXXXX-YYYY_timestamp.pdf
```

**Database Record:**
```javascript
Certificate {
  id: "uuid",
  registrationId: "uuid",           // Link ke registration
  certificateNumber: "CERT-XXXXX",  // Unique identifier
  certificateUrl: "/uploads/certificates/filename.pdf",
  verificationHash: "sha256:...",   // Untuk verifikasi
  issuedAt: DateTime,
  createdAt: DateTime
}
```

#### 4.2. User Access

**4.2.1. Get My Certificates**
```
GET /api/certificates/my?page=1&limit=10&sortBy=attendedAt&sortOrder=desc&search=...
```

**Response:**
```json
{
  "success": true,
  "data": {
    "certificates": [
      {
        "id": "...",
        "certificateNumber": "CERT-XXXXX",
        "certificateUrl": "/uploads/certificates/...",
        "issuedAt": "2024-01-01T00:00:00Z",
        "registration": {
          "event": {
            "title": "Event Name",
            "eventDate": "...",
            "location": "..."
          }
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "pages": 1
    }
  }
}
```

**4.2.2. Download Certificate**
```
GET /api/certificates/download-url/:certificateId
GET /api/certificates/download/:certificateId
```

**Service:** `certificateService.getUserCertificates()`

---

### **FASE 5: VERIFIKASI SERTIFIKAT** 🔍

#### 5.1. Public Verification by Certificate Number
```
GET /api/certificates/verify/:certificateNumber
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "certificate": {
      "certificateNumber": "CERT-XXXXX",
      "participantName": "John Doe",
      "eventTitle": "Event Name",
      "eventDate": "...",
      "issuedAt": "...",
      "verificationHash": "sha256:..."
    }
  }
}
```

**Public Access:** ✅ Tidak perlu authentication

#### 5.2. Search by Registration Token
```
GET /api/certificates/search/:token
```

**Token Format:** 10-character registration token
**Use Case:** Participant share certificate dengan token

**Service:** `certificateService.searchCertificateByToken()`

---

### **FASE 6: NOTIFIKASI EMAIL** 📧

**Email Template:** `backend/src/templates/email/certificate-notification.hbs`

**Content:**
- ✅ Greeting dengan nama participant
- ✅ Event details (title, date, location)
- ✅ Certificate number
- ✅ Download button (link ke certificateUrl)
- ✅ Verification URL
- ✅ Instructions & notes

**Service:** `emailTemplates.sendCertificateNotification()`

**File:** `backend/src/config/email.js`

---

## 🔄 ALUR DIAGRAM LENGKAP

```
┌─────────────────────────────────────────────────────────────────┐
│                    CERTIFICATE FLOW DIAGRAM                      │
└─────────────────────────────────────────────────────────────────┘

1. EVENT SETUP
   ┌─────────────────┐
   │ Admin creates   │
   │ Global Template │
   └────────┬────────┘
            │
   ┌────────▼────────┐
   │ Event created   │
   │ with            │
   │ generateCert=   │
   │ true            │
   └────────┬────────┘
            │
2. REGISTRATION
   ┌────────▼────────┐
   │ Participant     │
   │ Registers       │
   └────────┬────────┘
            │
   ┌────────▼────────┐
   │ Payment         │
   │ Completed       │
   └────────┬────────┘
            │
   ┌────────▼────────┐
   │ QR Ticket       │
   │ Generated       │
   └────────┬────────┘
            │
3. ATTENDANCE
   ┌────────▼────────┐
   │ QR Code Scanned │
   │ (Self/Admin)    │
   └────────┬────────┘
            │
   ┌────────▼────────┐
   │ hasAttended =   │
   │ true            │ ⚠️ CRITICAL STEP
   └────────┬────────┘
            │
4. CERTIFICATE GENERATION
   ┌────────▼──────────────────────┐
   │ Participant triggers:          │
   │ POST /certificates/generate    │
   └────────┬──────────────────────┘
            │
   ┌────────▼──────────────────────┐
   │ Validate:                      │
   │ ✓ hasAttended = true           │
   │ ✓ generateCertificate = true   │
   │ ✓ Certificate not exists       │
   └────────┬──────────────────────┘
            │
   ┌────────▼──────────────────────┐
   │ Get Template:                  │
   │ Priority: Event-specific >     │
   │           Global default        │
   └────────┬──────────────────────┘
            │
   ┌────────▼──────────────────────┐
   │ Generate Certificate Number:   │
   │ CERT-{timestamp}-{random}      │
   └────────┬──────────────────────┘
            │
   ┌────────▼──────────────────────┐
   │ Prepare Data:                  │
   │ - Participant name             │
   │ - Event details                │
   │ - Template elements            │
   └────────┬──────────────────────┘
            │
   ┌────────▼──────────────────────┐
   │ Generate PDF (Puppeteer):      │
   │ - Load HTML template           │
   │ - Replace placeholders         │
   │ - Render with fonts            │
   │ - Convert to PDF               │
   └────────┬──────────────────────┘
            │
   ┌────────▼──────────────────────┐
   │ Save:                          │
   │ - File: uploads/certificates/  │
   │ - Database: Certificate model  │
   │ - Update: EventRegistration    │
   └────────┬──────────────────────┘
            │
   ┌────────▼──────────────────────┐
   │ Send Email Notification        │
   │ (with download link)           │
   └────────┬──────────────────────┘
            │
5. ACCESS & VERIFICATION
   ┌────────▼──────────────────────┐
   │ User can:                      │
   │ - View in dashboard            │
   │ - Download PDF                 │
   │ - Share verification URL       │
   │ - Verify by certificate number │
   └────────────────────────────────┘
```

---

## 🔑 POIN-POIN PENTING

### **1. Prasyarat Wajib**
- ✅ Event harus `generateCertificate = true`
- ✅ Participant **MUST** `hasAttended = true` (melalui QR scan)
- ✅ Satu registration = satu certificate (unique)

### **2. Template Priority**
```
Event-specific Template (CertificateTemplate)
    ↓ (if not exists)
Global Default Template (GlobalCertificateTemplate)
    ↓ (if not exists)
Static HTML Template (fallback)
```

### **3. Certificate Number Format**
```
CERT-{timestamp}-{random}
Example: CERT-L3K9M2P-QX7A
```

### **4. File Naming**
```
certificate_{certificateNumber}_{timestamp}.pdf
Example: certificate_CERT-L3K9M2P-QX7A_1704067200000.pdf
```

### **5. Verification Methods**
1. **By Certificate Number** (Public)
   ```
   GET /api/certificates/verify/:certificateNumber
   ```

2. **By Registration Token** (Public)
   ```
   GET /api/certificates/search/:token
   ```

3. **By Certificate ID** (Authenticated)
   ```
   GET /api/certificates/my
   ```

---

## 📊 DATABASE SCHEMA

### **Certificate Model**
```prisma
model Certificate {
  id                String            @id @default(uuid())
  registrationId    String            @unique
  certificateNumber String            @unique
  certificateUrl    String
  verificationHash  String?
  issuedAt          DateTime          @default(now())
  registration      EventRegistration @relation(...)
}
```

### **CertificateTemplate Model** (Event-specific)
```prisma
model CertificateTemplate {
  id              String   @id @default(uuid())
  eventId         String   @unique
  backgroundImage String?
  backgroundSize  String   @default("cover")
  elements        Json     // Array of text/signature elements
  event           Event    @relation(...)
}
```

### **GlobalCertificateTemplate Model**
```prisma
model GlobalCertificateTemplate {
  id              String   @id @default(uuid())
  name            String
  description     String?
  backgroundImage String?
  backgroundSize  String   @default("cover")
  elements        Json
  isDefault       Boolean  @default(false)
  isActive        Boolean  @default(true)
  createdBy       String
  creator         User     @relation(...)
}
```

### **EventRegistration Model** (Updated)
```prisma
model EventRegistration {
  id                String       @id @default(uuid())
  eventId           String
  participantId     String
  registrationToken String       @unique
  hasAttended       Boolean      @default(false)  // ⚠️ CRITICAL
  attendanceTime    DateTime?
  certificateUrl    String?      // Set setelah generate
  certificate       Certificate?
  ...
}
```

---

## 🐛 POTENTIAL ISSUES & SOLUTIONS

### **Issue 1: Certificate Not Generated**
**Cause:**
- ❌ `hasAttended` masih `false`
- ❌ Event `generateCertificate` = `false`
- ❌ Template tidak ditemukan

**Solution:**
- Pastikan QR code sudah di-scan
- Check event settings
- Pastikan ada default global template

### **Issue 2: Puppeteer Error**
**Cause:**
- Puppeteer not installed
- Memory limit
- Font loading timeout

**Solution:**
```javascript
// Lazy load Puppeteer
// Add timeout untuk font loading
// Use proper args untuk production
```

### **Issue 3: Template Not Applied**
**Cause:**
- Event-specific template tidak ditemukan
- Global default template tidak ada
- Elements array kosong/invalid

**Solution:**
- Check template priority logic
- Validate elements structure
- Provide fallback template

---

## 📝 API ENDPOINTS SUMMARY

### **Certificate Generation**
- `POST /api/certificates/generate/:registrationId` - Generate single
- `POST /api/certificates/bulk-generate/:eventId` - Bulk generate

### **Certificate Access**
- `GET /api/certificates/my` - Get user certificates
- `GET /api/certificates/download-url/:certificateId` - Get download URL
- `GET /api/certificates/download/:certificateId` - Download file

### **Certificate Verification**
- `GET /api/certificates/verify/:certificateNumber` - Verify by number
- `GET /api/certificates/search/:token` - Search by token

### **Template Management**
- `GET /api/admin/certificate-templates/:eventId` - Get event template
- `POST /api/admin/certificate-templates/:eventId` - Save event template
- `GET /api/global-certificate-templates` - Get global templates
- `POST /api/global-certificate-templates` - Create global template

---

## ✅ CHECKLIST VERIFICATION

Sebelum generate certificate, sistem mengecek:
- [ ] Registration exists dan belongs to user
- [ ] `hasAttended = true`
- [ ] Event `generateCertificate = true`
- [ ] Certificate belum ada untuk registration ini
- [ ] Template tersedia (event-specific atau global default)
- [ ] Directory `uploads/certificates/` exists
- [ ] Puppeteer available dan dapat launch

---

## 🚀 OPTIMIZATION TIPS

1. **Batch Processing**
   - Gunakan `bulkGenerateCertificates()` untuk multiple certificates
   - Process dalam batch untuk avoid memory issues

2. **Template Caching**
   - Cache global default template
   - Cache event-specific templates

3. **PDF Generation**
   - Reuse Puppeteer browser instance jika multiple certificates
   - Monitor memory usage

4. **File Storage**
   - Consider S3/cloud storage untuk production
   - Implement file cleanup untuk old certificates

---

## 📚 FILES REFERENCE

### **Backend Services**
- `backend/src/services/certificateService.js` - Main logic
- `backend/src/services/certificatePdfService.js` - PDF generation
- `backend/src/services/certificateTemplateService.js` - Event templates
- `backend/src/services/globalCertificateTemplateService.js` - Global templates

### **Backend Controllers**
- `backend/src/controllers/certificateController.js` - HTTP handlers
- `backend/src/controllers/certificateTemplateController.js` - Template handlers
- `backend/src/controllers/globalCertificateTemplateController.js` - Global template handlers

### **Backend Routes**
- `backend/src/routes/certificates.js` - Certificate routes
- `backend/src/routes/certificateTemplates.js` - Event template routes
- `backend/src/routes/globalCertificateTemplates.js` - Global template routes

### **Templates**
- `backend/src/templates/certificates/certificate-template.html` - Static HTML template
- `backend/src/templates/email/certificate-notification.hbs` - Email template

### **Frontend**
- `frontend/src/lib/api.ts` - Certificate API methods (lines 820-862)

---

**Dokumen ini menjelaskan alur lengkap sistem sertifikat dari setup hingga verification.**
**Last Updated:** 2024




