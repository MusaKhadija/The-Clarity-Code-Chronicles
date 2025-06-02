# StacksQuest Deployment Guide

## Overview

This guide covers deploying StacksQuest to various environments, from local development to production.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Clarinet CLI
- Docker (optional)
- Stacks wallet with STX for contract deployment

## Environment Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd "StacksQuest Learning Game"

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install

# Install contract dependencies
cd ../stacks-contracts
npm install

cd ..
```

### 2. Environment Configuration

Copy the environment template and configure:

```bash
cp .env.example .env
```

Edit `.env` with your specific configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/stacksquest_db"

# Server
NODE_ENV="development"
PORT="3001"
FRONTEND_URL="http://localhost:3000"

# JWT
JWT_SECRET="your-super-secret-jwt-key"

# Stacks
STACKS_NETWORK="testnet"
STACKS_API_URL="https://stacks-node-api.testnet.stacks.co"
CONTRACT_ADDRESS="your-deployed-contract-address"
```

## Local Development

### 1. Database Setup

```bash
# Create database
createdb stacksquest_db

# Run migrations
cd backend
npx prisma migrate dev
npx prisma generate
```

### 2. Start Development Servers

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Contract development (optional)
cd stacks-contracts
clarinet console
```

### 3. Access Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3001/api-docs

## Contract Deployment

### Testnet Deployment

1. **Configure Clarinet for Testnet**

```bash
cd stacks-contracts
clarinet integrate
```

2. **Deploy Contract**

```bash
# Check contract syntax
clarinet check

# Deploy to testnet
clarinet deploy --testnet
```

3. **Initialize Contract**

After deployment, initialize with badge definitions:

```clarity
;; Create initial badge definitions
(contract-call? .nft-badges create-badge-definition
  "first-quest"
  u"First Quest Badge"
  u"Congratulations on completing your first quest!"
  u"https://stacksquest.com/badges/first-quest.png"
  "achievement"
  "common"
  (some u1000))

;; Authorize backend service
(contract-call? .nft-badges set-minter-authorization
  'ST1BACKEND-SERVICE-ADDRESS
  true)
```

### Mainnet Deployment

1. **Audit and Test**
   - Complete security audit
   - Extensive testnet testing
   - Load testing

2. **Deploy to Mainnet**

```bash
clarinet deploy --mainnet
```

3. **Verify Deployment**
   - Test all contract functions
   - Verify badge definitions
   - Confirm authorization settings

## Production Deployment

### Option 1: Traditional VPS/Cloud

#### Backend Deployment

1. **Server Setup**

```bash
# Install Node.js and PostgreSQL
sudo apt update
sudo apt install nodejs npm postgresql

# Create application user
sudo useradd -m stacksquest
sudo su - stacksquest
```

2. **Application Setup**

```bash
# Clone repository
git clone <repository-url>
cd "StacksQuest Learning Game"

# Install dependencies
cd backend
npm ci --production

# Setup database
createdb stacksquest_db
npx prisma migrate deploy
npx prisma generate
```

3. **Process Management**

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "stacksquest-backend" -- start
pm2 startup
pm2 save
```

#### Frontend Deployment

1. **Build Application**

```bash
cd frontend
npm ci
npm run build
```

2. **Serve with Nginx**

```nginx
server {
    listen 80;
    server_name stacksquest.com;
    
    location / {
        root /path/to/frontend/build;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Option 2: Docker Deployment

1. **Create Dockerfiles**

**Backend Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

**Frontend Dockerfile:**
```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

2. **Docker Compose**

```yaml
version: '3.8'
services:
  database:
    image: postgres:14
    environment:
      POSTGRES_DB: stacksquest_db
      POSTGRES_USER: stacksquest
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://stacksquest:${DB_PASSWORD}@database:5432/stacksquest_db
      NODE_ENV: production
    depends_on:
      - database
    ports:
      - "3001:3001"

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

3. **Deploy**

```bash
docker-compose up -d
```

### Option 3: Cloud Platform Deployment

#### Vercel (Frontend)

1. **Connect Repository**
   - Link GitHub repository to Vercel
   - Configure build settings

2. **Environment Variables**
   ```
   NEXT_PUBLIC_API_URL=https://api.stacksquest.com
   NEXT_PUBLIC_STACKS_NETWORK=mainnet
   ```

#### Railway/Heroku (Backend)

1. **Configure Build**
   ```json
   {
     "scripts": {
       "build": "tsc",
       "start": "node dist/index.js"
     }
   }
   ```

2. **Environment Variables**
   - Set all required environment variables
   - Configure database connection

## Database Migrations

### Production Migration

```bash
# Backup database
pg_dump stacksquest_db > backup.sql

# Run migrations
npx prisma migrate deploy

# Verify migration
npx prisma db pull
```

### Rollback Strategy

```bash
# Restore from backup if needed
psql stacksquest_db < backup.sql
```

## Monitoring and Logging

### Application Monitoring

1. **Health Checks**

```javascript
// Add to backend
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

2. **Logging**

```bash
# View PM2 logs
pm2 logs stacksquest-backend

# View Docker logs
docker-compose logs -f backend
```

### Database Monitoring

```sql
-- Monitor active connections
SELECT count(*) FROM pg_stat_activity;

-- Monitor slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

## Security Checklist

### Pre-deployment

- [ ] Environment variables secured
- [ ] Database credentials rotated
- [ ] JWT secrets generated
- [ ] HTTPS certificates configured
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] SQL injection prevention
- [ ] XSS protection enabled

### Post-deployment

- [ ] Security headers configured
- [ ] Firewall rules applied
- [ ] Monitoring alerts set up
- [ ] Backup strategy implemented
- [ ] Incident response plan ready

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check connection string
   - Verify database is running
   - Check firewall rules

2. **Contract Deployment Failures**
   - Verify STX balance
   - Check network configuration
   - Validate contract syntax

3. **Frontend Build Errors**
   - Clear node_modules and reinstall
   - Check environment variables
   - Verify API endpoints

### Performance Optimization

1. **Database**
   - Add indexes for frequent queries
   - Configure connection pooling
   - Monitor query performance

2. **API**
   - Implement caching
   - Optimize database queries
   - Add compression

3. **Frontend**
   - Enable code splitting
   - Optimize images
   - Implement lazy loading

## Maintenance

### Regular Tasks

- Monitor application health
- Update dependencies
- Backup database
- Review logs for errors
- Monitor contract interactions

### Updates

1. **Code Updates**
   ```bash
   git pull origin main
   npm ci
   npm run build
   pm2 restart stacksquest-backend
   ```

2. **Database Updates**
   ```bash
   npx prisma migrate deploy
   ```

3. **Contract Updates**
   - Deploy new contract version
   - Update environment variables
   - Migrate data if necessary
