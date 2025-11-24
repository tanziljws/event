require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetPassword() {
    try {
        console.log('🔄 Resetting password for SUPER_ADMIN users...');

        // Hash untuk password "superadmin123"
        const hashedPassword = '$2a$10$0fMZAGc26bh/cdiOYfN1N.XtYqvT1OocwsWcinyZdoXOnq872pMjm';

        const result = await prisma.user.updateMany({
            where: {
                email: {
                    in: ['superadmin@nusaevent.com', 'admin@nusaevent.com']
                },
                role: 'SUPER_ADMIN'
            },
            data: {
                password: hashedPassword
            }
        });

        console.log(`✅ Password updated for ${result.count} user(s)`);
        console.log('');
        console.log('📝 Login credentials:');
        console.log('   Email: superadmin@nusaevent.com');
        console.log('   Password: superadmin123');
        console.log('');
        console.log('   atau');
        console.log('');
        console.log('   Email: admin@nusaevent.com');
        console.log('   Password: superadmin123');

        // Verify
        const users = await prisma.user.findMany({
            where: {
                email: {
                    in: ['superadmin@nusaevent.com', 'admin@nusaevent.com']
                }
            },
            select: {
                email: true,
                role: true,
                emailVerified: true,
                verificationStatus: true
            }
        });

        console.log('\n✅ Verified users:');
        console.table(users);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetPassword();
