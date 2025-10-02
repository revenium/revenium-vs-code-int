import * as vscode from 'vscode';
import { DetectionResult, QuickFix } from '../types';
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

    const success = await editor.edit(editBuilder => {
      fix.edit.entries().forEach(([uri, edits]) => {
        edits.forEach(edit => {
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

  private static generateFix(detection: DetectionResult, document: vscode.TextDocument): QuickFix | null {
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

    const packageName = config.middlewarePackages[language as keyof typeof config.middlewarePackages];
    if (!packageName) {
      return null;
    }

    const edit = new vscode.WorkspaceEdit();

    if (language === 'python') {
      // Python: Replace the original import with Revenium wrapper
      const originalLine = document.lineAt(detection.range.start.line).text;

      // Determine the replacement based on import pattern
      let replacement = '';
      if (originalLine.includes('from openai import')) {
        // Replace: from openai import OpenAI → from revenium_middleware_openai_python import OpenAI
        replacement = originalLine.replace('from openai', `from ${packageName}`);
      } else if (originalLine.includes('from anthropic import')) {
        // Replace: from anthropic import Anthropic → from revenium_middleware_anthropic_python import Anthropic
        replacement = originalLine.replace('from anthropic', `from ${packageName}`);
      } else if (originalLine.includes('import openai')) {
        // For simple imports, add middleware after (auto-patching approach)
        replacement = originalLine + '\n' + `import ${packageName}  # Auto-patches ${provider}`;
      } else if (originalLine.includes('import anthropic')) {
        replacement = originalLine + '\n' + `import ${packageName}  # Auto-patches ${provider}`;
      } else {
        // Default: add auto-patching import after
        replacement = originalLine + '\n' + `import ${packageName}  # Auto-patches ${provider}`;
      }

      const fullLineRange = new vscode.Range(
        new vscode.Position(detection.range.start.line, 0),
        new vscode.Position(detection.range.start.line, originalLine.length)
      );
      edit.replace(document.uri, fullLineRange, replacement);
    } else if (language === 'javascript' || language === 'typescript') {
      // JavaScript/TypeScript: Replace import or add wrapper based on pattern
      const originalLine = document.lineAt(detection.range.start.line).text;

      if (originalLine.includes('import') && originalLine.includes('openai')) {
        // ES6 import - replace with Revenium wrapped version
        const replacement = originalLine.replace(
          /from\s+['"]openai['"]/g,
          `from '${packageName}'`
        ) + '  // Revenium-wrapped OpenAI';

        const fullLineRange = new vscode.Range(
          new vscode.Position(detection.range.start.line, 0),
          new vscode.Position(detection.range.start.line, originalLine.length)
        );
        edit.replace(document.uri, fullLineRange, replacement);
      } else if (originalLine.includes('require') && originalLine.includes('openai')) {
        // CommonJS require - replace with Revenium wrapped version
        const replacement = originalLine.replace(
          /require\s*\(\s*['"]openai['"]\s*\)/g,
          `require('${packageName}')`
        ) + '  // Revenium-wrapped OpenAI';

        const fullLineRange = new vscode.Range(
          new vscode.Position(detection.range.start.line, 0),
          new vscode.Position(detection.range.start.line, originalLine.length)
        );
        edit.replace(document.uri, fullLineRange, replacement);
      } else {
        // Fallback: Add patching code after import
        const reveniumImport = `import { initializeReveniumFromEnv, patch${config.displayName.replace(/\s/g, '')} } from '${packageName}';\n`;
        const insertPosition = new vscode.Position(detection.range.end.line + 1, 0);
        edit.insert(document.uri, insertPosition, reveniumImport);

        // Add initialization call
        const initCode = `// Initialize Revenium tracking\ninitializeReveniumFromEnv();\npatch${config.displayName.replace(/\s/g, '')}(); // Auto-patches all instances\n\n`;
        edit.insert(document.uri, insertPosition, initCode);
      }
    }

    return {
      title: `Apply ${config.displayName} Revenium middleware`,
      edit,
      isPreferred: true
    };
  }


  private static mapLanguageId(languageId: string): string {
    const languageMap: Record<string, string> = {
      'python': 'python',
      'javascript': 'javascript',
      'typescript': 'typescript',
      'javascriptreact': 'javascript',
      'typescriptreact': 'typescript'
    };
    return languageMap[languageId] || 'unknown';
  }
}