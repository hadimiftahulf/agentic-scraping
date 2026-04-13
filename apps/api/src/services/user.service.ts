import { CreateUserRequest, UpdateUserRequest } from '../schemas/user.schema';
import * as bcrypt from 'bcryptjs';
import { IUserRepository, ListUsersParams } from '../interfaces/user-repository.interface';
import { PrismaClient } from '@bot/db';
import { User } from '../interfaces/user.model';

export class UserService {
  constructor(
    private userRepository: IUserRepository,
    private db: PrismaClient
  ) {}

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  /**
   * List all users
   */
  async list(params: ListUsersParams): Promise<{ users: User[]; totalCount: number }> {
    return this.userRepository.list(params);
  }

  /**
   * Create new user
   */
  async create(data: CreateUserRequest['data']['attributes']): Promise<User> {
    const passwordHash = await bcrypt.hash(data.password, 10);

    let roleId = data.role_id;
    if (!roleId) {
      const defaultRole = await this.db.role.findFirst({
        where: { name: 'EDITOR' },
      });
      
      if (!defaultRole) {
        throw new Error('Default role not found');
      }
      roleId = defaultRole.id;
    }

    return this.userRepository.create({
      email: data.email,
      fullName: data.full_name,
      passwordHash,
      roleId: roleId!,
      status: 'PENDING_ACTIVATION',
    });
  }

  /**
   * Update user
   */
  async update(id: string, data: UpdateUserRequest['data']['attributes']): Promise<User> {
    return this.userRepository.update(id, {
      ...(data.full_name ? { fullName: data.full_name } : {}),
      ...(data.status ? { status: data.status } : {}),
      ...(data.role_id ? { roleId: data.role_id } : {}),
    });
  }

  /**
   * Suspend user
   */
  async suspend(id: string): Promise<User> {
    return this.userRepository.update(id, { status: 'SUSPENDED' });
  }

  /**
   * Activate user
   */
  async activate(id: string): Promise<User> {
    return this.userRepository.update(id, { status: 'ACTIVE' });
  }

  /**
   * Soft delete user
   */
  async delete(id: string): Promise<User> {
    return this.userRepository.delete(id);
  }
}
