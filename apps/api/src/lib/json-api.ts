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
 * Transforms a Prisma Permission model to a JSON:API response
 */
export function transformPermissions(permissions: any[]): JsonApiResponse {
  return {
    data: permissions.map(transformPermission),
    links: {
      self: '/api/v1/permissions',
    },
  };
}

/**
 * Transforms a Prisma Taxonomy model to a JSON:API resource
 */
export function transformTaxonomy(taxonomy: any): JsonApiResource {
  return {
    type: 'taxonomy',
    id: taxonomy.id,
    attributes: {
      code: taxonomy.code,
      name: taxonomy.name,
      is_hierarchical: taxonomy.isHierarchical,
    },
    links: {
      self: `/api/v1/taxonomies/${taxonomy.code}`,
    },
  };
}

/**
 * Transforms a list of Prisma Taxonomy models to a JSON:API response
 */
export function transformTaxonomies(taxonomies: any[]): JsonApiResponse {
  return {
    data: taxonomies.map(transformTaxonomy),
    links: {
      self: '/api/v1/taxonomies',
    },
  };
}

/**
 * Transforms a Prisma Term model to a JSON:API resource
 */
export function transformTerm(term: any): JsonApiResource {
  return {
    type: 'term',
    id: term.id,
    attributes: {
      code: term.code,
      label: term.label,
      parent_id: term.parentId,
    },
    relationships: term.taxonomy ? {
      taxonomy: {
        data: { type: 'taxonomy', id: term.taxonomy.id }
      }
    } : undefined,
    links: {
      self: `/api/v1/taxonomies/${term.taxonomy?.code || 'unknown'}/terms/${term.id}`,
    },
  };
}

/**
 * Transforms a list of Prisma Term models to a JSON:API response
 */
export function transformTerms(terms: any[], taxonomyCode: string): JsonApiResponse {
  return {
    data: terms.map(transformTerm),
    links: {
      self: `/api/v1/taxonomies/${taxonomyCode}/terms`,
    },
  };
}

/**
 * Transforms a Prisma Media model to a JSON:API resource
 */
export function transformMedia(media: any): JsonApiResource {
  return {
    type: 'media',
    id: media.id,
    attributes: {
      filename: media.filename,
      original_name: media.originalName,
      mime_type: media.mimeType,
      size: media.size,
      url: media.url,
      folder: media.folder,
    },
    links: {
      self: `/api/v1/media/${media.id}`,
    },
  };
}

/**
 * Transforms a list of Prisma Media models to a JSON:API response
 */
export function transformMediaList(mediaList: any[]): JsonApiResponse {
  return {
    data: mediaList.map(transformMedia),
    links: {
      self: '/api/v1/media',
    },
  };
}

/**
 * Transforms a Prisma MediaAttachment model to a JSON:API resource
 */
export function transformMediaAttachment(attachment: any): JsonApiResource {
  return {
    type: 'media_attachment',
    id: attachment.id,
    attributes: {
      entity_type: attachment.entityType,
      entity_id: attachment.entityId,
      collection_name: attachment.collectionName,
    },
    relationships: {
      media: {
        data: { type: 'media', id: attachment.mediaId }
      }
    },
  };
}
