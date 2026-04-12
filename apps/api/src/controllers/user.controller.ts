import { FastifyReply, FastifyRequest } from 'fastify';
import { UserService } from '../services/user.service';
import { transformUser, transformUsers } from '../lib/json-api';
import { CreateUserRequest, UpdateUserRequest } from '../schemas/user.schema';

export class UserController {
  constructor(private userService: UserService) {}

  /**
   * List all users
   */
  async index(request: FastifyRequest, reply: FastifyReply) {
    const { status, roleId, page = 1, limit = 10 } = request.query as any;
    const skip = (Number(page) - 1) * Number(limit);
    
    const { users, totalCount } = await this.userService.list({
      status,
      roleId,
      skip,
      take: Number(limit),
    });

    return reply.send(transformUsers(users, { total_count: totalCount }));
  }

  /**
   * Get a single user
   */
  async show(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const user = await this.userService.findById(id);
    
    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    return reply.send({ data: transformUser(user) });
  }

  /**
   * Create a new user
   */
  async store(request: FastifyRequest, reply: FastifyReply) {
    const { data } = request.body as CreateUserRequest;
    const user = await this.userService.create(data.attributes);
    
    return reply.status(201).send({ data: transformUser(user) });
  }

  /**
   * Update an existing user
   */
  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const { data } = request.body as UpdateUserRequest;
    
    const user = await this.userService.update(id, data.attributes);
    return reply.send({ data: transformUser(user) });
  }

  /**
   * Suspend a user
   */
  async suspend(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const user = await this.userService.suspend(id);
    return reply.send({ data: transformUser(user) });
  }

  /**
   * Activate a user
   */
  async activate(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const user = await this.userService.activate(id);
    return reply.send({ data: transformUser(user) });
  }

  /**
   * Delete a user
   */
  async destroy(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    await this.userService.delete(id);
    return reply.status(204).send();
  }
}
