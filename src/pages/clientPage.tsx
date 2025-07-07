import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronRightIcon, ChevronLeftIcon } from "lucide-react";
import { Card, CardHeader, CardDescription, CardTitle, CardContent } from "@/components/ui/card"
import { PercentIcon, CalendarIcon, ClockIcon, BarChartIcon, CheckIcon, XIcon } from "lucide-react"
import { useParams, useNavigate } from 'react-router-dom';
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import '../styles/clientPage.css';

interface Client {
  id: string;
  name: string;
  initials: string;
  email?: string;
  phone?: string;
  image?: string;
  location?: string;
  schedule: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
  };
  attendance?: {
    [date: string]: {
      attended: boolean;
      hours: number;
    };
  };
  paymentStatus?: {
    [month: string]: "Paid" | "Unpaid";
  };
}

interface AttendanceSummary {
  weekRange: string;
  monthName: string;
  daysScheduled: number;
  daysAttended: number;
  attendancePercentage: number;
  totalHours: number;
}

interface CalendarDay {
  date: Date;
  dateStr: string;
  dayNumber: number;
  dayName: string;
  attended: boolean;
  hours: number;
  isScheduled: boolean;
}

export default function ClientPage() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));
  const [summary, setSummary] = useState<AttendanceSummary>({
    weekRange: '',
    monthName: '',
    daysScheduled: 0,
    daysAttended: 0,
    attendancePercentage: 0,
    totalHours: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [schedule, setSchedule] = useState({
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
  });

  // Get the start of the week (Monday)
  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }

  // Get week range string
  function getWeekRange(startDate: Date): string {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const start = startDate.toLocaleDateString('en-US', options);
    const end = endDate.toLocaleDateString('en-US', options);
    
    return `${start} - ${end}`;
  }

  // Get month name from current week
  function getMonthName(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  // Calculate monthly attendance statistics
  function calculateMonthlyStats(client: Client, currentWeek: Date): AttendanceSummary {
    const monthStart = new Date(currentWeek.getFullYear(), currentWeek.getMonth(), 1);
    const monthEnd = new Date(currentWeek.getFullYear(), currentWeek.getMonth() + 1, 0);
    
    let daysScheduled = 0;
    let daysAttended = 0;
    let totalHours = 0;
    
    const clientSchedule = client.schedule || {};

    // Iterate through all days in the month
    for (let date = new Date(monthStart); date <= monthEnd; date.setDate(date.getDate() + 1)) {
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      
      if (clientSchedule[dayName as keyof typeof clientSchedule]) {
        daysScheduled++;
        
        const dateStr = date.toISOString().split('T')[0];
        const attendanceRecord = client.attendance?.[dateStr];
        
        if (attendanceRecord?.attended) {
          daysAttended++;
          totalHours += attendanceRecord.hours;
        }
      }
    }
    
    return {
      weekRange: getWeekRange(currentWeek),
      monthName: getMonthName(currentWeek),
      daysScheduled,
      daysAttended,
      attendancePercentage: daysScheduled ? Math.round((daysAttended / daysScheduled) * 100) : 0,
      totalHours
    };
  }

  useEffect(() => {
    const loadClient = () => {
      const savedClients = JSON.parse(localStorage.getItem('clients') || '[]');
      const foundClient = savedClients.find((c: Client) => c.id === clientId);
      
      if (foundClient) {
        setClient(foundClient);
        if (foundClient.schedule) {
          setSchedule(foundClient.schedule);
        }
      } else {
        navigate('/dashboard');
      }
      setIsLoading(false);
    };

    loadClient();
  }, [clientId, navigate]);

  // Calculate attendance summary for current month
  useEffect(() => {
    if (!client) return;

    const monthlyStats = calculateMonthlyStats(client, currentWeekStart);
    setSummary(monthlyStats);
  }, [client, currentWeekStart]);

  // Generate 7 days of the current week
  const generateWeekDays = (): CalendarDay[] => {
    const days: CalendarDay[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      
      const dateStr = date.toISOString().split('T')[0];
      const attendanceRecord = client?.attendance?.[dateStr];
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
      
      const isScheduled = client?.schedule?.[dayName as keyof typeof client.schedule] || false;
      
      days.push({
        date,
        dateStr,
        dayNumber: date.getDate(),
        dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
        attended: attendanceRecord?.attended || false,
        hours: attendanceRecord?.hours || 0,
        isScheduled
      });
    }
    
    return days;
  };

  const weekDays = generateWeekDays();

  // Handle attendance click
  const handleAttendanceClick = (day: CalendarDay) => {
    if (!day.isScheduled || !client) return;

    const updatedClient = { ...client };
    if (!updatedClient.attendance) {
      updatedClient.attendance = {};
    }

    const currentRecord = updatedClient.attendance[day.dateStr];
    
    if (!currentRecord || !currentRecord.attended) {
      // Mark as attended with default 2 hours
      updatedClient.attendance[day.dateStr] = {
        attended: true,
        hours: 2
      };
    } else {
      // Cycle through hours: 2 -> 3 -> absent
      if (currentRecord.hours === 2) {
        updatedClient.attendance[day.dateStr] = {
          attended: true,
          hours: 3
        };
      } else {
        // Mark as absent
        updatedClient.attendance[day.dateStr] = {
          attended: false,
          hours: 0
        };
      }
    }

    // Save to localStorage
    const savedClients = JSON.parse(localStorage.getItem('clients') || '[]');
    const clientIndex = savedClients.findIndex((c: Client) => c.id === client.id);
    if (clientIndex !== -1) {
      savedClients[clientIndex] = updatedClient;
      localStorage.setItem('clients', JSON.stringify(savedClients));
    }

    setClient(updatedClient);
  };

  // Handle schedule change
  const handleScheduleChange = (day: keyof typeof schedule) => {
    if (!client) return;

    const newSchedule = {
      ...schedule,
      [day]: !schedule[day]
    };
    setSchedule(newSchedule);

    const updatedClient = { ...client, schedule: newSchedule };

    // Save to localStorage
    const savedClients = JSON.parse(localStorage.getItem('clients') || '[]');
    const clientIndex = savedClients.findIndex((c: Client) => c.id === client.id);
    if (clientIndex !== -1) {
      savedClients[clientIndex] = updatedClient;
      localStorage.setItem('clients', JSON.stringify(savedClients));
    }

    setClient(updatedClient);
  };

  const handlePayment = () => {
    if (!client) return;

    const month = getMonthName(currentWeekStart);
    const updatedClient = { ...client };

    if (!updatedClient.paymentStatus) {
      updatedClient.paymentStatus = {};
    }

    updatedClient.paymentStatus[month] = "Paid";

    // Save to localStorage
    const savedClients = JSON.parse(localStorage.getItem('clients') || '[]');
    const clientIndex = savedClients.findIndex((c: Client) => c.id === client.id);
    if (clientIndex !== -1) {
      savedClients[clientIndex] = updatedClient;
      localStorage.setItem('clients', JSON.stringify(savedClients));
    }

    setClient(updatedClient);
  };

  // Navigate weeks
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newWeekStart);
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(getWeekStart(new Date()));
  };

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

  const isCurrentWeek = getWeekRange(currentWeekStart) === getWeekRange(getWeekStart(new Date()));

  return (
    <div className="client-page-container">
      <header className="client-header">
        <h1 className="client-title">{client.name}'s Attendance</h1>
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </header>

      {/* Schedule Configuration */}
      <Card className="schedule-config">
        <CardHeader>
          <CardTitle>Schedule Configuration</CardTitle>
          <CardDescription>Select the days this client is scheduled to attend.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="schedule-grid">
            {Object.entries(schedule).map(([day, checked]) => (
              <div key={day} className="schedule-item" onClick={() => handleScheduleChange(day as keyof typeof schedule)}>
                <Checkbox
                  id={`schedule-${day}`}
                  checked={checked}
                  onCheckedChange={() => handleScheduleChange(day as keyof typeof schedule)}
                  className="schedule-checkbox"
                />
                <Label htmlFor={`schedule-${day}`} className="schedule-label">
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
            <p className="stat-time-period">{summary.monthName}</p>
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
            <p className="stat-time-period">Scheduled days in {summary.monthName}</p>
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
            <p className="stat-time-period">{summary.monthName}</p>
          </CardContent>
        </Card>
      </div>

      <div className="calendar-section">
        <div className="calendar-header">
          <div className="week-navigation">
            <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <h2 className="calendar-title">{summary.weekRange}</h2>
            <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
          {!isCurrentWeek && (
            <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
              Current Week
            </Button>
          )}
        </div>

        <div className="week-grid">
          {weekDays.map((day, index) => (
            day ? (
              <Card
                key={index}
                className={`calendar-day ${
                  !day.isScheduled 
                    ? "calendar-day-unscheduled" 
                    : day.attended 
                      ? "calendar-day-attended" 
                      : "calendar-day-absent"
                } ${day.isScheduled ? "calendar-day-clickable" : ""}`}
                onClick={() => handleAttendanceClick(day)}
              >
                <CardContent className="calendar-day-content">
                  <div className="calendar-day-header">
                    <span className="calendar-day-number">{day.dayNumber}</span>
                    <span className="calendar-day-name">{day.dayName}</span>
                  </div>
                  <div className="calendar-day-status">
                    {!day.isScheduled ? (
                      <span className="unscheduled-text">Not scheduled</span>
                    ) : (
                      <>
                        <div
                          className={`status-indicator ${
                            day.attended
                              ? "status-indicator-attended"
                              : "status-indicator-absent"
                          }`}
                        >
                          {day.attended ? (
                            <CheckIcon className="h-3 w-3 text-white" />
                          ) : (
                            <XIcon className="h-3 w-3 text-white" />
                          )}
                        </div>
                        {day.attended ? (
                          <span>{day.hours} hours</span>
                        ) : (
                          <span>Absent</span>
                        )}
                      </>
                    )}
                  </div>
                  {day.isScheduled && (
                    <div className="click-hint">
                      Click to toggle
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div key={index} className="calendar-day-empty" />
            )
          ))}
        </div>
      </div>

      <div className="attendance-instructions">
        <Card>
          <CardContent className="instruction-content">
            <h3>How to track attendance:</h3>
            <ul>
              <li>Click on a scheduled day to mark as attended (2 hours)</li>
              <li>Click again to change to 3 hours</li>
              <li>Click once more to mark as absent</li>
              <li>Only scheduled days can be clicked</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="action-buttons">
        <Button variant="outline">
          <BarChartIcon className="mr-2 h-4 w-4" />
          Generate Report
        </Button>
        <Button onClick={handlePayment} disabled={client.paymentStatus && client.paymentStatus[summary.monthName] === "Paid"}>
          <CheckIcon className="mr-2 h-4 w-4" />
          Mark as Paid
        </Button>
      </div>
    </div>
  );
}