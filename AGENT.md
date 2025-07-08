# AGENT.md - StacksQuest Development Guide

## Build/Test Commands

**Frontend (Next.js):**
- `cd frontend && npm run dev` - Start development server
- `cd frontend && npm run build` - Production build
- `cd frontend && npm run lint` - ESLint check
- `cd frontend && npm run type-check` - TypeScript check

**Backend (Express/Prisma):**
- `cd backend && npm run dev` - Start development server
- `cd backend && npm run build` - TypeScript build
- `cd backend && npm test` - Run all tests
- `cd backend && npm run test:watch` - Watch mode tests
- `cd backend && npm run db:migrate` - Database migration

**Smart Contracts (Clarinet):**
- `cd stacks-contracts && clarinet check` - Check contract syntax
- `cd stacks-contracts && npm run test` - Run all contract tests
- `cd stacks-contracts && npm run test:watch` - Watch mode tests
- `cd stacks-contracts && npm run test:report` - Tests with coverage

## Architecture

Monorepo with 3 main subprojects:
- **frontend/**: Next.js 14 + TypeScript + Tailwind CSS + Zustand
- **backend/**: Express.js + Prisma + PostgreSQL + JWT auth
- **stacks-contracts/**: Clarity smart contracts (SIP-009 NFTs, SIP-010 tokens)

Key APIs: RESTful backend with Swagger docs, Stacks blockchain integration

## Code Style

- TypeScript everywhere with strict type checking
- Interfaces use PascalCase, exports from `types/index.ts`
- Enums use UPPER_CASE values
- API responses follow `ApiResponse<T>` pattern
- Imports: `@/` for absolute paths in backend, relative in frontend
- Error handling: Custom error constants for contracts, try/catch for TypeScript
- Functions: camelCase, async/await preferred
- Components: PascalCase, use `BaseComponentProps` interface
- Clarity: kebab-case for functions, UPPER-CASE for constants
