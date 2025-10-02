import * as vscode from 'vscode';
import { PROVIDER_CONFIGS } from '../detection/patterns';

export class ReveniumCodeActionProvider implements vscode.CodeActionProvider {

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
    console.log('[Revenium CodeActionProvider] provideCodeActions called');
    console.log('[Revenium CodeActionProvider] Document:', document.fileName);
    console.log('[Revenium CodeActionProvider] Range:', `${range.start.line}:${range.start.character}-${range.end.line}:${range.end.character}`);
    console.log('[Revenium CodeActionProvider] Context diagnostics:', context.diagnostics.length);

    const actions: vscode.CodeAction[] = [];

    for (const diagnostic of context.diagnostics) {
      console.log('[Revenium CodeActionProvider] Processing diagnostic:', {
        source: diagnostic.source,
        code: diagnostic.code,
        message: diagnostic.message,
        range: `${diagnostic.range.start.line}:${diagnostic.range.start.character}-${diagnostic.range.end.line}:${diagnostic.range.end.character}`
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
    const middlewarePackage = config.middlewarePackages[language as keyof typeof config.middlewarePackages];
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
    config: any,
    middlewarePackage: string
  ): vscode.CodeAction {
    const originalText = document.getText(diagnostic.range);
    const action = new vscode.CodeAction(
      `Add ${config.displayName} Revenium middleware (auto-patches all instances)`,
      vscode.CodeActionKind.QuickFix
    );
    action.diagnostics = [diagnostic];
    action.isPreferred = true;

    const edit = new vscode.WorkspaceEdit();

    if (language === 'python') {
      // Python: Replace import with Revenium wrapper
      return this.createPythonReplaceAction(document, diagnostic, originalText, middlewarePackage, config);
    } else if (language === 'javascript' || language === 'typescript') {
      // JavaScript/TypeScript: Add initialization code before original import
      const isRequire = patternId.includes('require');
      const insertPosition = new vscode.Position(diagnostic.range.start.line, 0);

      if (isRequire) {
        const reveniumCode = `const { initializeReveniumFromEnv, patch${config.displayName.replace(/\s/g, '')} } = require('${middlewarePackage}');
// Initialize Revenium tracking
initializeReveniumFromEnv();
patch${config.displayName.replace(/\s/g, '')}(); // Auto-patches all ${config.displayName} instances

`;
        edit.insert(document.uri, insertPosition, reveniumCode);
      } else {
        const reveniumCode = `import { initializeReveniumFromEnv, patch${config.displayName.replace(/\s/g, '')} } from '${middlewarePackage}';
// Initialize Revenium tracking
initializeReveniumFromEnv();
patch${config.displayName.replace(/\s/g, '')}(); // Auto-patches all ${config.displayName} instances

`;
        edit.insert(document.uri, insertPosition, reveniumCode);
      }
    }

    action.edit = edit;
    return action;
  }

  private mapLanguageId(languageId: string): string {
    const mapping: { [key: string]: string } = {
      'python': 'python',
      'javascript': 'javascript',
      'typescript': 'typescript',
      'javascriptreact': 'javascript',
      'typescriptreact': 'typescript'
    };

    return mapping[languageId] || languageId;
  }

  private createPythonReplaceAction(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic,
    originalText: string,
    middlewarePackage: string,
    config: any
  ): vscode.CodeAction {
    // Replace original import with Revenium wrapper import
    const replaceAction = new vscode.CodeAction(
      `Replace with ${config.displayName} Revenium wrapper import`,
      vscode.CodeActionKind.QuickFix
    );
    replaceAction.diagnostics = [diagnostic];
    replaceAction.isPreferred = true;

    const replaceEdit = new vscode.WorkspaceEdit();

    // Handle different import patterns intelligently - always replace, never add
    let replacementText = '';
    const providerName = config.name;

    // Pattern: from X import ...
    const fromImportMatch = originalText.match(new RegExp(`from\\s+${providerName}\\s+import\\s+(.+)`, 'i'));
    if (fromImportMatch) {
      const imports = fromImportMatch[1].trim();
      replacementText = `from ${middlewarePackage} import ${imports}  # Revenium auto-patching`;
    }
    // Pattern: import X
    else if (originalText.match(new RegExp(`import\\s+${providerName}`, 'i'))) {
      replacementText = `import ${middlewarePackage} as ${providerName}  # Revenium auto-patching`;
    }
    // Pattern: from X.Y import ...
    else if (originalText.includes('import') && originalText.includes(providerName)) {
      replacementText = `import ${middlewarePackage}  # Revenium auto-patching`;
    }
    // Fallback
    else {
      replacementText = `import ${middlewarePackage}  # Revenium auto-patching`;
    }

    replaceEdit.replace(document.uri, diagnostic.range, replacementText);
    replaceAction.edit = replaceEdit;

    return replaceAction;
  }
}