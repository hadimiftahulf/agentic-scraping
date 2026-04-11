import { PrismaClient, NotificationStatus, NotificationChannel } from '@bot/db';

export class NotificationService {
  constructor(private db: PrismaClient) {}

  /**
   * List notifications for a user
   */
  async listForUser(userId: string, params: { skip?: number; take?: number; status?: 'unread' }) {
    const where = {
      userId,
      deletedAt: null,
      ...(params.status === 'unread' ? { isRead: false } : {}),
    };

    const [notifications, totalCount, unreadCount] = await Promise.all([
      this.db.notification.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.notification.count({ where: { userId, deletedAt: null } }),
      this.db.notification.count({ where: { userId, deletedAt: null, isRead: false } }),
    ]);

    return { notifications, totalCount, unreadCount };
  }

  /**
   * Send a notification
   */
  async send(params: {
    userId: string;
    title: string;
    body: string;
    channel?: NotificationChannel;
    templateCode?: string;
    payload?: any;
  }) {
    return this.db.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        body: params.body,
        channel: params.channel || 'IN_APP',
        templateCode: params.templateCode,
        payload: params.payload,
        status: 'QUEUED',
      },
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string, userId: string) {
    return this.db.notification.update({
      where: { id, userId }, // Ensure user owns the notification
      data: { 
        isRead: true,
        status: 'READ',
      },
    });
  }
}
