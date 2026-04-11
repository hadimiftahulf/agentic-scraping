import { PrismaClient } from '@bot/db';

export class MediaService {
  constructor(private db: PrismaClient) {}

  /**
   * Create media record
   */
  async createMedia(data: {
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    folder?: string;
  }) {
    return this.db.media.create({
      data: {
        filename: data.filename,
        originalName: data.originalName,
        mimeType: data.mimeType,
        size: data.size,
        url: data.url,
        folder: data.folder,
      },
    });
  }

  /**
   * Find media by ID
   */
  async findById(id: string) {
    return this.db.media.findUnique({
      where: { id, deletedAt: null },
    });
  }

  /**
   * Attach media to entity
   */
  async attachMedia(params: {
    mediaId: string;
    entityType: string;
    entityId: string;
    collectionName?: string;
  }) {
    return this.db.mediaAttachment.upsert({
      where: {
        entityType_entityId_mediaId_collectionName: {
          entityType: params.entityType,
          entityId: params.entityId,
          mediaId: params.mediaId,
          collectionName: params.collectionName || 'default',
        },
      },
      update: {
        deletedAt: null,
      },
      create: {
        mediaId: params.mediaId,
        entityType: params.entityType,
        entityId: params.entityId,
        collectionName: params.collectionName || 'default',
      },
    });
  }

  /**
   * Soft delete media
   */
  async deleteMedia(id: string) {
    return this.db.media.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
