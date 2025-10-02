import * as vscode from 'vscode';

export class ControlTreeViewProvider implements vscode.TreeDataProvider<ControlItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ControlItem | undefined | null | void> = new vscode.EventEmitter<ControlItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<ControlItem | undefined | null | void> = this._onDidChangeTreeData.event;
  private isScanning: boolean = false;
  private scanAnimationInterval?: NodeJS.Timeout;

  constructor(private context: vscode.ExtensionContext) {
    console.log('[Revenium ControlTreeView] Initialized control tree view provider');
  }

  refresh(): void {
    console.log('[Revenium ControlTreeView] Refreshing tree view');
    this._onDidChangeTreeData.fire();
  }

  setScanning(scanning: boolean): void {
    this.isScanning = scanning;
    if (scanning) {
      this.startScanAnimation();
    } else {
      this.stopScanAnimation();
    }
    this.refresh();
  }

  private startScanAnimation(): void {
    let dots = 0;
    this.scanAnimationInterval = setInterval(() => {
      dots = (dots + 1) % 4;
      this.refresh();
    }, 500);
  }

  private stopScanAnimation(): void {
    if (this.scanAnimationInterval) {
      clearInterval(this.scanAnimationInterval);
      this.scanAnimationInterval = undefined;
    }
  }

  isCurrentlyScanning(): boolean {
    return this.isScanning;
  }

  getTreeItem(element: ControlItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ControlItem): Thenable<ControlItem[]> {
    if (!element) {
      return Promise.resolve(this.getControlItems());
    }

    // Handle nested children
    if (element.contextValue) {
      return Promise.resolve(this.getNestedItems(element.contextValue));
    }

    return Promise.resolve([]);
  }

  private getNestedItems(contextValue: string): ControlItem[] {
    const items: ControlItem[] = [];
    const config = vscode.workspace.getConfiguration('revenium');

    switch (contextValue) {
      case 'providers':
        const openaiEnabled = config.get<boolean>('providers.openai', true);
        const anthropicEnabled = config.get<boolean>('providers.anthropic', true);
        const googleEnabled = config.get<boolean>('providers.google', true);

        items.push(new ControlItem(
          'OpenAI Detection',
          vscode.TreeItemCollapsibleState.None,
          { command: 'revenium.toggleProvider', title: 'Toggle OpenAI', arguments: ['openai'] },
          openaiEnabled ? 'check' : 'close',
          this.context,
          'toggle'
        ));
        items.push(new ControlItem(
          'Anthropic Detection',
          vscode.TreeItemCollapsibleState.None,
          { command: 'revenium.toggleProvider', title: 'Toggle Anthropic', arguments: ['anthropic'] },
          anthropicEnabled ? 'check' : 'close',
          this.context,
          'toggle'
        ));
        items.push(new ControlItem(
          'Google AI Detection',
          vscode.TreeItemCollapsibleState.None,
          { command: 'revenium.toggleProvider', title: 'Toggle Google', arguments: ['google'] },
          googleEnabled ? 'check' : 'close',
          this.context,
          'toggle'
        ));
        break;

      // Removed: integrationFocus (non-functional configuration)

      case 'languages':
        const pythonEnabled = config.get<boolean>('languages.python', true);
        const javascriptEnabled = config.get<boolean>('languages.javascript', true);
        const typescriptEnabled = config.get<boolean>('languages.typescript', true);

        items.push(new ControlItem(
          'Python',
          vscode.TreeItemCollapsibleState.None,
          { command: 'revenium.toggleLanguage', title: 'Toggle Python', arguments: ['python'] },
          pythonEnabled ? 'check' : 'close',
          this.context,
          'toggle'
        ));
        items.push(new ControlItem(
          'JavaScript',
          vscode.TreeItemCollapsibleState.None,
          { command: 'revenium.toggleLanguage', title: 'Toggle JavaScript', arguments: ['javascript'] },
          javascriptEnabled ? 'check' : 'close',
          this.context,
          'toggle'
        ));
        items.push(new ControlItem(
          'TypeScript',
          vscode.TreeItemCollapsibleState.None,
          { command: 'revenium.toggleLanguage', title: 'Toggle TypeScript', arguments: ['typescript'] },
          typescriptEnabled ? 'check' : 'close',
          this.context,
          'toggle'
        ));
        break;
    }

    return items;
  }

  private getControlItems(): ControlItem[] {
    const config = vscode.workspace.getConfiguration('revenium');
    const detectionActive = config.get<boolean>('detectionActive', true);
    const detectionFilter = config.get<string>('detectionFilter', 'all');

    console.log('[Revenium ControlTreeView] Current state:', { detectionActive, detectionFilter });

    const items: ControlItem[] = [];

    // Detection status
    items.push(new ControlItem(
      detectionActive ? 'Detection: Active' : 'Detection: Stopped',
      vscode.TreeItemCollapsibleState.None,
      {
        command: detectionActive ? 'revenium.stopDetection' : 'revenium.startDetection',
        title: detectionActive ? 'Stop Detection' : 'Start Detection'
      },
      detectionActive ? 'circle-filled' : 'circle-outline',
      this.context,
      'status'
    ));

    // Separator
    items.push(new ControlItem('────────────', vscode.TreeItemCollapsibleState.None, undefined, undefined, this.context));

    // Filter options
    items.push(new ControlItem(
      'Integration Only',
      vscode.TreeItemCollapsibleState.None,
      {
        command: 'revenium.setFilterIntegration',
        title: 'Show Integration Issues Only'
      },
      detectionFilter === 'integration' ? 'check' : 'close',
      this.context,
      'filter'
    ));

    items.push(new ControlItem(
      'Security Only',
      vscode.TreeItemCollapsibleState.None,
      {
        command: 'revenium.setFilterSecurity',
        title: 'Show Security Issues Only'
      },
      detectionFilter === 'security' ? 'check' : 'close',
      this.context,
      'filter'
    ));

    items.push(new ControlItem(
      'Import Detection Only',
      vscode.TreeItemCollapsibleState.None,
      {
        command: 'revenium.setFilterImports',
        title: 'Show Import Detection Only'
      },
      detectionFilter === 'imports' ? 'check' : 'close',
      this.context,
      'filter'
    ));

    items.push(new ControlItem(
      'All Issues',
      vscode.TreeItemCollapsibleState.None,
      {
        command: 'revenium.setFilterAll',
        title: 'Show All Issues'
      },
      detectionFilter === 'all' ? 'check' : 'close',
      this.context,
      'filter'
    ));

    // Separator
    items.push(new ControlItem('────────────', vscode.TreeItemCollapsibleState.None, undefined, undefined, this.context));

    // Detection Types
    items.push(new ControlItem(
      'Detection Types',
      vscode.TreeItemCollapsibleState.Collapsed,
      undefined,
      'list-unordered',
      this.context,
      'detectionTypes'
    ));

    // AI Providers
    items.push(new ControlItem(
      'AI Providers',
      vscode.TreeItemCollapsibleState.Collapsed,
      undefined,
      'extensions',
      this.context,
      'providers'
    ));

    // Languages
    items.push(new ControlItem(
      'Languages',
      vscode.TreeItemCollapsibleState.Collapsed,
      undefined,
      'code',
      this.context,
      'languages'
    ));

    // Advanced Patterns
    const advancedEnabled = config.get<boolean>('advancedPatterns', false);
    items.push(new ControlItem(
      advancedEnabled ? 'Advanced Patterns (On)' : 'Advanced Patterns (Off)',
      vscode.TreeItemCollapsibleState.None,
      {
        command: 'revenium.toggleAdvancedPatterns',
        title: 'Toggle Advanced Patterns'
      },
      advancedEnabled ? 'check' : 'close',
      this.context,
      'advanced'
    ));

    // Separator
    items.push(new ControlItem('────────────', vscode.TreeItemCollapsibleState.None, undefined, undefined, this.context));

    // Action items
    const scanLabel = this.isScanning ? 'Scanning...' : 'Scan Workspace';
    const scanIcon = this.isScanning ? 'sync~spin' : 'play';
    const scanCommand = this.isScanning ? 'revenium.stopScan' : 'revenium.scanWorkspace';

    items.push(new ControlItem(
      scanLabel,
      vscode.TreeItemCollapsibleState.None,
      {
        command: scanCommand,
        title: this.isScanning ? 'Stop Scan' : 'Scan for AI Usage'
      },
      scanIcon,
      this.context
    ));

    return items;
  }
}

export class ControlItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command,
    iconName?: string,
    private context?: vscode.ExtensionContext,
    contextValue?: string
  ) {
    super(label, collapsibleState);
    this.command = command;

    // Use standard VSCode ThemeIcons only (no colored emojis)
    if (iconName) {
      this.iconPath = new vscode.ThemeIcon(iconName);
    }

    // Set context for menu contributions and nested items
    this.contextValue = contextValue || 'controlItem';
  }
}