import { z } from 'zod';

export const createStudentSchema = z.object({
  studentId: z.string().min(6).max(20),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  pin: z.string().length(6).regex(/^\d+$/, 'PIN must be exactly 6 digits'),
});

export const updateStudentSchema = z
  .object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
  })
  .refine((data) => data.firstName !== undefined || data.lastName !== undefined, {
    message: 'At least one field must be provided',
  });

export const batchCreateStudentSchema = z.object({
  students: z.array(createStudentSchema).min(1).max(50),
});

export const resetPinSchema = z.object({
  newPin: z.string().length(6).regex(/^\d+$/, 'PIN must be exactly 6 digits'),
});
