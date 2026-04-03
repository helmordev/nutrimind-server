import { z } from 'zod';

export const updateTeacherProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  school: z.string().max(200).nullable().optional(),
});

export type UpdateTeacherProfileInput = z.infer<typeof updateTeacherProfileSchema>;
