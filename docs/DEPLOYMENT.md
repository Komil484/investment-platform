# Infrastructure Deployment & Runbook Guide
**Author:** Lead Infrastructure & DevOps Engineer  
**Project:** Investment Matching Platform  

---

## 1. System Architecture Overview
The Investment Matching Platform utilizes a modern web stack containerized via Docker and orchestrated for production execution.

- **Application Runtime:** Next.js 15 (Node.js 22)
- **Database:** SQLite via Prisma ORM 6
- **Reverse Proxy / SSL:** Caddy Server
- **CI/CD:** GitHub Actions
- **Containerization:** Multi-stage Docker

---

## 2. Local Container Execution
To build and run the production container locally:

\\\ash
# Build and start services in detached mode
docker compose up -d --build

# Verify container status and health
docker compose ps

# View container logs
docker compose logs -f
\\\

---

## 3. Production Deployment Guide
To deploy to a cloud VPS instance (Ubuntu 24.04 LTS):

1. **Provision VPS & Point DNS:** Point domain A record to VPS public IP.
2. **Install Docker Engine:**
   \\\ash
   apt update && apt install -y docker.io docker-compose-v2 caddy
   \\\
3. **Clone Repo & Configure Secrets:**
   \\\ash
   git clone https://github.com/Komil484/investment-platform.git /app
   cd /app
   cp .env.production.example .env
   \\\
4. **Run Migrations & Seed Data:**
   \\\ash
   npx prisma migrate deploy
   npx prisma db seed
   \\\
5. **Start Application & Reverse Proxy:**
   \\\ash
   docker compose up -d --build
   caddy start --config Caddyfile
   \\\

---

## 4. Continuous Integration Pipeline
The \.github/workflows/ci.yml\ pipeline triggers on pushes to main branches and executes:
1. Automated dependency installation (\
pm ci\)
2. Prisma client generation (\
px prisma generate\)
3. Static typechecking (\
pm run typecheck\)
4. Linting (\
pm run lint\)
5. Unit tests (\
pm test\)
6. Next.js production compilation (\
pm run build\)
