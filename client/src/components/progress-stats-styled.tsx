import { useQuery } from "@tanstack/react-query";

interface UserStats {
  dayStreak: number;
  totalRecordings: number;
  totalCompletedTasks: number;
}

export function ProgressStats() {
  const { data: stats } = useQuery<UserStats>({
    queryKey: ["/api/user-stats"],
  });

  if (!stats) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '15px'
      }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            textAlign: 'center',
            padding: '15px',
            background: '#f8f9fa',
            borderRadius: '12px'
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: 600,
              color: '#667eea',
              marginBottom: '5px'
            }}>
              -
            </div>
            <div style={{
              fontSize: '12px',
              color: '#666',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Loading
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '15px'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '15px',
        background: '#f8f9fa',
        borderRadius: '12px'
      }}>
        <div style={{
          fontSize: '24px',
          fontWeight: 600,
          color: '#667eea',
          marginBottom: '5px'
        }}>
          {stats.dayStreak}
        </div>
        <div style={{
          fontSize: '12px',
          color: '#666',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Day Streak
        </div>
      </div>

      <div style={{
        textAlign: 'center',
        padding: '15px',
        background: '#f8f9fa',
        borderRadius: '12px'
      }}>
        <div style={{
          fontSize: '24px',
          fontWeight: 600,
          color: '#667eea',
          marginBottom: '5px'
        }}>
          {stats.totalRecordings}
        </div>
        <div style={{
          fontSize: '12px',
          color: '#666',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Entries
        </div>
      </div>

      <div style={{
        textAlign: 'center',
        padding: '15px',
        background: '#f8f9fa',
        borderRadius: '12px'
      }}>
        <div style={{
          fontSize: '24px',
          fontWeight: 600,
          color: '#667eea',
          marginBottom: '5px'
        }}>
          {stats.totalCompletedTasks}
        </div>
        <div style={{
          fontSize: '12px',
          color: '#666',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Tasks Done
        </div>
      </div>
    </div>
  );
}