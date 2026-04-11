import { PrismaClient, UserStatus } from '@bot/db';
import { CreateUserRequest, UpdateUserRequest } from '../schemas/user.schema';
import * as bcrypt from 'bcryptjs';

export class UserService {
  constructor(private db: PrismaClient) {}

  /**
   * Find user by ID
   */
  async findById(id: string) {
    return this.db.user.findUnique({
      where: { id, deletedAt: null },
      include: { role: true },
    });
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string) {
    return this.db.user.findUnique({
      where: { email, deletedAt: null },
      include: { role: true },
    });
  }

  /**
   * List all users
   */
  async list(params: {
    status?: UserStatus;
    roleId?: string;
    skip?: number;
    take?: number;
  }) {
    const where = {
      deletedAt: null,
      ...(params.status ? { status: params.status } : {}),
      ...(params.roleId ? { roleId: params.roleId } : {}),
    };

    const [users, totalCount] = await Promise.all([
      this.db.user.findMany({
        where,
        include: { role: true },
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.user.count({ where }),
    ]);

    return { users, totalCount };
  }

  /**
   * Create new user
   */
  async create(data: CreateUserRequest['data']['attributes']) {
    const passwordHash = await bcrypt.hash(data.password, 10);

    // If role_id not provided, assign a default role or throw error
    // For now, we'll require it or handle it in the controller
    if (!data.role_id) {
      // Find a default 'USER' or 'EDITOR' role
      const defaultRole = await this.db.role.findFirst({
        where: { name: 'EDITOR' },
      });
      
      if (!defaultRole) {
        throw new Error('Default role not found');
      }
      data.role_id = defaultRole.id;
    }

    return this.db.user.create({
      data: {
        email: data.email,
        fullName: data.full_name,
        passwordHash,
        roleId: data.role_id,
        status: 'PENDING_ACTIVATION',
      },
      include: { role: true },
    });
  }

  /**
   * Update user
   */
  async update(id: string, data: UpdateUserRequest['data']['attributes']) {
    return this.db.user.update({
      where: { id },
      data: {
        ...(data.full_name ? { fullName: data.full_name } : {}),
        ...(data.status ? { status: data.status } : {}),
        ...(data.role_id ? { roleId: data.role_id } : {}),
      },
      include: { role: true },
    });
  }

  /**
   * Soft delete user
   */
  async delete(id: string) {
    return this.db.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
