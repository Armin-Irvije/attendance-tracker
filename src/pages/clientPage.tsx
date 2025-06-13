import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronRightIcon } from "lucide-react";
import { Card, CardHeader, CardDescription, CardTitle, CardContent } from "@/components/ui/card"
import { PercentIcon, CalendarIcon, ClockIcon, BarChartIcon } from "lucide-react"
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/clientPage.css';

interface Client {
  id: string;
  name: string;
  initials: string;
  email?: string;
  phone?: string;
  image?: string;
  schedule: Record<string, boolean>;
  attendance?: {
    [date: string]: {
      attended: boolean;
      hours: number;
    };
  };
}

interface AttendanceSummary {
  month: string;
  daysScheduled: number;
  daysAttended: number;
  attendancePercentage: number;
  totalHours: number;
}

export default function ClientPage() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [summary, setSummary] = useState<AttendanceSummary>({
    month: new Date().toLocaleString('default', { month: 'long' }),
    daysScheduled: 0,
    daysAttended: 0,
    attendancePercentage: 0,
    totalHours: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadClient = () => {
      const savedClients = JSON.parse(localStorage.getItem('clients') || '[]');
      const foundClient = savedClients.find((c: Client) => c.id === clientId);
      
      if (foundClient) {
        setClient(foundClient);
        
        // Calculate attendance summary from actual attendance data
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        // Get all attendance records for the current month
        const monthAttendance = Object.entries(foundClient.attendance || {}).filter(([date]) => {
          const [year, month] = date.split('-').map(Number);
          return year === currentYear && month === currentMonth + 1;
        });

        const daysScheduled = monthAttendance.length;
        const daysAttended = monthAttendance.filter(([_, record]) => 
          (record as { attended: boolean; hours: number }).attended
        ).length;
        const totalHours = monthAttendance.reduce((sum, [_, record]) => {
          const r = record as { attended: boolean; hours: number };
          return sum + (r.attended ? r.hours : 0);
        }, 0);
        
        setSummary({
          month: new Date().toLocaleString('default', { month: 'long' }),
          daysScheduled,
          daysAttended,
          attendancePercentage: daysScheduled ? Math.round((daysAttended / daysScheduled) * 100) : 0,
          totalHours
        });
      } else {
        navigate('/dashboard'); // Redirect if client not found
      }
      setIsLoading(false);
    };

    loadClient();
  }, [clientId, navigate]);

  // Generate calendar days for the current month (weekdays only)
  const generateCalendarDays = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const days = [];
    for (let i = 1; i <= Math.min(daysInMonth, 14); i++) {
      const date = new Date(currentYear, currentMonth, i);
      const dayOfWeek = date.getDay();

      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const attendanceRecord = client?.attendance?.[dateStr];
        
        days.push({
          date: i,
          attended: attendanceRecord?.attended || false,
          hours: attendanceRecord?.hours || 0,
          dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
        });
      }
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading client data...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return null;
  }

  return (
    <div className="client-page-container">
      <header className="client-header">
        <h1 className="client-title">{client.name}'s Attendance</h1>
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </header>

      <div className="stats-grid">
        <Card className="stat-card">
          <CardHeader className="stat-card-header">
            <CardDescription className="stat-card-description">
              Attendance Rate
            </CardDescription>
            <CardTitle className="stat-card-title">
              {summary.attendancePercentage}%
              <PercentIcon className="h-5 w-5 ml-2 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="stat-card-content">
            <p className="stat-time-period">This month</p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="stat-card-header">
            <CardDescription className="stat-card-description">
              Days Attended
            </CardDescription>
            <CardTitle className="stat-card-title">
              {summary.daysAttended}/{summary.daysScheduled}
              <CalendarIcon className="h-5 w-5 ml-2 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="stat-card-content">
            <p className="stat-time-period">Weekdays this month</p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="stat-card-header">
            <CardDescription className="stat-card-description">
              Total Hours
            </CardDescription>
            <CardTitle className="stat-card-title">
              {summary.totalHours}
              <ClockIcon className="h-5 w-5 ml-2 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="stat-card-content">
            <p className="stat-time-period">This month</p>
          </CardContent>
        </Card>
      </div>

      <div className="calendar-section">
        <div className="calendar-header">
          <h2 className="calendar-title">{summary.month} {new Date().getFullYear()}</h2>
          <Button variant="outline" size="sm">
            View Full Calendar
            <ChevronRightIcon className="ml-1 h-4 w-4" />
          </Button>
        </div>

        <div className="calendar-grid">
          {calendarDays.map((day, index) => (
            <Card
              key={index}
              className={`calendar-day ${
                day.attended ? "calendar-day-attended" : "calendar-day-absent"
              }`}
            >
              <CardContent className="calendar-day-content">
                <div className="calendar-day-header">
                  <span className="calendar-day-number">{day.date}</span>
                  <span className="calendar-day-name">{day.dayName}</span>
                </div>
                <div className="calendar-day-status">
                  <div
                    className={`status-indicator ${
                      day.attended
                        ? "status-indicator-attended"
                        : "status-indicator-absent"
                    }`}
                  ></div>
                  {day.attended ? (
                    <span>{day.hours} hours</span>
                  ) : (
                    <span>Absent</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="action-buttons">
        <Button>
          <CalendarIcon className="mr-2 h-4 w-4" />
          Record Attendance
        </Button>
        <Button variant="outline">
          <BarChartIcon className="mr-2 h-4 w-4" />
          Generate Report
        </Button>
      </div>
    </div>
  );
}
