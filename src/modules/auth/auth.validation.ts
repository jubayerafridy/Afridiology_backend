import { z } from "zod";

import { AUTH_CONSTANTS } from "./auth.constants.js";

const normalizedEmail = z
  .string()
  .trim()
  .toLowerCase()
  .email()
  .max(AUTH_CONSTANTS.EMAIL_MAX_LENGTH);

const password = z
  .string()
  .min(AUTH_CONSTANTS.PASSWORD_MIN_LENGTH)
  .max(AUTH_CONSTANTS.PASSWORD_MAX_LENGTH);

const name = z
  .string()
  .trim()
  .min(AUTH_CONSTANTS.NAME_MIN_LENGTH)
  .max(AUTH_CONSTANTS.NAME_MAX_LENGTH);

export const registerSchema = z
  .object({
    name,
    email: normalizedEmail,
    password,
  })
  .strict();

export const loginSchema = z
  .object({
    email: normalizedEmail,
    password: z.string().min(1),
  })
  .strict();

export const refreshSchema = z
  .object({
    refreshToken: z.string().min(1),
  })
  .strict();

export type RegisterSchemaInput = z.infer<typeof registerSchema>;

export type LoginSchemaInput = z.infer<typeof loginSchema>;

export type RefreshSchemaInput = z.infer<typeof refreshSchema>;
