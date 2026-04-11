export interface JsonApiResource {
  type: string;
  id: string;
  attributes: Record<string, any>;
  relationships?: Record<string, any>;
  links?: Record<string, any>;
}

export interface JsonApiResponse<T = JsonApiResource | JsonApiResource[]> {
  data: T;
  included?: JsonApiResource[];
  links?: Record<string, any>;
  meta?: Record<string, any>;
}

/**
 * Transforms a Prisma User model to a JSON:API resource
 */
export function transformUser(user: any): JsonApiResource {
  return {
    type: 'users',
    id: user.id,
    attributes: {
      email: user.email,
      full_name: user.fullName,
      status: user.status,
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString(),
    },
    relationships: user.role ? {
      role: {
        data: { type: 'roles', id: user.role.id }
      }
    } : undefined,
    links: {
      self: `/api/v1/users/${user.id}`,
    },
  };
}

/**
 * Transforms a list of Prisma User models to a JSON:API response
 */
export function transformUsers(users: any[], meta?: Record<string, any>): JsonApiResponse {
  return {
    data: users.map(transformUser),
    links: {
      self: '/api/v1/users',
    },
    meta,
  };
}

/**
 * Transforms a Prisma Role model to a JSON:API resource
 */
export function transformRole(role: any): JsonApiResource {
  return {
    type: 'roles',
    id: role.id,
    attributes: {
      name: role.name,
      description: role.description,
    },
    relationships: role.permissions ? {
      permissions: {
        data: role.permissions.map((p: any) => ({ type: 'permissions', id: p.id }))
      }
    } : undefined,
    links: {
      self: `/api/v1/roles/${role.id}`,
    },
  };
}

/**
 * Transforms a list of Prisma Role models to a JSON:API response
 */
export function transformRoles(roles: any[]): JsonApiResponse {
  return {
    data: roles.map(transformRole),
    links: {
      self: '/api/v1/roles',
    },
  };
}

/**
 * Transforms a Prisma Permission model to a JSON:API resource
 */
export function transformPermission(permission: any): JsonApiResource {
  return {
    type: 'permissions',
    id: permission.id,
    attributes: {
      code: permission.code,
      description: permission.description,
    },
    links: {
      self: `/api/v1/permissions/${permission.id}`,
    },
  };
}

/**
 * Transforms a list of Prisma Permission models to a JSON:API response
 */
export function transformPermissions(permissions: any[]): JsonApiResponse {
  return {
    data: permissions.map(transformPermission),
    links: {
      self: '/api/v1/permissions',
    },
  };
}
