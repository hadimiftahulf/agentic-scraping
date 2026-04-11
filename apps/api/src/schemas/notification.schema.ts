import { z } from 'zod';

export const NotificationStatusSchema = z.enum(['QUEUED', 'SENT', 'FAILED', 'READ']);
export const NotificationChannelSchema = z.enum(['EMAIL', 'WHATSAPP', 'TELEGRAM', 'IN_APP']);

export const NotificationResourceSchema = z.object({
  type: z.literal('notifications'),
  id: z.string().uuid(),
  attributes: z.object({
    title: z.string(),
    body: z.string(),
    status: NotificationStatusSchema,
    channel: NotificationChannelSchema,
    is_read: z.boolean(),
    template_code: z.string().nullable(),
    payload: z.any().nullable(),
    created_at: z.string().datetime(),
  }),
  relationships: z.object({
    user: z.object({
      data: z.object({
        type: z.literal('users'),
        id: z.string().uuid(),
      }),
    }),
  }),
});

export const NotificationResponseSchema = z.object({
  data: z.union([NotificationResourceSchema, z.array(NotificationResourceSchema)]),
  meta: z.object({
    total_count: z.number().optional(),
    unread_count: z.number().optional(),
  }).optional(),
});

export const SendNotificationSchema = z.object({
  data: z.object({
    type: z.literal('notification_requests'),
    attributes: z.object({
      user_id: z.string().uuid(),
      title: z.string().optional(),
      body: z.string().optional(),
      template_code: z.string().optional(),
      channel: NotificationChannelSchema.default('IN_APP'),
      payload: z.any().optional(),
    }),
  }),
});

export const UpdateNotificationSchema = z.object({
  data: z.object({
    type: z.literal('notifications'),
    id: z.string().uuid(),
    attributes: z.object({
      is_read: z.boolean(),
    }),
  }),
});

export type SendNotificationRequest = z.infer<typeof SendNotificationSchema>;
export type UpdateNotificationRequest = z.infer<typeof UpdateNotificationSchema>;
