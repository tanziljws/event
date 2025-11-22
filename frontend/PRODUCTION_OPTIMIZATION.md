# Production Optimization Guide

## ✅ Optimasi yang Sudah Diterapkan

### 1. Build Optimizations
- ✅ **SWC Minification** - Minify dengan Rust-based SWC (lebih cepat dari Terser)
- ✅ **Console Removal** - Hapus console.log di production (kecuali error/warn)
- ✅ **CSS Optimization** - Optimize CSS di production
- ✅ **Package Imports Optimization** - Tree-shaking untuk library besar
- ✅ **Image Optimization** - AVIF & WebP dengan cache 1 tahun
- ✅ **Code Splitting** - Smart chunking untuk vendor, radix, recharts, leaflet, pdf
- ✅ **Compression** - Gzip compression enabled
- ✅ **Powered By Header** - Removed untuk security

### 2. Runtime Optimizations
- ✅ **React Strict Mode** - Enabled di production
- ✅ **Server Components** - External packages optimization
- ✅ **Deterministic Module IDs** - Better caching
- ✅ **Runtime Chunk** - Single runtime chunk untuk better caching

### 3. Bundle Size Optimizations
- ✅ **Max Initial Requests** - Limited to 25 chunks
- ✅ **Min Chunk Size** - 20KB minimum untuk avoid too many small chunks
- ✅ **Reuse Existing Chunks** - Better code reuse

## 🚀 Pre-Production Checklist

### 1. Build Test
```bash
# Test production build
npm run build

# Analyze bundle size (optional)
npm run build:analyze
```

### 2. Performance Test
```bash
# Start production server
npm start

# Test dengan:
# - Lighthouse (Chrome DevTools)
# - WebPageTest
# - GTmetrix
```

### 3. Environment Variables
Pastikan `.env.production` atau production environment variables sudah set:
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-api-url.com/api
```

### 4. Image Optimization
- Pastikan semua gambar menggunakan Next.js `<Image>` component
- Gunakan `loading="lazy"` untuk images below fold
- Gunakan `priority` hanya untuk above-fold images

### 5. Font Optimization
- Fonts sudah dioptimasi dengan `next/font/google`
- Decorative fonts hanya load di production dengan lazy loading

## 📊 Expected Performance Metrics

### Before Optimization
- First Contentful Paint (FCP): ~2-3s
- Largest Contentful Paint (LCP): ~3-4s
- Time to Interactive (TTI): ~4-5s
- Total Bundle Size: ~500-800KB

### After Optimization (Target)
- First Contentful Paint (FCP): <1.5s
- Largest Contentful Paint (LCP): <2.5s
- Time to Interactive (TTI): <3s
- Total Bundle Size: ~300-500KB (dengan code splitting)

## 🔧 Additional Optimizations (Optional)

### 1. CDN Setup
- Setup CDN untuk static assets
- Setup CDN untuk images (Next.js Image Optimization)

### 2. Caching Strategy
- Setup proper cache headers di hosting platform
- Setup service worker untuk offline support (optional)

### 3. Monitoring
- Setup error tracking (Sentry, LogRocket, dll)
- Setup performance monitoring (Vercel Analytics, Google Analytics)

### 4. Database Optimization
- Pastikan Prisma queries sudah optimized
- Setup database connection pooling
- Setup query caching jika perlu

## ⚠️ Important Notes

1. **Prisma Client** - Pastikan tidak di-bundle ke client-side
2. **API Routes** - Pastikan tidak expose sensitive data
3. **Environment Variables** - Pastikan semua secrets tidak di-expose ke client
4. **Source Maps** - Disabled di production untuk security

## 🐛 Troubleshooting

### Build Fails
```bash
# Clear cache dan rebuild
rm -rf .next
npm run build
```

### Bundle Too Large
```bash
# Analyze bundle
npm run build:analyze
# Check untuk duplicate dependencies
npm ls --depth=0
```

### Slow Production Build
- Pastikan menggunakan Node.js 18+ atau 20+
- Pastikan cukup memory (4GB+)
- Consider using build cache (CI/CD)

## 📈 Monitoring Production

### Key Metrics to Watch
1. **Build Time** - Should be <5 minutes
2. **Bundle Size** - Monitor untuk size creep
3. **Runtime Performance** - Monitor Core Web Vitals
4. **Error Rate** - Monitor untuk runtime errors

### Tools
- Vercel Analytics (jika deploy di Vercel)
- Google Analytics
- Sentry untuk error tracking
- Lighthouse CI untuk continuous monitoring

