import { prisma } from "@/lib/prisma";

export async function getPrivacyOverview(organizationId: string) {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      premiumFacial: true,
      _count: {
        select: {
          users: true,
          auditLogs: true,
        },
      },
    },
  });

  if (!organization) {
    return null;
  }

  const [consents, users, auditLogs] = await Promise.all([
    prisma.consent.groupBy({
      by: ["source", "status"],
      where: {
        user: {
          organizationId: organization.id,
        },
      },
      _count: {
        _all: true,
      },
    }),
    prisma.user.findMany({
      where: {
        organizationId: organization.id,
        isActive: true,
      },
      orderBy: { name: "asc" },
      take: 12,
      include: {
        team: {
          select: {
            name: true,
          },
        },
        consents: {
          orderBy: { source: "asc" },
        },
      },
    }),
    prisma.auditLog.findMany({
      where: { organizationId: organization.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: true,
      },
    }),
  ]);

  return {
    organization,
    consents,
    users,
    auditLogs,
  };
}
