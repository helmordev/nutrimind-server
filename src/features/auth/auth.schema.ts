import { z } from 'zod';

export const studentLoginSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required').max(50),
  pin: z
    .string()
    .length(6, 'PIN must be exactly 6 digits')
    .regex(/^\d{6}$/, 'PIN must be 6 digits'),
});

export const studentRefreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type StudentLoginInput = z.infer<typeof studentLoginSchema>;
export type StudentRefreshInput = z.infer<typeof studentRefreshSchema>;
