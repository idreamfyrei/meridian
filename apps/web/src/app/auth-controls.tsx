"use client";

import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";

export function AuthControls() {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return (
      <div aria-hidden="true" className="h-8 w-24 rounded-md bg-zinc-100" />
    );
  }

  if (isSignedIn) {
    return <UserButton />;
  }

  return (
    <>
      <SignInButton />
      <SignUpButton />
    </>
  );
}
