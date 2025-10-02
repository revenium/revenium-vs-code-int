import * as vscode from 'vscode';
import { DetectionEngine } from '../detection/engine';
import { DetectionResult } from '../types';

export class DiagnosticsProvider {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private detectionEngine: DetectionEngine;
  private documentChangeTimeout: Map<string, NodeJS.Timeout> = new Map();

  constructor(context: vscode.ExtensionContext) {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('revenium');
    this.detectionEngine = new DetectionEngine();

    context.subscriptions.push(this.diagnosticCollection);
    this.setupEventHandlers(context);
  }

  private setupEventHandlers(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
      vscode.workspace.onDidOpenTextDocument(document => {
        this.analyzeDocumentWithDiagnostics(document);
      }),

      vscode.workspace.onDidChangeTextDocument(event => {
        this.debounceAnalysis(event.document);
      }),

      vscode.workspace.onDidCloseTextDocument(document => {
        this.diagnosticCollection.delete(document.uri);
        this.clearTimeout(document.uri.toString());
      })
    );

    if (vscode.window.activeTextEditor) {
      this.analyzeDocumentWithDiagnostics(vscode.window.activeTextEditor.document);
    }
  }

  private debounceAnalysis(document: vscode.TextDocument): void {
    const uri = document.uri.toString();

    this.clearTimeout(uri);

    const timeout = setTimeout(() => {
      this.analyzeDocumentWithDiagnostics(document);
      this.documentChangeTimeout.delete(uri);
    }, 500);

    this.documentChangeTimeout.set(uri, timeout);
  }

  private clearTimeout(uri: string): void {
    const timeout = this.documentChangeTimeout.get(uri);
    if (timeout) {
      clearTimeout(timeout);
      this.documentChangeTimeout.delete(uri);
    }
  }

  private async analyzeDocumentWithDiagnostics(document: vscode.TextDocument): Promise<void> {
    console.log('[Revenium DiagnosticsProvider] Analyzing document:', document.fileName);

    if (!this.shouldAnalyze(document)) {
      console.log('[Revenium DiagnosticsProvider] Skipping document (shouldAnalyze = false):', document.fileName);
      return;
    }

    // Check if overlays are enabled
    const config = vscode.workspace.getConfiguration('revenium');
    const showOverlays = config.get('showDetectionOverlays', true);

    if (!showOverlays) {
      console.log('[Revenium DiagnosticsProvider] Detection overlays disabled, clearing diagnostics');
      this.diagnosticCollection.delete(document.uri);
      return;
    }

    try {
      console.log('[Revenium DiagnosticsProvider] Running detection engine...');
      const detectionResults = this.detectionEngine.analyzeDocument(document);
      console.log('[Revenium DiagnosticsProvider] Found detections:', detectionResults.length);

      for (const result of detectionResults) {
        console.log('[Revenium DiagnosticsProvider] Detection:', {
          pattern: result.pattern.id,
          range: `${result.range.start.line}:${result.range.start.character}-${result.range.end.line}:${result.range.end.character}`,
          match: result.match,
          scenario: result.pattern.scenario
        });
      }

      const diagnostics = this.convertToDiagnostics(detectionResults, document);
      console.log('[Revenium DiagnosticsProvider] Created diagnostics:', diagnostics.length);
      this.diagnosticCollection.set(document.uri, diagnostics);
    } catch (error) {
      console.error('[Revenium DiagnosticsProvider] Error analyzing document:', error);
    }
  }

  private shouldAnalyze(document: vscode.TextDocument): boolean {
    const supportedLanguages = ['python', 'javascript', 'typescript', 'javascriptreact', 'typescriptreact'];
    const isFileScheme = document.uri.scheme === 'file';

    // Skip non-code files
    const fileName = document.uri.fsPath.toLowerCase();
    const skipFiles = [
      'settings.json', 'package.json', 'tsconfig.json', '.gitignore',
      'readme.md', 'changelog.md', 'license', '.env'
    ];
    const isSkipFile = skipFiles.some(skip => fileName.includes(skip));

    // Skip common non-AI directories
    const skipDirs = ['node_modules', '.git', '.vscode', 'dist', 'build', 'coverage'];
    const isSkipDir = skipDirs.some(dir => fileName.includes(`/${dir}/`) || fileName.includes(`\\${dir}\\`));

    // Only analyze if it's a supported language and might contain AI usage
    const hasAIContent = this.quickCheckForAIContent(document);

    return supportedLanguages.includes(document.languageId) &&
           isFileScheme &&
           !isSkipFile &&
           !isSkipDir &&
           hasAIContent;
  }

  private quickCheckForAIContent(document: vscode.TextDocument): boolean {
    const text = document.getText();
    const aiKeywords = [
      'openai', 'anthropic', 'claude', 'gpt', 'completion', 'chat.completion',
      'langchain', 'llamaindex', 'huggingface', 'transformers', 'gemini',
      'mistral', 'cohere', 'bedrock', 'azure', 'api_key'
    ];

    const lowerText = text.toLowerCase();
    return aiKeywords.some(keyword => lowerText.includes(keyword));
  }

  private convertToDiagnostics(results: DetectionResult[], document?: vscode.TextDocument): vscode.Diagnostic[] {
    return results.map(result => {
      const diagnostic = new vscode.Diagnostic(
        result.range,
        result.pattern.message,
        this.getSeverity(result.pattern.severity)
      );

      diagnostic.source = 'Revenium';
      diagnostic.code = result.pattern.id;

      if (result.pattern.fixGuidance && document) {
        diagnostic.relatedInformation = [
          new vscode.DiagnosticRelatedInformation(
            new vscode.Location(document.uri, result.range),
            result.pattern.fixGuidance
          )
        ];
      }

      return diagnostic;
    });
  }

  private getSeverity(severity: string): vscode.DiagnosticSeverity {
    switch (severity) {
      case 'ERROR':
        return vscode.DiagnosticSeverity.Error;
      case 'WARNING':
        return vscode.DiagnosticSeverity.Warning;
      case 'INFO':
        return vscode.DiagnosticSeverity.Information;
      default:
        return vscode.DiagnosticSeverity.Warning;
    }
  }

  public async refreshAllDocuments(): Promise<void> {
    const documents = vscode.workspace.textDocuments;
    for (const document of documents) {
      if (this.shouldAnalyze(document)) {
        await this.analyzeDocumentWithDiagnostics(document);
      }
    }
  }

  public clearDiagnostics(): void {
    this.diagnosticCollection.clear();
  }

  public getDiagnostics(uri: vscode.Uri): readonly vscode.Diagnostic[] {
    return this.diagnosticCollection.get(uri) || [];
  }
}