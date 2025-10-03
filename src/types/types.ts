import * as vscode from 'vscode';

export interface DetectionPattern {
  id: string;
  pattern: RegExp;
  message: string;
  language: string[];
  severity: 'ERROR' | 'WARNING' | 'INFO';
  provider: AIProvider;
  scenario: DetectionScenario;
  fixGuidance?: string;
  costImpact?: 'HIGH' | 'MEDIUM' | 'LOW';
  securityRisk?: boolean;
}

export interface DetectionResult {
  pattern: DetectionPattern;
  range: vscode.Range;
  match: string;
  suggestion?: string;
  costEstimate?: CostEstimate;
}

export interface CostEstimate {
  provider: string;
  model?: string;
  estimatedCostPer1000Tokens?: number;
  monthlyEstimate?: number;
  optimizationPotential?: number;
}

export interface IntegrationProgress {
  totalDetections: number;
  fixedDetections: number;
  percentComplete: number;
  estimatedTimeRemaining: string;
}

export interface OnboardingReport {
  timestamp: Date;
  projectPath: string;
  summary: {
    totalFiles: number;
    filesWithAIUsage: number;
    totalDetections: number;
    criticalIssues: number;
    estimatedMonthlyCost: number;
    optimizationPotential: number;
  };
  detections: DetectionResult[];
  recommendations: string[];
}

export type AIProvider =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'vertex'
  | 'azure'
  | 'aws-bedrock'
  | 'perplexity'
  | 'cohere'
  | 'huggingface'
  | 'replicate'
  | 'langchain'
  | 'llamaindex'
  | 'ollama'
  | 'litellm'
  | 'unknown';

export type DetectionScenario =
  | 'missing_revenium'
  | 'security_warning'
  | 'framework_usage'
  | 'cost_optimization'
  | 'async_pattern'
  | 'optimization_opportunity';

export interface ProviderConfig {
  name: string;
  displayName: string;
  color: string;
  icon: string;
  middlewarePackages: {
    python?: string;
    javascript?: string;
    typescript?: string;
  };
  documentation: string;
}

export interface QuickFix {
  title: string;
  edit: vscode.WorkspaceEdit;
  isPreferred?: boolean;
  needsConfirmation?: boolean;
}
