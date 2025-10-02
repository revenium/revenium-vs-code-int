import { DetectionPattern, ProviderConfig } from '../types';

export const ONBOARDING_PATTERNS: DetectionPattern[] = [
  // OpenAI Python Patterns - Highest priority for onboarding
  {
    id: 'openai-python-import',
    pattern: /^(?:from\s+openai\s+import\s+[^\n]+|import\s+openai)/gm,
    message: 'OpenAI usage detected. Add Revenium middleware for cost tracking and monitoring.',
    language: ['python'],
    severity: 'INFO',
    provider: 'openai',
    scenario: 'missing_revenium',
    fixGuidance: 'import revenium_middleware_openai_python  # Auto-patches OpenAI',
  },

  // OpenAI JavaScript/TypeScript Patterns
  {
    id: 'openai-js-import',
    pattern: /import\s+(?:OpenAI|\*\s+as\s+OpenAI|\{\s*OpenAI\s*\})\s+from\s+['"]openai["']/g,
    message: 'OpenAI usage detected. Add Revenium middleware for cost tracking and monitoring.',
    language: ['javascript', 'typescript'],
    severity: 'INFO',
    provider: 'openai',
    scenario: 'missing_revenium',
    fixGuidance: 'import { patchOpenAIInstance } from "revenium-middleware-openai-node"'
  },
  {
    id: 'openai-commonjs-require',
    pattern: /(?:const|let|var)\s+(?:OpenAI|\w+)\s*=\s*require\s*\(\s*['"]openai['"]\s*\)/g,
    message: 'OpenAI usage detected. Add Revenium middleware for cost tracking and monitoring.',
    language: ['javascript'],
    severity: 'INFO',
    provider: 'openai',
    scenario: 'missing_revenium',
    fixGuidance: 'const { patchOpenAIInstance } = require("revenium-middleware-openai-node")'
  },

  // Anthropic Patterns
  {
    id: 'anthropic-python-import',
    pattern: /^from\s+anthropic\s+import\s+(?:Anthropic|AsyncAnthropic)/gm,
    message: 'Anthropic usage detected. Add Revenium middleware for cost tracking and monitoring.',
    language: ['python'],
    severity: 'INFO',
    provider: 'anthropic',
    scenario: 'missing_revenium',
    fixGuidance: 'from revenium_middleware_anthropic_python import Anthropic',
  },
  {
    id: 'anthropic-js-import',
    pattern: /import\s+(?:Anthropic|\{\s*Anthropic\s*\})\s+from\s+['"]@anthropic-ai\/sdk["']/g,
    message: 'Anthropic usage detected. Add Revenium middleware for cost tracking and monitoring.',
    language: ['javascript', 'typescript'],
    severity: 'INFO',
    provider: 'anthropic',
    scenario: 'missing_revenium',
    fixGuidance: 'import { patchAnthropicInstance } from "revenium-middleware-anthropic-node"'
  },

  // LangChain Patterns
  {
    id: 'langchain-import',
    pattern: /^(?:from\s+langchain|import\s+.*\s+from\s+["']langchain)/gm,
    message: 'LangChain usage detected. Ensure underlying LLM calls are tracked with Revenium.',
    language: ['python', 'javascript', 'typescript'],
    severity: 'INFO',
    provider: 'langchain',
    scenario: 'framework_usage',
    fixGuidance: 'Apply Revenium middleware to underlying OpenAI/Anthropic client'
  },
  {
    id: 'langchain-openai-import',
    pattern: /from\s+langchain_openai\s+import\s+(?:ChatOpenAI|OpenAI)/gm,
    message: 'LangChain OpenAI usage detected. Add Revenium middleware for cost tracking.',
    language: ['python'],
    severity: 'INFO',
    provider: 'openai',
    scenario: 'missing_revenium',
    fixGuidance: 'from revenium_middleware_openai.langchain import wrap',
  },

  // Google/Vertex AI Patterns
  {
    id: 'google-genai-import',
    pattern: /^import\s+google\.generativeai\s+as\s+genai/gm,
    message: 'Google AI usage detected. Add Revenium middleware for cost tracking and monitoring.',
    language: ['python'],
    severity: 'INFO',
    provider: 'google',
    scenario: 'missing_revenium',
    fixGuidance: 'from revenium_middleware_google_python import GenerativeAI'
  },

  // AWS Bedrock Patterns
  {
    id: 'bedrock-client',
    pattern: /boto3\.client\(['"]bedrock-runtime["']\)/g,
    message: 'AWS Bedrock usage detected. Add Revenium middleware for cost tracking.',
    language: ['python'],
    severity: 'INFO',
    provider: 'aws-bedrock',
    scenario: 'missing_revenium',
    fixGuidance: 'Apply Revenium Bedrock middleware to boto3 client'
  },


  // Perplexity AI
  {
    id: 'perplexity-usage',
    pattern: /(?:perplexity|pplx-api)/gi,
    message: 'Perplexity AI usage detected. Apply Revenium tracking.',
    language: ['python', 'javascript', 'typescript'],
    severity: 'INFO',
    provider: 'perplexity',
    scenario: 'missing_revenium',
    fixGuidance: 'Apply Revenium Perplexity middleware for usage tracking'
  },

  {
    id: 'async-openai-usage',
    pattern: /AsyncOpenAI|async.*\.chat\.completions\.create/g,
    message: 'Async OpenAI usage detected. Ensure Revenium middleware handles async operations.',
    language: ['python', 'javascript', 'typescript'],
    severity: 'INFO',
    provider: 'openai',
    scenario: 'async_pattern',
    fixGuidance: 'Revenium middleware automatically handles async operations'
  },

  // Streaming without tracking
  {
    id: 'streaming-no-tracking',
    pattern: /stream\s*=\s*True|stream:\s*true/g,
    message: 'Streaming responses detected. Ensure token counting is implemented.',
    language: ['python', 'javascript', 'typescript'],
    severity: 'INFO',
    provider: 'openai',
    scenario: 'framework_usage',
    fixGuidance: 'Revenium middleware automatically handles streaming token counts'
  },

  // Missing error handling - DISABLED
  // {
  //   id: 'no-error-handling',
  //   pattern: /\.(?:chat\.completions|messages)\.create\([^)]*\)(?!\s*\.catch|\s*except)/g,
  //   message: 'AI call without error handling. Add retry logic to handle rate limits.',
  //   language: ['python', 'javascript', 'typescript'],
  //   severity: 'WARNING',
  //   provider: 'unknown',
  //   scenario: 'security_warning'
  // }
];

export const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  openai: {
    name: 'openai',
    displayName: 'OpenAI',
    color: '#10A37F',
    icon: 'R',
    middlewarePackages: {
      python: 'revenium_middleware_openai_python',
      javascript: 'revenium-middleware-openai-node',
      typescript: 'revenium-middleware-openai-node'
    },
    documentation: 'https://docs.revenium.io/middleware/openai'
  },
  anthropic: {
    name: 'anthropic',
    displayName: 'Anthropic',
    color: '#D97757',
    icon: 'R',
    middlewarePackages: {
      python: 'revenium_middleware_anthropic_python',
      javascript: 'revenium-middleware-anthropic-node',
      typescript: 'revenium-middleware-anthropic-node'
    },
    documentation: 'https://docs.revenium.io/middleware/anthropic'
  },
  google: {
    name: 'google',
    displayName: 'Google AI',
    color: '#4285F4',
    icon: 'R',
    middlewarePackages: {
      python: 'revenium_middleware_google_python',
      javascript: 'revenium-middleware-google-node',
      typescript: 'revenium-middleware-google-node'
    },
    documentation: 'https://docs.revenium.io/middleware/google'
  },
  'aws-bedrock': {
    name: 'aws-bedrock',
    displayName: 'AWS Bedrock',
    color: '#FF9900',
    icon: 'R',
    middlewarePackages: {
      python: 'revenium_middleware_bedrock_python'
    },
    documentation: 'https://docs.revenium.io/middleware/bedrock'
  },
  perplexity: {
    name: 'perplexity',
    displayName: 'Perplexity AI',
    color: '#7C3AED',
    icon: 'R',
    middlewarePackages: {
      python: 'revenium_middleware_perplexity_python',
      javascript: 'revenium-middleware-perplexity-node'
    },
    documentation: 'https://docs.revenium.io/middleware/perplexity'
  }
};