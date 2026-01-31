# LLM Quiz & Contest Platform

A comprehensive platform for quizzes and contests, empowering students, parents, and admins with AI-driven insights and content generation.

## 🚀 Features

- **Role-Based Access**:
  - **Admin**: Manage contests, users, and system settings.
  - **Student**: Take quizzes, participate in contests, and track learning progress.
  - **Parent**: Monitor child's performance and activity.
- **AI-Powered**:
  - Syllabus-aware quiz generation.
  - Intelligent explanations for answers.
- **Contests & Quizzes**:
  - Live contests with real-time tracking.
  - Practice quizzes for self-improvement.
- **Analytics**: Detailed performance metrics and learning analytics.

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB
- **AI Integration**: Custom LLM Service

### Frontend
- **Framework**: React (Vite)
- **Styling**: TailwindCSS
- **State Management**: Context API / Modern Hooks

## 📦 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd llm-quiz-platform
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   # Configure .env based on .env.example
   ```

3. **Database Configuration**
   - Create a `.env` file in the `backend` directory.
   - Add your MongoDB connection string:
     ```env
     MONGODB_URI=mongodb://localhost:27017/llm_quiz_platform
     # Or for MongoDB Atlas:
     # MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/llm_quiz_platform
     ```

4. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   # Configure .env if needed
   ```

4. **Run the Application**
   - Backend: `npm run dev`
   - Frontend: `npm run dev`
