import { z } from 'zod';

export const createTeacherSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  school: z.string().max(200).optional(),
});

export const updateTeacherSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  school: z.string().max(200).nullable().optional(),
  email: z.string().email().optional(),
});

export const changeRoleSchema = z.object({
  role: z.enum(['admin', 'teacher']),
});

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;
export type ChangeRoleInput = z.infer<typeof changeRoleSchema>;
