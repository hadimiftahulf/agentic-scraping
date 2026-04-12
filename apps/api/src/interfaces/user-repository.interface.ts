import { User, UserStatus } from '@bot/db';

export interface ListUsersParams {
  status?: UserStatus;
  roleId?: string;
  skip?: number;
  take?: number;
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  list(params: ListUsersParams): Promise<{ users: User[]; totalCount: number }>;
  create(data: any): Promise<User>;
  update(id: string, data: any): Promise<User>;
  delete(id: string): Promise<User>;
}
