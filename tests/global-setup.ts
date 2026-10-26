import { execSync } from "node:child_process";
import { rmSync } from "node:fs";

// Start every run from an empty test database built from the migrations.
export default function setup() {
  rmSync("prisma/test.db", { force: true });
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
    stdio: "ignore",
  });
}
