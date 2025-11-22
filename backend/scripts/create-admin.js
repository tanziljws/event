#!/usr/bin/env node

/**
 * Script to create an admin user
 * Usage: node scripts/create-admin.js <email> <password> <fullName> [role]
 * 
 * Example:
 *   node scripts/create-admin.js admin@example.com password123 "Admin User" SUPER_ADMIN
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Default admin data
const DEFAULT_ADMIN = {
  email: 'admin@nusaevent.com',
  password: 'admin123',
  fullName: 'Super Admin',
  role: 'SUPER_ADMIN',
  phoneNumber: null,
  address: null,
  lastEducation: null,
  department: 'CUSTOMER_SUCCESS',
  userPosition: 'SUPER_ADMIN',
  emailVerified: true,
};

async function createAdmin(userData) {
  try {
    const {
      email,
      password,
      fullName,
      role = 'SUPER_ADMIN',
      phoneNumber = null,
      address = null,
      lastEducation = null,
      department = 'CUSTOMER_SUCCESS',
      userPosition = 'SUPER_ADMIN',
      emailVerified = true,
    } = userData;

    console.log('🔍 Checking if admin user already exists...');
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`❌ User with email ${email} already exists!`);
      console.log(`   Role: ${existingUser.role}`);
      console.log(`   ID: ${existingUser.id}`);
      
      // Ask if user wants to update role
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      return new Promise((resolve) => {
        readline.question('   Do you want to update this user to admin? (y/n): ', async (answer) => {
          readline.close();
          
          if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
            // Update user to admin
            const hashedPassword = await bcrypt.hash(password, 12);
            const updatedUser = await prisma.user.update({
              where: { email },
              data: {
                role,
                department,
                userPosition,
                emailVerified: true,
                password: hashedPassword,
              },
            });
            
            console.log(`✅ User updated to ${role} successfully!`);
            console.log(`   Email: ${updatedUser.email}`);
            console.log(`   Role: ${updatedUser.role}`);
            resolve(updatedUser);
          } else {
            console.log('❌ Operation cancelled.');
            resolve(null);
          }
        });
      });
    }

    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 12);

    console.log('👤 Creating admin user...');
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        role,
        phoneNumber,
        address,
        lastEducation,
        department,
        userPosition,
        emailVerified,
        verificationStatus: 'APPROVED',
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        department: true,
        userPosition: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log('\n📋 Admin Details:');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Full Name: ${admin.fullName}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Department: ${admin.department}`);
    console.log(`   Position: ${admin.userPosition}`);
    console.log(`   Email Verified: ${admin.emailVerified}`);
    console.log(`   Created At: ${admin.createdAt}`);
    console.log('\n🔑 Login Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n⚠️  Please change the password after first login!');

    return admin;
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
}

async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);

    let userData;

    if (args.length === 0) {
      // No arguments provided, use default admin
      console.log('📝 No arguments provided, using default admin credentials...');
      userData = DEFAULT_ADMIN;
    } else if (args.length >= 3) {
      // Custom admin data provided
      userData = {
        email: args[0],
        password: args[1],
        fullName: args[2],
        role: args[3] || 'SUPER_ADMIN',
        phoneNumber: args[4] || null,
        address: args[5] || null,
        department: args[6] || 'CUSTOMER_SUCCESS',
        userPosition: args[7] || 'SUPER_ADMIN',
      };
    } else {
      console.log('❌ Invalid arguments!');
      console.log('\nUsage:');
      console.log('  node scripts/create-admin.js');
      console.log('  node scripts/create-admin.js <email> <password> <fullName> [role] [phoneNumber] [address] [department] [userPosition]');
      console.log('\nExamples:');
      console.log('  node scripts/create-admin.js');
      console.log('  node scripts/create-admin.js admin@example.com password123 "Admin User" SUPER_ADMIN');
      console.log('  node scripts/create-admin.js admin@example.com password123 "Admin User" CS_HEAD "081234567890" "Jakarta" CUSTOMER_SUCCESS HEAD');
      process.exit(1);
    }

    console.log('🚀 Starting admin user creation...');
    console.log(`📧 Email: ${userData.email}`);
    console.log(`👤 Full Name: ${userData.fullName}`);
    console.log(`🎭 Role: ${userData.role}`);
    console.log('');

    await createAdmin(userData);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { createAdmin };

