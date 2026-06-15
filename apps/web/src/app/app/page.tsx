import { auth } from "@clerk/nextjs/server";

export default async function AppPage() {
  const { userId } = await auth.protect();

  return (
    <main className="flex flex-1 bg-zinc-50 px-6 py-8">
      <section className="w-full max-w-5xl">
        <p className="text-sm font-medium text-zinc-500">Private workspace</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
          Action Queue
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
          This route is protected by Clerk. Soon it will show the loops Meridian
          finds across Gmail and Google Calendar.
        </p>
        <p className="mt-6 text-xs text-zinc-400">Signed in as {userId}</p>
      </section>
    </main>
  );
}
