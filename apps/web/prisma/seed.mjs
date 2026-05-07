import { createHash, randomBytes, scryptSync } from "node:crypto";
import process from "node:process";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

process.loadEnvFile(".env");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
  log: ["error", "warn"],
});

function hashMessage(message) {
  return createHash("sha256").update(message).digest("hex");
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, 64).toString("base64url");

  return `scrypt$${salt}$${hash}`;
}

async function main() {
  const organization = await prisma.organization.upsert({
    where: { slug: "organizacion-demo" },
    update: {
      name: "Organizacion demo",
      industry: "Tecnologia",
    },
    create: {
      name: "Organizacion demo",
      slug: "organizacion-demo",
      industry: "Tecnologia",
    },
  });

  const teamNames = ["Soporte", "Ventas enterprise", "Producto", "Operaciones", "Bienestar", "Auditoria"];
  const teams = new Map();

  for (const name of teamNames) {
    const team = await prisma.team.upsert({
      where: {
        organizationId_name: {
          organizationId: organization.id,
          name,
        },
      },
      update: {},
      create: {
        organizationId: organization.id,
        name,
      },
    });

    teams.set(name, team);
  }

  const users = [
    {
      email: "admin@empresa.com",
      name: "Admin MindCare",
      role: "ADMIN",
      team: "Bienestar",
      password: "MindCareDemo2026",
    },
    {
      email: "ana.rivera@empresa.com",
      name: "Ana Rivera",
      role: "ADMIN",
      team: "Bienestar",
      password: "MindCareAna2026",
    },
    {
      email: "marco.vega@empresa.com",
      name: "Marco Vega",
      role: "TEAM_LEAD",
      team: "Soporte",
      password: "MindCareMarco2026",
    },
    {
      email: "lucia.torres@empresa.com",
      name: "Lucia Torres",
      role: "AUDITOR",
      team: "Auditoria",
      password: "MindCareLucia2026",
    },
  ];

  const savedUsers = new Map();

  for (const user of users) {
    const savedUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        organizationId: organization.id,
        teamId: teams.get(user.team)?.id,
        role: user.role,
        passwordHash: user.password ? hashPassword(user.password) : undefined,
        isActive: true,
      },
      create: {
        organizationId: organization.id,
        teamId: teams.get(user.team)?.id,
        email: user.email,
        name: user.name,
        role: user.role,
        passwordHash: user.password ? hashPassword(user.password) : undefined,
        isActive: true,
      },
    });

    savedUsers.set(user.email, savedUser);
  }

  for (const user of savedUsers.values()) {
    for (const source of ["TEXT", "WORKLOAD"]) {
      await prisma.consent.upsert({
        where: {
          userId_source: {
            userId: user.id,
            source,
          },
        },
        update: {
          status: "GRANTED",
          grantedAt: new Date(),
        },
        create: {
          userId: user.id,
          source,
          status: "GRANTED",
          grantedAt: new Date(),
        },
      });
    }
  }

  await prisma.interventionCase.deleteMany({
    where: { organizationId: organization.id },
  });

  await prisma.preventiveAlert.deleteMany({
    where: { organizationId: organization.id },
  });

  const supportAlert = await prisma.preventiveAlert.create({
    data: {
      organizationId: organization.id,
      teamId: teams.get("Soporte")?.id,
      openedById: savedUsers.get("ana.rivera@empresa.com")?.id,
      title: "Sobrecarga sostenida en soporte",
      summary: "Aumento de senales de frustracion y baja recuperacion semanal.",
      level: "PREVENTIVE_ATTENTION",
      recommendedAction: "Revisar carga operativa y activar seguimiento humano.",
    },
  });

  await prisma.preventiveAlert.create({
    data: {
      organizationId: organization.id,
      teamId: teams.get("Ventas enterprise")?.id,
      openedById: savedUsers.get("ana.rivera@empresa.com")?.id,
      title: "Ritmo elevado de trabajo",
      summary: "Comunicacion fuera de horario y descenso de descanso reportado.",
      level: "OBSERVATION",
      recommendedAction: "Conversar con liderazgo sobre prioridades y pausas.",
    },
  });

  await prisma.interventionCase.create({
    data: {
      organizationId: organization.id,
      alertId: supportAlert.id,
      teamId: teams.get("Soporte")?.id,
      ownerId: savedUsers.get("ana.rivera@empresa.com")?.id,
      title: "Caso preventivo: Sobrecarga sostenida en soporte",
      summary: "Seguimiento humano para validar contexto del equipo de soporte.",
      objective: "Reducir sobrecarga laboral sin usar senales preventivas como medida disciplinaria.",
      nextStep: "Agendar conversacion de apoyo y revisar distribucion de turnos.",
      status: "ACTIVE",
      priority: "HIGH",
      dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      notes: {
        create: {
          authorId: savedUsers.get("ana.rivera@empresa.com")?.id,
          body: "Caso demo creado para probar el flujo de seguimiento preventivo.",
        },
      },
      actions: {
        create: {
          actorId: savedUsers.get("ana.rivera@empresa.com")?.id,
          type: "HUMAN_REVIEW",
          description: "Revision humana inicial asignada al area de bienestar.",
          completedAt: new Date(),
        },
      },
    },
  });

  const author = savedUsers.get("marco.vega@empresa.com");
  const messageText = "Estoy agotado y siento demasiada presion esta semana.";

  if (author) {
    const message = await prisma.message.create({
      data: {
        organizationId: organization.id,
        teamId: teams.get("Soporte")?.id,
        authorId: author.id,
        source: "TEXT",
        contentHash: hashMessage(messageText),
        redactedPreview: "Estoy agotado y siento demasiada presion...",
        sentAt: new Date(),
      },
    });

    await prisma.messageAnalysis.create({
      data: {
        messageId: message.id,
        userId: author.id,
        score: 54,
        level: "PREVENTIVE_ATTENTION",
        confidence: 78,
        signals: [{ label: "Sobrecarga y estres", matches: ["agotado", "presion"] }],
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      organizationId: organization.id,
      userId: savedUsers.get("lucia.torres@empresa.com")?.id,
      action: "seed.demo.created",
      entityType: "Organization",
      entityId: organization.id,
      metadata: { source: "prisma/seed.mjs" },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
