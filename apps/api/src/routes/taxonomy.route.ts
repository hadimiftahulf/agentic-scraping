import { FastifyPluginAsync } from 'fastify';
import { TaxonomyService } from '../services/taxonomy.service';
import { CreateAttachmentSchema } from '../schemas/taxonomy.schema';
import { transformTaxonomies, transformTerms } from '../lib/json-api';

const taxonomyRoute: FastifyPluginAsync = async (fastify) => {
  const taxonomyService = new TaxonomyService(fastify.db);

  /**
   * GET /taxonomies
   */
  fastify.get('/taxonomies', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      const taxonomies = await taxonomyService.listTaxonomies();
      reply.send(transformTaxonomies(taxonomies));
    },
  });

  /**
   * GET /taxonomies/:code/terms
   */
  fastify.get('/taxonomies/:code/terms', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      const { code } = request.params as any;
      const taxonomy = await taxonomyService.getTaxonomyByCode(code);
      
      if (!taxonomy) {
        reply.status(404).send({ error: 'Taxonomy not found' });
        return;
      }

      const terms = await taxonomyService.listTerms(taxonomy.id);
      reply.send(transformTerms(terms, code));
    },
  });

  /**
   * POST /attachments
   */
  fastify.post('/attachments', {
    onRequest: [fastify.authenticate],
    schema: {
      body: CreateAttachmentSchema,
    },
    handler: async (request, reply) => {
      const { data } = request.body as any;
      await taxonomyService.attachTerm(data.attributes);
      
      reply.status(201).send({
        meta: { message: 'Attached successfully' }
      });
    },
  });
};

export default taxonomyRoute;
