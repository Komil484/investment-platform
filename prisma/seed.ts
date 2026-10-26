import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// Demo data for local development. Password for the demo owner: "password123"
async function main() {
  const owner = await db.user.upsert({
    where: { email: "owner@example.com" },
    update: {},
    create: {
      email: "owner@example.com",
      name: "Omar Owner",
      role: "OWNER",
      passwordHash: await bcrypt.hash("password123", 10),
    },
  });

  if ((await db.project.count()) === 0) {
    await db.project.createMany({
      data: [
        {
          ownerId: owner.id,
          name: "Rooftop Solar for Small Businesses",
          category: "Energy",
          requiredAmount: 120000,
          expectedReturn: 14,
          status: "APPROVED",
          description:
            "We install and maintain rooftop solar panels for small shops and workshops on a lease model. " +
            "Customers pay a fixed monthly fee lower than their current electricity bill, and we keep the " +
            "energy credits. Funding will cover equipment for the first 40 installations.",
        },
        {
          ownerId: owner.id,
          name: "Farm-to-Table Delivery App",
          category: "Agriculture",
          requiredAmount: 45000,
          expectedReturn: 22.5,
          status: "APPROVED",
          description:
            "A mobile app connecting local farmers directly with households and restaurants. Farmers list " +
            "produce daily; we handle ordering, payments and same-day delivery through partner couriers.",
        },
        {
          ownerId: owner.id,
          name: "Coding Bootcamp for Teenagers",
          category: "Education",
          requiredAmount: 30000,
          expectedReturn: 10,
          status: "PENDING",
          description:
            "Weekend programming courses for students aged 13–17, focusing on web development and " +
            "practical projects. Funds go toward classroom rental, laptops, and instructor salaries.",
        },
      ],
    });
  }

  // There is no project list page yet (DEV-5), so print where to find each project.
  for (const p of await db.project.findMany({ orderBy: { createdAt: "asc" } })) {
    console.log(`${p.status.padEnd(8)} http://localhost:3000/projects/${p.id}  ${p.name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
