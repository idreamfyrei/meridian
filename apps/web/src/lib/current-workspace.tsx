import { currentUser } from "@clerk/nextjs/server";
import { ensureUserWorkspace, getDb } from "@meridian/db";

export async function getCurrentWorkspace() {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  const primaryEmail =
    user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)
      ?.emailAddress ?? null;

  const displayName =
    user.firstName ?? primaryEmail?.split("@")[0] ?? "Meridian";

  const db = getDb();

  const { workspace } = await ensureUserWorkspace(db, {
    clerkUserId: user.id,
    email: primaryEmail,
    workspaceName: `${displayName}'s Workspace`,
  });

  return {
    db,
    user,
    workspace,
  };
}
