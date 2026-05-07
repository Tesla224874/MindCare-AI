# Production Deployment Guide

## Overview

MindCare.AI is a full-stack Next.js application designed for production deployment. This guide covers:
- Environment configuration
- Database setup
- Admin bootstrap
- Deployment options
- Monitoring and maintenance

## Prerequisites

- Node.js 20.x or later
- PostgreSQL 13.x or later
- A production PostgreSQL database
- A production host (Vercel, AWS, GCP, etc.)

## Step 1: Environment Configuration

### 1.1 Create Production Environment File

Create `.env.production` in `apps/web/` with required variables:

```bash
cp .env.production.example .env.production
```

Then edit `.env.production` with your production values:

```bash
# Database connection (required)
DATABASE_URL="postgresql://user:password@db-host:5432/mindcare_db?schema=public"

# Session security (required, minimum 32 characters, must be random)
AUTH_SECRET="your-super-secure-random-secret-at-least-32-characters"

# Environment
NODE_ENV="production"

# Analysis engine configuration
ANALYSIS_ENGINE="rules"              # or "ai" for AI adapter
ANALYSIS_AI_ENDPOINT=""              # Optional: URL for AI analysis service
ANALYSIS_AI_API_KEY=""               # Optional: API key for AI service
```

### 1.2 Generate AUTH_SECRET

Use this command to generate a secure random secret:

**macOS/Linux:**
```bash
openssl rand -base64 32
```

**Windows PowerShell:**
```powershell
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

**Node.js (any platform):**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Step 2: Database Setup

### 2.1 Create PostgreSQL Database

**AWS RDS, Vercel Postgres, or Supabase:**
1. Create a new PostgreSQL database instance
2. Note the connection string
3. Use that connection string for `DATABASE_URL`

**Local/Self-hosted PostgreSQL:**
```bash
psql -U postgres
CREATE USER mindcare WITH PASSWORD 'your-secure-password';
CREATE DATABASE mindcare_production OWNER mindcare;
```

### 2.2 Run Database Migrations

From `apps/web` directory:

```bash
npm run db:deploy
```

This creates all required tables and schema from `packages/database/prisma/schema.prisma`.

## Step 3: Production Environment Check

Run the production environment validation:

```bash
npm run prod:check
```

This verifies:
- ✅ All required environment variables are set
- ✅ AUTH_SECRET meets security requirements
- ✅ DATABASE_URL is a valid PostgreSQL connection
- ✅ ANALYSIS_ENGINE is valid ("rules" or "ai")
- ✅ If engine is "ai", ANALYSIS_AI_ENDPOINT is configured

## Step 4: Bootstrap Admin User

**IMPORTANT**: Do this BEFORE going live or immediately after deployment.

### 4.1 Local Bootstrap

Run the bootstrap script:

```bash
npm run bootstrap:admin
```

The script will prompt for:
- Organization name (e.g., "Acme Corp")
- Organization slug (e.g., "acme-corp")
- Industry (optional)
- Admin email
- Admin password (minimum 8 characters)

It will create:
- ✅ Organization
- ✅ Default teams (Bienestar, Operaciones, Auditoria)
- ✅ First admin user
- ✅ Initial consent records
- ✅ Audit log entry

### 4.2 Production Bootstrap

Connect to production database and run bootstrap:

```bash
# Set production environment variables
export DATABASE_URL="your-production-db-connection-string"
export AUTH_SECRET="your-production-secret"

# Run bootstrap
npm run bootstrap:admin
```

Or from CI/CD pipeline after deployment.

## Step 5: Build & Deploy

### 5.1 Vercel Deployment

**Via Git Integration (recommended):**
1. Push code to GitHub/GitLab/Bitbucket
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `NODE_ENV` = "production"
   - `ANALYSIS_ENGINE` = "rules"
4. Enable "Build & Deploy" on push
5. Redeploy after configuration

**Manual Deployment:**
```bash
npm install -g vercel
vercel --prod
```

### 5.2 Other Platforms

**Docker (self-hosted, AWS ECS, GCP Run, etc.):**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

**AWS (EC2, ELB, RDS):**
1. Configure EC2 instance with Node.js 20.x
2. Clone repository
3. Set environment variables
4. Run `npm install && npm run web:build`
5. Use PM2 or similar for process management
6. Configure load balancer to forward to port 3000

**Google Cloud (Cloud Run):**
```bash
gcloud run deploy mindcare-ai \
  --source . \
  --platform managed \
  --set-env-vars="DATABASE_URL=YOUR_DB_URL,AUTH_SECRET=YOUR_SECRET,NODE_ENV=production"
```

## Step 6: First Login

1. Navigate to your production URL
2. Go to `/login`
3. Enter the admin email and password from bootstrap
4. Create additional users and teams via the dashboard

## Monitoring & Maintenance

### Regular Checks

```bash
# Run periodic checks (weekly recommended)
npm run prod:check

# Monitor database
npm run db:status

# View audit logs in dashboard or database
SELECT * FROM "AuditLog" ORDER BY "createdAt" DESC LIMIT 100;
```

### Database Backups

Ensure your PostgreSQL provider has automatic backups enabled:
- **Vercel Postgres**: Daily automatic backups
- **AWS RDS**: Configure automated backups (7+ day retention)
- **Supabase**: Daily automatic backups
- **Self-hosted**: Set up pg_dump scripts with cron

### Scaling

As you grow, consider:
1. **Dedicated database**: Migrate from shared tier to dedicated PostgreSQL
2. **Connection pooling**: Use PgBouncer for connection management
3. **Read replicas**: For read-heavy workloads
4. **CDN**: Vercel Edge Network included; add Cloudflare if self-hosted
5. **Auto-scaling**: Vercel auto-scales; configure ASG for self-hosted

## Security Checklist

- [ ] `AUTH_SECRET` is strong (32+ random characters)
- [ ] `DATABASE_URL` uses SSL/TLS connection
- [ ] Production environment variables are not committed to git
- [ ] Firewall restricts database access to app servers only
- [ ] HTTPS is enabled (automatic on Vercel)
- [ ] Regular security updates for Node.js and dependencies
- [ ] SSH access to servers is restricted
- [ ] Database backups are encrypted and tested
- [ ] Audit logs are monitored for suspicious activity

## Troubleshooting

### Database Connection Failed
```
Error: ECONNREFUSED 5432
```
**Solution**: Verify `DATABASE_URL` is correct and database is accessible

### AUTH_SECRET Validation Failed
```
Error: AUTH_SECRET must be a strong secret with at least 32 characters
```
**Solution**: Generate a new secret using the commands in Step 1.2

### Bootstrap Script Hangs
**Solution**: Ensure `DATABASE_URL` points to accessible PostgreSQL and environment variables are loaded

### Build Fails with Missing Packages
**Solution**: 
```bash
npm install
npm run build
```

### Application Won't Start
```
Error: database server closed the connection unexpectedly
```
**Solution**: 
1. Check `DATABASE_URL` connection
2. Verify database migrations ran successfully
3. Check database user has correct permissions

## Rolling Back

If deployment fails:

1. Revert to previous commit
2. Redeploy with previous working build
3. Database schema changes are additive and backward-compatible

To rollback database migrations:
```bash
npm run db:migrate -- --name recovery_rollback
# Edit new migration file to remove changes
npm run db:deploy
```

## Performance Optimization

- Enable HTTP/2 Server Push (Vercel default)
- Use Next.js Image Optimization (automatic)
- Enable gzip compression (Vercel default)
- Monitor Core Web Vitals in Vercel Analytics
- Consider caching strategies for dashboard queries

## Support

For deployment issues:
1. Check `/logs` endpoint if available
2. Review application logs: `npm run web:build` output
3. Verify environment variables: `npm run prod:check`
4. Check database connectivity: `psql -c "SELECT NOW();" $DATABASE_URL`
