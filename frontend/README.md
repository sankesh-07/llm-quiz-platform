# LLM Quiz Platform - Frontend

A modern, responsive frontend for the LLM Quiz Platform built with React, TypeScript, and Tailwind CSS.

## Features

- **Multi-role Authentication**: Support for Students, Admins, and Parents
- **Student Features**:
  - Practice Mode: Create custom quizzes based on board, standard, subject, and chapter
  - Contest Participation: Join and participate in live contests
  - Analytics Dashboard: Track performance by subject and chapter
  - Submission History: View past quiz attempts and results
- **Admin Features**:
  - Contest Management: Create and manage contests
  - Generate Quiz Templates: Generate quiz questions using LLM
  - Publish Results & Solutions: Control when results and solutions are visible
  - Leaderboard Management: View contest leaderboards
- **Parent Features**:
  - Monitor Children: View progress and performance of linked children
  - Analytics: Track children's quiz performance and accuracy

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend server running (see backend README)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the frontend directory:
```
VITE_API_URL=http://localhost:4000/api
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` (or the port Vite assigns).

### Building for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

## Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable components
│   │   ├── auth/         # Authentication components
│   │   └── Layout.tsx    # Main layout wrapper
│   ├── contexts/         # React contexts (Auth, Quiz)
│   ├── pages/            # Page components
│   │   ├── student/      # Student pages
│   │   ├── admin/        # Admin pages
│   │   └── parent/       # Parent pages
│   ├── services/         # API service layer
│   ├── config/           # Configuration files
│   ├── App.tsx           # Main app component with routing
│   └── main.tsx          # Entry point
├── public/               # Static assets
└── package.json
```

## API Integration

The frontend communicates with the backend API through service files in `src/services/`:
- `auth.service.ts` - Authentication endpoints
- `boards.service.ts` - Board and syllabus data
- `learning.service.ts` - Practice quiz creation
- `contests.service.ts` - Contest management
- `submissions.service.ts` - Quiz submissions
- `analytics.service.ts` - Analytics and progress tracking

All API calls are configured in `src/config/api.ts` with automatic token injection and error handling.

## Authentication Flow

1. User registers/logs in through the auth pages
2. JWT token is stored in localStorage
3. Token is automatically included in API requests via axios interceptors
4. Protected routes check authentication and role
5. On 401 errors, user is redirected to login

## Role-Based Access

- **Student**: Access to learning mode, contests, analytics, and submissions
- **Admin**: Access to contest management and admin dashboard
- **Parent**: Access to parent dashboard for monitoring children

## Development Notes

- The quiz taking interface stores quiz data in localStorage temporarily (backend doesn't have a direct quiz GET endpoint)
- All API endpoints match the backend structure documented in `summary.md`
- The UI is fully responsive and works on mobile, tablet, and desktop
- Error handling is implemented throughout with user-friendly messages

## Future Enhancements

- Real-time contest updates
- Quiz result visualization with charts
- Detailed submission review with explanations
- Parent notifications for children's progress
- Admin analytics dashboard
