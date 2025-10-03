import * as vscode from 'vscode';
import { DetectionResult, QuickFix } from '../types/types';
import { PROVIDER_CONFIGS } from '../detection/patterns';

export class QuickFixProvider {
  static async applyQuickFix(detection: DetectionResult): Promise<boolean> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return false;
    }

    const fix = this.generateFix(detection, editor.document);
    if (!fix) {
      vscode.window.showWarningMessage('No quick fix available for this detection');
      return false;
    }

    const success = await editor.edit((editBuilder) => {
      fix.edit.entries().forEach(([_uri, edits]) => {
        edits.forEach((edit) => {
          if (edit.newText !== undefined && edit.range) {
            editBuilder.replace(edit.range, edit.newText);
          }
        });
      });
    });

    if (success) {
      vscode.window.showInformationMessage(
        `✅ Applied Revenium integration for ${detection.pattern.provider}`
      );
    }

    return success;
  }

  private static generateFix(
    detection: DetectionResult,
    document: vscode.TextDocument
  ): QuickFix | null {
    const pattern = detection.pattern;
    const language = this.mapLanguageId(document.languageId);

    switch (pattern.scenario) {
      case 'missing_revenium':
        return this.generateMiddlewareFix(detection, document, language);
      case 'security_warning':
        // Security warnings are display-only, no fixes provided
        return null;
      case 'framework_usage':
        return this.generateMiddlewareFix(detection, document, language);
      case 'async_pattern':
        return this.generateMiddlewareFix(detection, document, language);
      default:
        return null;
    }
  }

  private static generateMiddlewareFix(
    detection: DetectionResult,
    document: vscode.TextDocument,
    language: string
  ): QuickFix | null {
    const provider = detection.pattern.provider;
    const config = PROVIDER_CONFIGS[provider];

    if (!config) {
      return null;
    }

    const packageName =
      config.middlewarePackages[language as keyof typeof config.middlewarePackages];
    if (!packageName) {
      return null;
    }

    const edit = new vscode.WorkspaceEdit();

    if (language === 'python') {
      // Python: Add middleware import after original import (following official docs)
      // const _originalLine = document.lineAt(detection.range.start.line).text;

      // Add the middleware import on the next line (following official docs pattern)
      const insertPosition = new vscode.Position(detection.range.end.line + 1, 0);
      const middlewareImport = `import ${packageName}\n`;

      edit.insert(document.uri, insertPosition, middlewareImport);
    } else if (language === 'javascript' || language === 'typescript') {
      // JavaScript/TypeScript: Replace import or add wrapper based on pattern
      const originalLine = document.lineAt(detection.range.start.line).text;

      if (
        originalLine.includes('import') &&
        (originalLine.includes('openai') ||
          originalLine.includes('anthropic') ||
          originalLine.includes('litellm') ||
          originalLine.includes('google') ||
          originalLine.includes('@revenium/google') ||
          originalLine.includes('vertex') ||
          originalLine.includes('@revenium/vertex') ||
          originalLine.includes('perplexity') ||
          originalLine.includes('@revenium/perplexity'))
      ) {
        // ES6 import - add middleware imports after original import
        const insertPosition = new vscode.Position(detection.range.end.line + 1, 0);

        let middlewareImports = '';
        if (packageName.includes('openai-node')) {
          middlewareImports = `import { initializeReveniumFromEnv, patchOpenAIInstance } from '${packageName}';\n`;
        } else if (packageName.includes('anthropic-node')) {
          middlewareImports = `import '${packageName}';\n`;
        } else if (packageName.includes('litellm-node')) {
          middlewareImports = `import 'dotenv/config';\nimport '${packageName}';\n`;
        } else if (packageName.includes('@revenium/google')) {
          middlewareImports = `import { GoogleAiReveniumMiddleware } from '${packageName}';\n`;
        } else if (packageName.includes('@revenium/vertex')) {
          middlewareImports = `import { VertexAIReveniumMiddlewareV2 } from '${packageName}';\n`;
        } else if (packageName.includes('@revenium/perplexity')) {
          middlewareImports = `import { PerplexityReveniumMiddleware } from '${packageName}';\n`;
        } else {
          middlewareImports = `import '${packageName}';\n`;
        }

        edit.insert(document.uri, insertPosition, middlewareImports);
      } else if (
        originalLine.includes('require') &&
        (originalLine.includes('openai') ||
          originalLine.includes('anthropic') ||
          originalLine.includes('litellm'))
      ) {
        // CommonJS require - replace with Revenium wrapped version
        const replacement =
          originalLine.replace(/require\s*\(\s*['"]openai['"]\s*\)/g, `require('${packageName}')`) +
          '  // Revenium-wrapped OpenAI';

        const fullLineRange = new vscode.Range(
          new vscode.Position(detection.range.start.line, 0),
          new vscode.Position(detection.range.start.line, originalLine.length)
        );
        edit.replace(document.uri, fullLineRange, replacement);
      } else if (
        originalLine.includes('fetch') ||
        originalLine.includes('LITELLM_PROXY_URL') ||
        originalLine.includes('LITELLM_API_KEY')
      ) {
        // LiteLLM Proxy usage - add middleware at top of file
        const insertPosition = new vscode.Position(0, 0);
        const middlewareImports = `import 'dotenv/config';\nimport '${packageName}';\n\n`;
        edit.insert(document.uri, insertPosition, middlewareImports);
      } else {
        // Fallback: Add middleware import at top of file
        const insertPosition = new vscode.Position(0, 0);

        let middlewareImports = '';
        if (packageName.includes('openai-node')) {
          middlewareImports = `import { initializeReveniumFromEnv, patchOpenAIInstance } from '${packageName}';\n`;
        } else if (packageName.includes('anthropic-node')) {
          middlewareImports = `import '${packageName}';\n`;
        } else if (packageName.includes('litellm-node')) {
          middlewareImports = `import 'dotenv/config';\nimport '${packageName}';\n`;
        } else if (packageName.includes('@revenium/google')) {
          middlewareImports = `import { GoogleAiReveniumMiddleware } from '${packageName}';\n`;
        } else if (packageName.includes('@revenium/vertex')) {
          middlewareImports = `import { VertexAIReveniumMiddlewareV2 } from '${packageName}';\n`;
        } else if (packageName.includes('@revenium/perplexity')) {
          middlewareImports = `import { PerplexityReveniumMiddleware } from '${packageName}';\n`;
        } else {
          middlewareImports = `import '${packageName}';\n`;
        }

        edit.insert(document.uri, insertPosition, middlewareImports);
      }
    }

    return {
      title: `Apply ${config.displayName} Revenium middleware`,
      edit,
      isPreferred: true,
    };
  }

  private static mapLanguageId(languageId: string): string {
    const languageMap: Record<string, string> = {
      python: 'python',
      javascript: 'javascript',
      typescript: 'typescript',
      javascriptreact: 'javascript',
      typescriptreact: 'typescript',
    };
    return languageMap[languageId] || 'unknown';
  }
}
