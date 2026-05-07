import { randomBytes, scryptSync } from "node:crypto";
import process from "node:process";
import readline from "node:readline";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

process.loadEnvFile(".env");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is required to bootstrap the database.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
  log: ["error", "warn"],
});

function hashPassword(password) {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, 64).toString("base64url");

  return `scrypt$${salt}$${hash}`;
}

async function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

async function question(rl, prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function confirmAction(rl, message) {
  const answer = await question(rl, `${message} (yes/no): `);
  return answer.toLowerCase() === "yes" || answer.toLowerCase() === "y";
}

async function bootstrap() {
  console.log("\n🚀 MindCare.AI Production Bootstrap\n");
  console.log(
    "This script will create the first admin user and organization for your production environment.",
  );

  const rl = await createInterface();

  try {
    // Collect organization data
    console.log("\n--- Organization Setup ---");
    const orgName = await question(rl, "Organization name: ");
    const orgSlug =
      (await question(
        rl,
        `Organization slug [${orgName.toLowerCase().replace(/\s+/g, "-")}]: `,
      )) || orgName.toLowerCase().replace(/\s+/g, "-");
    const industry = await question(rl, "Industry (optional): ");

    // Collect admin user data
    console.log("\n--- Admin User Setup ---");
    const adminEmail = await question(rl, "Admin email: ");
    const adminName = await question(rl, "Admin name: ");

    // Get password securely
    console.log("Note: Password will not be displayed as you type");
    const adminPassword = await new Promise((resolve) => {
      rl.question("Admin password: ", (answer) => {
        // Hide input by overwriting with stars
        process.stdout.write("\r" + " ".repeat(50) + "\r");
        resolve(answer);
      });
    });

    if (!adminPassword || adminPassword.length < 8) {
      console.error("❌ Password must be at least 8 characters.");
      process.exit(1);
    }

    // Review configuration
    console.log("\n--- Review Configuration ---");
    console.log(`Organization: ${orgName}`);
    console.log(`Slug: ${orgSlug}`);
    console.log(`Industry: ${industry || "(not specified)"}`);
    console.log(`Admin Email: ${adminEmail}`);
    console.log(`Admin Name: ${adminName}`);

    const proceed = await confirmAction(
      rl,
      "\nCreate production admin user and organization?",
    );
    if (!proceed) {
      console.log("❌ Bootstrap cancelled.");
      process.exit(0);
    }

    console.log("\n🔄 Creating organization and admin user...\n");

    // Create organization
    const organization = await prisma.organization.create({
      data: {
        name: orgName,
        slug: orgSlug,
        industry: industry || null,
        premiumFacial: false,
      },
    });

    console.log(`✅ Organization created: ${organization.id}`);

    // Create default teams
    const defaultTeams = ["Bienestar", "Operaciones", "Auditoria"];
    const teams = new Map();

    for (const teamName of defaultTeams) {
      const team = await prisma.team.create({
        data: {
          organizationId: organization.id,
          name: teamName,
        },
      });

      teams.set(teamName, team);
      console.log(`✅ Team created: ${teamName}`);
    }

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        organizationId: organization.id,
        teamId: teams.get("Bienestar")?.id || null,
        email: adminEmail,
        name: adminName,
        role: "ADMIN",
        passwordHash: hashPassword(adminPassword),
        isActive: true,
      },
    });

    console.log(`✅ Admin user created: ${adminUser.id}`);

    // Create initial consents for admin
    await prisma.consent.createMany({
      data: [
        {
          userId: adminUser.id,
          source: "TEXT",
          status: "GRANTED",
          grantedAt: new Date(),
        },
        {
          userId: adminUser.id,
          source: "WORKLOAD",
          status: "GRANTED",
          grantedAt: new Date(),
        },
      ],
    });

    console.log("✅ Initial consents granted");

    // Log the admin creation audit
    await prisma.auditLog.create({
      data: {
        organizationId: organization.id,
        userId: adminUser.id,
        action: "ADMIN_BOOTSTRAP",
        entityType: "User",
        entityId: adminUser.id,
        metadata: {
          event: "Production admin user created via bootstrap script",
          email: adminEmail,
        },
      },
    });

    console.log("\n✅ Bootstrap complete!\n");
    console.log("--- Production Credentials ---");
    console.log(`Email:    ${adminEmail}`);
    console.log(`Password: (as entered above)`);
    console.log(`Organization: ${orgName} (${orgSlug})`);
    console.log("\n⚠️  Store these credentials securely. You will need them for first login.\n");
  } catch (error) {
    console.error("❌ Bootstrap failed:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

bootstrap().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
