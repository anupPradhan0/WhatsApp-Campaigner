import type { Request, Response, NextFunction } from "express";
import type { ZodSchema, ZodError } from "zod";

function formatZodError(error: ZodError): string[] {
  return error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
}

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: formatZodError(parsed.error),
      });
      return;
    }
    req.body = parsed.data as typeof req.body;
    next();
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.params);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid route parameters",
        errors: formatZodError(parsed.error),
      });
      return;
    }
    req.params = parsed.data as typeof req.params;
    next();
  };
}
