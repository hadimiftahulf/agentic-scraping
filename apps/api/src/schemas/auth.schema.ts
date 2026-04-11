import { z } from 'zod';
import { UserResourceSchema } from './user.schema';

export const LoginSchema = z.object({
  data: z.object({
    type: z.literal('auth_login'),
    attributes: z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }),
  }),
});

export const RegisterSchema = z.object({
  data: z.object({
    type: z.literal('auth_register'),
    attributes: z.object({
      email: z.string().email(),
      password: z.string().min(8),
      full_name: z.string().min(1),
    }),
  }),
});

export const SessionResourceSchema = z.object({
  type: z.literal('auth_session'),
  id: z.string(), // Usually session ID or a random UUID
  attributes: z.object({
    access_token: z.string(),
    refresh_token: z.string(),
    expires_in: z.number(),
    token_type: z.literal('Bearer'),
  }),
  links: z.object({
    self: z.string(),
  }).optional(),
});

export const SessionResponseSchema = z.object({
  data: SessionResourceSchema,
});

export const ActivateAccountSchema = z.object({
  data: z.object({
    type: z.literal('auth_activate'),
    attributes: z.object({
      token: z.string().min(1),
    }),
  }),
});

export const ChangePasswordSchema = z.object({
  data: z.object({
    type: z.literal('auth_change_password'),
    attributes: z.object({
      current_password: z.string().min(1),
      new_password: z.string().min(8),
    }),
  }),
});

export const ForgotPasswordSchema = z.object({
  data: z.object({
    type: z.literal('auth_forgot_password'),
    attributes: z.object({
      email: z.string().email(),
    }),
  }),
});

export const ResetPasswordSchema = z.object({
  data: z.object({
    type: z.literal('auth_reset_password'),
    attributes: z.object({
      token: z.string().min(1),
      new_password: z.string().min(8),
    }),
  }),
});

export const ProfileResponseSchema = z.object({
  data: UserResourceSchema,
});

export type LoginRequest = z.infer<typeof LoginSchema>;
export type RegisterRequest = z.infer<typeof RegisterSchema>;
export type SessionResponse = z.infer<typeof SessionResponseSchema>;
export type ActivateAccountRequest = z.infer<typeof ActivateAccountSchema>;
export type ChangePasswordRequest = z.infer<typeof ChangePasswordSchema>;
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordRequest = z.infer<typeof ResetPasswordSchema>;
export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;
