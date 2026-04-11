import { PrismaClient } from '@bot/db';
import { CreateRoleRequest } from '../schemas/role.schema';

export class RoleService {
  constructor(private db: PrismaClient) {}

  /**
   * List all roles
   */
  async listRoles() {
    return this.db.role.findMany({
      where: { deletedAt: null },
      include: { permissions: true },
    });
  }

  /**
   * List all permissions
   */
  async listPermissions() {
    return this.db.permission.findMany({
      where: { deletedAt: null },
    });
  }

  /**
   * Create new role
   */
  async createRole(data: CreateRoleRequest['data']['attributes']) {
    return this.db.role.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });
  }

  /**
   * Assign permissions to role
   */
  async assignPermissions(roleId: string, permissionIds: string[]) {
    return this.db.role.update({
      where: { id: roleId },
      data: {
        permissions: {
          set: permissionIds.map(id => ({ id })),
        },
      },
    });
  }
}
