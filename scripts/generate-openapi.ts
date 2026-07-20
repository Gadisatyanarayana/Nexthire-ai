import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);
import * as fs from 'fs';
import * as path from 'path';

// Define the registry
const registry = new OpenAPIRegistry();

// Register Bearer Auth
registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  description: 'Provide your API key generated from the NextHire AI dashboard.'
});

// Example Event Schema Registration
const AssessmentCompletedSchema = z.object({
  candidateId: z.string().uuid(),
  assessmentId: z.string().uuid(),
  score: z.number(),
  passed: z.boolean(),
  completedAt: z.string().datetime()
}).openapi('AssessmentCompleted');

registry.register('AssessmentCompleted', AssessmentCompletedSchema);

// Example Webhook Endpoint Documentation
registry.registerPath({
  method: 'post',
  path: '/api/integrations/webhooks',
  summary: 'Register a new webhook',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            url: z.string().url(),
            events: z.array(z.string()),
            active: z.boolean().default(true)
          })
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Webhook successfully registered',
      content: {
        'application/json': {
          schema: z.object({ id: z.string().uuid(), secret: z.string() })
        }
      }
    }
  }
});

function generateOpenAPI() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  const document = generator.generateDocument({
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: 'NextHire AI Integrations API',
      description: 'Enterprise REST APIs and Webhooks for ATS/LMS integrations.'
    },
    servers: [{ url: 'https://api.nexthire.ai/v1' }]
  });

  const outputPath = path.join(process.cwd(), 'docs', 'api', 'integrations-openapi-v1.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(document, null, 2));
  console.log(`Successfully generated OpenAPI spec at ${outputPath}`);
}

generateOpenAPI();
