import { prisma } from "@/lib/prisma";

export async function getOrganizationOverview(organizationId: string) {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      teams: {
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: {
              members: true,
              alerts: true,
            },
          },
        },
      },
      users: {
        orderBy: { name: "asc" },
        take: 12,
        include: {
          team: true,
        },
      },
      _count: {
        select: {
          users: true,
          teams: true,
          messages: true,
          alerts: true,
          auditLogs: true,
        },
      },
    },
  });

  if (!organization) {
    return null;
  }

  const consentStats = await prisma.consent.groupBy({
    by: ["status"],
    where: {
      user: {
        organizationId: organization.id,
      },
    },
    _count: {
      status: true,
    },
  });

  return {
    organization,
    consentStats,
  };
}
