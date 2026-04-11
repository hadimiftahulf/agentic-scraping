import { z } from 'zod';

export const MediaResourceSchema = z.object({
  type: z.literal('media'),
  id: z.string().uuid(),
  attributes: z.object({
    filename: z.string(),
    original_name: z.string(),
    mime_type: z.string(),
    size: z.number(),
    url: z.string(),
    folder: z.string().nullable(),
  }),
});

export const MediaAttachmentSchema = z.object({
  type: z.literal('media_attachment'),
  id: z.string().uuid(),
  attributes: z.object({
    entity_type: z.string(),
    entity_id: z.string().uuid(),
    collection_name: z.string().nullable(),
  }),
  relationships: z.object({
    media: z.object({
      data: z.object({
        type: z.literal('media'),
        id: z.string().uuid(),
      }),
    }),
  }),
});

export const MediaResponseSchema = z.object({
  data: z.union([MediaResourceSchema, z.array(MediaResourceSchema)]),
});

export const CreateMediaAttachmentSchema = z.object({
  data: z.object({
    type: z.literal('media_attachment'),
    attributes: z.object({
      media_id: z.string().uuid(),
      entity_type: z.string(),
      entity_id: z.string().uuid(),
      collection_name: z.string().optional(),
    }),
  }),
});

export type CreateMediaAttachmentRequest = z.infer<typeof CreateMediaAttachmentSchema>;
