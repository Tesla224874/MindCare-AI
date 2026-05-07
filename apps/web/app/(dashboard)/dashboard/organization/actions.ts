"use server";

import { Prisma, SignalSource, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireRoles } from "@/lib/authorization";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export type CreateTeamState = {
  status: "idle" | "success" | "error";
  message: string;
};

export type CreateUserState = {
  status: "idle" | "success" | "error";
  message: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedRoles = new Set<UserRole>([
  UserRole.ADMIN,
  UserRole.WELLBEING,
  UserRole.TEAM_LEAD,
  UserRole.AUDITOR,
  UserRole.EMPLOYEE,
]);

export async function createTeamAction(
  _previousState: CreateTeamState,
  formData: FormData,
): Promise<CreateTeamState> {
  const currentUser = await requireRoles(["ADMIN", "WELLBEING"]);
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (name.length < 3) {
    return {
      status: "error",
      message: "El nombre del equipo debe tener al menos 3 caracteres.",
    };
  }

  try {
    const team = await prisma.team.create({
      data: {
        organizationId: currentUser.organization.id,
        name,
        description: description || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: currentUser.organization.id,
        userId: currentUser.id,
        action: "organization.team.created",
        entityType: "Team",
        entityId: team.id,
        metadata: {
          name: team.name,
        },
      },
    });

    revalidatePath("/dashboard/organization");
    revalidatePath("/dashboard");

    return {
      status: "success",
      message: `Equipo "${team.name}" creado correctamente.`,
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        status: "error",
        message: "Ya existe un equipo con ese nombre en la organizacion.",
      };
    }

    return {
      status: "error",
      message: "No se pudo crear el equipo. Intentalo nuevamente.",
    };
  }
}

export async function createUserAction(
  _previousState: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  const currentUser = await requireRoles(["ADMIN", "WELLBEING"]);
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "") as UserRole;
  const teamId = String(formData.get("teamId") ?? "").trim();

  if (name.length < 3) {
    return {
      status: "error",
      message: "El nombre debe tener al menos 3 caracteres.",
    };
  }

  if (!emailPattern.test(email)) {
    return {
      status: "error",
      message: "Escribe un correo valido.",
    };
  }

  if (password.length < 8) {
    return {
      status: "error",
      message: "La contrasena temporal debe tener al menos 8 caracteres.",
    };
  }

  if (!allowedRoles.has(role)) {
    return {
      status: "error",
      message: "Selecciona un rol valido.",
    };
  }

  const team = teamId
    ? await prisma.team.findFirst({
        where: {
          id: teamId,
          organizationId: currentUser.organization.id,
        },
        select: {
          id: true,
        },
      })
    : null;

  if (teamId && !team) {
    return {
      status: "error",
      message: "El equipo seleccionado no pertenece a esta organizacion.",
    };
  }

  try {
    const user = await prisma.user.create({
      data: {
        organizationId: currentUser.organization.id,
        teamId: team?.id ?? null,
        email,
        name,
        role,
        passwordHash: hashPassword(password),
        consents: {
          create: [
            {
              source: SignalSource.TEXT,
              status: "PENDING",
            },
            {
              source: SignalSource.WORKLOAD,
              status: "PENDING",
            },
          ],
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: currentUser.organization.id,
        userId: currentUser.id,
        action: "organization.user.created",
        entityType: "User",
        entityId: user.id,
        metadata: {
          email: user.email,
          role: user.role,
          teamId: user.teamId,
        },
      },
    });

    revalidatePath("/dashboard/organization");
    revalidatePath("/dashboard/privacy");
    revalidatePath("/dashboard");

    return {
      status: "success",
      message: `Usuario "${user.name}" creado correctamente.`,
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        status: "error",
        message: "Ya existe un usuario con ese correo.",
      };
    }

    return {
      status: "error",
      message: "No se pudo crear el usuario. Intentalo nuevamente.",
    };
  }
}
