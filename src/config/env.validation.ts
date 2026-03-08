import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z
    .string()
    .transform((v) => Number(v))
    .refine((n) => !Number.isNaN(n), 'PORT must be a number')
    .default('3000'),

  // Dev-only JWT secret so you can test in Thunder Client right now.
  // We will replace this with Supabase JWKS verification later.
  JWT_DEV_SECRET: z.string().default('dev-secret-change-me'),
  JWT_ISSUER: z.string().default('dev'),
  JWT_AUDIENCE: z.string().default('dev'),
});

export type Env = z.infer<typeof schema>;

export function validateEnv(cfg: Record<string, unknown>) {
  const parsed = schema.safeParse(cfg);
  if (!parsed.success) {
    // Throwing a simple error keeps Nest output readable
    throw new Error(
      'Invalid environment variables:\n' +
        parsed.error.issues
          .map((e) => ` - ${e.path.join('.')}: ${e.message}`)
          .join('\n'),
    );
  }
  return parsed.data;
}
