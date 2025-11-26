# 📚 Panduan Menambahkan Table Database Baru untuk Fitur Baru

## 🎯 Overview

Ketika ingin menambahkan fitur baru yang memerlukan database, kita perlu:
1. **Definisikan model** di Prisma schema
2. **Buat migration** untuk membuat table di database
3. **Apply migration** ke database
4. **Generate Prisma Client** untuk menggunakan model baru

---

## 📝 Langkah-langkah Detail

### **Langkah 1: Definisikan Model di Prisma Schema**

Edit file `backend/prisma/schema.prisma` dan tambahkan model baru.

#### Contoh: Menambahkan Fitur "Reviews" untuk Event

```prisma
// Tambahkan di akhir file schema.prisma

model EventReview {
  id          String   @id @default(uuid())
  eventId     String   @map("event_id")
  userId      String   @map("user_id")
  rating      Int      // 1-5 stars
  comment     String?
  isVerified  Boolean  @default(false) @map("is_verified")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  // Relations
  event       Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([eventId, userId]) // Satu user hanya bisa review sekali per event
  @@index([eventId])
  @@index([userId])
  @@index([rating])
  @@map("event_reviews")
}

// Tambahkan relation ke model Event yang sudah ada
// Edit model Event, tambahkan:
model Event {
  // ... field yang sudah ada ...
  reviews     EventReview[]  // Tambahkan ini
}
```

#### Contoh: Menambahkan Fitur "Notifications Settings"

```prisma
model NotificationSettings {
  id                    String   @id @default(uuid())
  userId                String   @unique @map("user_id")
  emailNotifications    Boolean  @default(true) @map("email_notifications")
  pushNotifications     Boolean  @default(true) @map("push_notifications")
  smsNotifications      Boolean  @default(false) @map("sms_notifications")
  eventReminders        Boolean  @default(true) @map("event_reminders")
  paymentAlerts         Boolean  @default(true) @map("payment_alerts")
  createdAt             DateTime @default(now()) @map("created_at")
  updatedAt             DateTime @updatedAt @map("updated_at")
  
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("notification_settings")
}

// Tambahkan ke model User:
model User {
  // ... field yang sudah ada ...
  notificationSettings NotificationSettings?  // Tambahkan ini
}
```

---

### **Langkah 2: Buat Migration**

Setelah menambahkan model di schema, buat migration:

```bash
cd backend

# Buat migration baru
npx prisma migrate dev --name add_event_reviews

# Atau dengan nama yang lebih deskriptif
npx prisma migrate dev --name add_notification_settings
```

**Apa yang terjadi:**
- Prisma akan membuat file migration di `backend/prisma/migrations/`
- File migration berisi SQL untuk membuat table baru
- Migration akan otomatis di-apply ke database development

---

### **Langkah 3: Generate Prisma Client**

Setelah migration, generate Prisma Client agar bisa menggunakan model baru:

```bash
cd backend
npx prisma generate
```

**Apa yang terjadi:**
- Prisma Client akan di-generate dengan model baru
- Bisa langsung digunakan di code dengan `prisma.eventReview`, dll

---

### **Langkah 4: Gunakan Model Baru di Code**

#### Contoh: Service untuk Event Reviews

Buat file `backend/src/services/reviewService.js`:

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create review
const createReview = async (eventId, userId, rating, comment) => {
  return await prisma.eventReview.create({
    data: {
      eventId,
      userId,
      rating,
      comment,
    },
    include: {
      event: true,
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });
};

// Get reviews for event
const getEventReviews = async (eventId) => {
  return await prisma.eventReview.findMany({
    where: { eventId },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

// Get average rating
const getAverageRating = async (eventId) => {
  const result = await prisma.eventReview.aggregate({
    where: { eventId },
    _avg: {
      rating: true,
    },
    _count: {
      rating: true,
    },
  });
  
  return {
    average: result._avg.rating || 0,
    count: result._count.rating || 0,
  };
};

module.exports = {
  createReview,
  getEventReviews,
  getAverageRating,
};
```

---

## 🔧 Contoh Lengkap: Fitur "Event Favorites"

### 1. Tambahkan Model ke Schema

```prisma
model EventFavorite {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  eventId   String   @map("event_id")
  createdAt DateTime @default(now()) @map("created_at")
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  @@unique([userId, eventId]) // Satu user hanya bisa favorite sekali per event
  @@index([userId])
  @@index([eventId])
  @@map("event_favorites")
}

// Tambahkan ke model User dan Event
model User {
  // ... existing fields ...
  favoriteEvents EventFavorite[]
}

model Event {
  // ... existing fields ...
  favorites EventFavorite[]
}
```

### 2. Buat Migration

```bash
cd backend
npx prisma migrate dev --name add_event_favorites
```

### 3. Generate Client

```bash
npx prisma generate
```

### 4. Buat Service

```javascript
// backend/src/services/favoriteService.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const toggleFavorite = async (userId, eventId) => {
  const existing = await prisma.eventFavorite.findUnique({
    where: {
      userId_eventId: {
        userId,
        eventId,
      },
    },
  });

  if (existing) {
    // Unfavorite
    await prisma.eventFavorite.delete({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });
    return { isFavorite: false };
  } else {
    // Favorite
    await prisma.eventFavorite.create({
      data: {
        userId,
        eventId,
      },
    });
    return { isFavorite: true };
  }
};

const getUserFavorites = async (userId) => {
  return await prisma.eventFavorite.findMany({
    where: { userId },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          eventDate: true,
          location: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

module.exports = {
  toggleFavorite,
  getUserFavorites,
};
```

---

## 📋 Tipe Data Prisma yang Sering Digunakan

```prisma
model Example {
  // String
  name        String   // Required
  description String?  // Optional
  
  // Number
  price       Decimal   // Untuk uang
  quantity    Int       // Integer
  rating      Float     // Decimal number
  
  // Boolean
  isActive    Boolean   @default(true)
  
  // Date & Time
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  eventDate   DateTime?
  
  // Array
  tags        String[]
  documents   String[]
  
  // JSON
  metadata    Json?
  settings    Json?
  
  // Enum
  status      Status    @default(PENDING)
  
  // Relations
  userId      String
  user        User      @relation(fields: [userId], references: [id])
}
```

---

## 🎨 Best Practices

### 1. **Naming Convention**

- **Model name**: PascalCase (contoh: `EventReview`)
- **Table name**: snake_case (contoh: `event_reviews`)
- **Field name**: camelCase (contoh: `eventId`)
- **Column name**: snake_case (contoh: `event_id`)

### 2. **Indexes**

```prisma
// Index untuk query yang sering digunakan
@@index([eventId])
@@index([userId])
@@index([status, createdAt]) // Composite index

// Unique constraint
@@unique([userId, eventId])
```

### 3. **Relations**

```prisma
// One-to-Many
model Event {
  reviews EventReview[]
}

// Many-to-One
model EventReview {
  eventId String
  event   Event @relation(fields: [eventId], references: [id])
}

// One-to-One
model User {
  settings NotificationSettings?
}

model NotificationSettings {
  userId String @unique
  user   User   @relation(fields: [userId], references: [id])
}
```

### 4. **Cascade Delete**

```prisma
// Jika event dihapus, hapus semua reviews juga
event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)

// Atau set null
user User? @relation(fields: [userId], references: [id], onDelete: SetNull)
```

---

## 🚀 Workflow Lengkap

```bash
# 1. Edit schema.prisma
# Tambahkan model baru

# 2. Buat migration
cd backend
npx prisma migrate dev --name add_feature_name

# 3. Generate client
npx prisma generate

# 4. Buat service/controller
# Implementasi logic untuk fitur baru

# 5. Test
# Test fitur baru di development

# 6. Deploy ke production
# Migration akan otomatis di-apply saat deploy
```

---

## ⚠️ Troubleshooting

### Error: "Migration failed"

```bash
# Reset migration (HATI-HATI: akan hapus data!)
npx prisma migrate reset

# Atau rollback migration terakhir
npx prisma migrate resolve --rolled-back <migration_name>
```

### Error: "Table already exists"

```bash
# Mark migration as applied tanpa menjalankan SQL
npx prisma migrate resolve --applied <migration_name>
```

### Error: "Schema drift detected"

```bash
# Sync schema dengan database
npx prisma db pull

# Atau buat migration untuk sync
npx prisma migrate dev --name sync_schema
```

---

## 📌 Tips

1. ✅ **Selalu backup database** sebelum migration besar
2. ✅ **Test migration di development** dulu sebelum production
3. ✅ **Gunakan migration names yang deskriptif** (contoh: `add_event_reviews`)
4. ✅ **Review migration SQL** sebelum apply ke production
5. ✅ **Gunakan transactions** untuk operasi yang kompleks
6. ✅ **Index foreign keys** untuk performa query yang lebih baik

---

## 📚 Referensi

- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Migrations Guide](https://www.prisma.io/docs/guides/migrate)
- [Prisma Relations](https://www.prisma.io/docs/concepts/components/prisma-schema/relations)

