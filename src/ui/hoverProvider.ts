import * as vscode from 'vscode';
import { DetectionEngine } from '../detection/engine';
// import { PROVIDER_CONFIGS } from '../detection/patterns';
// import { CostClassifier } from '../detection/costClassifier';

export class OnboardingHoverProvider implements vscode.HoverProvider {
  private detectionEngine: DetectionEngine;

  constructor() {
    this.detectionEngine = new DetectionEngine();
  }

  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    const detections = this.detectionEngine.analyzeDocument(document);

    for (const detection of detections) {
      if (detection.range.contains(position)) {
        const markdown = this.createHoverContent(detection);
        return new vscode.Hover(markdown, detection.range);
      }
    }

    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private createHoverContent(detection: any): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.isTrusted = true;

    md.appendMarkdown(`**Revenium Issue Detection:**\n\n`);
    md.appendMarkdown(`${detection.pattern.message}`);

    return md;
  }

  private extractModel(match: string): string {
    const modelMatch = match.match(/["']([^"']+)["']/);
    return modelMatch ? modelMatch[1] : 'unknown';
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getDocumentLanguage(detection: any): string {
    if (detection.pattern.language.includes('python')) return 'python';
    if (detection.pattern.language.includes('javascript')) return 'javascript';
    if (detection.pattern.language.includes('typescript')) return 'typescript';
    return 'unknown';
  }
}
