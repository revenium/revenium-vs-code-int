# 🏗️ Architecture Overview

This document provides an overview of the Revenium VS Code Extension source code structure and the purpose of each component.

## **Source Code Structure (`src/`)**

### **📁 detection/**
- `engine.ts` - Main detection engine that scans code for AI library usage
- `patterns.ts` - Regex patterns to detect OpenAI, Anthropic, Google AI, and other providers
- `costClassifier.ts` - Classifies and estimates costs for detected AI models

### **📁 diagnostics/**
- `provider.ts` - Creates warnings/errors in VS Code editor
- `codeActionProvider.ts` - Provides quick fixes (lightbulb 💡 actions)

### **📁 fixes/**
- `quickFixes.ts` - Applies automatic code fixes (adds middleware imports)

### **📁 ui/**
- `codeLensProvider.ts` - Shows hints above code lines
- `statusBarProvider.ts` - Manages bottom status bar display
- `treeViewProvider.ts` - Side panel "AI Usage Discovered" tree view
- `controlTreeView.ts` - Side panel "Revenium Configuration" tree view
- `hoverProvider.ts` - Tooltips when hovering over detected code

### **📁 reports/**
- `onboardingReport.ts` - Generates integration reports for users

### **📁 types/**
- `types.ts` - TypeScript definitions (interfaces, types, enums)

### **📄 Root Files:**
- `extension.ts` - **Main entry point** - activates extension and registers all providers
- `extension-minimal.ts` - Simplified version (not currently used)

## **Data Flow**

1. **Detection**: `engine.ts` scans files using patterns from `patterns.ts`
2. **UI Updates**: Results displayed via `codeLensProvider.ts`, `statusBarProvider.ts`, and tree views
3. **User Interaction**: CodeLens clicks trigger `quickFixes.ts` to apply middleware
4. **Diagnostics**: Optional warnings shown via `diagnostics/provider.ts`

## **Key Components**

### **Detection Engine**
The core component that:
- Scans workspace files for AI library imports
- Caches results for performance
- Filters based on user configuration
- Detects if middleware is already present

### **UI Providers**
Multiple VS Code providers that:
- Show integration hints (CodeLens)
- Display workspace overview (Tree Views)
- Provide status information (Status Bar)
- Offer contextual help (Hover)

### **Quick Fix System**
Automated code modification that:
- Adds appropriate middleware imports
- Follows official Revenium documentation patterns
- Supports Python, JavaScript, and TypeScript

## **Configuration**

The extension behavior is controlled through VS Code settings defined in `package.json` and managed by the various providers based on user preferences.
