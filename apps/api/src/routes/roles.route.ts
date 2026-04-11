import { FastifyPluginAsync } from 'fastify';
import { RoleService } from '../services/role.service';
import { CreateRoleSchema } from '../schemas/role.schema';
import { transformRole, transformRoles, transformPermissions } from '../lib/json-api';

const rolesRoute: FastifyPluginAsync = async (fastify) => {
  const roleService = new RoleService(fastify.db);

  /**
   * GET /roles
   */
  fastify.get('/roles', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      const roles = await roleService.listRoles();
      reply.send(transformRoles(roles));
    },
  });

  /**
   * POST /roles
   */
  fastify.post('/roles', {
    onRequest: [fastify.authenticate],
    schema: {
      body: CreateRoleSchema,
    },
    handler: async (request, reply) => {
      const { data } = request.body as any;
      const role = await roleService.createRole(data.attributes);
      reply.status(201).send({ data: transformRole(role) });
    },
  });

  /**
   * GET /permissions
   */
  fastify.get('/permissions', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      const permissions = await roleService.listPermissions();
      reply.send(transformPermissions(permissions));
    },
  });

  /**
   * PATCH /roles/:id/relationships/permissions
   */
  fastify.patch('/roles/:id/relationships/permissions', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as any;
      const data = request.body as any[];
      const permissionIds = data.map(item => item.id);
      
      await roleService.assignPermissions(id, permissionIds);
      reply.status(204).send();
    },
  });
};

export default rolesRoute;
