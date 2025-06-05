import { useQuery } from "@tanstack/react-query";
import { DailyMessage } from "@/components/daily-message";
import { VoiceRecording } from "@/components/voice-recording-styled";
import { DailyTasks } from "@/components/daily-tasks-styled";
import { MoodSelector } from "@/components/mood-selector-styled";
import { MoodHistory } from "@/components/mood-history";
import { DailyNotes } from "@/components/daily-notes-styled";
import { DailyGratitude } from "@/components/daily-gratitude-styled";
import { DailyReflection } from "@/components/daily-reflection";
import { ProgressStats } from "@/components/progress-stats-styled";
import { TimeTracker } from "@/components/time-tracker-styled";
import { useDailyReset } from "@/hooks/use-daily-reset";

interface SunData {
  sunrise: {
    time: string;
    formatted: string;
  };
  sunset: {
    time: string;
    formatted: string;
  };
}

const cardStyle = {
  background: 'white',
  borderRadius: '20px',
  padding: '25px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
};

const cardHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  marginBottom: '20px'
};

const cardIconStyle = {
  fontSize: '20px',
  marginRight: '12px'
};

const cardTitleStyle = {
  fontSize: '18px',
  fontWeight: 600,
  color: '#333',
  margin: 0
};

const cardSubtitleStyle = {
  fontSize: '14px',
  color: '#666',
  marginLeft: 'auto'
};

export default function Home() {
  // Initialize daily reset functionality
  useDailyReset();

  const { data: sunData } = useQuery<SunData>({
    queryKey: ["/api/sunrise"],
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  const getCurrentGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning!";
    if (hour < 17) return "Good afternoon!";
    return "Good evening!";
  };

  const getCurrentDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: '#333'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px'
      }}>
        {/* Header */}
        <header style={{
          textAlign: 'center',
          marginBottom: '40px',
          color: 'white'
        }}>
          <div style={{
            fontSize: '14px',
            opacity: 0.9,
            marginBottom: '10px'
          }}>
            {getCurrentDate()} • {getCurrentTime()} • Alpharetta, GA
          </div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 300,
            marginBottom: '20px',
            margin: 0
          }}>
            {getCurrentGreeting()} ✨
          </h1>
        </header>

        {/* Daily Inspiration */}
        <section style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '30px',
          marginBottom: '30px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <DailyMessage />
        </section>

        {/* Main Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '20px',
          marginBottom: '30px'
        }}>
          {/* Brain Dump (Voice Recording) */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <span style={cardIconStyle}>🧠</span>
              <h2 style={cardTitleStyle}>Brain Dump</h2>
            </div>
            <VoiceRecording />
          </div>

          {/* Today's Focus */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <span style={cardIconStyle}>🎯</span>
              <h2 style={cardTitleStyle}>Today's Focus</h2>
            </div>
            <DailyTasks />
          </div>

          {/* Mood Tracker */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <span style={cardIconStyle}>😊</span>
              <h2 style={cardTitleStyle}>How are you feeling?</h2>
            </div>
            <MoodSelector />
          </div>
        </div>

        {/* Time Tracking Section */}
        <section style={{ marginBottom: '30px' }}>
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <span style={cardIconStyle}>⏰</span>
              <h2 style={cardTitleStyle}>Time Tracker</h2>
            </div>
            <TimeTracker />
          </div>
        </section>

        {/* Bottom Section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '20px',
          marginBottom: '30px'
        }}>
          {/* Daily Notes */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <span style={cardIconStyle}>📝</span>
              <h2 style={cardTitleStyle}>Daily Notes</h2>
              <span style={cardSubtitleStyle}>Capture your thoughts</span>
            </div>
            <DailyNotes />
          </div>

          {/* Progress & Gratitude */}
          <div style={{
            ...cardStyle,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={cardHeaderStyle}>
                <span style={cardIconStyle}>🌟</span>
                <h2 style={cardTitleStyle}>Today's Gratitude</h2>
              </div>
              <DailyGratitude />
            </div>
            
            <div style={{ marginTop: '20px' }}>
              <ProgressStats />
            </div>
          </div>
        </div>

        {/* End of Day Reflection */}
        <section style={cardStyle}>
          <div style={cardHeaderStyle}>
            <span style={cardIconStyle}>🌙</span>
            <h2 style={cardTitleStyle}>End of Day Reflection</h2>
            <span style={cardSubtitleStyle}>Share how your day went</span>
          </div>
          <DailyReflection />
        </section>

        {/* Mood History */}
        <div style={{ marginTop: '30px' }}>
          <MoodHistory />
        </div>
      </div>


    </div>
  );
}