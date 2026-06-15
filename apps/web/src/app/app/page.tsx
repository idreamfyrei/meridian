import { currentUser } from "@clerk/nextjs/server";
import { ensureUserWorkspace, getDb } from "@meridian/db";

export default async function AppPage() {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  const primaryEmail =
    user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)
      ?.emailAddress ?? null;

  const displayName =
    user.firstName ?? primaryEmail?.split("@")[0] ?? "Meridian";

  const { workspace } = await ensureUserWorkspace(getDb(), {
    clerkUserId: user.id,
    email: primaryEmail,
    workspaceName: `${displayName}'s Workspace`,
  });

  return (
    <main className="flex flex-1 bg-zinc-50 px-6 py-8">
      <section className="w-full max-w-5xl">
        <p className="text-sm font-medium text-zinc-500">{workspace.name}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
          Action Queue
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
          This route is connected to your Meridian workspace. Next, we will use
          this workspace as the tenant boundary for Gmail and Google Calendar.
        </p>
      </section>
    </main>
  );
}
