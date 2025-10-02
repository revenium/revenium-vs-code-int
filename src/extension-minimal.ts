import * as vscode from 'vscode';

// Minimal, safe extension that only provides basic AI detection
// NO network calls, NO infinite loops, NO complex UI components

interface SimpleDetection {
  line: number;
  message: string;
  provider: string;
}

let statusBarItem: vscode.StatusBarItem;
let detectionCount = 0;

export function activate(context: vscode.ExtensionContext) {
  console.log('Revenium Onboarding Assistant (Minimal) activated');

  // Create simple status bar
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = '$(search) Revenium: Ready';
  statusBarItem.command = 'revenium.scanCurrentFile';
  statusBarItem.show();

  // Register simple commands
  context.subscriptions.push(
    vscode.commands.registerCommand('revenium.scanCurrentFile', () => {
      scanCurrentFile();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('revenium.showDetections', () => {
      showDetectionResults();
    })
  );

  // Simple file change listener
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor) {
        scanCurrentFile();
      }
    })
  );

  context.subscriptions.push(statusBarItem);

  // Initial scan
  if (vscode.window.activeTextEditor) {
    scanCurrentFile();
  }
}

function scanCurrentFile() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    statusBarItem.text = '$(search) Revenium: No file open';
    return;
  }

  const document = editor.document;
  const detections = findAIUsage(document);
  detectionCount = detections.length;

  if (detectionCount === 0) {
    statusBarItem.text = '$(check) Revenium: No AI usage found';
    statusBarItem.backgroundColor = undefined;
  } else {
    statusBarItem.text = `$(warning) Revenium: ${detectionCount} AI calls found`;
    statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    statusBarItem.command = 'revenium.showDetections';
  }
}

function findAIUsage(document: vscode.TextDocument): SimpleDetection[] {
  const detections: SimpleDetection[] = [];
  const text = document.getText();
  const lines = text.split('\n');

  // Simple, safe patterns - NO regex with global flags
  const patterns = [
    { pattern: 'import openai', provider: 'OpenAI', message: 'OpenAI import detected' },
    { pattern: 'from openai import', provider: 'OpenAI', message: 'OpenAI import detected' },
    { pattern: 'import anthropic', provider: 'Anthropic', message: 'Anthropic import detected' },
    { pattern: 'from anthropic import', provider: 'Anthropic', message: 'Anthropic import detected' },
    { pattern: 'OpenAI(', provider: 'OpenAI', message: 'OpenAI client creation' },
    { pattern: 'Anthropic(', provider: 'Anthropic', message: 'Anthropic client creation' },
    { pattern: 'openai.ChatCompletion', provider: 'OpenAI', message: 'OpenAI chat completion' },
    { pattern: 'client.completions', provider: 'OpenAI', message: 'OpenAI completion call' }
  ];

  lines.forEach((line, index) => {
    patterns.forEach(({ pattern, provider, message }) => {
      if (line.includes(pattern)) {
        detections.push({
          line: index + 1,
          message,
          provider
        });
      }
    });
  });

  return detections;
}

function showDetectionResults() {
  const editor = vscode.window.activeTextEditor;
  if (!editor || detectionCount === 0) {
    vscode.window.showInformationMessage('No AI usage detected in current file');
    return;
  }

  const document = editor.document;
  const detections = findAIUsage(document);

  const items = detections.map(detection => ({
    label: `Line ${detection.line}: ${detection.message}`,
    description: detection.provider,
    detail: `Go to line ${detection.line}`
  }));

  vscode.window.showQuickPick(items).then(selectedItem => {
    if (selectedItem) {
      const lineNumber = parseInt(selectedItem.label.split(':')[0].replace('Line ', '')) - 1;
      const position = new vscode.Position(lineNumber, 0);
      const range = new vscode.Range(position, position);
      editor.selection = new vscode.Selection(range.start, range.end);
      editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
    }
  });
}

export function deactivate() {
  console.log('Revenium Onboarding Assistant deactivated');
}