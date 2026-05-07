import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const organizationOverviewInclude = {
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
} satisfies Prisma.OrganizationInclude;

type OrganizationOverview = Prisma.OrganizationGetPayload<{
  include: typeof organizationOverviewInclude;
}>;

type OrganizationConsentStat = {
  status: string;
  _count: {
    status: number;
  };
};

type OrganizationOverviewResult = {
  organization: OrganizationOverview;
  consentStats: OrganizationConsentStat[];
};

export async function getOrganizationOverview(organizationId: string): Promise<OrganizationOverviewResult | null> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: organizationOverviewInclude,
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
