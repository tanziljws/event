# Scripts Documentation

## create-admin.js

Script untuk membuat admin user baru atau update user existing menjadi admin.

### Usage

#### 1. Create Admin dengan Default Credentials

```bash
node scripts/create-admin.js
```

Ini akan membuat admin dengan credentials berikut:
- **Email**: `admin@nusaevent.com`
- **Password**: `admin123`
- **Full Name**: `Super Admin`
- **Role**: `SUPER_ADMIN`

#### 2. Create Admin dengan Custom Credentials

```bash
node scripts/create-admin.js <email> <password> <fullName> [role] [phoneNumber] [address] [department] [userPosition]
```

**Parameters:**
- `email` (required): Email admin
- `password` (required): Password admin
- `fullName` (required): Nama lengkap admin
- `role` (optional): Role admin (default: `SUPER_ADMIN`)
  - Available roles: `SUPER_ADMIN`, `CS_HEAD`, `CS_SENIOR_AGENT`, `CS_AGENT`, `OPS_HEAD`, `OPS_SENIOR_AGENT`, `OPS_AGENT`, `FINANCE_HEAD`, `FINANCE_SENIOR_AGENT`, `FINANCE_AGENT`
- `phoneNumber` (optional): Nomor telepon
- `address` (optional): Alamat
- `department` (optional): Department (default: `CUSTOMER_SUCCESS`)
  - Available departments: `CUSTOMER_SUCCESS`, `OPERATIONS`, `FINANCE`
- `userPosition` (optional): User position (default: `SUPER_ADMIN`)
  - Available positions: `SUPER_ADMIN`, `HEAD`, `SENIOR_AGENT`, `AGENT`

### Examples

```bash
# Create default admin
node scripts/create-admin.js

# Create custom admin
node scripts/create-admin.js admin@example.com password123 "Admin User" SUPER_ADMIN

# Create CS Head admin
node scripts/create-admin.js cs.head@example.com password123 "CS Head" CS_HEAD "081234567890" "Jakarta" CUSTOMER_SUCCESS HEAD

# Create OPS Agent admin
node scripts/create-admin.js ops.agent@example.com password123 "OPS Agent" OPS_AGENT "081234567890" "Jakarta" OPERATIONS AGENT
```

### Features

- ✅ Check if user already exists
- ✅ Update existing user to admin (with confirmation)
- ✅ Hash password securely using bcrypt
- ✅ Auto-verify email
- ✅ Support multiple admin roles
- ✅ Display admin details after creation

### Important Notes

1. **Password Security**: Default password is `admin123`. Please change it after first login!
2. **Email Verification**: Admin users are automatically verified (`emailVerified: true`)
3. **Role Permissions**: `SUPER_ADMIN` has full access to all features
4. **Existing Users**: If email already exists, script will ask if you want to update the user to admin

### Troubleshooting

**Error: User already exists**
- The script will ask if you want to update the existing user to admin
- Answer `y` to update, or `n` to cancel

**Error: Database connection failed**
- Make sure your database is running
- Check your `DATABASE_URL` in `.env` file
- Verify database credentials

**Error: Invalid role**
- Make sure the role matches one of the available roles
- Role must match the department (e.g., `CS_HEAD` must be in `CUSTOMER_SUCCESS` department)

