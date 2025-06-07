# Sunrise Insights

A comprehensive personal growth and daily reflection application that transforms productivity tracking through intelligent, AI-powered insights and time management tools.

## Overview

Sunrise Insights is a full-stack web application designed to help users track their daily wellness journey through multiple data points including brain dumps, gratitude entries, mood tracking, task management, and end-of-day reflections. The app features an AI-powered "Today's Summary" that aggregates all daily inputs to provide intelligent insights about your day.

## Features

### 🌅 Daily Dashboard
- **Sunrise/Sunset Times**: Automatically calculated for Alpharetta, GA
- **Weather Integration**: Current conditions and temperature
- **Daily Motivational Messages**: AI-generated inspirational quotes

### 📝 Daily Tracking
- **Brain Dump Notes**: Capture thoughts and ideas with AI-powered summaries
- **Gratitude Journal**: Daily gratitude entries with search functionality  
- **Voice Recordings**: Audio transcription and AI summarization
- **Mood Tracking**: Log emotions with emoji support and analysis

### ✅ Task & Habit Management
- **Today's Focus**: Separate Tasks and Habits sections (3 items max each)
- **Interactive Management**: Click-to-edit functionality with custom icons
- **Daily Reset**: Automatically resets at midnight Eastern Time
- **Progress Tracking**: Mark items as completed throughout the day

### 📊 Time & Reflection
- **Time Logging**: Track activities throughout the day with summaries
- **Daily Reflections**: End-of-day voice recordings with AI insights
- **Mood Analysis**: AI-powered mood journey analysis over time

### 🤖 AI-Powered Insights
- **Today's Summary**: Comprehensive daily overview combining all data sources
- **Smart Analysis**: AI generates insights about productivity, mood, and patterns
- **Action Items**: Extracted from notes and reflections
- **Personal Voice**: First-person summaries ("I accomplished..." vs "You accomplished...")

## Technology Stack

- **Frontend**: React with TypeScript, Tailwind CSS
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: OpenAI GPT-4o for text analysis and generation
- **External APIs**: Weather data integration
- **UI Components**: Radix UI with shadcn/ui styling
- **State Management**: TanStack Query for server state

## Installation

### Prerequisites
- Node.js 18 or higher
- PostgreSQL database
- OpenAI API key

### Environment Variables
Create a `.env` file in the root directory:

```env
DATABASE_URL=your_postgresql_connection_string
OPENAI_API_KEY=your_openai_api_key
SESSION_SECRET=your_session_secret_key
```

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/githubuser20152014/SunriseInsights.git
   cd SunriseInsights
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup the database**
   ```bash
   # Push the schema to your database
   npm run db:push
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   Open your browser and navigate to `http://localhost:5000`

## Database Schema

The application uses the following main tables:
- `users` - User accounts and authentication
- `daily_tasks` - Tasks and habits with type separation
- `daily_notes` - Brain dump entries with AI summaries
- `daily_gratitude` - Gratitude journal entries
- `moods` - Mood tracking with timestamps
- `voice_recordings` - Audio transcriptions and summaries
- `daily_reflections` - End-of-day reflection recordings
- `time_log` - Time tracking entries
- `daily_summaries` - AI-generated daily insights

## Usage

### Getting Started
1. The app automatically shows today's information on the main dashboard
2. Use the various sections to log different aspects of your day
3. Check "Today's Summary" for AI-powered insights about your progress

### Daily Workflow
1. **Morning**: Check weather, sunrise time, and motivational message
2. **Throughout the Day**: 
   - Add tasks and habits to Today's Focus
   - Log brain dumps and gratitude entries
   - Track mood and time spent on activities
3. **Evening**: Record daily reflections and review AI-generated summary

### Data Management
- All data is automatically saved as you interact with the app
- Use search functionality to find past notes and gratitude entries
- View historical mood analysis and daily summaries

## API Endpoints

The application provides a RESTful API for all functionality:

- `GET /api/sunrise` - Sun times for Alpharetta, GA
- `GET /api/weather` - Current weather conditions
- `GET /api/daily-message` - AI-generated motivational message
- `POST /api/voice-recordings` - Upload and transcribe audio
- `GET/POST /api/daily-tasks` - Task and habit management
- `GET/POST /api/daily-notes` - Brain dump entries
- `GET/POST /api/daily-gratitude` - Gratitude journal
- `GET/POST /api/moods` - Mood tracking
- `GET/POST /api/time-log` - Time logging
- `GET/POST /api/daily-reflections` - Daily reflections
- `GET /api/daily-summary` - AI-generated daily insights

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support or questions, please open an issue in the GitHub repository.