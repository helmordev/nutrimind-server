import { z } from 'zod';

export const createHubSchema = z.object({
  name: z.string().min(1).max(100),
});

export const updateHubSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
  })
  .refine((data) => data.name !== undefined, {
    message: 'At least one field must be provided',
  });

export const joinHubSchema = z.object({
  /** Server code entered by the student — normalized to uppercase */
  code: z
    .string()
    .length(6)
    .transform((s) => s.toUpperCase()),
});

export const generateCodeSchema = z.object({
  ttlSeconds: z.number().int().min(60).max(86_400).default(86_400),
});
