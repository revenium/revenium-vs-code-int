import * as vscode from 'vscode';
import { DetectionEngine } from '../detection/engine';
import { DetectionResult } from '../types/types';

export class OnboardingCodeLensProvider implements vscode.CodeLensProvider {
  private detectionEngine: DetectionEngine;
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;
  private refreshTimeout: NodeJS.Timeout | undefined;

  constructor() {
    this.detectionEngine = new DetectionEngine();
  }

  public provideCodeLenses(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CodeLens[]> {
    if (!this.shouldProvideCodeLenses(document)) {
      return [];
    }

    try {
      const detectionResults = this.detectionEngine.analyzeDocument(document);
      return this.createCodeLenses(detectionResults);
    } catch (error) {
      console.error('Error providing code lenses:', error);
      return [];
    }
  }

  private shouldProvideCodeLenses(document: vscode.TextDocument): boolean {
    const supportedLanguages = [
      'python',
      'javascript',
      'typescript',
      'javascriptreact',
      'typescriptreact',
    ];
    return supportedLanguages.includes(document.languageId) && document.uri.scheme === 'file';
  }

  private createCodeLenses(results: DetectionResult[]): vscode.CodeLens[] {
    const codeLenses: vscode.CodeLens[] = [];
    const resultsByLine = new Map<number, DetectionResult[]>();

    for (const result of results) {
      const line = result.range.start.line;
      if (!resultsByLine.has(line)) {
        resultsByLine.set(line, []);
      }
      resultsByLine.get(line)!.push(result);
    }

    for (const [line, lineResults] of resultsByLine) {
      // Group all fixable scenarios together
      const fixableResults = lineResults.filter(
        (r) =>
          r.pattern.scenario === 'missing_revenium' ||
          r.pattern.scenario === 'framework_usage' ||
          r.pattern.scenario === 'async_pattern'
      );

      // Show middleware integration CodeLens for all fixable scenarios
      if (fixableResults.length > 0) {
        const range = new vscode.Range(line, 0, line, 1);
        const provider = fixableResults[0].pattern.provider;
        const title = `[Revenium] Integrate ${this.getProviderName(provider)} middleware - Click to fix`;

        const codeLens = new vscode.CodeLens(range, {
          title,
          command: 'revenium.applyQuickFix',
          arguments: [fixableResults[0]],
          tooltip: 'Apply Revenium middleware for automatic usage tracking',
        });

        codeLenses.unshift(codeLens);
      }
    }

    return codeLenses;
  }

  private getProviderName(provider: string): string {
    const names: Record<string, string> = {
      openai: 'OpenAI',
      anthropic: 'Anthropic',
      google: 'Google AI',
      'aws-bedrock': 'AWS Bedrock',
      perplexity: 'Perplexity',
      langchain: 'LangChain',
    };
    return names[provider] || provider;
  }

  public refresh(): void {
    // Debounce refresh calls to prevent infinite loops
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }

    this.refreshTimeout = setTimeout(() => {
      this._onDidChangeCodeLenses.fire();
      this.refreshTimeout = undefined;
    }, 100); // Short debounce for CodeLens
  }

  dispose(): void {
    // Clean up resources
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = undefined;
    }
    this._onDidChangeCodeLenses.dispose();
  }
}
