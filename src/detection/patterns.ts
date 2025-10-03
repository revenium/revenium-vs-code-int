import { DetectionPattern, ProviderConfig } from '../types/types';

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
    fixGuidance: 'import revenium_middleware_openai  # Add middleware import',
  },
  {
    id: 'openai-python-client-instantiation',
    pattern: /(\w+)\s*=\s*(?:openai\.)?(?:OpenAI|AsyncOpenAI)\s*\(/g,
    message: 'OpenAI client instantiation detected. Wrap with Revenium for tracking.',
    language: ['python'],
    severity: 'INFO',
    provider: 'openai',
    scenario: 'missing_revenium',
    fixGuidance: 'client = ReveniumWrapper(OpenAI())  # Wrap the client',
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
    fixGuidance:
      'import { initializeReveniumFromEnv, patchOpenAIInstance } from "revenium-middleware-openai-node"',
  },
  {
    id: 'openai-js-client-instantiation',
    pattern: /(?:const|let|var)\s+(\w+)\s*=\s*new\s+OpenAI\s*\(/g,
    message: 'OpenAI client instantiation detected. Using Revenium wrapper for tracking.',
    language: ['javascript', 'typescript'],
    severity: 'INFO',
    provider: 'openai',
    scenario: 'missing_revenium',
    fixGuidance: 'const client = new ReveniumOpenAI()  // Use wrapped client',
  },
  {
    id: 'openai-commonjs-require',
    pattern: /(?:const|let|var)\s+(?:OpenAI|\w+)\s*=\s*require\s*\(\s*['"]openai['"]\s*\)/g,
    message: 'OpenAI usage detected. Add Revenium middleware for cost tracking and monitoring.',
    language: ['javascript'],
    severity: 'INFO',
    provider: 'openai',
    scenario: 'missing_revenium',
    fixGuidance: 'const { patchOpenAIInstance } = require("revenium-middleware-openai-node")',
  },

  // Anthropic Patterns
  {
    id: 'anthropic-python-import',
    pattern: /^(?:from\s+anthropic\s+import\s+[^\n]+|import\s+anthropic)/gm,
    message: 'Anthropic usage detected. Add Revenium middleware for cost tracking and monitoring.',
    language: ['python'],
    severity: 'INFO',
    provider: 'anthropic',
    scenario: 'missing_revenium',
    fixGuidance: 'import revenium_middleware_anthropic  # Add middleware import',
  },
  {
    id: 'anthropic-python-client-instantiation',
    pattern: /(\w+)\s*=\s*(?:anthropic\.)?(?:Anthropic|AsyncAnthropic)\s*\(/g,
    message: 'Anthropic client instantiation detected. Wrap with Revenium for tracking.',
    language: ['python'],
    severity: 'INFO',
    provider: 'anthropic',
    scenario: 'missing_revenium',
    fixGuidance: 'client = ReveniumWrapper(Anthropic())  # Wrap the client',
  },
  {
    id: 'anthropic-js-import',
    pattern: /import\s+(?:Anthropic|\{\s*Anthropic\s*\})\s+from\s+['"]@anthropic-ai\/sdk["']/g,
    message: 'Anthropic usage detected. Add Revenium middleware for cost tracking and monitoring.',
    language: ['javascript', 'typescript'],
    severity: 'INFO',
    provider: 'anthropic',
    scenario: 'missing_revenium',
    fixGuidance: 'import "revenium-middleware-anthropic-node"',
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
    fixGuidance: 'Apply Revenium middleware to underlying OpenAI/Anthropic client',
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
    pattern:
      /^(?:from\s+google\s+import\s+genai|import\s+google\.generativeai|from\s+google\.generativeai\s+import|import\s+vertexai|from\s+vertexai)/gm,
    message: 'Google AI usage detected. Add Revenium middleware for cost tracking and monitoring.',
    language: ['python'],
    severity: 'INFO',
    provider: 'google',
    scenario: 'missing_revenium',
    fixGuidance: 'import revenium_middleware_google  # Add middleware import',
  },
  {
    id: 'google-js-revenium-import',
    pattern: /import\s+.*\s+from\s+['"]@revenium\/google["']/g,
    message: 'Google AI Revenium middleware usage detected.',
    language: ['javascript', 'typescript'],
    severity: 'INFO',
    provider: 'google',
    scenario: 'missing_revenium',
    fixGuidance: 'import { GoogleAiReveniumMiddleware } from "@revenium/google"',
  },
  {
    id: 'google-js-genai-import',
    pattern: /import\s+.*\s+from\s+['"]@google\/generative-ai["']/g,
    message: 'Google Generative AI usage detected. Add Revenium middleware for cost tracking.',
    language: ['javascript', 'typescript'],
    severity: 'INFO',
    provider: 'google',
    scenario: 'missing_revenium',
    fixGuidance: 'import { GoogleAiReveniumMiddleware } from "@revenium/google"',
  },
  {
    id: 'google-js-genai-class',
    pattern: /new\s+GoogleGenerativeAI\s*\(/g,
    message: 'Google Generative AI instantiation detected. Use Revenium wrapper for tracking.',
    language: ['javascript', 'typescript'],
    severity: 'INFO',
    provider: 'google',
    scenario: 'missing_revenium',
    fixGuidance: 'new GoogleAiReveniumMiddleware()',
  },
  {
    id: 'google-js-revenium-class-usage',
    pattern: /new\s+GoogleAiReveniumMiddleware\s*\(/g,
    message: 'Google AI Revenium middleware usage detected without import. Add import statement.',
    language: ['javascript', 'typescript'],
    severity: 'INFO',
    provider: 'google',
    scenario: 'missing_revenium',
    fixGuidance: 'import { GoogleAiReveniumMiddleware } from "@revenium/google"',
  },

  // Vertex AI Patterns
  {
    id: 'vertex-js-revenium-import',
    pattern: /import\s+.*\s+from\s+['"]@revenium\/vertex["']/g,
    message: 'Vertex AI Revenium middleware usage detected.',
    language: ['javascript', 'typescript'],
    severity: 'INFO',
    provider: 'vertex',
    scenario: 'missing_revenium',
    fixGuidance: 'import { VertexAIReveniumMiddlewareV2 } from "@revenium/vertex"',
  },
  {
    id: 'vertex-js-revenium-class-usage',
    pattern: /new\s+VertexAIReveniumMiddlewareV2\s*\(/g,
    message: 'Vertex AI Revenium middleware usage detected without import. Add import statement.',
    language: ['javascript', 'typescript'],
    severity: 'INFO',
    provider: 'vertex',
    scenario: 'missing_revenium',
    fixGuidance: 'import { VertexAIReveniumMiddlewareV2 } from "@revenium/vertex"',
  },

  // Perplexity AI Patterns
  {
    id: 'perplexity-js-revenium-import',
    pattern: /import\s+.*\s+from\s+['"]@revenium\/perplexity["']/g,
    message: 'Perplexity AI Revenium middleware usage detected.',
    language: ['javascript', 'typescript'],
    severity: 'INFO',
    provider: 'perplexity',
    scenario: 'missing_revenium',
    fixGuidance: 'import { PerplexityReveniumMiddleware } from "@revenium/perplexity"',
  },
  {
    id: 'perplexity-js-revenium-class-usage',
    pattern: /new\s+PerplexityReveniumMiddleware\s*\(/g,
    message:
      'Perplexity AI Revenium middleware usage detected without import. Add import statement.',
    language: ['javascript', 'typescript'],
    severity: 'INFO',
    provider: 'perplexity',
    scenario: 'missing_revenium',
    fixGuidance: 'import { PerplexityReveniumMiddleware } from "@revenium/perplexity"',
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
    fixGuidance: 'Apply Revenium Bedrock middleware to boto3 client',
  },

  // Ollama Patterns
  {
    id: 'ollama-python-import',
    pattern: /^(?:from\s+ollama\s+import\s+[^\n]+|import\s+ollama)/gm,
    message: 'Ollama usage detected. Add Revenium middleware for cost tracking and monitoring.',
    language: ['python'],
    severity: 'INFO',
    provider: 'ollama',
    scenario: 'missing_revenium',
    fixGuidance: 'import revenium_middleware_ollama  # Add middleware import',
  },

  // LiteLLM Patterns
  {
    id: 'litellm-python-import',
    pattern: /^(?:from\s+litellm\s+import\s+[^\n]+|import\s+litellm)/gm,
    message: 'LiteLLM usage detected. Add Revenium middleware for cost tracking and monitoring.',
    language: ['python'],
    severity: 'INFO',
    provider: 'litellm',
    scenario: 'missing_revenium',
    fixGuidance: 'import revenium_middleware_litellm_client.middleware  # Add middleware import',
  },
  {
    id: 'litellm-js-import',
    pattern: /import\s+.*\s+from\s+['"]litellm["']/g,
    message: 'LiteLLM usage detected. Add Revenium middleware for cost tracking and monitoring.',
    language: ['javascript', 'typescript'],
    severity: 'INFO',
    provider: 'litellm',
    scenario: 'missing_revenium',
    fixGuidance: 'import "revenium-middleware-litellm-node"',
  },
  {
    id: 'litellm-proxy-fetch',
    pattern: /fetch\s*\(\s*[`'"].*\/chat\/completions[`'"]/g,
    message:
      'LiteLLM Proxy usage detected. Add Revenium middleware for cost tracking and monitoring.',
    language: ['javascript', 'typescript'],
    severity: 'INFO',
    provider: 'litellm',
    scenario: 'missing_revenium',
    fixGuidance: 'import "revenium-middleware-litellm-node"',
  },
  {
    id: 'litellm-proxy-env',
    pattern: /LITELLM_PROXY_URL|LITELLM_API_KEY/g,
    message:
      'LiteLLM Proxy environment variables detected. Add Revenium middleware for cost tracking.',
    language: ['javascript', 'typescript'],
    severity: 'INFO',
    provider: 'litellm',
    scenario: 'missing_revenium',
    fixGuidance: 'import "revenium-middleware-litellm-node"',
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
    fixGuidance: 'Apply Revenium Perplexity middleware for usage tracking',
  },

  {
    id: 'async-openai-usage',
    pattern: /AsyncOpenAI|async.*\.chat\.completions\.create/g,
    message: 'Async OpenAI usage detected. Ensure Revenium middleware handles async operations.',
    language: ['python', 'javascript', 'typescript'],
    severity: 'INFO',
    provider: 'openai',
    scenario: 'async_pattern',
    fixGuidance: 'Revenium middleware automatically handles async operations',
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
    fixGuidance: 'Revenium middleware automatically handles streaming token counts',
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
      python: 'revenium_middleware_openai',
      javascript: 'revenium-middleware-openai-node',
      typescript: 'revenium-middleware-openai-node',
    },
    documentation: 'https://docs.revenium.io/middleware/openai',
  },
  anthropic: {
    name: 'anthropic',
    displayName: 'Anthropic',
    color: '#D97757',
    icon: 'R',
    middlewarePackages: {
      python: 'revenium_middleware_anthropic',
      javascript: 'revenium-middleware-anthropic-node',
      typescript: 'revenium-middleware-anthropic-node',
    },
    documentation: 'https://docs.revenium.io/middleware/anthropic',
  },
  ollama: {
    name: 'ollama',
    displayName: 'Ollama',
    color: '#000000',
    icon: 'R',
    middlewarePackages: {
      python: 'revenium_middleware_ollama',
      javascript: 'revenium-middleware-ollama-node',
      typescript: 'revenium-middleware-ollama-node',
    },
    documentation: 'https://docs.revenium.io/middleware/ollama',
  },
  litellm: {
    name: 'litellm',
    displayName: 'LiteLLM',
    color: '#FF6B35',
    icon: 'R',
    middlewarePackages: {
      python: 'revenium_middleware_litellm_client.middleware',
      javascript: 'revenium-middleware-litellm-node',
      typescript: 'revenium-middleware-litellm-node',
    },
    documentation: 'https://docs.revenium.io/middleware/litellm',
  },
  google: {
    name: 'google',
    displayName: 'Google AI',
    color: '#4285F4',
    icon: 'R',
    middlewarePackages: {
      python: 'revenium_middleware_google',
      javascript: '@revenium/google',
      typescript: '@revenium/google',
    },
    documentation: 'https://docs.revenium.io/middleware/google',
  },
  vertex: {
    name: 'vertex',
    displayName: 'Vertex AI',
    color: '#4285F4',
    icon: 'R',
    middlewarePackages: {
      javascript: '@revenium/vertex',
      typescript: '@revenium/vertex',
    },
    documentation: 'https://docs.revenium.io/middleware/vertex',
  },
  perplexity: {
    name: 'perplexity',
    displayName: 'Perplexity AI',
    color: '#20B2AA',
    icon: 'R',
    middlewarePackages: {
      python: 'revenium_middleware_perplexity_python',
      javascript: '@revenium/perplexity',
      typescript: '@revenium/perplexity',
    },
    documentation: 'https://docs.revenium.io/middleware/perplexity',
  },
  'aws-bedrock': {
    name: 'aws-bedrock',
    displayName: 'AWS Bedrock',
    color: '#FF9900',
    icon: 'R',
    middlewarePackages: {
      python: 'revenium_middleware_bedrock_python',
    },
    documentation: 'https://docs.revenium.io/middleware/bedrock',
  },
};
