import * as vscode from 'vscode';
import { DetectionEngine } from '../detection/engine';
import { DetectionResult } from '../types/types';
import { PROVIDER_CONFIGS } from '../detection/patterns';

export class IntegrationTreeProvider implements vscode.TreeDataProvider<IntegrationItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<IntegrationItem | undefined | null | void> =
    new vscode.EventEmitter<IntegrationItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<IntegrationItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private detectionEngine: DetectionEngine;
  private workspaceDetections: Map<string, DetectionResult[]> = new Map();
  private fixedItems: Set<string> = new Set();
  private refreshTimeout: NodeJS.Timeout | undefined;

  constructor() {
    this.detectionEngine = new DetectionEngine();
  }

  refresh(): void {
    // Debounce refresh calls to prevent infinite loops
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }

    this.refreshTimeout = setTimeout(() => {
      this._onDidChangeTreeData.fire();
      this.refreshTimeout = undefined;
    }, 100); // Short debounce for TreeView
  }

  async scanWorkspace(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      return;
    }

    this.workspaceDetections.clear();
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Scanning for AI usage...',
        cancellable: false,
      },
      async (progress) => {
        for (const folder of workspaceFolders) {
          progress.report({ message: `Scanning ${folder.name}...` });
          const results = await this.detectionEngine.analyzeWorkspace(folder);
          results.forEach((detections, file) => {
            this.workspaceDetections.set(file, detections);
          });
        }
        this.refresh();
        vscode.window.showInformationMessage(
          `Found AI usage in ${this.workspaceDetections.size} files with ${this.getTotalDetections()} opportunities`
        );
      }
    );
  }

  getTreeItem(element: IntegrationItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: IntegrationItem): Thenable<IntegrationItem[]> {
    if (!element) {
      return Promise.resolve(this.getRootItems());
    }

    if (element.contextValue === 'provider-section') {
      return Promise.resolve(this.getProviders());
    }

    if (element.contextValue === 'language-section') {
      return Promise.resolve(this.getLanguageGroups());
    }

    if (element.contextValue === 'provider') {
      return Promise.resolve(this.getProviderItems(element.provider!));
    }

    if (element.contextValue === 'language') {
      return Promise.resolve(this.getFilesForLanguage(element.language!));
    }

    if (element.contextValue === 'file') {
      return Promise.resolve(this.getFileItems(element.resourceUri!.toString()));
    }

    return Promise.resolve([]);
  }

  private getRootItems(): IntegrationItem[] {
    const items: IntegrationItem[] = [];

    // Get filtered detections based on current configuration
    const filteredDetections = this.getFilteredDetections();
    const totalDetections = this.getTotalFilteredDetections(filteredDetections);

    if (totalDetections === 0) {
      return items;
    }

    // AI Usage by Provider section
    const providerItem = new IntegrationItem(
      'AI USAGE BY PROVIDER',
      vscode.TreeItemCollapsibleState.Expanded
    );
    providerItem.contextValue = 'provider-section';
    providerItem.description = `${totalDetections} detections`;
    providerItem.iconPath = new vscode.ThemeIcon('cloud');
    items.push(providerItem);

    // Files by Language section
    const languageItem = new IntegrationItem(
      'FILES BY LANGUAGE',
      vscode.TreeItemCollapsibleState.Collapsed
    );
    languageItem.contextValue = 'language-section';
    languageItem.description = `${filteredDetections.size} files`;
    languageItem.iconPath = new vscode.ThemeIcon('code');
    items.push(languageItem);

    return items;
  }

  private getProviders(): IntegrationItem[] {
    const items: IntegrationItem[] = [];
    const filteredDetections = this.getFilteredDetections();
    const providers = this.getUniqueProvidersFromFiltered(filteredDetections);

    for (const provider of providers) {
      const count = this.getProviderDetectionCountFromFiltered(provider, filteredDetections);
      const config = PROVIDER_CONFIGS[provider];
      const item = new IntegrationItem(
        config?.displayName || provider,
        vscode.TreeItemCollapsibleState.Collapsed
      );
      item.contextValue = 'provider';
      item.provider = provider;
      item.description = `${count} detections`;
      item.iconPath = new vscode.ThemeIcon('extensions');
      items.push(item);
    }

    return items;
  }

  private getProviderItems(provider: string): IntegrationItem[] {
    const items: IntegrationItem[] = [];
    const filteredDetections = this.getFilteredDetections();
    const filesWithProvider = new Set<string>();
    let totalDetections = 0;

    filteredDetections.forEach((detections, file) => {
      const providerDetections = detections.filter((d) => d.pattern.provider === provider);
      if (providerDetections.length > 0) {
        filesWithProvider.add(file);
        totalDetections += providerDetections.length;
      }
    });

    // Add summary item at the top
    const summaryItem = new IntegrationItem(
      `${filesWithProvider.size} files • ${totalDetections} detections`,
      vscode.TreeItemCollapsibleState.None
    );
    summaryItem.contextValue = 'summary';
    summaryItem.iconPath = new vscode.ThemeIcon('info');
    items.push(summaryItem);

    filesWithProvider.forEach((file) => {
      const uri = vscode.Uri.parse(file);
      const detections = filteredDetections.get(file) || [];
      const providerDetections = detections.filter((d) => d.pattern.provider === provider);

      const item = new IntegrationItem(
        vscode.workspace.asRelativePath(uri),
        vscode.TreeItemCollapsibleState.Collapsed
      );
      item.contextValue = 'file';
      item.resourceUri = uri;
      item.description = `${providerDetections.length} detections`;
      item.iconPath = new vscode.ThemeIcon('file-code');
      item.command = {
        command: 'vscode.open',
        title: 'Open File',
        arguments: [uri],
      };
      items.push(item);
    });

    return items;
  }

  private getFileItems(file: string): IntegrationItem[] {
    const items: IntegrationItem[] = [];
    const filteredDetections = this.getFilteredDetections();
    const detections = filteredDetections.get(file) || [];

    for (const detection of detections) {
      const isFixed = this.fixedItems.has(this.getDetectionId(file, detection));
      const item = new IntegrationItem(
        detection.pattern.message,
        vscode.TreeItemCollapsibleState.None
      );
      item.contextValue = 'detection';
      item.description = `Line ${detection.range.start.line + 1}`;
      item.iconPath = new vscode.ThemeIcon(
        isFixed ? 'check' : this.getSeverityIcon(detection.pattern.severity),
        isFixed ? new vscode.ThemeColor('charts.green') : undefined
      );
      item.command = {
        command: 'revenium.goToDetection',
        title: 'Go to Detection',
        arguments: [vscode.Uri.parse(file), detection.range],
      };
      items.push(item);
    }

    return items;
  }

  private getLanguageGroups(): IntegrationItem[] {
    const items: IntegrationItem[] = [];
    const filteredDetections = this.getFilteredDetections();
    const languageData = new Map<string, { files: Set<string>; detectionCount: number }>();

    // Group files by language and count detections
    filteredDetections.forEach((detections, file) => {
      const language = this.getLanguageFromFile(file);
      if (!languageData.has(language)) {
        languageData.set(language, { files: new Set(), detectionCount: 0 });
      }
      const data = languageData.get(language)!;
      data.files.add(file);
      data.detectionCount += detections.length;
    });

    // Create language group items
    const languageDisplayNames: Record<string, string> = {
      python: 'Python',
      javascript: 'JavaScript',
      typescript: 'TypeScript',
    };

    const languageIcons: Record<string, string> = {
      python: 'symbol-method',
      javascript: 'symbol-variable',
      typescript: 'symbol-interface',
    };

    ['python', 'javascript', 'typescript'].forEach((language) => {
      const data = languageData.get(language);
      if (data && data.files.size > 0) {
        const item = new IntegrationItem(
          languageDisplayNames[language] || language,
          vscode.TreeItemCollapsibleState.Collapsed
        );
        item.contextValue = 'language';
        item.language = language;
        item.description = `${data.detectionCount} detections`;
        item.iconPath = new vscode.ThemeIcon(languageIcons[language] || 'file');
        items.push(item);
      }
    });

    return items;
  }

  private getFilesForLanguage(language: string): IntegrationItem[] {
    const items: IntegrationItem[] = [];
    const filteredDetections = this.getFilteredDetections();
    let totalDetections = 0;
    let fileCount = 0;

    // First pass: count files and detections
    filteredDetections.forEach((detections, file) => {
      if (this.getLanguageFromFile(file) === language) {
        fileCount++;
        totalDetections += detections.length;
      }
    });

    // Add summary item at the top
    const summaryItem = new IntegrationItem(
      `${fileCount} files • ${totalDetections} detections`,
      vscode.TreeItemCollapsibleState.None
    );
    summaryItem.contextValue = 'summary';
    summaryItem.iconPath = new vscode.ThemeIcon('info');
    items.push(summaryItem);

    // Second pass: add file items
    filteredDetections.forEach((detections, file) => {
      if (this.getLanguageFromFile(file) === language) {
        const uri = vscode.Uri.parse(file);
        const item = new IntegrationItem(
          vscode.workspace.asRelativePath(uri),
          vscode.TreeItemCollapsibleState.Collapsed
        );
        item.contextValue = 'file';
        item.resourceUri = uri;
        item.description = `${detections.length} detections`;
        item.iconPath = new vscode.ThemeIcon('file-code');
        item.command = {
          command: 'vscode.open',
          title: 'Open File',
          arguments: [uri],
        };
        items.push(item);
      }
    });

    return items;
  }

  private getLanguageFromFile(filePath: string): string {
    if (filePath.endsWith('.py')) {
      return 'python';
    } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      return 'typescript';
    } else if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
      return 'javascript';
    }
    return 'unknown';
  }

  public getTotalDetections(): number {
    let total = 0;
    this.workspaceDetections.forEach((detections) => {
      total += detections.length;
    });
    return total;
  }

  private getSeverityIcon(severity: string): string {
    switch (severity) {
      case 'ERROR':
        return 'error';
      case 'WARNING':
        return 'warning';
      case 'INFO':
        return 'info';
      default:
        return 'circle-outline';
    }
  }

  private getDetectionId(file: string, detection: DetectionResult): string {
    return `${file}:${detection.range.start.line}:${detection.pattern.id}`;
  }

  markAsFixed(file: string, detection: DetectionResult): void {
    this.fixedItems.add(this.getDetectionId(file, detection));
    this.refresh();
  }

  /**
   * Filter all detections based on current configuration settings
   * This ensures the tree view respects ALL configuration toggles
   */
  private getFilteredDetections(): Map<string, DetectionResult[]> {
    const config = vscode.workspace.getConfiguration('revenium');
    const filtered = new Map<string, DetectionResult[]>();

    // Check if detection is active globally (check new key first, fall back to old key)
    const detectionEnabled = config.get<boolean>(
      'detection.enabled',
      config.get<boolean>('detectionActive', true)
    );
    if (!detectionEnabled) {
      return filtered;
    }

    this.workspaceDetections.forEach((detections, file) => {
      const fileLanguage = this.getLanguageFromFile(file);

      // Check if this language is enabled
      const languageEnabled = config.get<boolean>(`languages.${fileLanguage}`, true);
      if (!languageEnabled) {
        return; // Skip this file entirely
      }

      // Filter detections by provider and detection filter
      const fileFilteredDetections = detections.filter((detection) => {
        // Check if provider is enabled
        const providerEnabled = config.get<boolean>(
          `providers.${detection.pattern.provider}`,
          true
        );
        if (!providerEnabled) {
          return false;
        }

        // Apply detection filter (check new key first, fall back to old key)
        const detectionFilter = config.get<string>(
          'detection.filter',
          config.get<string>('detectionFilter', 'all')
        );
        if (detectionFilter === 'all') {
          return true;
        }

        switch (detectionFilter) {
          case 'integration':
            return detection.pattern.scenario === 'missing_revenium';
          case 'security':
            return detection.pattern.scenario === 'security_warning';
          case 'imports':
            return detection.pattern.id.includes('import');
          default:
            return true;
        }
      });

      if (fileFilteredDetections.length > 0) {
        filtered.set(file, fileFilteredDetections);
      }
    });

    return filtered;
  }

  private getTotalFilteredDetections(filteredDetections: Map<string, DetectionResult[]>): number {
    let total = 0;
    filteredDetections.forEach((detections) => {
      total += detections.length;
    });
    return total;
  }

  private getUniqueProvidersFromFiltered(
    filteredDetections: Map<string, DetectionResult[]>
  ): string[] {
    const providers = new Set<string>();
    filteredDetections.forEach((detections) => {
      detections.forEach((d) => providers.add(d.pattern.provider));
    });
    return Array.from(providers);
  }

  private getProviderDetectionCountFromFiltered(
    provider: string,
    filteredDetections: Map<string, DetectionResult[]>
  ): number {
    let count = 0;
    filteredDetections.forEach((detections) => {
      count += detections.filter((d) => d.pattern.provider === provider).length;
    });
    return count;
  }

  dispose(): void {
    // Clean up resources
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = undefined;
    }
    this._onDidChangeTreeData.dispose();
  }
}

class IntegrationItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
  }

  provider?: string;
  language?: string;
}
