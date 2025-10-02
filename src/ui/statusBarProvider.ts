import * as vscode from 'vscode';
import { DetectionEngine } from '../detection/engine';

export class StatusBarProvider {
  private statusBarItem: vscode.StatusBarItem;
  private detectionEngine: DetectionEngine;
  private totalDetections: number = 0;
  private workspaceTotal: number = 0;

  constructor() {
    this.detectionEngine = new DetectionEngine();
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.command = 'revenium.scanWorkspace';
    this.updateStatusBar();
  }

  public setWorkspaceTotal(total: number): void {
    this.workspaceTotal = total;
    this.updateStatusBar();
  }

  public async scanActiveDocument(): Promise<void> {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      console.log('[Revenium StatusBar] No active editor');
      return;
    }

    console.log('[Revenium StatusBar] Scanning document:', activeEditor.document.fileName);
    const detections = this.detectionEngine.analyzeDocument(activeEditor.document);
    this.totalDetections = detections.length;
    console.log('[Revenium StatusBar] Found detections:', this.totalDetections);
    this.updateStatusBar();
  }

  public markFixed(count: number = 1): void {
    // Method kept for compatibility but no longer tracks progress
    this.updateStatusBar();
  }

  public reset(): void {
    this.totalDetections = 0;
    this.updateStatusBar();
  }

  private updateStatusBar(): void {
    // Show workspace total if available, otherwise show current file
    const displayCount = this.workspaceTotal > 0 ? this.workspaceTotal : this.totalDetections;

    if (displayCount === 0) {
      this.statusBarItem.text = `$(search) Revenium: No AI usage detected`;
      this.statusBarItem.tooltip = 'Click to scan workspace for AI usage';
    } else {
      this.statusBarItem.text = `$(search) Revenium: ${displayCount} detections`;
      this.statusBarItem.tooltip = `${displayCount} AI usage detections found. Click to rescan workspace.`;
    }

    this.statusBarItem.backgroundColor = undefined;
    this.statusBarItem.show();
  }

  public dispose(): void {
    this.statusBarItem.dispose();
  }
}