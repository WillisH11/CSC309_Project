/*
 * Database seeding script - Creates test users for each role
 * Usage: node prisma/seed.js
 */
'use strict';

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Starting database seeding...\n');

        // 1. Create Regular User
        const regularPassword = await bcrypt.hash('Regular123!', 10);
        const regularUser = await prisma.user.create({
            data: {
                utorid: 'regularuser',
                name: 'John Regular',
                email: 'regular@mail.utoronto.ca',
                password: regularPassword,
                role: 'regular',
                birthday: '2000-01-15',
                points: 150,
                verified: true
            }
        });
        console.log('Regular user created successfully');
        console.log(`ID: ${regularUser.id}`);
        console.log(`UTORid: ${regularUser.utorid}`);
        console.log(`Email: ${regularUser.email}`);
        console.log(`Role: ${regularUser.role}`);
        console.log('');

        // 2. Create Cashier User
        const cashierPassword = await bcrypt.hash('Cashier123!', 10);
        const cashierUser = await prisma.user.create({
            data: {
                utorid: 'cashieruser',
                name: 'Sarah Cashier',
                email: 'cashier@mail.utoronto.ca',
                password: cashierPassword,
                role: 'cashier',
                birthday: '1998-05-20',
                points: 50,
                verified: true
            }
        });
        console.log('Cashier user created successfully');
        console.log(`ID: ${cashierUser.id}`);
        console.log(`UTORid: ${cashierUser.utorid}`);
        console.log(`Email: ${cashierUser.email}`);
        console.log(`Role: ${cashierUser.role}`);
        console.log('');

        // 3. Create Manager User
        const managerPassword = await bcrypt.hash('Manager123!', 10);
        const managerUser = await prisma.user.create({
            data: {
                utorid: 'manageruser',
                name: 'Mike Manager',
                email: 'manager@mail.utoronto.ca',
                password: managerPassword,
                role: 'manager',
                birthday: '1995-08-10',
                points: 250,
                verified: true
            }
        });
        console.log('Manager user created successfully');
        console.log(`ID: ${managerUser.id}`);
        console.log(`UTORid: ${managerUser.utorid}`);
        console.log(`Email: ${managerUser.email}`);
        console.log(`Role: ${managerUser.role}`);
        console.log('');

        console.log('========================================');
        console.log('Database seeding completed successfully!');
        console.log('========================================');
        console.log('\nTest user credentials:');
        console.log('\n1. Regular User:');
        console.log('   UTORid: regularuser');
        console.log('   Password: Regular123!');
        console.log('\n2. Cashier User:');
        console.log('   UTORid: cashieruser');
        console.log('   Password: Cashier123!');
        console.log('\n3. Manager User:');
        console.log('   UTORid: manageruser');
        console.log('   Password: Manager123!');

    } catch (error) {
        console.error('Error during seeding:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
