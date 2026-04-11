import { z } from 'zod';

export const PermissionSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  description: z.string().nullable(),
});

export const RoleSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
});

export const RoleResourceSchema = z.object({
  type: z.literal('roles'),
  id: z.string().uuid(),
  attributes: z.object({
    name: z.string(),
    description: z.string().nullable(),
  }),
});

export const PermissionResourceSchema = z.object({
  type: z.literal('permissions'),
  id: z.string().uuid(),
  attributes: z.object({
    code: z.string(),
    description: z.string().nullable(),
  }),
});

export const RoleResponseSchema = z.object({
  data: RoleResourceSchema,
});

export const RolesResponseSchema = z.object({
  data: z.array(RoleResourceSchema),
});

export const CreateRoleSchema = z.object({
  data: z.object({
    type: z.literal('roles'),
    attributes: z.object({
      name: z.string().min(1),
      description: z.string().optional(),
    }),
  }),
});

export type Permission = z.infer<typeof PermissionSchema>;
export type Role = z.infer<typeof RoleSchema>;
export type RoleResource = z.infer<typeof RoleResourceSchema>;
export type PermissionResource = z.infer<typeof PermissionResourceSchema>;
export type RoleResponse = z.infer<typeof RoleResponseSchema>;
export type RolesResponse = z.infer<typeof RolesResponseSchema>;
export type CreateRoleRequest = z.infer<typeof CreateRoleSchema>;
