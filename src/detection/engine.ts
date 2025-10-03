import * as vscode from 'vscode';
import { ONBOARDING_PATTERNS } from './patterns';
import { DetectionPattern, DetectionResult } from '../types/types';

export class DetectionEngine {
  private patterns: DetectionPattern[];
  private cache: Map<string, DetectionResult[]> = new Map();

  constructor() {
    this.patterns = ONBOARDING_PATTERNS;
  }

  analyzeDocument(document: vscode.TextDocument): DetectionResult[] {
    console.log('[Revenium DetectionEngine] Analyzing document:', document.fileName);

    // Check if detection is active (check new key first, fall back to old key)
    const config = vscode.workspace.getConfiguration('revenium');
    const detectionEnabled = config.get<boolean>(
      'detection.enabled',
      config.get<boolean>('detectionActive', true)
    );
    if (!detectionEnabled) {
      console.log('[Revenium DetectionEngine] Detection is disabled');
      return [];
    }

    const cacheKey = `${document.uri.toString()}:${document.version}`;

    if (this.cache.has(cacheKey)) {
      console.log('[Revenium DetectionEngine] Using cached results');
      return this.filterResults(this.cache.get(cacheKey)!, config);
    }

    const results: DetectionResult[] = [];
    const text = document.getText();
    const language = this.mapLanguageId(document.languageId);
    console.log('[Revenium DetectionEngine] Document language:', language);
    console.log('[Revenium DetectionEngine] Document text preview:', text.substring(0, 200));

    // Check if this language is enabled
    const languageEnabled = config.get<boolean>(`languages.${language}`, true);
    if (!languageEnabled) {
      console.log('[Revenium DetectionEngine] Language disabled:', language);
      return [];
    }

    for (const pattern of this.patterns) {
      if (!pattern.language.includes(language)) {
        continue;
      }

      // Check if provider is enabled
      const providerEnabled = config.get<boolean>(`providers.${pattern.provider}`, true);
      if (!providerEnabled) {
        console.log('[Revenium DetectionEngine] Provider disabled:', pattern.provider);
        continue;
      }

      // Skip detection if middleware is already present
      if (this.isMiddlewareAlreadyPresent(text, pattern.provider, language)) {
        console.log('[Revenium DetectionEngine] Middleware already present for:', pattern.provider);
        continue;
      }

      console.log('[Revenium DetectionEngine] Testing pattern:', pattern.id);

      // Use the original pattern to preserve flags (especially global flag)
      const regex =
        pattern.pattern instanceof RegExp ? pattern.pattern : new RegExp(pattern.pattern, 'g');
      let match;
      let matchCount = 0;

      while ((match = regex.exec(text)) !== null) {
        matchCount++;
        console.log('[Revenium DetectionEngine] Pattern matched:', {
          patternId: pattern.id,
          match: match[0],
          index: match.index,
          matchCount,
        });

        // Prevent infinite loops with non-global regex
        if (!regex.global) {
          break;
        }
        const startPos = document.positionAt(match.index);
        const endPos = document.positionAt(match.index + match[0].length);
        const range = new vscode.Range(startPos, endPos);

        results.push({
          pattern,
          range,
          match: match[0],
          suggestion: pattern.fixGuidance,
        });
      }

      if (matchCount === 0) {
        console.log('[Revenium DetectionEngine] No matches for pattern:', pattern.id);
      }
    }

    console.log('[Revenium DetectionEngine] Total results found:', results.length);

    this.cache.set(cacheKey, results);

    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    return results;
  }

  analyzeWorkspace(
    workspaceFolder: vscode.WorkspaceFolder
  ): Promise<Map<string, DetectionResult[]>> {
    return new Promise((resolve) => {
      (async () => {
        const results = new Map<string, DetectionResult[]>();

        const files = await vscode.workspace.findFiles(
          new vscode.RelativePattern(workspaceFolder, '**/*.{py,js,ts,jsx,tsx}'),
          '**/node_modules/**',
          1000
        );

        for (const file of files) {
          try {
            const document = await vscode.workspace.openTextDocument(file);
            const detections = this.analyzeDocument(document);
            if (detections.length > 0) {
              results.set(file.toString(), detections);
            }
          } catch (error) {
            console.error(`Error analyzing ${file}:`, error);
          }
        }

        resolve(results);
      })();
    });
  }

  getPatternById(id: string): DetectionPattern | undefined {
    return this.patterns.find((p) => p.id === id);
  }

  getCriticalPatterns(): DetectionPattern[] {
    return this.patterns.filter(
      (p) => p.severity === 'ERROR' || p.securityRisk === true || p.costImpact === 'HIGH'
    );
  }

  getProviderPatterns(provider: string): DetectionPattern[] {
    return this.patterns.filter((p) => p.provider === provider);
  }

  private mapLanguageId(languageId: string): string {
    const languageMap: Record<string, string> = {
      python: 'python',
      javascript: 'javascript',
      typescript: 'typescript',
      javascriptreact: 'javascript',
      typescriptreact: 'typescript',
    };
    return languageMap[languageId] || 'unknown';
  }

  clearCache(): void {
    this.cache.clear();
  }

  private filterResults(
    results: DetectionResult[],
    config: vscode.WorkspaceConfiguration
  ): DetectionResult[] {
    // Check new key first, fall back to old key
    const detectionFilter = config.get<string>(
      'detection.filter',
      config.get<string>('detectionFilter', 'all')
    );

    if (detectionFilter === 'all') {
      return results;
    }

    return results.filter((result) => {
      switch (detectionFilter) {
        case 'integration':
          return result.pattern.scenario === 'missing_revenium';
        case 'security':
          return result.pattern.scenario === 'security_warning';
        case 'imports':
          // Match patterns that are specifically import detections
          return result.pattern.id.includes('import');
        default:
          return true;
      }
    });
  }

  private isMiddlewareAlreadyPresent(text: string, provider: string, language: string): boolean {
    // Import the provider configs to get the correct middleware package name
    const { PROVIDER_CONFIGS } = require('./patterns');
    const config = PROVIDER_CONFIGS[provider];

    if (!config || !config.middlewarePackages) {
      return false;
    }

    const middlewarePackage = config.middlewarePackages[language];
    if (!middlewarePackage) {
      return false;
    }

    // Check if the middleware import is already present in the text
    if (language === 'python') {
      // Check for: import revenium_middleware_openai
      const middlewareImportPattern = new RegExp(
        `^\\s*import\\s+${middlewarePackage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`,
        'm'
      );
      const hasMiddlewareImport = middlewareImportPattern.test(text);

      console.log('[Revenium DetectionEngine] Checking middleware presence:', {
        provider,
        middlewarePackage,
        hasMiddlewareImport,
        pattern: middlewareImportPattern.source,
      });

      return hasMiddlewareImport;
    } else if (language === 'javascript' || language === 'typescript') {
      // Check for both patterns:
      // import ... from 'revenium-middleware-openai-node' (OpenAI)
      // import 'revenium-middleware-anthropic-node' (Anthropic, LiteLLM)
      // import ... from '@revenium/google' (Google)
      const escapedPackage = middlewarePackage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const middlewareFromPattern = new RegExp(`from\\s+['"]${escapedPackage}['"]`, 'm');
      const middlewareDirectPattern = new RegExp(`import\\s+['"]${escapedPackage}['"]`, 'm');
      // Also check for destructured imports like: import { GoogleAiReveniumMiddleware } from '@revenium/google'
      const middlewareDestructuredPattern = new RegExp(
        `import\\s+\\{[^}]*\\}\\s+from\\s+['"]${escapedPackage}['"]`,
        'm'
      );

      const hasFromImport = middlewareFromPattern.test(text);
      const hasDirectImport = middlewareDirectPattern.test(text);
      const hasDestructuredImport = middlewareDestructuredPattern.test(text);

      console.log('[Revenium DetectionEngine] Checking JS/TS middleware presence:', {
        provider,
        middlewarePackage,
        hasFromImport,
        hasDirectImport,
        hasDestructuredImport,
        fromPattern: middlewareFromPattern.source,
        directPattern: middlewareDirectPattern.source,
        destructuredPattern: middlewareDestructuredPattern.source,
      });

      return hasFromImport || hasDirectImport || hasDestructuredImport;
    }

    return false;
  }
}
