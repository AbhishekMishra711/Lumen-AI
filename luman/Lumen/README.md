# Lumen AI Study Tool

An AI-native study platform with a brutalist retro aesthetic, featuring intelligent learning tools powered by SARVAM AI.

## Features

### 🎴 Flashcards
- Generate intelligent flashcards from any topic
- AI-powered content creation using SARVAM LLM
- Spaced repetition learning system

### 📝 Quiz System
- Dynamic quiz generation using SARVAM AI
- Topic-specific questions with detailed explanations
- Performance tracking with strengths/weaknesses analysis
- Personalized action plans based on quiz results

### 🏰 Memory Palace RPG
- Complete game-first learning experience
- Pacman-inspired dungeon exploration
- Quiz questions power combat mechanics (Knowledge Attacks)
- RPG elements: leveling, health, mana, gold, experience
- Progressive difficulty with multiple enemy types
- Visual effects: particles, projectiles, screen shake
- SARVAM AI-generated dungeons and content

### 🧠 AI Tutor
- Interactive AI-powered study assistance
- Context-aware responses using SARVAM LLM
- Personalized learning guidance

### 🗺️ Mind Map
- Visual learning through mind mapping
- AI-generated concept relationships
- Interactive exploration of topics

## Tech Stack

- **Frontend**: Next.js 16.3.4, React 19.2.8, TypeScript, Tailwind CSS v4
- **Backend**: Express 5, MongoDB/Mongoose
- **AI**: SARVAM AI API for content generation
- **Styling**: Brutalist retro aesthetic with custom fonts

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account
- SARVAM AI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd luman/Lumen
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd ../luman-flashcard-devin
   npm install
   ```

4. **Configure environment variables**

   Backend `.env` file:
   ```env
   PORT=5001
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/lumen
   JWT_SECRET=your_jwt_secret
   SARVAM_API_URL=https://api.sarvam.ai/v1/chat/completions
   SARVAM_MODEL=sarvam-105b-conversations
   SARVAM_AI_API_KEY=your_sarvam_api_key
   ```

   Frontend `.env.local` file:
   ```env
   NEXT_PUBLIC_BACKEND_URL=http://localhost:5001
   ```

5. **Start the backend server**
   ```bash
   cd luman-flashcard-devin
   npm start
   ```

6. **Start the frontend development server**
   ```bash
   cd luman/Lumen
   npm run dev
   ```

7. **Open your browser**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:5001/api

## Usage

### Quiz Feature
1. Navigate to `/dashboard/quiz`
2. Enter a topic you want to learn about
3. Answer AI-generated questions
4. Review your performance with detailed analysis

### Memory Palace RPG
1. Navigate to `/dashboard/memory-palace`
2. Enter a topic for your adventure
3. Explore dungeons and fight enemies
4. Use quiz answers as "Knowledge Attacks" for bonus damage
5. Level up and progress through increasingly difficult dungeons

### Flashcards
1. Navigate to `/dashboard/flashcards`
2. Generate flashcards from any topic
3. Study using spaced repetition
4. Track your progress

## API Endpoints

### Quiz
- `POST /api/quiz/generate` - Generate quiz questions for a topic

### Memory Palace
- `POST /api/memory-palace/generate` - Generate dungeon content and questions

### Flashcards
- `POST /api/flashcards/generate` - Generate flashcards from content

### Dashboard
- `GET /api/dashboard/stats` - Get user statistics
- `POST /api/dashboard/ask` - Ask AI tutor a question

## Development

### Project Structure

```
luman/
├── Lumen/                 # Frontend (Next.js)
│   ├── app/
│   │   ├── dashboard/     # Feature pages
│   │   ├── globals.css    # Global styles
│   │   └── layout.tsx     # Root layout
│   ├── components/        # Reusable components
│   └── utils/            # Utility functions
└── luman-flashcard-devin/ # Backend (Express)
    ├── controllers/      # Route handlers
    ├── routes/          # API routes
    ├── config/          # Database configuration
    └── server.js        # Entry point
```

### Key Files

- `Lumen/app/dashboard/quiz/page.tsx` - Quiz feature
- `Lumen/app/dashboard/memory-palace/page.tsx` - Memory Palace RPG
- `luman-flashcard-devin/controllers/quizController.js` - Quiz API logic
- `luman-flashcard-devin/controllers/memoryPalaceController.js` - Memory Palace API logic

## Features Status

- ✅ Flashcards - Active
- ✅ Quiz - Active (SARVAM AI-powered)
- ✅ Memory Palace RPG - Active (SARVAM AI-powered)
- ✅ AI Tutor - Active
- ✅ Mind Map - Active
- ✅ Authentication - Active

## Contributors

- **Aditya Banerjee** - Frontend development and UI design, including animations and user experience
- **Aryan Fursule** - Flashcards and Mind Maps development
- **Abhishek Mishra** - MongoDB database design and complete backend infrastructure

## Contributing

This project uses Next.js 16.3.4 with breaking changes from standard Next.js. Always check the relevant documentation in `node_modules/next/dist/docs/` before making changes.

## License

This project is proprietary and confidential.

## Support

For issues or questions, please contact the development team.