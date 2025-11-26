# 📜 RINGKASAN ALUR CERTIFICATE - SISTEM LENGKAP

## 🎯 OVERVIEW
Sistem certificate di NusaEvent adalah sistem **manual trigger** yang menghasilkan sertifikat PDF setelah participant menghadiri event. Certificate hanya bisa di-generate jika:
- ✅ Participant sudah **hadir** (`hasAttended = true`)
- ✅ Event memiliki **certificate enabled** (`generateCertificate = true`)
- ✅ Certificate **belum pernah dibuat** untuk registration tersebut

---

## 📋 ALUR LENGKAP (STEP-BY-STEP)

### **FASE 1: SETUP EVENT & TEMPLATE** 🎨

#### 1.1. Global Certificate Template (SUPER_ADMIN)
```
POST /api/global-certificate-templates
```
- Admin membuat template global yang akan digunakan sebagai default
- Bisa set sebagai `isDefault: true`
- Digunakan jika event tidak punya template spesifik

**File:** `backend/src/services/globalCertificateTemplateService.js`

#### 1.2. Event-Specific Template (Optional)
```
POST /api/admin/certificate-templates/:eventId
```
- Organizer bisa buat template khusus untuk event tertentu
- Override global template
- Custom background, elements, styling

**File:** `backend/src/services/certificateTemplateService.js`

#### 1.3. Enable Certificate di Event
```javascript
// Saat create/update event
{
  generateCertificate: true  // ✅ Enable certificate generation
}
```

**Database:** `Event.generateCertificate` (Boolean)

---

### **FASE 2: REGISTRASI & ATTENDANCE** 🎫

#### 2.1. Participant Register
```
Participant → Register Event → Payment → Ticket Generated
```

**Database Records:**
- `EventRegistration` created
- `Ticket` created dengan QR code
- `Payment` created

#### 2.2. QR Code Scanning untuk Attendance

**Self-Scan (Participant):**
```
POST /api/events/scan-qr
{
  qrCodeData: "REG-TOKEN-XXXXX"
}
```

**Admin/Organizer Check-in:**
```
POST /api/events/admin/check-in
POST /api/events/organizer/check-in
{
  eventId: "uuid",
  qrCodeData: "REG-TOKEN-XXXXX"
}
```

**Yang Terjadi:**
```javascript
// Update EventRegistration
{
  hasAttended: true,        // ✅ Attendance marked
  attendanceTime: DateTime, // Waktu scan
  attendedAt: DateTime      // Timestamp
}
```

**File:** `backend/src/services/ticketService.js` (line 457-532)

---

### **FASE 3: GENERASI SERTIFIKAT** 🎓

#### 3.1. Trigger Generation (MANUAL - Tidak Otomatis!)

**3.1.1. Participant Generate Sendiri**
```
POST /api/certificates/generate/:registrationId
Headers: Authorization: Bearer <token>
```

**Validasi:**
- ✅ Registration exists dan belongs to user
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

---

#### 3.2. Proses Generation (Internal)

**Step-by-Step:**

1. **VALIDASI REGISTRATION**
   ```javascript
   const registration = await prisma.eventRegistration.findFirst({
     where: {
       id: registrationId,
       participantId,
       hasAttended: true, // ⚠️ MUST HAVE ATTENDED
     }
   });
   ```

2. **CHECK CERTIFICATE EXISTS**
   ```javascript
   const existing = await prisma.certificate.findUnique({
     where: { registrationId }
   });
   ```

3. **CHECK EVENT HAS CERTIFICATE ENABLED**
   ```javascript
   const event = await prisma.event.findUnique({
     where: { id: registration.event.id },
     select: { generateCertificate: true }
   });
   ```

4. **GET TEMPLATE (Priority)**
   ```javascript
   // Priority: Event-specific > Global default
   const template = await prisma.certificateTemplate.findUnique({
     where: { eventId: registration.event.id }
   }) || await prisma.globalCertificateTemplate.findFirst({
     where: { isDefault: true, isActive: true }
   });
   ```

5. **GENERATE CERTIFICATE NUMBER**
   ```javascript
   const certificateNumber = await certificatePdfService.generateCertificateNumber();
   // Format: CERT-{timestamp}-{random}
   // Example: CERT-L3K9M2P-QX7A
   ```

6. **PREPARE CERTIFICATE DATA**
   ```javascript
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
   ```

7. **GENERATE PDF dengan Puppeteer**
   ```javascript
   const pdfResult = await certificatePdfService.generateCertificatePdf(certificateData);
   // Output: { filename, filePath, certificateUrl, pdfBuffer }
   ```

8. **SAVE TO DATABASE**
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

9. **UPDATE REGISTRATION**
   ```javascript
   await prisma.eventRegistration.update({
     where: { id: registrationId },
     data: { certificateUrl: pdfResult.certificateUrl }
   });
   ```

10. **SEND NOTIFICATION EMAIL**
    ```javascript
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

**Technology:**
- **Puppeteer**: Headless browser untuk HTML → PDF
- **HTML Template**: Dynamic template dengan placeholders
- **Google Fonts**: Custom font support

**Proses:**
```javascript
// 1. Launch Puppeteer
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

// 2. Create Page & Set Viewport
const page = await browser.newPage();
await page.setViewport({ width: 800, height: 600 });

// 3. Load Template & Replace Placeholders
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

**Get My Certificates:**
```
GET /api/certificates/my?page=1&limit=10&sortBy=attendedAt&sortOrder=desc&search=...
```

**Download Certificate:**
```
GET /api/certificates/download-url/:certificateId
GET /api/certificates/download/:certificateId
```

**Service:** `certificateService.getUserCertificates()`

**Frontend:** `frontend/src/app/(dashboard)/my-certificates/page.tsx`

---

### **FASE 5: VERIFIKASI SERTIFIKAT** 🔍

#### 5.1. Public Verification by Certificate Number
```
GET /api/certificates/verify/:certificateNumber
```

**Public Access:** ✅ Tidak perlu authentication

#### 5.2. Search by Registration Token
```
GET /api/certificates/search/:token
```

**Token Format:** 10-character registration token

**Service:** `certificateService.verifyCertificate()`

---

### **FASE 6: NOTIFIKASI EMAIL** 📧

**Email Template:** Brevo API

**Content:**
- ✅ Greeting dengan nama participant
- ✅ Event details (title, date, location)
- ✅ Certificate number
- ✅ Download button (link ke certificateUrl)
- ✅ Verification URL

**Service:** `emailTemplates.sendCertificateNotification()`
**File:** `backend/src/config/brevoEmail.js` (line 281-307)

---

## 🔑 POIN-POIN PENTING

### **1. Prasyarat Wajib**
- ✅ Event harus `generateCertificate = true`
- ✅ Participant **MUST** `hasAttended = true` (melalui QR scan)
- ✅ Satu registration = satu certificate (unique)
- ⚠️ **Certificate TIDAK otomatis generate** - harus manual trigger!

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

## 📝 API ENDPOINTS SUMMARY

### **Certificate Generation**
- `POST /api/certificates/generate/:registrationId` - Generate single (Participant)
- `POST /api/certificates/bulk-generate/:eventId` - Bulk generate (Admin)

### **Certificate Access**
- `GET /api/certificates/my` - Get user certificates
- `GET /api/certificates/download-url/:certificateId` - Get download URL
- `GET /api/certificates/download/:certificateId` - Download file

### **Certificate Verification**
- `GET /api/certificates/verify/:certificateNumber` - Verify by number (Public)
- `GET /api/certificates/search/:token` - Search by token (Public)

### **Template Management**
- `GET /api/admin/certificate-templates/:eventId` - Get event template
- `POST /api/admin/certificate-templates/:eventId` - Save event template
- `GET /api/global-certificate-templates` - Get global templates
- `POST /api/global-certificate-templates` - Create global template

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
- Lazy load Puppeteer
- Add timeout untuk font loading
- Use proper args untuk production

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

### **Frontend**
- `frontend/src/app/(dashboard)/my-certificates/page.tsx` - User certificates page
- `frontend/src/lib/api.ts` - Certificate API methods (lines 997-1144)

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

**Last Updated:** 2025-01-27
**Status:** ✅ Complete Analysis

