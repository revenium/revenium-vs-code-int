# Revenium

Visual Studio Code extension for detecting AI library usage and integrating Revenium middleware for cost tracking and monitoring.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://marketplace.visualstudio.com/items?itemName=revenium.revenium-onboarding-assistant)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## Overview

Revenium automatically scans your codebase to identify AI library usage (OpenAI, Anthropic, Google AI) and provides integration points for Revenium middleware. The extension helps developers:

- Detect AI library imports and usage patterns across Python, JavaScript, and TypeScript
- Identify opportunities to integrate Revenium middleware for usage tracking
- Apply automated fixes to replace direct library imports with Revenium wrappers
- Monitor AI usage across projects through a centralized view

## Installation

Install from the [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=revenium.revenium-onboarding-assistant) or search for "Revenium" in the Extensions view (`Ctrl+Shift+X` / `Cmd+Shift+X`).

## Features

### Automatic Detection

The extension analyzes your codebase in real-time to detect:

- **Python**: `import openai`, `from anthropic import`, `import google.generativeai`
- **JavaScript/TypeScript**: `import OpenAI from 'openai'`, `require('anthropic')`, etc.
- **Frameworks**: LangChain, LiteLLM, and other AI framework patterns

### Visual Indicators

- Inline diagnostics showing detected AI usage
- Tree view displaying all detections organized by provider and language
- CodeLens hints above detected code for quick actions

### Quick Fixes

Apply middleware integration with one click:

**Before:**
```python
from openai import OpenAI
client = OpenAI()
```

**After:**
```python
from revenium_middleware_openai_python import OpenAI
client = OpenAI()
```

## Configuration

Access settings through `File > Preferences > Settings` and search for "Revenium".

### Detection Settings

- **Detection Enabled**: Enable/disable AI usage detection
- **Real-time**: Scan files as you type
- **Show Overlays**: Display visual indicators under detected code
- **Filter**: Show all detections or filter by type (integration/security/imports)

### Provider Settings

Toggle detection for specific AI providers:

- OpenAI
- Anthropic
- Google AI

**Note:** The extension also detects AWS Bedrock, Perplexity, and LangChain patterns, but these do not have individual configuration toggles.

### Language Settings

Enable/disable detection for specific languages:

- Python
- JavaScript
- TypeScript

### Display Settings

- **CodeLens**: Show/hide inline integration hints

### Advanced Settings

- **Advanced Patterns**: Enable experimental detection patterns

## Usage

### Scan Workspace

1. Open the Revenium view from the Activity Bar
2. Click "Scan Workspace" to analyze all files
3. View detected AI usage organized by provider and language

### Apply Integration

1. Open a file with detected AI usage
2. Click the CodeLens hint above the detected code
3. Select "Add Revenium middleware" from the quick fix menu
4. The extension automatically updates your imports

### Configuration Options

Toggle specific providers or languages through the settings to focus detection on relevant areas of your codebase.

## Development

### Prerequisites

- Node.js 18.x or higher
- npm 8.x or higher
- Visual Studio Code 1.74.0 or higher

### Setup

```bash
git clone https://github.com/revenium/revenium-onboarding-assistant.git
cd revenium-onboarding-assistant
npm install
npm run compile
```

### Development Workflow

```bash
# Watch mode for development
npm run watch

# Run linter
npm run lint

# Compile TypeScript
npm run compile

# Package extension
npm run package
```

### Testing

Press F5 in Visual Studio Code to launch the Extension Development Host with the extension loaded.

## Project Structure

```
src/
├── detection/        # Pattern detection engine
├── diagnostics/      # VSCode diagnostics integration
├── fixes/           # Quick fix implementations
├── ui/              # Tree view and CodeLens providers
├── types.ts         # TypeScript type definitions
└── extension.ts     # Extension entry point
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines and submission process.

## Security

Report security vulnerabilities to security@revenium.io. See [SECURITY.md](SECURITY.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [Revenium Platform](https://revenium.io)
- [Documentation](https://docs.revenium.io)
- [GitHub Issues](https://github.com/revenium/revenium-onboarding-assistant/issues)
- [Marketplace](https://marketplace.visualstudio.com/items?itemName=revenium.revenium-onboarding-assistant)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history.