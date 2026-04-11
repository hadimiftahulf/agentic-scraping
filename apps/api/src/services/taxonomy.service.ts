import { PrismaClient } from '@bot/db';

export class TaxonomyService {
  constructor(private db: PrismaClient) {}

  /**
   * List all taxonomies
   */
  async listTaxonomies() {
    return this.db.taxonomy.findMany({
      where: { deletedAt: null },
    });
  }

  /**
   * Get taxonomy by code
   */
  async getTaxonomyByCode(code: string) {
    return this.db.taxonomy.findUnique({
      where: { code, deletedAt: null },
    });
  }

  /**
   * List terms for a taxonomy
   */
  async listTerms(taxonomyId: string) {
    return this.db.term.findMany({
      where: { taxonomyId, deletedAt: null },
      include: { taxonomy: true },
    });
  }

  /**
   * Find term by taxonomy and term code
   */
  async findTerm(taxonomyCode: string, termCode: string) {
    const taxonomy = await this.getTaxonomyByCode(taxonomyCode);
    if (!taxonomy) return null;

    return this.db.term.findUnique({
      where: {
        taxonomyId_code: {
          taxonomyId: taxonomy.id,
          code: termCode,
        },
        deletedAt: null,
      },
      include: { taxonomy: true },
    });
  }

  /**
   * Attach term to entity
   */
  async attachTerm(params: {
    entityType: string;
    entityId: string;
    taxonomyCode: string;
    termCode: string;
  }) {
    const term = await this.findTerm(params.taxonomyCode, params.termCode);
    if (!term) {
      throw new Error(`Term ${params.termCode} not found in taxonomy ${params.taxonomyCode}`);
    }

    return this.db.taxonomyAttachment.upsert({
      where: {
        entityType_entityId_termId: {
          entityType: params.entityType,
          entityId: params.entityId,
          termId: term.id,
        },
      },
      update: {
        deletedAt: null, // Reactivate if it was soft deleted
      },
      create: {
        entityType: params.entityType,
        entityId: params.entityId,
        termId: term.id,
        taxonomyId: term.taxonomyId,
      },
    });
  }
}
