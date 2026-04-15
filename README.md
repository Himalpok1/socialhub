# SocialHub

A full-stack social media management platform built with Node.js, React, MongoDB, and Redis.

## Features

- 🔗 **Multi-platform**: Facebook, Instagram, and TikTok
- ✏️ **Post Composer**: Write, preview, and publish to multiple platforms simultaneously
- 📅 **Post Scheduling**: Queue posts for future publishing using BullMQ
- 📊 **Analytics Dashboard**: Track reach, impressions, and engagement
- 🗓️ **Calendar View**: Visual content calendar for scheduled posts
- 🎭 **Demo Mode**: Fully functional without real API credentials

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Job Queue | BullMQ + Redis |
| Frontend | React + Vite |
| Auth | JWT |

## Quick Start

### Prerequisites

- Node.js 20+
- Docker (for MongoDB + Redis)

### 1. Start Infrastructure

```bash
docker-compose up -d
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Seed Demo Data

```bash
npm run seed
```
This creates a demo user: `demo@socialhub.io` / `demo1234`

### 4. Start Backend

```bash
npm run dev
```
Backend runs on http://localhost:5000

### 5. Install & Start Frontend

```bash
cd ../frontend
npm install
npm run dev
```
Frontend runs on http://localhost:5173

## Connecting Real Social Media Accounts

Edit `backend/.env`:

```env
DEMO_MODE=false

# Facebook / Instagram
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret

# TikTok
TIKTOK_CLIENT_KEY=your_client_key
TIKTOK_CLIENT_SECRET=your_client_secret
```

### Platform Setup

**Facebook/Instagram:**
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create an app → Add "Facebook Login" + "Instagram Graph API" products
3. Add `http://localhost:5000/api/accounts/callback/facebook` as redirect URI

**TikTok:**
1. Go to [TikTok for Developers](https://developers.tiktok.com/)
2. Create an app → Enable "Content Posting API"
3. Add `http://localhost:5000/api/accounts/callback/tiktok` as redirect URI

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/accounts` | List connected accounts |
| POST | `/api/accounts/connect/:platform` | Start OAuth or connect demo |
| DELETE | `/api/accounts/:id` | Disconnect account |
| GET | `/api/posts` | List posts (filterable) |
| POST | `/api/posts` | Create/schedule post |
| PUT | `/api/posts/:id` | Update post |
| DELETE | `/api/posts/:id` | Delete post |
| POST | `/api/posts/:id/publish` | Publish immediately |
| GET | `/api/analytics` | Analytics overview |
