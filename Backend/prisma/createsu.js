/*
 * Complete this script so that it is able to add a superuser to the database
 * Usage example:
 *   node prisma/createsu.js clive123 clive.su@mail.utoronto.ca SuperUser123!
 */
'use strict';

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    const args = process.argv.slice(2);

    if (args.length !== 3) {
        console.error('Usage: node prisma/createsu.js <utorid> <email> <password>');
        process.exit(1);
    }

    const [utorid, email, password] = args;

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the superuser
        const user = await prisma.user.create({
            data: {
                utorid: utorid,
                name: 'Superuser',
                email: email,
                password: hashedPassword,
                role: 'superuser',
                verified: true,
            }
        });

        console.log('Superuser created successfully');
        console.log(`ID: ${user.id}`);
        console.log(`UTORid: ${user.utorid}`);
        console.log(`Email: ${user.email}`);

    } catch (error) {
        console.error('Error creating superuser:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
