# Sunrise Insights

A comprehensive personal growth and daily reflection application that transforms productivity tracking through intelligent, AI-powered insights and engaging user experience design.

## Overview

Sunrise Insights is a full-stack web application designed to help users track their daily wellness journey through multiple data points including brain dumps, gratitude entries, mood tracking, task management, time logging, and end-of-day reflections. The app features an AI-powered "Today's Summary" that aggregates all daily inputs to provide intelligent insights about your day.

## Key Features

### 🌅 Daily Dashboard
- **Sunrise/Sunset Times**: Automatically calculated for Alpharetta, GA
- **Weather Integration**: Current conditions and temperature  
- **Daily Motivational Messages**: AI-generated inspirational quotes
- **Responsive Design**: Mobile-first approach with adaptive layouts

### 📝 Core Daily Activities
- **Today's Focus**: Organized task management with three categories:
  - Tasks (3 max) - Daily action items with completion tracking
  - Habits (3 max) - Recurring behaviors to build consistency
  - Learn (1 max) - Learning goals and educational activities
- **Daily Notes**: Brain dump space for thoughts, ideas, and important moments
- **Mood Tracking**: Comprehensive emotion logging with 9 mood states and emoji support

### 📊 Reflection & Growth
- **Gratitude Journal**: Daily gratitude entries with search functionality
- **Mood History**: AI-powered mood journey analysis over time with insights
- **Voice Recordings**: Audio transcription and AI summarization
- **Daily Reflections**: End-of-day voice recordings with AI insights

### ⏰ Time & Content Management
- **Time Tracker**: Log activities throughout the day (5 AM - 10 PM in 30-min slots)
- **AI Time Summaries**: Intelligent analysis of time allocation and productivity patterns
- **Scrapbook**: Store and organize interesting content from the web
  - Direct image paste functionality (Ctrl+V workflow)
  - Tag management and search capabilities
  - Combined text, links, and images in single entries

### 🤖 AI-Powered Insights
- **Today's Summary**: Comprehensive daily overview combining all data sources
- **First-Person Analysis**: Personal voice using "I" statements for better connection
- **Smart Summaries**: AI generates insights about productivity, mood, and patterns
- **Action Items**: Extracted from notes and reflections
- **Contextual Intelligence**: Analyzes patterns across multiple data points

### 🎨 Enhanced User Experience
- **Glass-Card Design**: Modern frosted glass aesthetic with warm gradients
- **Hover Effects**: Subtle lift animations and smooth transitions
- **Mobile Responsive**: Optimized 3-column grid layout that adapts to screen sizes
- **Content Hierarchy**: Clear section organization with elegant dividers
- **Accessibility**: Focus states, keyboard navigation, and screen reader support

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

## Recent Updates

### Version 2.1 - Enhanced UX & Layout Improvements
- **Reorganized Layout**: Today's Focus and Daily Notes now positioned side by side for better workflow
- **Improved Mood Tracking**: Dedicated space below main cards for cleaner visual hierarchy
- **Fixed UI Issues**: Resolved Learn section radio button display problems
- **Time Tracker Enhancement**: AI summaries now collapsed by default, expandable on demand
- **Content Organization**: Clear section dividers separating Core Activities → Reflection & Growth → Time & Content → Day Wrap-up

### Version 2.0 - Scrapbook & Advanced Features
- **Scrapbook Module**: Complete content management system with direct image paste
- **Tag System**: Comprehensive tagging and search functionality for all stored content
- **Enhanced AI**: First-person voice in all AI-generated summaries and insights
- **Mobile Optimization**: Responsive 3-column grid that adapts to all screen sizes
- **Glass Design**: Modern frosted glass cards with subtle hover animations

## Database Schema

The application uses the following main tables:
- `users` - User accounts and authentication
- `daily_tasks` - Tasks, habits, and learning goals with type separation
- `daily_notes` - Brain dump entries with AI summaries and search
- `daily_gratitude` - Gratitude journal entries with search functionality
- `moods` - Comprehensive mood tracking with 9 emotional states
- `mood_analyses` - AI-generated mood insights and pattern analysis
- `voice_recordings` - Audio transcriptions and AI summaries
- `daily_reflections` - End-of-day reflection recordings
- `time_log` - Time tracking entries (5 AM - 10 PM in 30-min slots)
- `time_log_summary` - AI-generated time allocation insights
- `daily_summaries` - Comprehensive AI-generated daily insights
- `scrapbook` - Content storage with image support and tag management
- `user_stats` - User engagement and streak tracking

## Usage Guide

### Getting Started
1. The dashboard automatically displays today's information including weather and sunrise times
2. Use the organized sections to track different aspects of your day
3. AI-powered insights provide personalized analysis of your daily patterns

### Optimal Daily Workflow

#### Morning Routine
- Check weather conditions and sunrise/sunset times
- Read the AI-generated motivational message
- Set up Today's Focus with tasks, habits, and learning goals (max 3, 3, 1 respectively)

#### Throughout the Day
- Log thoughts and ideas in Daily Notes for continuous brain dumping
- Track emotional state using the comprehensive mood selector
- Record time allocation in 30-minute increments for detailed productivity analysis
- Add interesting content to Scrapbook with tags for future reference

#### Evening Reflection
- Complete gratitude journal entries
- Record voice reflections about the day's experiences
- Review AI-generated mood analysis and time allocation insights
- Check comprehensive daily summary for patterns and actionable insights

### Advanced Features
- **Search Functionality**: Find past notes and gratitude entries across all historical data
- **Mood Journey**: View AI-powered analysis of emotional patterns over time
- **Time Intelligence**: Get productivity insights and recommendations based on activity patterns
- **Content Curation**: Organize web content with tags and visual previews in Scrapbook
- **Voice Integration**: Audio transcription with intelligent summarization

## API Endpoints

The application provides a comprehensive RESTful API:

### Dashboard & Weather
- `GET /api/sunrise` - Sunrise/sunset times for Alpharetta, GA
- `GET /api/weather` - Current weather conditions and forecasts
- `GET /api/daily-message` - AI-generated motivational messages

### Task & Habit Management
- `GET /api/daily-tasks` - Retrieve tasks, habits, and learning goals
- `POST /api/daily-tasks` - Create new tasks/habits/learning items
- `PUT /api/daily-tasks/:id` - Update task completion or content
- `DELETE /api/daily-tasks/:id` - Remove tasks

### Notes & Gratitude
- `GET /api/daily-notes` - Retrieve daily brain dump entries
- `POST /api/daily-notes` - Save daily notes with AI summarization
- `GET /api/search-notes` - Search historical notes
- `GET /api/daily-gratitude` - Retrieve gratitude entries
- `POST /api/daily-gratitude` - Save gratitude with search indexing
- `GET /api/search-gratitude` - Search gratitude history

### Mood & Analysis
- `GET /api/moods` - Retrieve mood entries
- `POST /api/moods` - Log emotional state
- `GET /api/mood-analysis` - Get AI mood insights for specific date
- `GET /api/mood-analysis-history` - Historical mood analysis

### Time Tracking
- `GET /api/time-log` - Retrieve time entries for date
- `POST /api/time-log` - Log time slot activities
- `PUT /api/time-log/:id` - Update time entry
- `DELETE /api/time-log/:id` - Remove time entry
- `GET /api/time-log-summary` - AI time allocation analysis
- `POST /api/generate-time-summary` - Generate AI time insights

### Voice & Reflections
- `POST /api/voice-recordings` - Upload and transcribe audio
- `GET /api/voice-recordings` - Retrieve voice transcriptions
- `GET /api/daily-reflections` - End-of-day reflection entries
- `POST /api/daily-reflections` - Save reflection recordings

### Scrapbook & Content
- `GET /api/scrapbook` - Retrieve scrapbook entries
- `POST /api/scrapbook` - Create new scrapbook entry with images/text/links
- `GET /api/scrapbook/tags` - Get all available tags
- `PUT /api/scrapbook/:id/tags` - Update entry tags
- `DELETE /api/scrapbook/:id` - Remove scrapbook entry

### Daily Insights
- `GET /api/daily-summary` - Comprehensive AI-generated daily overview
- `GET /api/daily-summary-history` - Historical daily summaries

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