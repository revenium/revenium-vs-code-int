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
      // Python uses auto-patching - just add the import after the original
      const reveniumImport = `import ${packageName}  # Auto-patches ${provider} for Revenium tracking\n`;
      const insertPosition = new vscode.Position(detection.range.end.line + 1, 0);
      edit.insert(document.uri, insertPosition, reveniumImport);
    } else if (language === 'javascript' || language === 'typescript') {
      // Add Revenium middleware import after the AI import
      const reveniumImport = `import { initializeReveniumFromEnv, patchOpenAI } from '${packageName}';\n`;
      const insertPosition = new vscode.Position(detection.range.end.line + 1, 0);
      edit.insert(document.uri, insertPosition, reveniumImport);

      // Add initialization call (patches all instances globally)
      const initCode = `// Initialize Revenium tracking\ninitializeReveniumFromEnv();\npatchOpenAI(); // Auto-patches all OpenAI instances\n\n`;
      edit.insert(document.uri, insertPosition, initCode);
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