import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { AppError, ValidationError } from "@/shared/lib/errors";
import { logger } from "@/shared/middleware/logger";

export function errorHandler(err: Error, c: Context): Response {
  if (err instanceof ValidationError) {
    return c.json(
      {
        success: false,
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
        },
      },
      400 as ContentfulStatusCode,
    );
  }

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err }, err.message);
    }
    return c.json(
      {
        success: false,
        error: {
          code: err.code,
          message: err.message,
        },
      },
      err.statusCode as ContentfulStatusCode,
    );
  }

  // Unexpected error
  logger.error({ err }, "Unhandled error");
  return c.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      },
    },
    500 as ContentfulStatusCode,
  );
}
