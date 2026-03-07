import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["student", "teacher", "admin"]).optional(),
});


export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
