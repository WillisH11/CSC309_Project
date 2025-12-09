const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedEvents() {
  console.log("Seeding events...\n");

  try {
    // Get a manager user to create events
    const manager = await prisma.user.findFirst({
      where: {
        role: { in: ["manager", "superuser"] },
      },
    });

    if (!manager) {
      console.error(
        "No manager or superuser found. Please create a user with manager role first."
      );
      console.log("\nRun this command to create a superuser:");
      console.log("  node prisma/createsu.js\n");
      return;
    }

    console.log(`Using manager: ${manager.name} (${manager.utorid})\n`);

    // Event 1: Upcoming Tech Talk
    const event1 = await prisma.event.create({
      data: {
        name: "Web Development Workshop",
        description:
          "Learn the latest in React, Node.js, and full-stack development. This hands-on workshop will cover:\n\n- Modern React patterns and hooks\n- Building RESTful APIs with Express\n- Database design with Prisma\n- Deployment strategies\n\nBring your laptop! Pizza and drinks provided.",
        location: "BA3200 - Bahen Centre",
        startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        endTime: new Date(
          Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000
        ), // 2 hours later
        capacity: 30,
        points: 100,
        pointsRemain: 100,
        pointsAwarded: 0,
        published: true,
      },
    });
    console.log(`Created: ${event1.name}`);

    // Event 2: Upcoming Social Event
    const event2 = await prisma.event.create({
      data: {
        name: "CSSU Board Game Night",
        description:
          "Join us for a fun evening of board games, snacks, and socializing!\n\nWe'll have:\n- Classic board games (Monopoly, Settlers of Catan, etc.)\n- Card games\n- Snacks and refreshments\n- Great company!\n\nAll skill levels welcome. No experience necessary!",
        location: "BA2165 - CSSU Office",
        startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        endTime: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000
        ), // 3 hours later
        capacity: 20,
        points: 50,
        pointsRemain: 50,
        pointsAwarded: 0,
        published: true,
      },
    });
    console.log(`Created: ${event2.name}`);

    // Event 3: Upcoming Career Event (Unlimited capacity)
    const event3 = await prisma.event.create({
      data: {
        name: "Industry Panel: Careers in Tech",
        description:
          "Hear from professionals working at top tech companies including Google, Microsoft, Shopify, and more.\n\nTopics covered:\n- Breaking into the industry\n- Interview preparation\n- Career growth and development\n- Work-life balance in tech\n\nQ&A session at the end. Network with panelists after the event!",
        location: "SF1101 - Sidney Smith Hall",
        startTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        endTime: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000
        ), // 2 hours later
        capacity: null, // Unlimited
        points: 150,
        pointsRemain: 150,
        pointsAwarded: 0,
        published: true,
      },
    });
    console.log(`Created: ${event3.name}`);

    // Event 4: Upcoming Hackathon
    const event4 = await prisma.event.create({
      data: {
        name: "CSSU Mini Hackathon",
        description:
          "Join us for a 24-hour hackathon! Build amazing projects, win prizes, and have fun.\n\nPrizes:\n- 1st Place: $500 + 200 bonus points\n- 2nd Place: $300 + 150 bonus points\n- 3rd Place: $200 + 100 bonus points\n\nMeals and snacks provided throughout the event. Beginner-friendly!",
        location: "BA3175 - Bahen Centre",
        startTime: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        endTime: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000), // 24 hours later
        capacity: 50,
        points: 200,
        pointsRemain: 200,
        pointsAwarded: 0,
        published: true,
      },
    });
    console.log(`Created: ${event4.name}`);

    // Event 5: Past Event (for testing)
    const event5 = await prisma.event.create({
      data: {
        name: "Python Workshop - Intro to Machine Learning",
        description:
          "An introductory workshop covering basic ML concepts using Python and scikit-learn.",
        location: "BA2185",
        startTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        endTime: new Date(
          Date.now() - 10 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000
        ), // 2 hours later
        capacity: 25,
        points: 75,
        pointsRemain: 50,
        pointsAwarded: 25,
        published: true,
      },
    });
    console.log(`Created: ${event5.name}`);

    // Event 6: Past Event (Full)
    const event6 = await prisma.event.create({
      data: {
        name: "Fall BBQ Social",
        description:
          "CSSU's annual fall BBQ with burgers, hot dogs, and veggie options!",
        location: "King's College Circle",
        startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        endTime: new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000
        ),
        capacity: 40,
        points: 100,
        pointsRemain: 0,
        pointsAwarded: 100,
        published: true,
      },
    });
    console.log(`Created: ${event6.name}`);

    // Event 7: Unpublished Draft (for managers to see)
    const event7 = await prisma.event.create({
      data: {
        name: "Winter Networking Night",
        description:
          "DRAFT: Details TBD. Connect with alumni and industry professionals.",
        location: "TBD",
        startTime: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        endTime: new Date(
          Date.now() + 60 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000
        ),
        capacity: 30,
        points: 100,
        pointsRemain: 100,
        pointsAwarded: 0,
        published: false, // DRAFT
      },
    });
    console.log(`Created: ${event7.name} (DRAFT)`);

    console.log("\n Successfully seeded 7 events!");
    console.log("\n Summary:");
    console.log("   - 4 upcoming events (published)");
    console.log("   - 2 past events (published)");
    console.log("   - 1 draft event (unpublished)");
    console.log("\n You can now test the Events page!\n");
  } catch (error) {
    console.error(" Error seeding events:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedEvents().catch((e) => {
  console.error(e);
  process.exit(1);
});
