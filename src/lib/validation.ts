import { z } from "zod";

import { ValidationError } from "./errors.js";

export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export function validateSlug(slug: string): string {
  const result = slugSchema.safeParse(slug);

  if (!result.success) {
    throw new ValidationError();
  }

  return result.data;
}
