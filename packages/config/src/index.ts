import { z } from "zod";

const nodeEnvSchema = z
  .enum(["development", "test", "production"])
  .default("development");

export const serverEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  APP_URL: z.string().default("http://localhost:3000"),
  DATABASE_URL: z.string(),

  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1).optional(),
  CLERK_SECRET_KEY: z.string().min(1).optional(),

  CORSAIR_KEK: z.string().min(1).optional(),

  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),

  OPENAI_API_KEY: z.string().min(1).optional(),

  INNGEST_EVENT_KEY: z.string().min(1).optional(),
  INNGEST_SIGNING_KEY: z.string().min(1).optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

const optionalServerEnvSchema = serverEnvSchema.partial();

export type OptionalServerEnv = z.infer<typeof optionalServerEnvSchema>;

export function getServerEnv(
  source: NodeJS.ProcessEnv = process.env,
): ServerEnv {
  return serverEnvSchema.parse(source);
}

export function getOptionalServerEnv(
  source: NodeJS.ProcessEnv = process.env,
): OptionalServerEnv {
  return optionalServerEnvSchema.parse(source);
}
