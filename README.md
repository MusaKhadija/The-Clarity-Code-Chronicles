# StacksQuest: The Clarity Code Chronicles

An educational RPG game that teaches Stacks blockchain concepts through interactive quests involving real blockchain transactions.

## 🎮 Game Overview

StacksQuest combines gaming with blockchain education, allowing players to:
- Connect their Stacks wallet (Hiro Wallet)
- Complete educational quests with practical Stacks transactions
- Earn SIP-009 NFT badges and SIP-010 token rewards
- Progress through increasingly complex blockchain concepts

## 🎯 Educational Objectives

- **Stacks Architecture**: Proof of Transfer, Clarity language, Gaia storage
- **Wallet Management**: Transaction handling and wallet integration
- **Smart Contract Development**: Basic Clarity programming
- **Blockchain Fundamentals**: Blocks, transactions, and consensus
- **Token Standards**: SIP-009 NFTs and SIP-010 fungible tokens
- **Decentralized Systems**: Identity and storage concepts

## 🛠 Technology Stack

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Stacks Integration**: @stacks/connect, @stacks/auth, @stacks/transactions

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with Stacks wallet verification
- **API**: RESTful with OpenAPI documentation

### Blockchain
- **Platform**: Stacks blockchain (Testnet development, Mainnet compatible)
- **Smart Contracts**: Clarity language
- **Development**: Clarinet framework
- **Token Standards**: SIP-009 (NFTs), SIP-010 (fungible tokens)

## 📁 Project Structure

```
StacksQuest Learning Game/
├── frontend/              # Next.js application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Next.js pages
│   │   ├── hooks/         # Custom React hooks
│   │   ├── utils/         # Utility functions
│   │   └── types/         # TypeScript type definitions
│   ├── public/            # Static assets
│   └── package.json
├── backend/               # Express.js API server
│   ├── src/
│   │   ├── controllers/   # Route handlers
│   │   ├── models/        # Database models
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API routes
│   │   └── utils/         # Utility functions
│   └── package.json
├── stacks-contracts/      # Clarinet project
│   ├── contracts/         # Clarity smart contracts
│   ├── tests/             # Contract tests
│   └── Clarinet.toml
├── docs/                  # Additional documentation
├── .env.example           # Environment variables template
├── README.md              # This file
└── CHANGELOG.md           # Version history
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL 14+
- Clarinet CLI
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "StacksQuest Learning Game"
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Install dependencies**
   ```bash
   # Frontend
   cd frontend
   npm install
   
   # Backend
   cd ../backend
   npm install
   
   # Return to root
   cd ..
   ```

4. **Set up database**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Initialize Clarinet project**
   ```bash
   cd stacks-contracts
   clarinet check
   ```

6. **Start development servers**
   ```bash
   # Terminal 1: Backend
   cd backend
   npm run dev
   
   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```

7. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Documentation: http://localhost:3001/api-docs

## 🔧 Development

### Running Tests

```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
npm test

# Smart contract tests
cd stacks-contracts
clarinet test
```

### Code Quality

```bash
# Linting
npm run lint

# Formatting
npm run format

# Type checking
npm run type-check
```

## 🔐 Security

- All sensitive data stored in environment variables
- Input validation on all API endpoints
- Clarity contract security best practices
- OWASP Top 10 compliance

## 📚 Documentation

- [API Documentation](./docs/api.md)
- [Smart Contract Documentation](./docs/contracts.md)
- [Deployment Guide](./docs/deployment.md)
- [Contributing Guidelines](./docs/contributing.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please open an issue on GitHub or contact the development team.

---

**Built with ❤️ for the Stacks ecosystem**
