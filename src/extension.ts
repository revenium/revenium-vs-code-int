import * as vscode from 'vscode';
import { OnboardingCodeLensProvider } from './ui/codeLensProvider';
import { OnboardingHoverProvider } from './ui/hoverProvider';
import { IntegrationTreeProvider } from './ui/treeViewProvider';
import { StatusBarProvider } from './ui/statusBarProvider';
import { ControlTreeViewProvider } from './ui/controlTreeView';
import { QuickFixProvider } from './fixes/quickFixes';
import { OnboardingReportGenerator } from './reports/onboardingReport';
import { DetectionEngine } from './detection/engine';
import { DetectionResult } from './types';
import { DiagnosticsProvider } from './diagnostics/provider';
import { ReveniumCodeActionProvider } from './diagnostics/codeActionProvider';

let detectionEngine: DetectionEngine;
let statusBar: StatusBarProvider;
let treeProvider: IntegrationTreeProvider;
let controlTreeProvider: ControlTreeViewProvider;
let codeLensProvider: OnboardingCodeLensProvider;
let diagnosticsProvider: DiagnosticsProvider;

export function activate(context: vscode.ExtensionContext) {
  console.log('Revenium Onboarding Assistant is now active!');

  detectionEngine = new DetectionEngine();
  statusBar = new StatusBarProvider();
  treeProvider = new IntegrationTreeProvider();
  controlTreeProvider = new ControlTreeViewProvider(context);
  codeLensProvider = new OnboardingCodeLensProvider();
  diagnosticsProvider = new DiagnosticsProvider(context);
  const hoverProvider = new OnboardingHoverProvider();
  const codeActionProvider = new ReveniumCodeActionProvider();
  const reportGenerator = new OnboardingReportGenerator();

  // Register providers
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      [
        { language: 'python' },
        { language: 'javascript' },
        { language: 'typescript' },
        { language: 'javascriptreact' },
        { language: 'typescriptreact' }
      ],
      codeLensProvider
    )
  );

  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      [
        { language: 'python' },
        { language: 'javascript' },
        { language: 'typescript' },
        { language: 'javascriptreact' },
        { language: 'typescriptreact' }
      ],
      hoverProvider
    )
  );

  // Register code actions provider for quick fixes
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      [
        { language: 'python' },
        { language: 'javascript' },
        { language: 'typescript' },
        { language: 'javascriptreact' },
        { language: 'typescriptreact' }
      ],
      codeActionProvider,
      {
        providedCodeActionKinds: [vscode.CodeActionKind.QuickFix]
      }
    )
  );

  // Register tree views
  vscode.window.registerTreeDataProvider('discoveredUsage', treeProvider);
  vscode.window.registerTreeDataProvider('reveniumControl', controlTreeProvider);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('revenium.startDetection', async () => {
      console.log('[Revenium Extension] Starting AI detection');
      const config = vscode.workspace.getConfiguration('revenium');
      await config.update('detectionActive', true, vscode.ConfigurationTarget.Workspace);
      await vscode.commands.executeCommand('setContext', 'revenium.detectionActive', true);

      controlTreeProvider.refresh();
      statusBar.scanActiveDocument();
      codeLensProvider.refresh();
      vscode.window.showInformationMessage('AI Detection started');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('revenium.stopDetection', async () => {
      console.log('[Revenium Extension] Stopping AI detection');
      const config = vscode.workspace.getConfiguration('revenium');
      await config.update('detectionActive', false, vscode.ConfigurationTarget.Workspace);
      await vscode.commands.executeCommand('setContext', 'revenium.detectionActive', false);

      controlTreeProvider.refresh();
      codeLensProvider.refresh();
      vscode.window.showInformationMessage('AI Detection stopped');
    })
  );


  context.subscriptions.push(
    vscode.commands.registerCommand('revenium.scanWorkspace', async () => {
      controlTreeProvider.setScanning(true);
      try {
        await treeProvider.scanWorkspace();
        // Update status bar with workspace totals
        const total = treeProvider.getTotalDetections();
        statusBar.setWorkspaceTotal(total);
      } finally {
        controlTreeProvider.setScanning(false);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('revenium.stopScan', async () => {
      controlTreeProvider.setScanning(false);
      vscode.window.showInformationMessage('Scan stopped');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('revenium.generateOnboardingReport', async () => {
      await reportGenerator.generateReport();
    })
  );

  // Filter commands
  context.subscriptions.push(
    vscode.commands.registerCommand('revenium.setFilterIntegration', async () => {
      const config = vscode.workspace.getConfiguration('revenium');
      await config.update('detectionFilter', 'integration', vscode.ConfigurationTarget.Workspace);
      controlTreeProvider.refresh();
      treeProvider.refresh();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('revenium.setFilterSecurity', async () => {
      const config = vscode.workspace.getConfiguration('revenium');
      await config.update('detectionFilter', 'security', vscode.ConfigurationTarget.Workspace);
      controlTreeProvider.refresh();
      treeProvider.refresh();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('revenium.setFilterImports', async () => {
      const config = vscode.workspace.getConfiguration('revenium');
      await config.update('detectionFilter', 'imports', vscode.ConfigurationTarget.Workspace);
      controlTreeProvider.refresh();
      treeProvider.refresh();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('revenium.setFilterAll', async () => {
      const config = vscode.workspace.getConfiguration('revenium');
      await config.update('detectionFilter', 'all', vscode.ConfigurationTarget.Workspace);
      controlTreeProvider.refresh();
      treeProvider.refresh();
    })
  );

  // Toggle commands
  context.subscriptions.push(
    vscode.commands.registerCommand('revenium.toggleProvider', async (provider: string) => {
      const config = vscode.workspace.getConfiguration('revenium');
      const currentValue = config.get<boolean>(`providers.${provider}`, true);
      await config.update(`providers.${provider}`, !currentValue, vscode.ConfigurationTarget.Workspace);
      controlTreeProvider.refresh();
      treeProvider.refresh();
    })
  );

  // Removed: integrationFocus toggle (non-functional configuration)

  context.subscriptions.push(
    vscode.commands.registerCommand('revenium.toggleAdvancedPatterns', async () => {
      const config = vscode.workspace.getConfiguration('revenium');
      const currentValue = config.get<boolean>('advancedPatterns', false);
      await config.update('advancedPatterns', !currentValue, vscode.ConfigurationTarget.Workspace);
      controlTreeProvider.refresh();
      treeProvider.refresh();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('revenium.toggleLanguage', async (language: string) => {
      const config = vscode.workspace.getConfiguration('revenium');
      const currentValue = config.get<boolean>(`languages.${language}`, true);
      await config.update(`languages.${language}`, !currentValue, vscode.ConfigurationTarget.Workspace);
      controlTreeProvider.refresh();
      treeProvider.refresh();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('revenium.applyQuickFix', async (detection: DetectionResult) => {
      const success = await QuickFixProvider.applyQuickFix(detection);
      if (success) {
        statusBar.markFixed();
        if (vscode.window.activeTextEditor) {
          const file = vscode.window.activeTextEditor.document.uri.toString();
          treeProvider.markAsFixed(file, detection);
        }
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('revenium.fixSecurityIssue', async (detection: DetectionResult) => {
      const action = await vscode.window.showWarningMessage(
        'This will move the API key to an environment variable. Continue?',
        'Yes', 'No'
      );

      if (action === 'Yes') {
        const success = await QuickFixProvider.applyQuickFix(detection);
        if (success) {
          statusBar.markFixed();
          vscode.window.showInformationMessage('Security issue fixed! Remember to set the environment variable.');
        }
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('revenium.showCostOptimization', (detection: DetectionResult, estimate: any) => {
      const panel = vscode.window.createWebviewPanel(
        'costOptimization',
        'Cost Optimization',
        vscode.ViewColumn.Two,
        {}
      );

      panel.webview.html = getCostOptimizationWebview(detection, estimate);
    })
  );



  context.subscriptions.push(
    vscode.commands.registerCommand('revenium.fixAllIssues', async () => {
      const action = await vscode.window.showInformationMessage(
        'This will apply all available Revenium middleware integrations. Continue?',
        'Yes', 'No'
      );

      if (action === 'Yes') {
        await applyAllFixes();
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('revenium.goToDetection', (uri: vscode.Uri, range: vscode.Range) => {
      vscode.window.showTextDocument(uri, {
        selection: range,
        viewColumn: vscode.ViewColumn.One
      });
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('revenium.showQuickFix', async (range: vscode.Range) => {
      console.log('[Revenium Extension] showQuickFix called for range:', `${range.start.line}:${range.start.character}-${range.end.line}:${range.end.character}`);

      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        console.log('[Revenium Extension] No active editor');
        return;
      }

      console.log('[Revenium Extension] Moving cursor to range and showing quick fix menu');
      // Move cursor to the range and show quick fix menu
      editor.selection = new vscode.Selection(range.start, range.end);
      await vscode.commands.executeCommand('editor.action.quickFix');
    })
  );

  // Set initial context values for menu conditions
  const config = vscode.workspace.getConfiguration('revenium');
  const detectionActive = config.get('detectionActive', true);
  const operationMode = config.get('operationMode', 'detection');

  vscode.commands.executeCommand('setContext', 'revenium.detectionActive', detectionActive);
  vscode.commands.executeCommand('setContext', 'revenium.mode', operationMode);

  // Auto-scan on activation
  if (config.get('enableRealTimeScanning') && detectionActive) {
    setTimeout(async () => {
      await treeProvider.scanWorkspace();
      statusBar.scanActiveDocument();

      const detections = await countTotalDetections();
      if (detections > 0) {
        vscode.window.showInformationMessage(
          `Found ${detections} AI usage points in your workspace. Check the AI Usage Discovered panel for details.`
        );
      }
    }, 2000);
  }

  // Listen for document changes with debouncing to prevent infinite loops
  let refreshTimeout: NodeJS.Timeout | undefined;

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor) {
        // Clear any pending refresh
        if (refreshTimeout) {
          clearTimeout(refreshTimeout);
        }
        statusBar.scanActiveDocument();
      }
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(event => {
      if (event.document === vscode.window.activeTextEditor?.document) {
        const config = vscode.workspace.getConfiguration('revenium');
        const detectionActive = config.get('detectionActive', true);

        if (!detectionActive) {
          return; // Skip processing if detection is disabled
        }

        // Clear any pending refresh to prevent cascade
        if (refreshTimeout) {
          clearTimeout(refreshTimeout);
        }

        // Debounce the refresh to prevent infinite loops
        refreshTimeout = setTimeout(() => {
          detectionEngine.clearCache();
          codeLensProvider.refresh();
          statusBar.scanActiveDocument();
          // Diagnostics provider automatically handles document changes
          refreshTimeout = undefined;
        }, 500); // Wait 500ms after last change before refreshing
      }
    })
  );

  // Listen for configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration('revenium')) {
        const config = vscode.workspace.getConfiguration('revenium');
        const detectionActive = config.get('detectionActive', true);
        const showOverlays = config.get('showDetectionOverlays', true);

        vscode.commands.executeCommand('setContext', 'revenium.detectionActive', detectionActive);

        // Clear detection cache to pick up new configuration
        console.log('[Revenium Extension] Configuration changed, clearing cache and refreshing');
        detectionEngine.clearCache();

        // Refresh all UI components
        controlTreeProvider.refresh();
        codeLensProvider.refresh();
        treeProvider.refresh();
        statusBar.scanActiveDocument();

        // Refresh diagnostics for all open documents
        diagnosticsProvider.refreshAllDocuments();
      }
    })
  );

  // Status bar
  context.subscriptions.push(statusBar);
}

export function deactivate() {
  console.log('Revenium Onboarding Assistant deactivated');

  // Clean up resources to prevent memory leaks
  if (detectionEngine) {
    detectionEngine.clearCache();
  }
  if (statusBar) {
    statusBar.dispose();
  }
  if (treeProvider) {
    treeProvider.dispose();
  }
  if (codeLensProvider) {
    codeLensProvider.dispose();
  }
  // Clear any pending timeouts
  // Note: refreshTimeout is in function scope, VS Code handles cleanup
}

async function applyAllFixes(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('No active editor');
    return;
  }

  const detections = detectionEngine.analyzeDocument(editor.document);
  let fixedCount = 0;

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Applying Revenium integrations...',
      cancellable: false
    },
    async (progress) => {
      for (let i = 0; i < detections.length; i++) {
        const detection = detections[i];
        progress.report({
          message: `Fixing ${i + 1} of ${detections.length}...`,
          increment: (100 / detections.length)
        });

        const success = await QuickFixProvider.applyQuickFix(detection);
        if (success) {
          fixedCount++;
          statusBar.markFixed();
        }
      }
    }
  );

  vscode.window.showInformationMessage(
    `Successfully applied ${fixedCount} of ${detections.length} Revenium integrations!`
  );
}

async function countTotalDetections(): Promise<number> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    return 0;
  }

  let total = 0;
  for (const folder of workspaceFolders) {
    const results = await detectionEngine.analyzeWorkspace(folder);
    results.forEach(detections => {
      total += detections.length;
    });
  }

  return total;
}

function getCostOptimizationWebview(detection: DetectionResult, estimate: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: var(--vscode-font-family);
          padding: 20px;
          color: var(--vscode-foreground);
        }
        .cost-card {
          background: var(--vscode-editor-inactiveSelectionBackground);
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .cost-amount {
          font-size: 36px;
          font-weight: bold;
          color: var(--vscode-textLink-foreground);
        }
        .savings {
          color: var(--vscode-testing-iconPassed);
          font-size: 20px;
          margin-top: 10px;
        }
        button {
          background: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          margin-right: 10px;
        }
        button:hover {
          background: var(--vscode-button-hoverBackground);
        }
      </style>
    </head>
    <body>
      <h1>💰 Cost Optimization Opportunity</h1>

      <div class="cost-card">
        <div class="cost-amount">$${estimate.monthlyEstimate.toFixed(2)}/month</div>
        <div>Current estimated cost</div>
        ${estimate.optimizationPotential > 0 ? `
          <div class="savings">
            Save up to $${estimate.optimizationPotential.toFixed(2)}/month
          </div>
        ` : ''}
      </div>

      <h2>Recommendation</h2>
      <p>${detection.pattern.message}</p>

      ${detection.pattern.fixGuidance ? `
        <h3>How to fix:</h3>
        <pre>${detection.pattern.fixGuidance}</pre>
      ` : ''}

      <div style="margin-top: 30px;">
        <button onclick="applyFix()">Apply Fix</button>
        <button onclick="learnMore()">Learn More</button>
      </div>

      <script>
        const vscode = acquireVsCodeApi();

        function applyFix() {
          vscode.postMessage({ type: 'applyFix' });
        }

        function learnMore() {
          vscode.postMessage({ type: 'learnMore' });
        }
      </script>
    </body>
    </html>
  `;
}