import { User as PrismaUser, UserStatus, Role } from '@bot/db';

export class User {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
  status: UserStatus;
  roleId: string;
  role?: Role;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  /**
   * Fields that are mass assignable
   */
  static readonly fillable = ['email', 'fullName', 'status', 'roleId', 'passwordHash'];

  /**
   * Fields that should be cast to specific types
   */
  static readonly casts = {
    status: 'UserStatus',
    createdAt: 'datetime',
    updatedAt: 'datetime',
    deletedAt: 'datetime',
  };

  /**
   * Relationships for this model
   */
  static readonly relations = ['role', 'notifications'];

  constructor(data: PrismaUser & { role?: Role }) {
    this.id = data.id;
    this.email = data.email;
    this.fullName = data.fullName;
    this.passwordHash = data.passwordHash;
    this.status = data.status;
    this.roleId = data.roleId;
    this.role = data.role;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.deletedAt = data.deletedAt;
  }

  /**
   * Check if user is active
   */
  isActive(): boolean {
    return this.status === 'ACTIVE' && this.deletedAt === null;
  }

  /**
   * Check if user is suspended
   */
  isSuspended(): boolean {
    return this.status === 'SUSPENDED';
  }

  /**
   * Check if user has a specific role
   */
  hasRole(roleName: string): boolean {
    return this.role?.name === roleName;
  }

  /**
   * Static method to create from Prisma result
   */
  static fromPrisma(user: PrismaUser & { role?: Role }): User {
    return new User(user);
  }

  /**
   * Convert to JSON:API compliant attributes
   */
  toAttributes() {
    return {
      email: this.email,
      full_name: this.fullName,
      status: this.status,
      created_at: this.createdAt.toISOString(),
      updated_at: this.updatedAt.toISOString(),
    };
  }
}
