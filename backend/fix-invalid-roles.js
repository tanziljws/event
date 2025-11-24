require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixInvalidRoles() {
    try {
        console.log('🔄 Fixing invalid OPS_SENIOR_AGENT roles...');

        // Use raw query to bypass enum validation
        const result = await prisma.$executeRaw`
      UPDATE users 
      SET role = 'OPS_AGENT'::user_role 
      WHERE role::text = 'OPS_SENIOR_AGENT'
    `;

        console.log(`✅ Fixed ${result} user(s) with invalid role`);

        // Verify
        const users = await prisma.user.findMany({
            where: {
                role: 'OPS_AGENT'
            },
            select: {
                email: true,
                role: true
            }
        });

        console.log('\n✅ OPS_AGENT users:');
        console.table(users);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

fixInvalidRoles();
