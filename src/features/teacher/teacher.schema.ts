import { z } from 'zod';

export const updateTeacherProfileSchema = z
  .object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    school: z.string().max(200).nullable().optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'At least one field must be provided',
  });

export type UpdateTeacherProfileInput = z.infer<typeof updateTeacherProfileSchema>;
