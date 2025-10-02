/**
 * Test file for OpenAI Node.js/TypeScript SDK detection
 */

// Test Case 1: ES6 import - should be detected
import OpenAI from 'openai';

// Test Case 2: Named import - should be detected
import { OpenAI as OpenAIClient } from 'openai';

// Test Case 3: CommonJS require - should be detected
const OpenAICommon = require('openai');

// Test Case 4: Client instantiation with hardcoded key
const openai = new OpenAI({
  apiKey: 'sk-node123456789012345678901234567890', // Hardcoded key - should be detected
});

// Test Case 5: Chat completion without max_tokens
async function testCompletion() {
  const response = await openai.chat.completions.create({
    model: 'gpt-4', // Expensive model - should be detected
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello!' }
    ]
  });
  return response;
}

// Test Case 6: Streaming response
async function testStreaming() {
  const stream = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Tell me a story' }],
    stream: true // Streaming detected
  });
  return stream;
}

// Test Case 7: Multiple client instances
const productionClient = new OpenAI({
  apiKey: 'sk-prod123456789012345678901234567890'
});

const testClient = new OpenAI({
  apiKey: 'sk-test123456789012345678901234567890'
});

// Test Case 8: Using environment variable (good practice, but still needs Revenium)
const envClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Test Case 9: Embedding call
async function testEmbedding() {
  const embedding = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: 'The quick brown fox'
  });
  return embedding;
}

// Test Case 10: Function calling
async function testFunctionCalling() {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo', // Another expensive model
    messages: [{ role: 'user', content: 'What is the weather?' }],
    functions: [
      {
        name: 'get_weather',
        description: 'Get the weather',
        parameters: {
          type: 'object',
          properties: {
            location: { type: 'string' }
          }
        }
      }
    ]
  });
  return response;
}

// Test Case 11: Error handling
async function testWithErrorHandling() {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Test' }]
    });
    return response;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Test Case 12: Azure OpenAI pattern
const azureClient = new OpenAI({
  apiKey: 'sk-azure123456789012345678901234567890',
  baseURL: 'https://myazure.openai.azure.com',
  defaultHeaders: {
    'api-version': '2024-02-15-preview'
  }
});

export { openai, testCompletion, testStreaming };