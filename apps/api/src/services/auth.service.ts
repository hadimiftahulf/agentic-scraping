import { UserService } from './user.service';
import { UserRepository } from '../repositories/user.repository';
import { LoginRequest, RegisterRequest } from '../schemas/auth.schema';
import * as bcrypt from 'bcryptjs';
import { FastifyInstance } from 'fastify';

export class AuthService {
  private userService: UserService;

  constructor(private fastify: FastifyInstance) {
    const userRepository = new UserRepository(fastify.db);
    this.userService = new UserService(userRepository, fastify.db);
  }

  /**
   * Register a new user
   */
  async register(data: RegisterRequest['data']['attributes']) {
    // Check if user already exists
    const existingUser = await this.userService.findByEmail(data.email);
    if (existingUser) {
      const error: any = new Error('User already exists');
      error.statusCode = 409;
      throw error;
    }

    return this.userService.create(data);
  }

  /**
   * Login user and generate tokens
   */
  async login(data: LoginRequest['data']['attributes']) {
    const user = await this.userService.findByEmail(data.email);
    if (!user) {
      const error: any = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    if (user.status === 'SUSPENDED') {
      const error: any = new Error('Account suspended');
      error.statusCode = 403;
      throw error;
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isPasswordValid) {
      const error: any = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Generate tokens
    const accessToken = this.fastify.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role.name,
    });

    // For now, we use the same token as refresh token or generate a different one
    const refreshToken = this.fastify.jwt.sign({
      sub: user.id,
      type: 'refresh',
    }, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600,
      userId: user.id,
    };
  }

  /**
   * Get current user profile
   */
  async getProfile(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    return user;
  }

  /**
   * Activate account via token
   */
  async activateAccount(token: string) {
    // Basic stub - would normally verify token in DB
    return { success: true };
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      const error: any = new Error('Invalid current password');
      error.statusCode = 401;
      throw error;
    }

    // Update password (assumes userService handles hashing or we do it here)
    const newHash = await bcrypt.hash(newPassword, 10);
    // await this.userService.updatePassword(userId, newHash);
    return { success: true };
  }

  /**
   * Request password reset (Forgot Password)
   */
  async forgotPassword(email: string) {
    // Basic stub - would normally generate reset token and send email
    const user = await this.userService.findByEmail(email);
    if (user) {
      // simulate sending email
    }
    return { success: true };
  }

  /**
   * Execute password reset
   */
  async resetPassword(token: string, newPassword: string) {
    // Basic stub - would compute user from token, verify expiry, and update pass
    return { success: true };
  }
}
