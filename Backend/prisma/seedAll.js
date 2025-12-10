/*
 * Comprehensive Database Seeding Script
 * Seeds: Users (all roles), Transactions, Events, Promotions, RSVPs
 * Usage: node prisma/seedAll.js
 */
'use strict';

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('🌱 Starting comprehensive database seeding...\n');

        // ======================
        // 0. CLEAR EXISTING DATA
        // ======================
        console.log('🗑️  Clearing existing data...');

        await prisma.transactionPromotion.deleteMany({});
        await prisma.promotionUsage.deleteMany({});
        await prisma.eventGuest.deleteMany({});
        await prisma.eventOrganizer.deleteMany({});
        await prisma.transaction.deleteMany({});
        await prisma.event.deleteMany({});
        await prisma.promotion.deleteMany({});
        await prisma.user.deleteMany({});

        console.log('✓ Existing data cleared\n');

        // ======================
        // 1. CREATE USERS
        // ======================
        console.log('👥 Creating users...');

        const regularPassword = await bcrypt.hash('Regular123!', 10);
        const regularUser = await prisma.user.create({
            data: {
                utorid: 'regularuser',
                name: 'John Regular',
                email: 'regular@mail.utoronto.ca',
                password: regularPassword,
                role: 'regular',
                birthday: '2000-01-15',
                points: 251,
                verified: true
            }
        });
        console.log('✓ Regular user created');

        const cashierPassword = await bcrypt.hash('Cashier123!', 10);
        const cashierUser = await prisma.user.create({
            data: {
                utorid: 'cashieruser',
                name: 'Sarah Cashier',
                email: 'cashier@mail.utoronto.ca',
                password: cashierPassword,
                role: 'cashier',
                birthday: '1998-05-20',
                points: 75,
                verified: true
            }
        });
        console.log('✓ Cashier user created');

        const managerPassword = await bcrypt.hash('Manager123!', 10);
        const managerUser = await prisma.user.create({
            data: {
                utorid: 'manageruser',
                name: 'Mike Manager',
                email: 'manager@mail.utoronto.ca',
                password: managerPassword,
                role: 'manager',
                birthday: '1995-08-10',
                points: 300,
                verified: true
            }
        });
        console.log('✓ Manager user created');

        // Create a few more regular users for realistic data
        const user2Password = await bcrypt.hash('User123!', 10);
        const user2 = await prisma.user.create({
            data: {
                utorid: 'alicewu',
                name: 'Alice Wu',
                email: 'alice.wu@mail.utoronto.ca',
                password: user2Password,
                role: 'regular',
                birthday: '2001-03-22',
                points: 180,
                verified: true
            }
        });
        console.log('✓ Additional user 1 created');

        const user3Password = await bcrypt.hash('User123!', 10);
        const user3 = await prisma.user.create({
            data: {
                utorid: 'bobchen',
                name: 'Bob Chen',
                email: 'bob.chen@mail.utoronto.ca',
                password: user3Password,
                role: 'regular',
                birthday: '1999-11-05',
                points: 420,
                verified: true
            }
        });
        console.log('✓ Additional user 2 created');

        const user4Password = await bcrypt.hash('User123!', 10);
        const user4 = await prisma.user.create({
            data: {
                utorid: 'emilyjohn',
                name: 'Emily Johnson',
                email: 'emily.j@mail.utoronto.ca',
                password: user4Password,
                role: 'regular',
                birthday: '2002-07-18',
                points: 95,
                verified: true
            }
        });
        console.log('✓ Additional user 3 created\n');

        // ======================
        // 2. CREATE PROMOTIONS
        // ======================
        console.log('🎁 Creating promotions...');

        const promo1 = await prisma.promotion.create({
            data: {
                name: 'Holiday Bonus',
                description: 'Earn 1.5x points on all purchases this month!',
                type: 'automatic',
                startTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                endTime: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
                minSpending: 10.0,
                rate: 1.5,
            }
        });
        console.log('✓ Automatic promotion created');

        const promo2 = await prisma.promotion.create({
            data: {
                name: 'First Purchase Bonus',
                description: 'Get 50 bonus points on your first purchase over $25',
                type: 'onetime',
                startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                endTime: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
                minSpending: 25.0,
                points: 50,
            }
        });
        console.log('✓ One-time promotion created\n');

        // ======================
        // 3. CREATE TRANSACTIONS
        // ======================
        console.log('💰 Creating transactions for chart data...');

        // Regular user transactions (for timeline chart)
        const transactions = [];

        // Purchase transaction 1 (10 days ago)
        transactions.push(await prisma.transaction.create({
            data: {
                type: 'purchase',
                userId: regularUser.id,
                amount: 100,
                spent: 25.0,
                createdById: cashierUser.id,
                createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            }
        }));

        // Purchase transaction 2 (8 days ago)
        transactions.push(await prisma.transaction.create({
            data: {
                type: 'purchase',
                userId: regularUser.id,
                amount: 80,
                spent: 20.0,
                createdById: cashierUser.id,
                createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
            }
        }));

        // Event transaction (5 days ago)
        transactions.push(await prisma.transaction.create({
            data: {
                type: 'event',
                userId: regularUser.id,
                amount: 50,
                createdById: managerUser.id,
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            }
        }));

        // Transfer transaction (3 days ago)
        transactions.push(await prisma.transaction.create({
            data: {
                type: 'transfer',
                userId: regularUser.id,
                amount: 20,
                relatedId: user2.id,
                createdById: regularUser.id,
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            }
        }));

        // Purchase transaction 3 (1 day ago)
        transactions.push(await prisma.transaction.create({
            data: {
                type: 'purchase',
                userId: regularUser.id,
                amount: 1,
                spent: 0.25,
                createdById: cashierUser.id,
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            }
        }));

        console.log('✓ Created 5 transactions for regular user');

        // More transactions for other users
        await prisma.transaction.create({
            data: {
                type: 'purchase',
                userId: user2.id,
                amount: 120,
                spent: 30.0,
                createdById: cashierUser.id,
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            }
        });

        await prisma.transaction.create({
            data: {
                type: 'purchase',
                userId: user3.id,
                amount: 200,
                spent: 50.0,
                createdById: cashierUser.id,
                createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
            }
        });

        await prisma.transaction.create({
            data: {
                type: 'event',
                userId: user3.id,
                amount: 100,
                createdById: managerUser.id,
                createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            }
        });

        await prisma.transaction.create({
            data: {
                type: 'purchase',
                userId: user4.id,
                amount: 60,
                spent: 15.0,
                createdById: cashierUser.id,
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            }
        });

        console.log('✓ Created transactions for other users\n');

        // ======================
        // 4. CREATE EVENTS
        // ======================
        console.log('📅 Creating events with attendance...');

        // Event 1: Upcoming - Medium attendance
        const event1 = await prisma.event.create({
            data: {
                name: 'Web Development Workshop',
                description: 'Learn React, Node.js, and full-stack development. Pizza provided!',
                location: 'BA3200 - Bahen Centre',
                startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
                capacity: 30,
                points: 100,
                pointsRemain: 100,
                pointsAwarded: 0,
                published: true,
            }
        });

        // Add organizer
        await prisma.eventOrganizer.create({
            data: {
                eventId: event1.id,
                userId: managerUser.id,
            }
        });

        // Add 15 guests (50% capacity)
        const event1Guests = [regularUser, user2, user3, user4, cashierUser];
        for (const guest of event1Guests) {
            await prisma.eventGuest.create({
                data: {
                    eventId: event1.id,
                    userId: guest.id,
                }
            });
        }
        console.log('✓ Event 1 created with 5 guests');

        // Event 2: Upcoming - High attendance (almost full)
        const event2 = await prisma.event.create({
            data: {
                name: 'CSSU Board Game Night',
                description: 'Board games, snacks, and great company!',
                location: 'BA2165 - CSSU Office',
                startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
                capacity: 20,
                points: 50,
                pointsRemain: 50,
                pointsAwarded: 0,
                published: true,
            }
        });

        await prisma.eventOrganizer.create({
            data: {
                eventId: event2.id,
                userId: managerUser.id,
            }
        });

        // Add 18 guests (90% capacity)
        const event2Guests = [regularUser, user2, user3, user4];
        for (const guest of event2Guests) {
            await prisma.eventGuest.create({
                data: {
                    eventId: event2.id,
                    userId: guest.id,
                }
            });
        }
        console.log('✓ Event 2 created with 4 guests (high attendance)');

        // Event 3: Upcoming - Unlimited capacity
        const event3 = await prisma.event.create({
            data: {
                name: 'Industry Panel: Careers in Tech',
                description: 'Hear from professionals at Google, Microsoft, Shopify and more!',
                location: 'SF1101 - Sidney Smith Hall',
                startTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                endTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
                capacity: null, // Unlimited
                points: 150,
                pointsRemain: 150,
                pointsAwarded: 0,
                published: true,
            }
        });

        await prisma.eventOrganizer.create({
            data: {
                eventId: event3.id,
                userId: managerUser.id,
            }
        });

        const event3Guests = [regularUser, user2, user3];
        for (const guest of event3Guests) {
            await prisma.eventGuest.create({
                data: {
                    eventId: event3.id,
                    userId: guest.id,
                }
            });
        }
        console.log('✓ Event 3 created with 3 guests (unlimited capacity)');

        // Event 4: Upcoming - Low attendance
        const event4 = await prisma.event.create({
            data: {
                name: 'CSSU Mini Hackathon',
                description: '24-hour hackathon with prizes! Meals provided.',
                location: 'BA3175 - Bahen Centre',
                startTime: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
                endTime: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
                capacity: 50,
                points: 200,
                pointsRemain: 200,
                pointsAwarded: 0,
                published: true,
            }
        });

        await prisma.eventOrganizer.create({
            data: {
                eventId: event4.id,
                userId: managerUser.id,
            }
        });

        const event4Guests = [regularUser, user3];
        for (const guest of event4Guests) {
            await prisma.eventGuest.create({
                data: {
                    eventId: event4.id,
                    userId: guest.id,
                }
            });
        }
        console.log('✓ Event 4 created with 2 guests (low attendance)');

        // Event 5: Past Event - Full capacity (for chart)
        const event5 = await prisma.event.create({
            data: {
                name: 'Python Workshop - ML Basics',
                description: 'Intro to Machine Learning with Python',
                location: 'BA2185',
                startTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                endTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
                capacity: 25,
                points: 75,
                pointsRemain: 0,
                pointsAwarded: 75,
                published: true,
            }
        });

        await prisma.eventOrganizer.create({
            data: {
                eventId: event5.id,
                userId: managerUser.id,
            }
        });

        const event5Guests = [regularUser, user2, user3, user4, cashierUser];
        for (const guest of event5Guests) {
            await prisma.eventGuest.create({
                data: {
                    eventId: event5.id,
                    userId: guest.id,
                    confirmedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                }
            });
        }
        console.log('✓ Event 5 created (past, full)');

        // Event 6: Past Event - Partial attendance
        const event6 = await prisma.event.create({
            data: {
                name: 'Fall BBQ Social',
                description: 'CSSU annual fall BBQ with burgers and veggie options!',
                location: 'King\'s College Circle',
                startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                endTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
                capacity: 40,
                points: 100,
                pointsRemain: 60,
                pointsAwarded: 40,
                published: true,
            }
        });

        await prisma.eventOrganizer.create({
            data: {
                eventId: event6.id,
                userId: managerUser.id,
            }
        });

        const event6Guests = [user2, user3, user4];
        for (const guest of event6Guests) {
            await prisma.eventGuest.create({
                data: {
                    eventId: event6.id,
                    userId: guest.id,
                    confirmedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                }
            });
        }
        console.log('✓ Event 6 created (past)');

        // Event 7: Upcoming - FULL (for color coding test)
        const event7 = await prisma.event.create({
            data: {
                name: 'Study Session - Exam Prep',
                description: 'Group study session for CSC309 final exam',
                location: 'BA2200',
                startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
                capacity: 5,
                points: 25,
                pointsRemain: 25,
                pointsAwarded: 0,
                published: true,
            }
        });

        await prisma.eventOrganizer.create({
            data: {
                eventId: event7.id,
                userId: managerUser.id,
            }
        });

        const event7Guests = [regularUser, user2, user3, user4, cashierUser];
        for (const guest of event7Guests) {
            await prisma.eventGuest.create({
                data: {
                    eventId: event7.id,
                    userId: guest.id,
                }
            });
        }
        console.log('✓ Event 7 created (FULL - 5/5 capacity)\n');

        // Event 8: Unpublished draft
        const event8 = await prisma.event.create({
            data: {
                name: 'Winter Networking Night',
                description: 'DRAFT: Connect with alumni and industry professionals.',
                location: 'TBD',
                startTime: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
                endTime: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
                capacity: 30,
                points: 100,
                pointsRemain: 100,
                pointsAwarded: 0,
                published: false, // DRAFT
            }
        });

        await prisma.eventOrganizer.create({
            data: {
                eventId: event8.id,
                userId: managerUser.id,
            }
        });
        console.log('✓ Event 8 created (draft - unpublished)\n');

        // ======================
        // SUMMARY
        // ======================
        console.log('========================================');
        console.log('✅ Database seeding completed successfully!');
        console.log('========================================\n');

        console.log('📊 Summary:');
        console.log('  Users:        6 (1 Regular, 1 Cashier, 1 Manager, 3 Additional Regular)');
        console.log('  Transactions: 9 (for chart data)');
        console.log('  Events:       8 (7 published, 1 draft)');
        console.log('  Event Guests: ~25 RSVPs across events');
        console.log('  Promotions:   2 (1 automatic, 1 one-time)\n');

        console.log('🔐 Demo Credentials:');
        console.log('  Regular User: regularuser / Regular123!');
        console.log('  Cashier:      cashieruser / Cashier123!');
        console.log('  Manager:      manageruser / Manager123!\n');

        console.log('📈 Charts Will Display:');
        console.log('  ✓ Points Timeline (user dashboard)');
        console.log('  ✓ Points Breakdown (user dashboard)');
        console.log('  ✓ Event Attendance (manager/organizer dashboards)\n');

    } catch (error) {
        console.error('❌ Error during seeding:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
