import { FastifyPluginAsync } from 'fastify';
import { MediaService } from '../services/media.service';
import { CreateMediaAttachmentSchema } from '../schemas/media.schema';
import { transformMedia, transformMediaAttachment } from '../lib/json-api';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const mediaRoute: FastifyPluginAsync = async (fastify) => {
  const mediaService = new MediaService(fastify.db);

  /**
   * POST /upload
   */
  fastify.post('/upload', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      const data = await request.file();
      if (!data) {
        reply.status(400).send({ error: 'No file uploaded' });
        return;
      }

      const folder = (data.fields.folder as any)?.value || 'uploads';
      const uploadDir = path.join(process.cwd(), 'public', folder);
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileId = uuidv4();
      const ext = path.extname(data.filename);
      const filename = `${fileId}${ext}`;
      const savePath = path.join(uploadDir, filename);

      // Save file
      const writeStream = fs.createWriteStream(savePath);
      await new Promise((resolve, reject) => {
        data.file.pipe(writeStream);
        data.file.on('end', resolve);
        data.file.on('error', reject);
      });

      const media = await mediaService.createMedia({
        filename,
        originalName: data.filename,
        mimeType: data.mimetype,
        size: fs.statSync(savePath).size,
        url: `/public/${folder}/${filename}`, // Relative URL
        folder,
      });

      reply.status(201).send({ data: transformMedia(media) });
    },
  });

  /**
   * POST /attach
   */
  fastify.post('/attach', {
    onRequest: [fastify.authenticate],
    schema: {
      body: CreateMediaAttachmentSchema,
    },
    handler: async (request, reply) => {
      const { data } = request.body as any;
      await mediaService.attachMedia(data.attributes);
      
      reply.status(201).send({
        meta: { message: 'Media attached successfully' }
      });
    },
  });

  /**
   * DELETE /media/:id
   */
  fastify.delete('/media/:id', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as any;
      await mediaService.deleteMedia(id);
      reply.send({
        meta: { message: 'Media deleted successfully' }
      });
    },
  });
};

export default mediaRoute;
