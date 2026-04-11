import { z } from 'zod';

export const TaxonomyResourceSchema = z.object({
  type: z.literal('taxonomy'),
  id: z.string().uuid(),
  attributes: z.object({
    code: z.string(),
    name: z.string(),
    is_hierarchical: z.boolean(),
  }),
});

export const TermResourceSchema = z.object({
  type: z.literal('term'),
  id: z.string().uuid(),
  attributes: z.object({
    code: z.string(),
    label: z.string(),
    parent_id: z.string().uuid().nullable(),
  }),
});

export const TaxonomyResponseSchema = z.object({
  data: z.union([TaxonomyResourceSchema, z.array(TaxonomyResourceSchema)]),
});

export const TermResponseSchema = z.object({
  data: z.union([TermResourceSchema, z.array(TermResourceSchema)]),
});

export const CreateAttachmentSchema = z.object({
  data: z.object({
    type: z.literal('attachment'),
    attributes: z.object({
      entity_type: z.string(),
      entity_id: z.string().uuid(),
      term_code: z.string(),
      taxonomy_code: z.string(),
    }),
  }),
});

export type CreateAttachmentRequest = z.infer<typeof CreateAttachmentSchema>;
