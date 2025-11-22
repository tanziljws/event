# Performance Optimization Guide

## Optimasi yang Sudah Diterapkan

### 1. Next.js Configuration (`next.config.js`)
- ✅ **Turbo Mode**: Mengaktifkan `--turbo` untuk kompilasi lebih cepat
- ✅ **Filesystem Caching**: Menggunakan filesystem cache untuk rebuild lebih cepat
- ✅ **Source Maps**: Menggunakan `eval-cheap-module-source-map` untuk dev yang lebih cepat
- ✅ **Module Resolution**: Disable symlinks dan enable cache untuk resolusi lebih cepat
- ✅ **Image Optimization**: Disable di development untuk kompilasi lebih cepat
- ✅ **CSS Optimization**: Disable di development untuk kompilasi lebih cepat

### 2. Middleware Optimization (`src/middleware.ts`)
- ✅ **Fast Path**: Skip processing untuk static assets dan API routes
- ✅ **Simplified Logic**: Menggunakan simple string checks instead of regex
- ✅ **Early Returns**: Return early untuk static files

### 3. Font Loading (`src/app/layout.tsx`)
- ✅ **Lazy Loading**: Decorative fonts hanya dimuat di production
- ✅ **Preconnect**: Hanya preconnect untuk fonts, tidak load semua di dev

### 4. Development Scripts (`package.json`)
- ✅ **Turbo Mode**: Default dev script menggunakan `--turbo`
- ✅ **Memory**: Meningkatkan memory limit ke 4GB

## Cara Menggunakan

### Development Normal (Recommended)
```bash
npm run dev
```
Menggunakan Turbo mode untuk kompilasi lebih cepat.

### Development Fast (Jika Turbo bermasalah)
```bash
npm run dev:fast
```
Menggunakan Turbo dengan HTTPS experimental.

### Development Slow (Fallback)
```bash
npm run dev:slow
```
Menggunakan mode normal tanpa Turbo.

## Tips Tambahan untuk Performa

### 1. Clear Cache
Jika masih lambat, coba clear cache:
```bash
rm -rf .next
npm run dev
```

### 2. Disable Type Checking di Dev
Type checking sudah di-disable di `next.config.js` untuk kompilasi lebih cepat.

### 3. Gunakan Production Build untuk Testing
Untuk melihat performa sebenarnya:
```bash
npm run build
npm start
```

### 4. Monitor Bundle Size
Gunakan `@next/bundle-analyzer` untuk melihat bundle size:
```bash
npm install @next/bundle-analyzer
```

## Troubleshooting

### Masih Lambat?
1. **Clear `.next` folder**: `rm -rf .next`
2. **Clear node_modules cache**: `rm -rf node_modules/.cache`
3. **Restart dev server**: Stop dan start ulang
4. **Check disk space**: Pastikan ada cukup space untuk cache
5. **Disable antivirus**: Antivirus bisa memperlambat file watching

### Turbo Mode Error?
Gunakan `npm run dev:slow` sebagai fallback.

### Memory Issues?
Pastikan Node.js versi terbaru dan cek memory limit:
```bash
node --max-old-space-size=4096
```

## Performance Metrics

### Before Optimization
- Initial compilation: ~30-40s
- Page compilation: ~5-10s per page
- Hot reload: ~2-5s

### After Optimization (Expected)
- Initial compilation: ~15-20s (dengan Turbo)
- Page compilation: ~1-3s per page
- Hot reload: ~500ms-1s

## Catatan Penting

1. **Turbo Mode**: Masih experimental, jika ada error gunakan `dev:slow`
2. **Image Optimization**: Disabled di dev untuk speed, enabled di production
3. **Font Loading**: Decorative fonts hanya di production untuk dev lebih cepat
4. **Cache**: Filesystem cache akan membuat rebuild lebih cepat setelah pertama kali

