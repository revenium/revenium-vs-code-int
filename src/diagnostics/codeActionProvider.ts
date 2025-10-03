import * as vscode from 'vscode';
import { PROVIDER_CONFIGS } from '../detection/patterns';

export class ReveniumCodeActionProvider implements vscode.CodeActionProvider {
  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
    console.log('[Revenium CodeActionProvider] provideCodeActions called');
    console.log('[Revenium CodeActionProvider] Document:', document.fileName);
    console.log(
      '[Revenium CodeActionProvider] Range:',
      `${range.start.line}:${range.start.character}-${range.end.line}:${range.end.character}`
    );
    console.log('[Revenium CodeActionProvider] Context diagnostics:', context.diagnostics.length);

    const actions: vscode.CodeAction[] = [];

    for (const diagnostic of context.diagnostics) {
      console.log('[Revenium CodeActionProvider] Processing diagnostic:', {
        source: diagnostic.source,
        code: diagnostic.code,
        message: diagnostic.message,
        range: `${diagnostic.range.start.line}:${diagnostic.range.start.character}-${diagnostic.range.end.line}:${diagnostic.range.end.character}`,
      });

      if (diagnostic.source === 'Revenium' && diagnostic.code) {
        console.log('[Revenium CodeActionProvider] Creating quick fixes for:', diagnostic.code);
        const quickFixes = this.createQuickFix(document, diagnostic);
        if (quickFixes) {
          console.log('[Revenium CodeActionProvider] Added 1 quick fix');
          actions.push(quickFixes);
        }
      }
    }

    console.log('[Revenium CodeActionProvider] Returning', actions.length, 'total actions');
    return actions;
  }

  private createQuickFix(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic
  ): vscode.CodeAction | undefined {
    const patternId = diagnostic.code?.toString();
    if (!patternId) {
      return undefined;
    }

    const language = this.mapLanguageId(document.languageId);
    const config = this.getProviderConfig(patternId);

    if (!config) {
      console.log('[Revenium CodeActionProvider] No provider config found for pattern:', patternId);
      return undefined;
    }

    // Get middleware package for this language
    const middlewarePackage =
      config.middlewarePackages[language as keyof typeof config.middlewarePackages];
    if (!middlewarePackage) {
      console.log('[Revenium CodeActionProvider] No middleware package for language:', language);
      return undefined;
    }

    return this.createMiddlewareIntegrationAction(
      document,
      diagnostic,
      patternId,
      language,
      config,
      middlewarePackage
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getProviderConfig(patternId: string): any {
    // Map pattern IDs to provider configs
    if (patternId.includes('openai')) return PROVIDER_CONFIGS['openai'];
    if (patternId.includes('anthropic')) return PROVIDER_CONFIGS['anthropic'];
    if (patternId.includes('google')) return PROVIDER_CONFIGS['google'];
    if (patternId.includes('bedrock')) return PROVIDER_CONFIGS['aws-bedrock'];
    if (patternId.includes('perplexity')) return PROVIDER_CONFIGS['perplexity'];
    if (patternId.includes('langchain')) return PROVIDER_CONFIGS['openai']; // LangChain uses OpenAI middleware
    return null;
  }

  private createMiddlewareIntegrationAction(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic,
    patternId: string,
    language: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    config: any,
    middlewarePackage: string
  ): vscode.CodeAction {
    const originalText = document.getText(diagnostic.range);
    const action = new vscode.CodeAction(
      `Add ${config.displayName} Revenium middleware`,
      vscode.CodeActionKind.QuickFix.append('revenium')
    );
    action.diagnostics = [diagnostic];
    action.isPreferred = true;

    const edit = new vscode.WorkspaceEdit();

    if (language === 'python') {
      // Python: Replace import with Revenium wrapper
      return this.createPythonReplaceAction(
        document,
        diagnostic,
        originalText,
        middlewarePackage,
        config
      );
    } else if (language === 'javascript' || language === 'typescript') {
      // JavaScript/TypeScript: Add initialization code before original import
      const isRequire = patternId.includes('require');
      const insertPosition = new vscode.Position(diagnostic.range.start.line, 0);

      if (isRequire) {
        let reveniumCode = '';
        if (middlewarePackage.includes('openai-node')) {
          reveniumCode = `const { initializeReveniumFromEnv, patchOpenAIInstance } = require('${middlewarePackage}');
// Initialize Revenium tracking
initializeReveniumFromEnv();
patchOpenAIInstance(); // Auto-patches all OpenAI instances

`;
        } else if (middlewarePackage.includes('anthropic-node')) {
          reveniumCode = `require('${middlewarePackage}');
`;
        } else if (middlewarePackage.includes('litellm-node')) {
          reveniumCode = `require('dotenv/config');
require('${middlewarePackage}');
`;
        } else {
          reveniumCode = `require('${middlewarePackage}');
`;
        }
        edit.insert(document.uri, insertPosition, reveniumCode);
      } else {
        let reveniumCode = '';
        if (middlewarePackage.includes('openai-node')) {
          reveniumCode = `import { initializeReveniumFromEnv, patchOpenAIInstance } from '${middlewarePackage}';
// Initialize Revenium tracking
initializeReveniumFromEnv();
patchOpenAIInstance(); // Auto-patches all OpenAI instances

`;
        } else if (middlewarePackage.includes('anthropic-node')) {
          reveniumCode = `import '${middlewarePackage}';
`;
        } else if (middlewarePackage.includes('litellm-node')) {
          reveniumCode = `import 'dotenv/config';
import '${middlewarePackage}';
`;
        } else {
          reveniumCode = `import '${middlewarePackage}';
`;
        }
        edit.insert(document.uri, insertPosition, reveniumCode);
      }
    }

    action.edit = edit;
    return action;
  }

  private mapLanguageId(languageId: string): string {
    const mapping: { [key: string]: string } = {
      python: 'python',
      javascript: 'javascript',
      typescript: 'typescript',
      javascriptreact: 'javascript',
      typescriptreact: 'typescript',
    };

    return mapping[languageId] || languageId;
  }

  private createPythonReplaceAction(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic,
    _originalText: string,
    middlewarePackage: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    config: any
  ): vscode.CodeAction {
    // Add Revenium middleware import (following official documentation)
    const replaceAction = new vscode.CodeAction(
      `Add ${config.displayName} Revenium middleware`,
      vscode.CodeActionKind.QuickFix.append('revenium')
    );
    replaceAction.diagnostics = [diagnostic];
    replaceAction.isPreferred = true;

    const replaceEdit = new vscode.WorkspaceEdit();

    // Follow Revenium documentation: Keep original import + add middleware import
    // const _providerName = config.name;

    // Add the middleware import on the next line (following official docs pattern)
    const insertPosition = new vscode.Position(diagnostic.range.end.line + 1, 0);
    const middlewareImport = `import ${middlewarePackage}\n`;

    replaceEdit.insert(document.uri, insertPosition, middlewareImport);
    replaceAction.edit = replaceEdit;

    return replaceAction;
  }
}
