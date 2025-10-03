# Contributing to Revenium

## Development Setup

### Prerequisites

- Node.js 18.x or higher
- npm 8.x or higher
- Visual Studio Code 1.74.0 or higher
- Git

### Initial Setup

```bash
git clone https://github.com/revenium/revenium-onboarding-assistant.git
cd revenium-onboarding-assistant
npm install
npm run compile
```

### Development Workflow

```bash
# Watch mode for TypeScript compilation
npm run watch

# Linting
npm run lint

# Compile TypeScript
npm run compile

# Package for distribution
npm run package
```

### Testing

Press F5 in Visual Studio Code to launch the Extension Development Host with the extension loaded for testing.

## Code Standards

### TypeScript Guidelines

- Use strict TypeScript configuration
- Provide explicit type annotations for public methods
- Follow VSCode extension development patterns
- Prefer composition over inheritance

### Code Style

- Use camelCase for variables and functions
- Use PascalCase for classes and interfaces
- Follow ESLint configuration
- Maximum line length: 120 characters

### File Organization

```
src/
├── detection/        # Pattern detection engine
│   ├── patterns.ts   # Detection pattern definitions
│   └── engine.ts     # Detection logic
├── diagnostics/      # VSCode diagnostics integration
│   └── codeActionProvider.ts
├── fixes/           # Quick fix implementations
│   └── quickFixes.ts
├── ui/              # UI providers
│   ├── treeViewProvider.ts
│   ├── codeLensProvider.ts
│   └── hoverProvider.ts
├── types.ts         # Type definitions
└── extension.ts     # Extension entry point
```

## Adding New Provider Support

### Step 1: Add Pattern Definitions

Update `src/detection/patterns.ts`:

```typescript
{
  id: 'newprovider-python-import',
  pattern: /from\s+newprovider\s+import\s+.+$/gm,
  message: 'NewProvider usage detected',
  language: ['python'],
  severity: 'INFO',
  provider: 'newprovider',
  scenario: 'missing_revenium',
  fixGuidance: 'Use revenium-middleware-newprovider'
}
```

### Step 2: Add Provider Configuration

Update `PROVIDER_CONFIGS` in `src/detection/patterns.ts`:

```typescript
'newprovider': {
  name: 'newprovider',
  displayName: 'NewProvider',
  middlewarePackages: {
    python: 'revenium-middleware-newprovider-python',
    javascript: 'revenium-middleware-newprovider-node',
    typescript: 'revenium-middleware-newprovider-node'
  }
}
```

### Step 3: Test Implementation

1. Create test files with NewProvider usage
2. Verify detection appears in tree view
3. Test quick fix application
4. Ensure configuration toggles work

## Pull Request Guidelines

### Before Submitting

- [ ] Code compiles without errors
- [ ] Linter passes
- [ ] Manual testing completed
- [ ] Documentation updated if needed

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Code refactoring

## Testing
Describe testing performed

## Checklist
- [ ] Code compiles
- [ ] Linter passes
- [ ] Manual testing completed
```

## Issue Reporting

### Bug Reports

Include:

- VSCode version
- Extension version
- Steps to reproduce
- Expected vs actual behavior
- Console logs (Help > Toggle Developer Tools > Console)

### Feature Requests

Include:

- Use case description
- Proposed solution
- Provider/language affected

## Code Review Process

### Review Criteria

- Code quality and maintainability
- TypeScript best practices
- VSCode extension patterns
- Documentation completeness

### Review Timeline

- Initial response: 2 business days
- Full review: 5 business days

## Release Process

### Version Management

Follow semantic versioning (MAJOR.MINOR.PATCH):

- MAJOR: Breaking changes
- MINOR: New features, backward compatible
- PATCH: Bug fixes, backward compatible

### Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] VSIX package created and tested

## Questions

For questions about contributing:

- Open a GitHub issue
- Email: support@revenium.io

## License

By contributing, you agree that your contributions will be licensed under the MIT License.