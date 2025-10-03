import 'dotenv/config';

import OpenAI from 'openai';

async function main() {
  // Initialize Revenium middleware
  const initResult = initializeReveniumFromEnv();
  if (!initResult.success) {
    console.error('Failed to initialize Revenium:', initResult.message);
    process.exit(1);
  }

  // Create and patch OpenAI instance
  const openai = patchOpenAIInstance(new OpenAI());

  // Chat completion with metadata
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
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

  console.log('Response:', response.choices[0]?.message?.content);
}

main().catch(console.error);