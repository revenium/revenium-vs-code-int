import 'dotenv/config';

import Anthropic from '@anthropic-ai/sdk';

async function main() {
  // Create Anthropic client
  const anthropic = new Anthropic();

  // Chat completion with metadata
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [
      { role: 'user', content: 'Please verify you are ready to assist me.' }
    ],

    /* Optional metadata for advanced reporting, lineage tracking, and cost allocation
    usageMetadata: {
      subscriber: {
        id: 'user-123',
        email: 'user@example.com'
      },
      organizationId: 'my-customers-name',
      productId: 'my-product',
      taskType: 'doc-summary',
      agent: 'customer-support'
    }
    */
  });

  console.log('Response:', response.content[0]?.text);
}

main().catch(console.error);