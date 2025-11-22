# Dependencies Analysis Report - Backend

## ✅ Dependencies yang DIGUNAKAN (JANGAN DIHAPUS)

### Core Dependencies
- `@prisma/client` ✅ - Database ORM
- `express` ✅ - Web framework
- `dotenv` ✅ - Environment variables
- `cors` ✅ - CORS middleware
- `helmet` ✅ - Security headers
- `morgan` ✅ - HTTP request logger
- `compression` ✅ - Response compression
- `cookie-parser` ✅ - Cookie parsing
- `express-async-errors` ✅ - Async error handling
- `express-rate-limit` ✅ - Rate limiting
- `express-slow-down` ✅ - Speed limiting
- `express-validator` ✅ - Input validation
- `joi` ✅ - Schema validation
- `jsonwebtoken` ✅ - JWT tokens
- `bcrypt` ✅ - Password hashing (routes/admin.js)
- `bcryptjs` ✅ - Password hashing (authService.js, departments.js)
- `node-cron` ✅ - Cron jobs
- `redis` ✅ - Redis client
- `winston` ✅ - Logging
- `uuid` ✅ - UUID generation
- `multer` ✅ - File uploads
- `nodemailer` ✅ - Email sending
- `@sendgrid/mail` ✅ - SendGrid email
- `handlebars` ✅ - Email templates
- `qrcode` ✅ - QR code generation
- `sharp` ✅ - Image processing
- `prom-client` ✅ - Prometheus metrics
- `ws` ✅ - WebSocket (websocketService.js)
- `exceljs` ✅ - Excel file generation
- `pdfkit` ✅ - PDF generation (reports.js)
- `puppeteer` ✅ - PDF generation (certificatePdfService.js)
- `mime-types` ✅ - MIME type detection (s3.js)
- `crypto-js` ✅ - Crypto operations (bitgetService.js)
- `crypto` ✅ - Built-in Node.js crypto (authService.js, paymentService.js)
- `duitku-nodejs` ✅ - Duitku payment gateway
- `midtrans-client` ✅ - Midtrans payment gateway
- `@aws-sdk/client-s3` ✅ - AWS S3 client
- `dompurify` ✅ - XSS protection (validation.js)
- `jsdom` ✅ - DOM manipulation (validation.js)
- `@sentry/node` ✅ - Error tracking
- `@sentry/integrations` ✅ - Sentry integrations
- `@sentry/profiling-node` ✅ - Sentry profiling

---

## ❌ Dependencies yang TIDAK DIGUNAKAN (BISA DIHAPUS)

### 1. **bull** ❌
- **Status**: TIDAK DIGUNAKAN
- **Alasan**: Hanya menggunakan `node-cron` untuk queue processing, tidak menggunakan Bull queue
- **File yang dicek**: `queueProcessor.js` - hanya menggunakan `node-cron`
- **Rekomendasi**: ✅ **AMAN UNTUK DIHAPUS**

### 2. **canvas** ❌
- **Status**: TIDAK DIGUNAKAN
- **Alasan**: Tidak ada file yang mengimport atau menggunakan canvas
- **Rekomendasi**: ✅ **AMAN UNTUK DIHAPUS**

### 3. **html2canvas** ❌
- **Status**: TIDAK DIGUNAKAN
- **Alasan**: Library untuk browser, tidak untuk Node.js backend
- **Rekomendasi**: ✅ **AMAN UNTUK DIHAPUS**

### 4. **jspdf** ❌
- **Status**: TIDAK DIGUNAKAN
- **Alasan**: Menggunakan `pdfkit` dan `puppeteer` untuk PDF generation, tidak menggunakan jsPDF
- **Rekomendasi**: ✅ **AMAN UNTUK DIHAPUS**

### 5. **socket.io** ❌
- **Status**: TIDAK DIGUNAKAN
- **Alasan**: Menggunakan `ws` (WebSocket native) bukan socket.io
- **File yang dicek**: `websocketService.js` - hanya menggunakan `ws`
- **Rekomendasi**: ✅ **AMAN UNTUK DIHAPUS**

### 6. **swiper** ❌
- **Status**: TIDAK DIGUNAKAN
- **Alasan**: Library untuk frontend carousel, tidak digunakan di backend
- **Rekomendasi**: ✅ **AMAN UNTUK DIHAPUS**

### 7. **swagger-jsdoc** ❌
- **Status**: TIDAK DIGUNAKAN
- **Alasan**: Tidak ada Swagger documentation yang di-setup
- **Rekomendasi**: ✅ **AMAN UNTUK DIHAPUS**

### 8. **swagger-ui-express** ❌
- **Status**: TIDAK DIGUNAKAN
- **Alasan**: Tidak ada Swagger UI yang di-setup
- **Rekomendasi**: ✅ **AMAN UNTUK DIHAPUS**

### 9. **xlsx** ❌
- **Status**: TIDAK DIGUNAKAN
- **Alasan**: Menggunakan `exceljs` untuk Excel file generation, tidak menggunakan xlsx
- **File yang dicek**: `eventController.js`, `reports.js`, `operations.js` - semua menggunakan `exceljs`
- **Rekomendasi**: ✅ **AMAN UNTUK DIHAPUS**

### 10. **pdf-poppler** ❌
- **Status**: TIDAK DIGUNAKAN
- **Alasan**: Tidak ada file yang mengimport atau menggunakan pdf-poppler
- **Rekomendasi**: ✅ **AMAN UNTUK DIHAPUS**

### 11. **moment** ❌
- **Status**: TIDAK DIGUNAKAN
- **Alasan**: Menggunakan native JavaScript Date, tidak menggunakan moment.js
- **Rekomendasi**: ✅ **AMAN UNTUK DIHAPUS**

---

## ⚠️ Dependencies untuk DevDependencies (Bisa dipindah atau dihapus)

### 12. **autoprefixer** ❌
- **Status**: TIDAK DIGUNAKAN
- **Alasan**: Tool untuk CSS, tidak digunakan di backend Node.js
- **Lokasi**: devDependencies
- **Rekomendasi**: ✅ **AMAN UNTUK DIHAPUS**

### 13. **postcss** ❌
- **Status**: TIDAK DIGUNAKAN
- **Alasan**: Tool untuk CSS, tidak digunakan di backend Node.js
- **Lokasi**: devDependencies
- **Rekomendasi**: ✅ **AMAN UNTUK DIHAPUS**

### 14. **tailwindcss** ❌
- **Status**: TIDAK DIGUNAKAN
- **Alasan**: CSS framework untuk frontend, tidak digunakan di backend
- **Lokasi**: devDependencies
- **Rekomendasi**: ✅ **AMAN UNTUK DIHAPUS**

### 15. **@types/nodemailer** ❌
- **Status**: TIDAK DIGUNAKAN
- **Alasan**: Type definitions, tidak diperlukan untuk runtime JavaScript
- **Lokasi**: dependencies (seharusnya di devDependencies jika digunakan)
- **Rekomendasi**: ✅ **AMAN UNTUK DIHAPUS**

---

## 📊 Summary

### Total Dependencies: 55
### Digunakan: 40
### Tidak Digunakan: 15
### Percentage Unused: ~27%

### Dependencies yang bisa dihapus:
1. `bull` - Queue library (tidak digunakan)
2. `canvas` - Canvas rendering (tidak digunakan)
3. `html2canvas` - Browser-only library (tidak digunakan)
4. `jspdf` - PDF library (tidak digunakan, menggunakan pdfkit & puppeteer)
5. `socket.io` - WebSocket library (tidak digunakan, menggunakan ws)
6. `swiper` - Frontend carousel (tidak digunakan)
7. `swagger-jsdoc` - Swagger docs (tidak digunakan)
8. `swagger-ui-express` - Swagger UI (tidak digunakan)
9. `xlsx` - Excel library (tidak digunakan, menggunakan exceljs)
10. `pdf-poppler` - PDF processing (tidak digunakan)
11. `moment` - Date library (tidak digunakan, menggunakan native Date)
12. `autoprefixer` - CSS tool (tidak digunakan)
13. `postcss` - CSS tool (tidak digunakan)
14. `tailwindcss` - CSS framework (tidak digunakan)
15. `@types/nodemailer` - Type definitions (tidak diperlukan)

---

## 🚀 Impact Analysis

### Dependencies yang Paling Berat (jika dihapus akan mempercepat install):
1. **puppeteer** (~300MB) - TETAP DIGUNAKAN (certificate generation)
2. **socket.io** (~50MB) - BISA DIHAPUS
3. **canvas** (~30MB) - BISA DIHAPUS
4. **swagger-ui-express** (~20MB) - BISA DIHAPUS
5. **bull** (~15MB) - BISA DIHAPUS
6. **moment** (~10MB) - BISA DIHAPUS
7. **xlsx** (~8MB) - BISA DIHAPUS

### Estimated Size Reduction: ~133MB
### Estimated Install Time Reduction: ~30-60 detik

---

## ✅ Rekomendasi

### Langkah 1: Hapus dependencies yang jelas tidak digunakan
```bash
npm uninstall bull canvas html2canvas jspdf socket.io swiper swagger-jsdoc swagger-ui-express xlsx pdf-poppler moment autoprefixer postcss tailwindcss @types/nodemailer
```

### Langkah 2: Test setelah penghapusan
```bash
npm install
npm start
# Test semua fitur utama
```

### Langkah 3: Verifikasi tidak ada error
- Test certificate generation (puppeteer)
- Test PDF generation (pdfkit)
- Test Excel export (exceljs)
- Test WebSocket (ws)
- Test semua API endpoints

---

## 📝 Notes

1. **bcrypt vs bcryptjs**: Keduanya digunakan di file yang berbeda. Perlu konsolidasi di masa depan.
2. **crypto**: Built-in Node.js, tidak perlu di dependencies (tapi digunakan)
3. **puppeteer**: Sangat berat tapi diperlukan untuk certificate PDF generation
4. **moment**: Bisa diganti dengan native Date atau date-fns jika diperlukan di masa depan

---

## ⚠️ PENTING: Sebelum Menghapus

1. ✅ Pastikan semua fitur di-test setelah penghapusan
2. ✅ Pastikan tidak ada dynamic require yang menggunakan dependencies ini
3. ✅ Pastikan tidak ada dependencies lain yang membutuhkan package ini sebagai peer dependency
4. ✅ Backup package.json sebelum menghapus

---

**Generated**: 2025-11-10
**Last Updated**: 2025-11-10

    