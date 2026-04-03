import { z } from 'zod';

export const createTeacherSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  school: z.string().max(200).optional(),
});

export const updateTeacherSchema = z
  .object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    school: z.string().max(200).nullable().optional(),
    email: z.string().email().optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'At least one field must be provided',
  });

export const changeRoleSchema = z.object({
  role: z.enum(['admin', 'teacher']),
});

export const teacherIdParamSchema = z.object({
  id: z.string().min(1, 'Teacher ID is required'),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;
export type ChangeRoleInput = z.infer<typeof changeRoleSchema>;
export type TeacherIdParam = z.infer<typeof teacherIdParamSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
