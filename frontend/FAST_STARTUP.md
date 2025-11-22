# Fast Startup Guide

## Problem
Next.js dengan Turbopack startup sangat lambat (stuck di "Starting...").

## Solutions

### 1. Clear Cache (RECOMMENDED FIRST STEP)
```bash
cd frontend
./clear-cache.sh
# atau manual:
rm -rf .next .turbo node_modules/.cache
```

### 2. Gunakan Script yang Lebih Cepat
```bash
# Fast mode (recommended)
npm run dev:fast

# Normal mode
npm run dev

# Slow mode (fallback jika ada masalah)
npm run dev:slow
```

### 3. Optimasi yang Sudah Diterapkan
- ✅ Disabled source maps di development
- ✅ Disabled CSS optimization di development
- ✅ Reduced page buffer untuk startup lebih cepat
- ✅ Optimized Turbopack configuration
- ✅ Disabled unnecessary optimizations

### 4. Jika Masih Lambat

**Check apakah ada proses yang menghalangi:**
```bash
# Check port 3000
lsof -ti:3000 | xargs kill -9

# Check memory usage
top -l 1 | grep node
```

**Restart dengan clean state:**
```bash
# Kill semua node processes
pkill -f node

# Clear cache
rm -rf .next .turbo node_modules/.cache

# Start fresh
npm run dev:fast
```

### 5. Environment Variables untuk Performa
Tambahkan ke `.env.local`:
```env
TURBOPACK=1
NODE_OPTIONS=--max-old-space-size=2048
```

### Expected Startup Time
- **Before**: 30-60 detik
- **After**: 5-15 detik

Jika masih lambat setelah clear cache, kemungkinan ada masalah dengan:
1. File system yang lambat
2. Antivirus yang scan file
3. Terlalu banyak file di project
4. Memory yang penuh

