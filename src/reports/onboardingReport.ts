import * as vscode from 'vscode';
import * as path from 'path';
import { DetectionEngine } from '../detection/engine';
// import { CostClassifier } from '../detection/costClassifier';
import { OnboardingReport, DetectionResult } from '../types/types';
import { PROVIDER_CONFIGS } from '../detection/patterns';

export class OnboardingReportGenerator {
  private detectionEngine: DetectionEngine;

  constructor() {
    this.detectionEngine = new DetectionEngine();
  }

  async generateReport(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      vscode.window.showWarningMessage('No workspace folder open');
      return;
    }

    const folder = workspaceFolders[0];
    const detections = await this.detectionEngine.analyzeWorkspace(folder);

    const report = this.createReport(folder.uri.fsPath, detections);
    const reportContent = this.formatReport(report);

    const reportUri = vscode.Uri.file(
      path.join(folder.uri.fsPath, `revenium-integration-report-${Date.now()}.md`)
    );

    await vscode.workspace.fs.writeFile(reportUri, Buffer.from(reportContent));

    const doc = await vscode.workspace.openTextDocument(reportUri);
    await vscode.window.showTextDocument(doc);

    vscode.window.showInformationMessage(
      `Integration report generated: ${path.basename(reportUri.fsPath)}`
    );
  }

  private createReport(
    projectPath: string,
    detections: Map<string, DetectionResult[]>
  ): OnboardingReport {
    const allDetections: DetectionResult[] = [];
    let criticalIssues = 0;

    detections.forEach((fileDetections) => {
      fileDetections.forEach((detection) => {
        allDetections.push(detection);

        if (detection.pattern.severity === 'ERROR' || detection.pattern.securityRisk) {
          criticalIssues++;
        }
      });
    });

    const recommendations = this.generateRecommendations(allDetections);

    return {
      timestamp: new Date(),
      projectPath,
      summary: {
        totalFiles: detections.size,
        filesWithAIUsage: detections.size,
        totalDetections: allDetections.length,
        criticalIssues,
        estimatedMonthlyCost: 0,
        optimizationPotential: 0,
      },
      detections: allDetections,
      recommendations,
    };
  }

  private generateRecommendations(detections: DetectionResult[]): string[] {
    const recommendations: string[] = [];
    const providers = new Set<string>();
    const scenarios = new Set<string>();

    detections.forEach((d) => {
      providers.add(d.pattern.provider);
      scenarios.add(d.pattern.scenario);
    });

    if (scenarios.has('security_warning')) {
      recommendations.push(
        '🔒 **Critical Security**: Move all API keys to environment variables immediately'
      );
    }

    if (scenarios.has('missing_revenium')) {
      recommendations.push(
        '🚀 **Quick Win**: Install Revenium middleware packages to enable automatic tracking'
      );
    }

    providers.forEach((provider) => {
      const config = PROVIDER_CONFIGS[provider];
      if (config && provider !== 'unknown') {
        recommendations.push(
          `📦 Install ${config.displayName} middleware: \`npm install ${Object.values(config.middlewarePackages)[0]}\``
        );
      }
    });

    return recommendations;
  }

  private formatReport(report: OnboardingReport): string {
    const { summary, detections, recommendations } = report;

    let content = `# 🚀 Revenium Integration Report\n\n`;
    content += `**Generated:** ${report.timestamp.toLocaleString()}\n`;
    content += `**Project:** ${path.basename(report.projectPath)}\n\n`;

    content += `## 📊 Executive Summary\n\n`;
    content += `| Metric | Value |\n`;
    content += `|--------|-------|\n`;
    content += `| **Total Files Analyzed** | ${summary.totalFiles} |\n`;
    content += `| **Files with AI Usage** | ${summary.filesWithAIUsage} |\n`;
    content += `| **Total Integration Points** | ${summary.totalDetections} |\n`;
    content += `| **Security Issues** | ${summary.criticalIssues} |\n\n`;

    content += `## 🎯 Key Recommendations\n\n`;
    recommendations.forEach((rec) => {
      content += `- ${rec}\n`;
    });
    content += `\n`;

    content += `## 📝 Detection Details\n\n`;

    const groupedByProvider = this.groupDetectionsByProvider(detections);

    groupedByProvider.forEach((providerDetections, provider) => {
      const config = PROVIDER_CONFIGS[provider];
      content += `### ${config?.icon || '🤖'} ${config?.displayName || provider}\n\n`;

      const groupedByFile = this.groupDetectionsByFile(providerDetections);

      groupedByFile.forEach((fileDetections, file) => {
        content += `#### 📄 ${vscode.workspace.asRelativePath(vscode.Uri.parse(file))}\n\n`;

        fileDetections.forEach((detection) => {
          const severity = this.getSeverityEmoji(detection.pattern.severity);
          content += `- ${severity} **Line ${detection.range.start.line + 1}:** ${detection.pattern.message}\n`;

          if (detection.pattern.fixGuidance) {
            content += `  - **Fix:** \`${detection.pattern.fixGuidance}\`\n`;
          }
        });
        content += `\n`;
      });
    });

    content += `## 🚀 Next Steps\n\n`;
    content += `1. **Install Revenium CLI:** \`npm install -g @revenium/cli\`\n`;
    content += `2. **Initialize Revenium:** \`revenium init\`\n`;
    content += `3. **Install middleware packages** (see recommendations above)\n`;
    content += `4. **Use VSCode quick fixes** to update your code\n`;
    content += `5. **Test your integration** and monitor usage in the Revenium dashboard\n\n`;

    content += `## 📚 Resources\n\n`;
    content += `- [Revenium Documentation](https://docs.revenium.io)\n`;
    content += `- [Getting Started Guide](https://docs.revenium.io/getting-started)\n`;
    content += `- [Middleware Integration](https://docs.revenium.io/middleware)\n`;
    content += `- [Support](https://support.revenium.io)\n\n`;

    content += `---\n\n`;
    content += `*Report generated by Revenium Onboarding Assistant v1.0.0*\n`;

    return content;
  }

  private groupDetectionsByProvider(detections: DetectionResult[]): Map<string, DetectionResult[]> {
    const grouped = new Map<string, DetectionResult[]>();

    detections.forEach((detection) => {
      const provider = detection.pattern.provider;
      if (!grouped.has(provider)) {
        grouped.set(provider, []);
      }
      grouped.get(provider)!.push(detection);
    });

    return grouped;
  }

  private groupDetectionsByFile(detections: DetectionResult[]): Map<string, DetectionResult[]> {
    const grouped = new Map<string, DetectionResult[]>();

    detections.forEach((detection) => {
      const file = detection.range.start.line.toString();
      if (!grouped.has(file)) {
        grouped.set(file, []);
      }
      grouped.get(file)!.push(detection);
    });

    return grouped;
  }

  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case 'ERROR':
        return '❌';
      case 'WARNING':
        return '⚠️';
      case 'INFO':
        return 'ℹ️';
      default:
        return '•';
    }
  }
}
