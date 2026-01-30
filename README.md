# Visa Eligibility Determination System

AI-powered system for evaluating visa eligibility based on applicant profiles and documents.

## Features

- **AI-Powered Document Parsing**: Automatically extracts information from documents using OpenAI
- **Dynamic Eligibility Rules**: Scrapes USCIS websites to get up-to-date eligibility criteria
- **Multi-Visa Support**: Works for H-1B, L-1, B-2, F-1, EB-1 and extensible to any visa type
- **Profile Scoring**: Calculates eligibility scores based on qualifications and documents
- **Real-time Feedback**: Immediate eligibility assessment after document submission

## Tech Stack

- **Backend**: Node.js, Express.js, MongoDB, OpenAI API
- **Frontend**: Next.js 14, React, Tailwind CSS
- **Web Scraping**: Cheerio, Puppeteer

## Setup

1. Install dependencies:
```bash
npm run install:all
```

2. Set up environment variables:
- Copy `backend/.env.example` to `backend/.env`
- Copy `frontend/.env.example` to `frontend/.env.local`
- Add your OpenAI API key and MongoDB connection string

3. Run development servers:
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

## Initial Setup

### 1. Environment Variables

Create `backend/.env` file:
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/visa-eli
OPENAI_API_KEY=your_openai_api_key_here
UPLOAD_DIR=./uploads
NODE_ENV=development
```

Create `frontend/.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 2. Initialize Visa Rules (One-Time Setup)

Before processing user uploads, scrape and store eligibility rules for visa types:

```bash
# H-1B
curl -X POST http://localhost:3001/api/rules/scrape \
  -H "Content-Type: application/json" \
  -d '{"visaType": "H-1B"}'

# L-1
curl -X POST http://localhost:3001/api/rules/scrape \
  -H "Content-Type: application/json" \
  -d '{"visaType": "L-1"}'

# F-1
curl -X POST http://localhost:3001/api/rules/scrape \
  -H "Content-Type: application/json" \
  -d '{"visaType": "F-1"}'

# B-2
curl -X POST http://localhost:3001/api/rules/scrape \
  -H "Content-Type: application/json" \
  -d '{"visaType": "B-2"}'

# EB-1
curl -X POST http://localhost:3001/api/rules/scrape \
  -H "Content-Type: application/json" \
  -d '{"visaType": "EB-1"}'
```

Or use a custom URL:
```bash
curl -X POST http://localhost:3001/api/rules/scrape \
  -H "Content-Type: application/json" \
  -d '{"visaType": "H-1B", "url": "https://www.uscis.gov/working-in-the-united-states/h-1b-specialty-occupations"}'
```

### 3. Verify Rules

Check if rules are stored:
```bash
curl http://localhost:3001/api/rules
```

## Project Structure

```
visa-eli/
├── backend/          # Express.js API server
├── frontend/         # Next.js React application
└── README.md
```

