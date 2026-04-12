import { PrismaClient, User, UserStatus } from '@bot/db';
import { IUserRepository, ListUsersParams } from '../interfaces/user-repository.interface';

export class UserRepository implements IUserRepository {
  constructor(private db: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { id, deletedAt: null },
      include: { role: true },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { email, deletedAt: null },
      include: { role: true },
    });
  }

  async list(params: ListUsersParams): Promise<{ users: User[]; totalCount: number }> {
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

  async create(data: any): Promise<User> {
    return this.db.user.create({
      data,
      include: { role: true },
    });
  }

  async update(id: string, data: any): Promise<User> {
    return this.db.user.update({
      where: { id },
      data,
      include: { role: true },
    });
  }

  async delete(id: string): Promise<User> {
    return this.db.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
