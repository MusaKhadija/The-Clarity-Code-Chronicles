# Contributing to StacksQuest

Thank you for your interest in contributing to StacksQuest! This guide will help you get started with contributing to our educational blockchain game.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- Be respectful and inclusive
- Focus on constructive feedback
- Help create a welcoming environment for all contributors
- Report any unacceptable behavior to the maintainers

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Clarinet CLI
- Git
- Basic knowledge of TypeScript, React, and Clarity

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/stacksquest.git
   cd stacksquest
   ```

2. **Install Dependencies**
   ```bash
   # Frontend
   cd frontend && npm install
   
   # Backend
   cd ../backend && npm install
   
   # Smart Contracts
   cd ../stacks-contracts && npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Start Development Servers**
   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev
   
   # Terminal 2: Frontend
   cd frontend && npm run dev
   ```

## Development Workflow

### Branch Strategy

We use a feature branch workflow:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/feature-name` - Individual feature branches
- `hotfix/issue-description` - Critical bug fixes

### Making Changes

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Write clean, well-documented code
   - Follow existing code style and conventions
   - Add tests for new functionality

3. **Test Your Changes**
   ```bash
   # Frontend tests
   cd frontend && npm test
   
   # Backend tests
   cd backend && npm test
   
   # Smart contract tests
   cd stacks-contracts && npm test
   
   # Linting
   npm run lint
   ```

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add new quest system"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```bash
feat(auth): add wallet connection functionality
fix(quest): resolve quest completion tracking bug
docs(api): update authentication documentation
test(contracts): add NFT badge minting tests
```

## Code Style Guidelines

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Prefer functional programming patterns

```typescript
// Good
interface QuestProgress {
  questId: string;
  userId: string;
  completedSteps: number[];
  status: QuestStatus;
}

const updateQuestProgress = async (
  userId: string,
  questId: string,
  stepNumber: number
): Promise<QuestProgress> => {
  // Implementation
};

// Bad
const updateProgress = (u: string, q: string, s: number) => {
  // Implementation
};
```

### React Components

- Use functional components with hooks
- Implement proper TypeScript interfaces
- Use descriptive component names
- Keep components focused and small

```tsx
// Good
interface QuestCardProps {
  quest: Quest;
  onStart: (questId: string) => void;
  isCompleted: boolean;
}

const QuestCard: React.FC<QuestCardProps> = ({ quest, onStart, isCompleted }) => {
  return (
    <div className="card">
      <h3>{quest.title}</h3>
      <p>{quest.description}</p>
      {!isCompleted && (
        <button onClick={() => onStart(quest.id)}>Start Quest</button>
      )}
    </div>
  );
};
```

### Clarity Smart Contracts

- Use descriptive function and variable names
- Add comprehensive comments
- Follow security best practices
- Include proper error handling

```clarity
;; Good
(define-public (mint-badge (recipient principal) (badge-type (string-ascii 32)))
  (let (
    (badge-def (unwrap! (map-get? badge-definitions badge-type) ERR-NOT-FOUND))
  )
    ;; Check authorization
    (asserts! (is-authorized-minter tx-sender) ERR-UNAUTHORIZED)
    
    ;; Check if user already has this badge
    (asserts! (not (user-has-badge recipient badge-type)) ERR-DUPLICATE-BADGE)
    
    ;; Mint the badge
    (mint-nft recipient badge-type)
  )
)
```

## Testing Guidelines

### Frontend Testing

- Write unit tests for utilities and hooks
- Write integration tests for components
- Use React Testing Library
- Aim for >80% code coverage

```typescript
// Example test
describe('QuestCard', () => {
  it('should call onStart when start button is clicked', () => {
    const mockOnStart = jest.fn();
    const quest = createMockQuest();
    
    render(<QuestCard quest={quest} onStart={mockOnStart} isCompleted={false} />);
    
    fireEvent.click(screen.getByText('Start Quest'));
    
    expect(mockOnStart).toHaveBeenCalledWith(quest.id);
  });
});
```

### Backend Testing

- Write unit tests for all business logic
- Write integration tests for API endpoints
- Mock external dependencies
- Test error conditions

```typescript
// Example test
describe('AuthController', () => {
  it('should create user on first login', async () => {
    const mockUser = { stacksAddress: 'ST123...' };
    
    const response = await request(app)
      .post('/api/auth/login')
      .send(mockUser)
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.stacksAddress).toBe(mockUser.stacksAddress);
  });
});
```

### Smart Contract Testing

- Test all public functions
- Test error conditions
- Test access control
- Use descriptive test names

```typescript
// Example test
describe("NFT Badges Contract", () => {
  it("should prevent non-owners from creating badge definitions", () => {
    const { result } = simnet.callPublicFn(
      "nft-badges",
      "create-badge-definition",
      [/* parameters */],
      wallet1 // non-owner
    );
    expect(result).toBeErr(Cl.uint(100)); // ERR-OWNER-ONLY
  });
});
```

## Documentation

### Code Documentation

- Add JSDoc comments for all public APIs
- Document complex algorithms
- Include usage examples
- Keep documentation up to date

### README Updates

- Update README for new features
- Include setup instructions
- Add troubleshooting information
- Update dependency requirements

## Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] Documentation is updated
- [ ] Commit messages follow convention
- [ ] Branch is up to date with main

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests pass
```

### Review Process

1. Automated checks must pass
2. At least one maintainer review required
3. Address all review feedback
4. Squash commits before merge

## Issue Reporting

### Bug Reports

Use the bug report template:

```markdown
**Describe the bug**
Clear description of the bug

**To Reproduce**
Steps to reproduce the behavior

**Expected behavior**
What you expected to happen

**Screenshots**
If applicable, add screenshots

**Environment**
- OS: [e.g. Windows 10]
- Browser: [e.g. Chrome 91]
- Version: [e.g. 1.0.0]
```

### Feature Requests

Use the feature request template:

```markdown
**Is your feature request related to a problem?**
Clear description of the problem

**Describe the solution you'd like**
Clear description of desired solution

**Describe alternatives you've considered**
Alternative solutions considered

**Additional context**
Any other context or screenshots
```

## Community

### Communication Channels

- GitHub Issues: Bug reports and feature requests
- GitHub Discussions: General questions and ideas
- Discord: Real-time chat and community support

### Getting Help

- Check existing issues and documentation
- Ask questions in GitHub Discussions
- Join our Discord community
- Reach out to maintainers

## Recognition

Contributors will be recognized in:

- CONTRIBUTORS.md file
- Release notes
- Project documentation
- Community highlights

Thank you for contributing to StacksQuest! 🚀
