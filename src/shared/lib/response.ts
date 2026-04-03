import type { Context } from 'hono';

export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function successResponse<T>(
  c: Context,
  data: T,
  status: 200 | 201 = 200,
  meta?: Record<string, unknown>,
): Response {
  const body: SuccessResponse<T> = { success: true, data };
  if (meta) body.meta = meta;
  return c.json(body, status);
}

export function errorResponse(
  c: Context,
  message: string,
  statusCode: number,
  code: string,
  details?: unknown,
): Response {
  const body: ErrorResponse = {
    success: false,
    error: { code, message, ...(details !== undefined && { details }) },
  };
  return c.json(body, statusCode as Parameters<typeof c.json>[1]);
}
