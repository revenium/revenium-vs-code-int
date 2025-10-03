import { CostEstimate } from '../types/types';

export class CostClassifier {
  private static readonly COST_DATA = {
    openai: {
      'gpt-4': { per1000Tokens: 0.03, category: 'premium' },
      'gpt-4-turbo': { per1000Tokens: 0.01, category: 'premium' },
      'gpt-3.5-turbo': { per1000Tokens: 0.0015, category: 'standard' },
      'gpt-3.5-turbo-16k': { per1000Tokens: 0.003, category: 'standard' },
      'text-embedding-ada-002': { per1000Tokens: 0.0001, category: 'embedding' },
      'text-embedding-3-small': { per1000Tokens: 0.00002, category: 'embedding' },
      'text-embedding-3-large': { per1000Tokens: 0.00013, category: 'embedding' },
    },
    anthropic: {
      'claude-3-opus': { per1000Tokens: 0.015, category: 'premium' },
      'claude-3-sonnet': { per1000Tokens: 0.003, category: 'standard' },
      'claude-3-haiku': { per1000Tokens: 0.00025, category: 'economy' },
      'claude-2.1': { per1000Tokens: 0.008, category: 'standard' },
      'claude-instant': { per1000Tokens: 0.0016, category: 'economy' },
    },
    google: {
      'gemini-pro': { per1000Tokens: 0.00025, category: 'standard' },
      'gemini-pro-vision': { per1000Tokens: 0.00025, category: 'standard' },
      'palm-2': { per1000Tokens: 0.002, category: 'standard' },
    },
    'aws-bedrock': {
      'claude-v2': { per1000Tokens: 0.008, category: 'standard' },
      'claude-instant': { per1000Tokens: 0.0016, category: 'economy' },
      'titan-text-express': { per1000Tokens: 0.0008, category: 'economy' },
      'titan-text-lite': { per1000Tokens: 0.0003, category: 'economy' },
    },
  };

  static estimateCost(
    provider: string,
    model?: string,
    tokensPerMonth: number = 100000
  ): CostEstimate {
    const providerData = this.COST_DATA[provider as keyof typeof this.COST_DATA];

    if (!providerData) {
      return {
        provider,
        model: model || 'unknown',
        estimatedCostPer1000Tokens: 0.001,
        monthlyEstimate: (0.001 * tokensPerMonth) / 1000,
        optimizationPotential: 0,
      };
    }

    let modelData;
    let actualModel = model || '';

    if (model && providerData[model as keyof typeof providerData]) {
      modelData = providerData[model as keyof typeof providerData];
    } else {
      const models = Object.values(providerData);
      modelData = models.find((m) => m.category === 'standard') || models[0];
      actualModel = Object.keys(providerData)[0];
    }

    const costPer1000 = modelData.per1000Tokens;
    const monthlyEstimate = (costPer1000 * tokensPerMonth) / 1000;

    const economyModel = Object.values(providerData).find((m) => m.category === 'economy');
    const optimizationPotential = economyModel
      ? ((costPer1000 - economyModel.per1000Tokens) * tokensPerMonth) / 1000
      : 0;

    return {
      provider,
      model: actualModel,
      estimatedCostPer1000Tokens: costPer1000,
      monthlyEstimate,
      optimizationPotential,
    };
  }

  static categorizeSpend(monthlyEstimate: number): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (monthlyEstimate > 1000) return 'HIGH';
    if (monthlyEstimate > 100) return 'MEDIUM';
    return 'LOW';
  }

  static getOptimizationSuggestion(provider: string, model: string): string | undefined {
    const suggestions: Record<string, Record<string, string>> = {
      openai: {
        'gpt-4': 'Consider gpt-3.5-turbo for non-critical tasks (20x cost reduction)',
        'gpt-4-turbo': 'Use gpt-3.5-turbo where possible (7x cost reduction)',
      },
      anthropic: {
        'claude-3-opus': 'Try claude-3-haiku for simple tasks (60x cost reduction)',
        'claude-3-sonnet': 'Consider claude-3-haiku for basic queries (12x cost reduction)',
      },
    };

    return suggestions[provider]?.[model];
  }

  static formatCostDisplay(estimate: CostEstimate): string {
    const monthly = estimate.monthlyEstimate || 0;

    if (monthly < 0.01) {
      return `< $0.01/month`;
    } else if (monthly < 1) {
      return `$${monthly.toFixed(3)}/month`;
    } else if (monthly < 10) {
      return `$${monthly.toFixed(2)}/month`;
    } else {
      return `$${Math.round(monthly)}/month`;
    }
  }
}
