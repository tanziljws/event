# Dependency Audit Report

## ✅ Dependencies yang TERPAKAI

### Production Dependencies
1. **@hookform/resolvers** ✅ - Digunakan untuk resolvers dengan react-hook-form
2. **@prisma/client** ✅ - Digunakan di API routes (`src/app/api/admin/events/header/`)
3. **@radix-ui/react-*** ✅ - Digunakan di berbagai UI components
4. **@tanstack/react-query** ✅ - Digunakan untuk data fetching
5. **@types/leaflet** ✅ - Type definitions untuk leaflet
6. **autoprefixer** ✅ - Digunakan oleh Tailwind CSS
7. **axios** ✅ - Digunakan untuk API calls
8. **class-variance-authority** ✅ - Digunakan di UI components (alert, badge, button)
9. **clsx** ✅ - Digunakan untuk conditional classes
10. **html2canvas** ✅ - Digunakan di certificate template page
11. **jspdf** ✅ - Digunakan di certificate template page
12. **jsqr** ✅ - Digunakan di QR scanner component
13. **leaflet** ✅ - Digunakan untuk maps
14. **lucide-react** ✅ - Digunakan untuk icons
15. **next** ✅ - Framework utama
16. **react** ✅ - Framework utama
17. **react-dom** ✅ - Framework utama
18. **react-hook-form** ✅ - Digunakan untuk forms
19. **react-icons** ✅ - Digunakan di about page (SiGoogle, SiApple, dll)
20. **recharts** ✅ - Digunakan untuk charts
21. **tailwind-merge** ✅ - Digunakan untuk merging Tailwind classes
22. **zod** ✅ - Digunakan untuk validation
23. **zustand** ✅ - Digunakan untuk state management

### Dev Dependencies
1. **@types/node** ✅ - Type definitions
2. **@types/react** ✅ - Type definitions
3. **@types/react-dom** ✅ - Type definitions
4. **eslint** ✅ - Digunakan untuk linting
5. **eslint-config-next** ✅ - ESLint config untuk Next.js
6. **postcss** ✅ - Digunakan oleh Tailwind CSS
7. **tailwindcss** ✅ - CSS framework
8. **typescript** ✅ - TypeScript compiler

## ❌ Dependencies yang TIDAK TERPAKAI (BISA DIHAPUS)

### Production Dependencies
1. **prisma** ❌ - Hanya perlu `@prisma/client`, tidak perlu CLI di frontend
   - **Alasan**: Prisma CLI biasanya hanya digunakan di backend untuk migrations
   - **Aksi**: Hapus dari dependencies, pindah ke devDependencies jika benar-benar diperlukan

2. **react-signature-canvas** ❌ - TIDAK DIGUNAKAN
   - **Alasan**: Tidak ditemukan penggunaan di codebase
   - **Aksi**: HAPUS - `npm uninstall react-signature-canvas`

3. **react-qr-scanner** ❌ - TIDAK DIGUNAKAN
   - **Alasan**: Menggunakan `jsqr` langsung, bukan library wrapper ini
   - **Aksi**: HAPUS - `npm uninstall react-qr-scanner`

4. **simple-icons** ⚠️ - TIDAK LANGSUNG DIGUNAKAN
   - **Alasan**: `react-icons` sudah include simple-icons (SiGoogle, SiApple, dll dari `react-icons/si`)
   - **Status**: Redundant, tapi mungkin diperlukan oleh react-icons
   - **Aksi**: VERIFIKASI - Cek apakah react-icons memerlukan ini sebagai peer dependency

5. **sonner** ❌ - TIDAK DIGUNAKAN
   - **Alasan**: Tidak ditemukan import atau penggunaan
   - **Aksi**: HAPUS - `npm uninstall sonner`

### Dev Dependencies
1. **@eslint/eslintrc** ✅ - Digunakan di `eslint.config.mjs`
   - **Status**: TERPAKAI, tapi mungkin bisa dioptimasi

## 📊 Summary

### Total Dependencies: 49
- Production: 38
- Dev: 11

### Unused Dependencies: 4-5
- **react-signature-canvas** (1.1.0-alpha.2) ❌
- **react-qr-scanner** (1.0.0-alpha.11) ❌
- **simple-icons** (15.14.0) ❌ - Redundant dengan react-icons
- **sonner** (2.0.7) ❌
- **prisma** (^6.16.2) ⚠️ - Evaluasi: biasanya hanya diperlukan di backend

### Estimated Size Reduction
- **react-signature-canvas**: ~50KB
- **react-qr-scanner**: ~30KB
- **simple-icons**: ~500KB (besar!)
- **sonner**: ~20KB
- **prisma**: ~15MB (sangat besar!)

**Total bisa dihemat: ~16MB** (terutama dari prisma)

## 🚀 Rekomendasi Aksi

### Langkah 1: Hapus Dependencies yang Tidak Terpakai
```bash
cd frontend
# Gunakan script otomatis
./remove-unused-deps.sh

# Atau manual
npm uninstall react-signature-canvas react-qr-scanner simple-icons sonner
```

### Langkah 2: Evaluasi Prisma
Jika tidak digunakan untuk migrations di frontend:
```bash
npm uninstall prisma
```

Jika masih diperlukan untuk migrations:
```bash
npm uninstall prisma
npm install --save-dev prisma
```

### Langkah 3: Verifikasi Setelah Penghapusan
```bash
npm run build
npm run dev
```

## ⚠️ Catatan Penting

1. **react-signature-canvas** dan **react-qr-scanner** adalah alpha versions - mungkin direncanakan untuk fitur yang belum diimplementasikan
2. **simple-icons** mungkin direncanakan untuk custom icon usage
3. **sonner** mungkin direncanakan untuk toast notifications (tapi sudah ada @radix-ui/react-toast)
4. **prisma** di frontend biasanya tidak diperlukan kecuali untuk migrations

## 🔍 Cara Verifikasi Manual

Jika ingin memastikan tidak ada yang terlewat:
```bash
# Cek penggunaan setiap dependency
grep -r "react-signature-canvas" src/
grep -r "react-qr-scanner" src/
grep -r "simple-icons" src/
grep -r "sonner" src/
grep -r "from 'prisma'" src/
```

