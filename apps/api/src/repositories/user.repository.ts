import { PrismaClient, UserStatus } from '@bot/db';
import { IUserRepository, ListUsersParams } from '../interfaces/user-repository.interface';
import { User } from '../interfaces/user.model';

export class UserRepository implements IUserRepository {
  constructor(private db: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    const user = await this.db.user.findUnique({
      where: { id, deletedAt: null },
      include: { role: true },
    });

    return user ? User.fromPrisma(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.db.user.findUnique({
      where: { email, deletedAt: null },
      include: { role: true },
    });

    return user ? User.fromPrisma(user) : null;
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

    return { 
      users: users.map(user => User.fromPrisma(user)), 
      totalCount 
    };
  }

  async create(data: any): Promise<User> {
    const user = await this.db.user.create({
      data,
      include: { role: true },
    });

    return User.fromPrisma(user);
  }

  async update(id: string, data: any): Promise<User> {
    const user = await this.db.user.update({
      where: { id },
      data,
      include: { role: true },
    });

    return User.fromPrisma(user);
  }

  async delete(id: string): Promise<User> {
    const user = await this.db.user.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: { role: true },
    });

    return User.fromPrisma(user);
  }
}
