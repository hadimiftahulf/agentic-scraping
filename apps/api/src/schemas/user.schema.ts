import { z } from 'zod';

export const UserStatusSchema = z.enum(['ACTIVE', 'SUSPENDED', 'PENDING_ACTIVATION']);

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string(),
  status: UserStatusSchema,
  roleId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional(),
});

// JSON:API Resource Schema for User
export const UserResourceSchema = z.object({
  type: z.literal('users'),
  id: z.string().uuid(),
  attributes: z.object({
    email: z.string().email(),
    full_name: z.string(),
    status: UserStatusSchema,
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
  }),
  relationships: z.object({
    role: z.object({
      data: z.object({
        type: z.literal('roles'),
        id: z.string().uuid(),
      }),
    }).optional(),
  }).optional(),
  links: z.object({
    self: z.string(),
  }).optional(),
});

export const UserResponseSchema = z.object({
  data: UserResourceSchema,
});

export const UsersResponseSchema = z.object({
  data: z.array(UserResourceSchema),
  links: z.object({
    self: z.string(),
    first: z.string().optional(),
    last: z.string().optional(),
    prev: z.string().optional(),
    next: z.string().optional(),
  }).optional(),
  meta: z.object({
    total_count: z.number().optional(),
  }).optional(),
});

export const CreateUserSchema = z.object({
  data: z.object({
    type: z.literal('users'),
    attributes: z.object({
      email: z.string().email(),
      full_name: z.string().min(1),
      password: z.string().min(8),
      role_id: z.string().uuid().optional(),
    }),
  }),
});

export const UpdateUserSchema = z.object({
  data: z.object({
    type: z.literal('users'),
    id: z.string().uuid(),
    attributes: z.object({
      full_name: z.string().min(1).optional(),
      status: UserStatusSchema.optional(),
      role_id: z.string().uuid().optional(),
    }),
  }),
});

export type User = z.infer<typeof UserSchema>;
export type UserResource = z.infer<typeof UserResourceSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type UsersResponse = z.infer<typeof UsersResponseSchema>;
export type CreateUserRequest = z.infer<typeof CreateUserSchema>;
export type UpdateUserRequest = z.infer<typeof UpdateUserSchema>;
