import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load .env explicitly
dotenv.config({ path: join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
        console.error('❌ Error: ADMIN_EMAIL or ADMIN_PASSWORD not found in .env');
        process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            password: hashedPassword, // Update password if it changes in .env
            role: 'ADMIN'
        },
        create: {
            email: adminEmail,
            name: 'System Administrator',
            password: hashedPassword,
            role: 'ADMIN',
        },
    });

    console.log('✅ Admin account synced via Environment Variables:');
    console.log('Admin Email:', adminEmail);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
