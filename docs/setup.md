# PublishAI Setup & Installation Guide

## Overview
This guide provides instructions for setting up the local development environment for the PublishAI platform.

## Prerequisites
- **Node.js**: >= 18.18.0
- **npm**: >= 9.x
- **PostgreSQL Database**: Neon serverless Postgres or local PostgreSQL instance
- **AI Service Keys**: OpenAI API key / Anthropic API key

## Environment Configuration
Create a `.env.local` file in the root directory:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/publishai

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_key

# AI Providers
OPENAI_API_KEY=your_openai_api_key
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Lio311/PublishAI.git
cd PublishAI
```

2. Install project dependencies:
```bash
npm install
```

## Database Setup

Push the database schema using Drizzle ORM:
```bash
npm run db:push
```

## Running the Application

Start the local Next.js development server:
```bash
npm run dev
```

The application will be accessible at `http://localhost:3000`.

## Running Tests

Execute test suites:
```bash
# Unit & integration tests
npm test

# End-to-end tests
npm run test:e2e
```

## Building for Production

Compile and bundle for deployment:
```bash
npm run build
npm start
```
