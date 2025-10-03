# Changelog

All notable changes to the Revenium VSCode extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-01

### Added

- Initial prototype release of Revenium VSCode extension
- Automatic AI usage detection for Python, JavaScript, and TypeScript
- Support for OpenAI, Anthropic, and Google AI providers
- Real-time detection with visual indicators
- Tree view panel for workspace-wide AI usage overview
- CodeLens integration for inline quick actions
- One-click middleware integration via quick fixes
- Configurable detection settings with provider and language toggles
- Professional configuration structure with logical groupings
- Comprehensive documentation (README, CONTRIBUTING, SECURITY, CODE_OF_CONDUCT)

### Detection Capabilities

- Python import detection for OpenAI, Anthropic, Google AI
- JavaScript/TypeScript import and require() detection
- LangChain and framework usage detection
- Async pattern handling detection

### Configuration

- Detection settings (enable/disable, real-time, overlays, filters)
- Provider toggles (OpenAI, Anthropic, Google AI)
- Language toggles (Python, JavaScript, TypeScript)
- Display settings (CodeLens visibility)
- Advanced patterns (experimental features)

### Documentation

- Professional README with installation and usage instructions
- Contributing guidelines for developers
- Security policy and vulnerability reporting
- Code of Conduct based on Contributor Covenant
- Developer guide (planned)
- Product requirements document (planned)

## [Unreleased]

### Planned Features

- Additional AI provider support (Cohere, Hugging Face, Replicate)
- Improved import detection accuracy (aliased imports, conditional imports)
- Batch operations for fixing multiple files
- Enhanced configuration UI
- Platform integration with Revenium APIs
- Team collaboration features
- Usage analytics and optimization recommendations

### Under Consideration

- AST-based detection for improved accuracy
- Live cost data integration
- Custom detection pattern configuration
- Integration with other AI development tools