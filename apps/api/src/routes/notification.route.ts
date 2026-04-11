import { FastifyPluginAsync } from 'fastify';
import { NotificationService } from '../services/notification.service';
import { SendNotificationSchema, UpdateNotificationSchema } from '../schemas/notification.schema';
import { transformNotification, transformNotifications } from '../lib/json-api';

const notificationRoute: FastifyPluginAsync = async (fastify) => {
  const notificationService = new NotificationService(fastify.db);

  /**
   * POST /notifications/send
   */
  fastify.post('/notifications/send', {
    onRequest: [fastify.authenticate],
    schema: {
      body: SendNotificationSchema,
    },
    handler: async (request, reply) => {
      const { data } = request.body as any;
      const job = await notificationService.send({
        userId: data.attributes.user_id,
        title: data.attributes.title || 'Notification',
        body: data.attributes.body || '',
        channel: data.attributes.channel,
        templateCode: data.attributes.template_code,
        payload: data.attributes.payload,
      });

      reply.status(202).send({
        data: {
          type: 'notification_jobs',
          id: job.id,
          attributes: {
            status: job.status,
            created_at: job.createdAt.toISOString(),
          },
          links: {
            self: `/api/v1/notifications/jobs/${job.id}`,
          },
        },
      });
    },
  });

  /**
   * GET /notifications
   */
  fastify.get('/notifications', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      const userId = (request.user as any).sub;
      const { page, filter } = request.query as any;
      const pageNumber = page?.number ? parseInt(page.number) : 1;
      const pageSize = page?.size ? parseInt(page.size) : 20;
      const status = filter?.status;

      const { notifications, totalCount, unreadCount } = await notificationService.listForUser(userId, {
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        status,
      });

      reply.send(transformNotifications(notifications, {
        total_count: totalCount,
        unread_count: unreadCount,
      }));
    },
  });

  /**
   * PATCH /notifications/:id
   */
  fastify.patch('/notifications/:id', {
    onRequest: [fastify.authenticate],
    schema: {
      body: UpdateNotificationSchema,
    },
    handler: async (request, reply) => {
      const { id } = request.params as any;
      const userId = (request.user as any).sub;
      const { data } = request.body as any;

      if (data.attributes.is_read) {
        const notification = await notificationService.markAsRead(id, userId);
        reply.send({ data: transformNotification(notification) });
      } else {
        reply.status(400).send({ error: 'Only is_read=true is supported for updates' });
      }
    },
  });
};

export default notificationRoute;
