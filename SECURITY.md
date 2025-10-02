# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | ✅        |

## Reporting Security Vulnerabilities

If you discover a security vulnerability in the Revenium extension, please report it responsibly.

### Reporting Method

- **Email**: security@revenium.io
- **Subject**: [SECURITY] Revenium VSCode Extension Vulnerability

### Report Contents

Include the following information:

- Description of the vulnerability
- Steps to reproduce
- Potential impact assessment
- Suggested remediation (if known)

### Response Timeline

- **Acknowledgment**: Within 2 business days
- **Initial Assessment**: Within 5 business days
- **Resolution**: Varies by severity (see below)

## Severity Classification

### Critical (24-48 hours)

- Remote code execution
- Privilege escalation
- Data exfiltration

### High (1 week)

- Local code execution
- Information disclosure
- Authentication bypass

### Medium (2 weeks)

- Denial of service
- Input validation issues
- Configuration vulnerabilities

### Low (1 month)

- Information leakage
- Minor configuration issues

## Security Considerations

### Data Handling

- **Local processing**: All detection happens locally in VSCode
- **No external transmission**: Extension does not send code content to external services
- **No telemetry**: Extension does not collect or transmit usage data
- **Workspace isolation**: Detection results are workspace-specific

### Code Analysis

- **Static analysis only**: Extension uses pattern matching, no code execution
- **Regex-based detection**: Detection uses regular expressions, not code evaluation
- **Sandboxed operation**: Runs within VSCode's extension security sandbox
- **Offline capable**: Full functionality without network access

### Dependencies

- Minimal dependency surface area
- Regular security audits via npm audit
- Only production dependencies for core functionality

## Security Best Practices for Users

### Installation

- Install only from official VSCode Marketplace
- Verify publisher information before installation
- Review extension permissions

### Configuration

- Review detection settings for your security requirements
- Configure provider and language toggles appropriately
- Keep extension updated to latest version

### Usage

- Monitor detection results for unexpected behavior
- Report suspicious activity to security@revenium.io
- Review quick fix suggestions before applying

## Incident Response

### In Case of Security Incident

1. **Immediate**: Disable extension if actively exploited
2. **Report**: Contact security@revenium.io with details
3. **Document**: Record affected systems and versions
4. **Cooperate**: Work with Revenium security team on resolution

### Communication

- Security advisories published via GitHub Security Advisories
- Critical issues communicated through multiple channels
- Updates provided throughout resolution process

## Security Contact

- **Primary**: security@revenium.io
- **Alternative**: Create private security advisory on GitHub
- **GitHub Issues**: Use [SECURITY] prefix for urgent issues

## Recognition

We appreciate responsible disclosure of security vulnerabilities. Contributors who report valid security issues will be:

- Acknowledged in security advisories (if desired)
- Listed in project contributors

## Additional Resources

- [VSCode Extension Security](https://code.visualstudio.com/api/extension-guides/overview#security)
- [Revenium Security Documentation](https://docs.revenium.io/security)