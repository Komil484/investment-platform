import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const isProduction = process.env.NODE_ENV === "production";

// Demo data for local development. Password for every demo account: "password123"
// In production only the admin account is created (see below).
async function main() {
  await seedAdmin();

  if (isProduction) {
    console.log("Production: admin account ensured, demo data skipped.");
    return;
  }

  const passwordHash = await bcrypt.hash("password123", 10);

  // `update: { verified }` means re-running the seed also fixes accounts that
  // already exist (for example ones created before the `verified` column was added).
  const upsertUser = (email: string, name: string, role: string) =>
    db.user.upsert({
      where: { email },
      update: { verified: true },
      create: { email, name, role, passwordHash, verified: true },
    });

  const owner = await upsertUser("owner@example.com", "Omar Owner", "OWNER");
  await upsertUser("investor@example.com", "Ian Investor", "INVESTOR");

  // Fixed ids keep the demo URLs the same on every machine (see README).
  const projects = [
    {
      id: "rooftop-solar",
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
      id: "farm-to-table",
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
      id: "coding-bootcamp",
      name: "Coding Bootcamp for Teenagers",
      category: "Education",
      requiredAmount: 30000,
      expectedReturn: 10,
      status: "PENDING",
      description:
        "Weekend programming courses for students aged 13–17, focusing on web development and " +
        "practical projects. Funds go toward classroom rental, laptops, and instructor salaries.",
    },
  ];

  for (const project of projects) {
    await db.project.upsert({
      where: { id: project.id },
      update: {},
      create: { ...project, ownerId: owner.id },
    });
  }

  console.log("Approved projects are listed at http://localhost:3000/projects");
  for (const p of await db.project.findMany({ orderBy: { createdAt: "asc" } })) {
    console.log(`${p.status.padEnd(8)} http://localhost:3000/projects/${p.id}  ${p.name}`);
  }
}

// The admin account. Credentials come from the environment so no password
// is hardcoded in production. Locally it falls back to the demo values.
async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@example.com").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "password123";
  const name = process.env.ADMIN_NAME ?? "Alex Admin";

  if (isProduction && !process.env.ADMIN_PASSWORD) {
    throw new Error("Set ADMIN_PASSWORD before seeding in production.");
  }
  if (isProduction && password.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters in production.");
  }

  await db.user.upsert({
    where: { email },
    // Re-running the seed makes sure the admin is verified and not suspended,
    // but never overwrites an existing password.
    update: { role: "ADMIN", verified: true, suspended: false },
    create: {
      email,
      name,
      role: "ADMIN",
      verified: true,
      passwordHash: await bcrypt.hash(password, 10),
    },
  });

  console.log(`Admin account ready: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());