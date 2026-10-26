# Investment Matching Platform

A web platform that connects investors with project owners. Project owners publish business ideas with a description, the investment they need and the return they expect. Investors browse approved projects and send investment proposals. Administrators verify users and projects and remove suspicious content.

## Tech stack

| Area | Tool |
| --- | --- |
| Framework | [Next.js 15](https://nextjs.org) (App Router) with React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Database | SQLite through [Prisma 6](https://www.prisma.io) |
| Validation | zod |
| Password hashing | bcryptjs |
| Tests | Vitest |
| Linting | ESLint (`next/core-web-vitals`) |
| Runtime | Node.js 22 (pinned in `mise.toml`) |

## Features

| Feature | Jira | Status |
| --- | --- | --- |
| User registration | DEV-3 | Done |
| Project details page | DEV-6 | In review ([#6](https://github.com/Komil484/investment-platform/pull/6)) |
| User login | DEV-4 | Planned |
| Browse projects | DEV-5 | Planned |
| Create and edit projects | DEV-7, DEV-8 | Planned |
| Submit and view proposals | DEV-9, DEV-10 | Planned |
| Admin approval | DEV-11 | Planned |
| Proposal status | DEV-12 | Planned |

## Getting started

You need Node.js 22 and npm. With [mise](https://mise.jdx.dev) installed, `mise install` picks up the right Node version.

```bash
git clone git@github.com:Komil484/investment-platform.git
cd investment-platform

# The project page and demo data are still in review.
# Until #6 is merged, check out its branch:
git checkout DEV-6-project-details

cp .env.example .env    # points Prisma at prisma/dev.db
npm install             # also generates the Prisma client
npm run db:migrate      # creates prisma/dev.db and its tables
npm run db:seed         # adds the demo data listed below
npm run dev             # http://localhost:3000
```

## Demo data

`npm run db:seed` adds one project owner and three projects. It is safe to run more than once.

| Project | Status | URL |
| --- | --- | --- |
| Rooftop Solar for Small Businesses | Approved | http://localhost:3000/projects/rooftop-solar |
| Farm-to-Table Delivery App | Approved | http://localhost:3000/projects/farm-to-table |
| Coding Bootcamp for Teenagers | Pending | http://localhost:3000/projects/coding-bootcamp |

All three belong to **Omar Owner** (`owner@example.com`, password `password123`). Login is not built yet, so this account is only there to own the projects.

## Trying it out

### Register a user

1. Open http://localhost:3000 and click **Create an account**, or go straight to http://localhost:3000/register.
2. Fill in the form, for example:
   - Full name: `Ivy Investor`
   - Email: `ivy@example.com`
   - Password: `password123`
   - I am joining as: **Investor**
3. Click **Create account**. The page shows "Account created" and welcomes Ivy by name.
4. Go back to `/register` and submit `ivy@example.com` again. The form shows "An account with this email already exists."
5. Try invalid values to see the field errors: a one-letter name, an email without `@`, or a password shorter than 8 characters.

To see the stored account, run `npx prisma studio` and open the **User** table. The password column holds a bcrypt hash, not the password itself.

### Open a project page

1. Open http://localhost:3000/projects/rooftop-solar. The page shows:
   - Category **Energy** and a green **Approved** badge
   - The name, "by Omar Owner" and the listing date
   - Required investment **$120,000** and expected annual return **14%**
   - The full description
2. Open http://localhost:3000/projects/farm-to-table. It shows **$45,000** and **22.5%**.
3. Open http://localhost:3000/projects/coding-bootcamp. It shows **Page not found**, because pending projects are hidden until an administrator approves them.
4. Open any made-up id, such as http://localhost:3000/projects/abc. It also shows **Page not found**.

## Automated tests

```bash
npm test
```

The tests use their own database, `prisma/test.db`, which is recreated on every run, so your demo data is left alone.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server on port 3000 |
| `npm run build` | Build for production |
| `npm start` | Run the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Check types with `tsc` |
| `npm test` | Run the Vitest suite |
| `npm run db:migrate` | Apply migrations to the dev database (and create new ones after schema changes) |
| `npm run db:seed` | Add the demo data |

## Project structure

```
prisma/
  schema.prisma     database models
  migrations/       SQL migrations
  seed.ts           demo data
src/
  app/              pages and server actions (Next.js App Router)
  components/       shared UI components
  lib/              database client, validation, constants, formatting
  server/           data access used by pages and actions
tests/              Vitest tests
```

## Team

Ahmad, Akmal, Komil, Kamoliddin, Nihola
