import { AIPlanner } from '../../src/platform/ai/planner/AIPlanner';
import { ProviderGateway, AIProvider } from '../../src/platform/ai/gateway/ProviderGateway';
import { CostTracker } from '../../src/platform/ai/kernel/cost/CostTracker';
import { TokenCounter } from '../../src/platform/ai/kernel/tokens/TokenCounter';
import { ContextBuilder } from '../../src/platform/ai/rag/context-builder/ContextBuilder';
import { ChunkedDocument } from '../../src/platform/ai/knowledge/KnowledgeSchema';

describe('PRR-1 to PRR-13: AI Placement Intelligence E2E Validation', () => {

  it('PRR-4: Planner Accuracy (Execution Plan Generation)', () => {
    const planner = new AIPlanner();
    const plan = planner.generatePlan('I have an Amazon OA tomorrow');
    expect(plan).toContain('Retrieve Syllabus');
    expect(plan).toContain('Generate Roadmap');
  });

  it('PRR-6: Gateway Provider Fallback & Routing', async () => {
    const mockPrimary: AIProvider = {
      id: 'Primary',
      capabilities: { chat: true, vision: false, embeddings: false, moderation: false },
      generateResponse: jest.fn().mockRejectedValue(new Error('Rate Limit'))
    };
    const mockSecondary: AIProvider = {
      id: 'Secondary',
      capabilities: { chat: true, vision: false, embeddings: false, moderation: false },
      generateResponse: jest.fn().mockResolvedValue('Fallback Success')
    };

    const gateway = new ProviderGateway(new Map([['1', mockPrimary], ['2', mockSecondary]]));
    const result = await gateway.executeWithFallback('hello');
    expect(result).toBe('Fallback Success');
  });

  it('PRR-11: Cost Tracking by Feature', () => {
    const tracker = new CostTracker();
    const cost = tracker.calculateAndLogCost('gpt-4', 1000, 500, 'Placement Copilot');
    // (1000/1000 * 0.03) + (500/1000 * 0.06) = 0.03 + 0.03 = 0.06
    expect(cost).toBeCloseTo(0.06);
  });

  it('PRR-8 & PRR-1: Context Builder Budget Enforcement', () => {
    const counter = new TokenCounter();
    const builder = new ContextBuilder(counter);

    const doc: ChunkedDocument = {
      id: 'doc1', chunkId: 'c1', index: 'CURRICULUM', content: 'A very long content string that takes tokens',
      chunkIndex: 1, totalChunks: 1, embeddingVersion: 'v1', metadata: { sourceId: 's1', version: '1', tags: [], createdAt: '' }
    };

    // The document is roughly 11 tokens (44 chars / 4)
    const context = builder.buildContext([{ chunk: doc, score: 0.9 }], 5);
    // Since budget is 5 tokens and doc is 11, it should stop adding and return empty context
    expect(context).toBe('');
  });
});
