// src/components/DailyAttendance.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DailyAttendanceProps {
  clients: any[];
}

const DailyAttendance = ({ clients }: DailyAttendanceProps) => {
  const today = new Date().toISOString().split('T')[0];
  const attendance: Record<string, number> = {};

  clients.forEach(client => {
    if (client.attendance && client.attendance[today]?.attended) {
      const location = client.location || 'Unknown';
      if (!attendance[location]) {
        attendance[location] = 0;
      }
      attendance[location]++;
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
            {Object.entries(attendance).map(([location, count]) => (
              <li key={location}>
                {location}: {count}
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