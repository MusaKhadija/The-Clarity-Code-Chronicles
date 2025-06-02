# StacksQuest API Documentation

## Overview

The StacksQuest API provides endpoints for managing users, quests, and NFT badges in the educational blockchain game.

## Base URL

- Development: `http://localhost:3001`
- Production: `https://api.stacksquest.com`

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Authentication

#### POST /api/auth/login
Login or register a user with their Stacks wallet address.

**Request Body:**
```json
{
  "stacksAddress": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "stacksAddress": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
      "username": null,
      "email": null,
      "createdAt": "2024-06-02T12:00:00Z",
      "profile": {
        "level": 1,
        "experience": 0,
        "totalQuestsCompleted": 0
      }
    },
    "token": "jwt_token_here"
  }
}
```

#### POST /api/auth/register
Register a new user with additional details.

**Request Body:**
```json
{
  "stacksAddress": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  "username": "player123",
  "email": "player@example.com"
}
```

#### GET /api/auth/profile
Get current user profile (requires authentication).

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "stacksAddress": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
    "username": "player123",
    "profile": {
      "level": 5,
      "experience": 1250,
      "totalQuestsCompleted": 3
    },
    "progress": [...],
    "nftBadges": [...]
  }
}
```

### Users

#### GET /api/users/profile
Get user profile information (requires authentication).

### Quests

#### GET /api/quests
Get all available quests.

**Query Parameters:**
- `category` (optional): Filter by quest category
- `difficulty` (optional): Filter by difficulty level
- `page` (optional): Page number for pagination
- `limit` (optional): Number of items per page

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "quest_id",
      "title": "First Steps in Stacks",
      "description": "Learn the basics of Stacks blockchain",
      "category": "BASICS",
      "difficulty": "BEGINNER",
      "estimatedTime": 30,
      "rewards": [
        {
          "type": "NFT_BADGE",
          "nftBadgeId": "first-quest",
          "description": "First Quest Completion Badge"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

#### GET /api/quests/:id
Get a specific quest by ID.

### Badges

#### GET /api/badges
Get all available NFT badges.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "badge_id",
      "name": "First Quest Badge",
      "description": "Awarded for completing your first quest",
      "imageUrl": "https://stacksquest.com/badges/first-quest.png",
      "category": "ACHIEVEMENT",
      "rarity": "COMMON",
      "requirements": ["Complete the 'First Steps in Stacks' quest"]
    }
  ]
}
```

#### GET /api/badges/user
Get badges earned by the current user (requires authentication).

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

### Common Error Codes

- `400` - Bad Request: Invalid input data
- `401` - Unauthorized: Missing or invalid authentication token
- `403` - Forbidden: Insufficient permissions
- `404` - Not Found: Resource not found
- `429` - Too Many Requests: Rate limit exceeded
- `500` - Internal Server Error: Server error

## Rate Limiting

API requests are limited to 100 requests per 15-minute window per IP address.

## WebSocket Events

The API supports real-time updates via WebSocket connections for:

- Quest progress updates
- Badge awards
- User level changes

Connect to: `ws://localhost:3001/ws` (development)

## SDK Usage

For JavaScript/TypeScript applications, use the official StacksQuest SDK:

```javascript
import { StacksQuestClient } from '@stacksquest/sdk';

const client = new StacksQuestClient({
  apiUrl: 'http://localhost:3001',
  authToken: 'your-jwt-token'
});

// Get user profile
const profile = await client.auth.getProfile();

// Get available quests
const quests = await client.quests.getAll();

// Start a quest
await client.quests.start('quest-id');
```
