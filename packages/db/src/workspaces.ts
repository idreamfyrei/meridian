import { eq } from "drizzle-orm";

import type { MeridianDb } from ".";
import { users, workspaces } from "./schema";

type EnsureWorkspaceInput = {
  clerkUserId: string;
  email?: string | null;
  workspaceName?: string;
};

export async function ensureUserWorkspace(
  db: MeridianDb,
  input: EnsureWorkspaceInput,
) {
  const existingUser = await db.query.users.findFirst({
    where: eq(users.clerkUserId, input.clerkUserId),
  });

  if (existingUser) {
    const existingWorkspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.userId, existingUser.id),
    });

    if (existingWorkspace) {
      return {
        user: existingUser,
        workspace: existingWorkspace,
      };
    }

    const [createdWorkspace] = await db
      .insert(workspaces)
      .values({
        userId: existingUser.id,
        name: input.workspaceName ?? "My Workspace",
      })
      .returning();

    if (!createdWorkspace) {
      throw new Error("Failed to create workspace");
    }

    return {
      user: existingUser,
      workspace: createdWorkspace,
    };
  }

  const [createdUser] = await db
    .insert(users)
    .values({
      clerkUserId: input.clerkUserId,
      email: input.email,
    })
    .returning();

  if (!createdUser) {
    throw new Error("Failed to create user");
  }

  const [createdWorkspace] = await db
    .insert(workspaces)
    .values({
      userId: createdUser.id,
      name: input.workspaceName ?? "My Workspace",
    })
    .returning();

  if (!createdWorkspace) {
    throw new Error("Failed to create workspace");
  }

  return {
    user: createdUser,
    workspace: createdWorkspace,
  };
}

export type Workspace = Awaited<
  ReturnType<typeof ensureUserWorkspace>
>["workspace"];
