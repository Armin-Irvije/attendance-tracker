// src/components/DailyAttendance.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DailyAttendanceProps {
  clients: any[];
}

const DailyAttendance = ({ clients }: DailyAttendanceProps) => {
  const today = new Date().toISOString().split('T')[0];
  // Map location to array of client names
  const attendance: Record<string, string[]> = {};

  clients.forEach(client => {
    if (client.attendance && client.attendance[today]?.attended) {
      const location = client.location || 'Unknown';
      if (!attendance[location]) {
        attendance[location] = [];
      }
      attendance[location].push(client.name);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Attendance</CardTitle>
      </CardHeader>
      <CardContent>
        {Object.keys(attendance).length > 0 ? (
          <ul>
            {Object.entries(attendance).map(([location, names]) => (
              <li key={location} style={{ marginBottom: '0.5em' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75em' }}>
                  <strong>{location}:</strong>
                  <span>{names.length}</span>
                  <span style={{ fontSize: '0.95em', color: '#64748b' }}>{names.join(', ')}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No attendance recorded for today.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyAttendance;