import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XIcon, DownloadIcon, FileTextIcon } from "lucide-react";
import { supabaseHelpers } from '../supabase-client.js';
import { toast } from "sonner";
import './AttendanceReport.css';

interface AttendanceRecord {
  id: string;
  clientId: string;
  clientName: string;
  clientInitials: string;
  date: string;
  status: string;
  hours: number;
  excused: boolean;
  createdAt: string;
}

interface AttendanceReportProps {
  location: string;
  onClose: () => void;
}

export default function AttendanceReport({ location, onClose }: AttendanceReportProps) {
  const [reportData, setReportData] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReportData();
  }, [location]);

  const loadReportData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await supabaseHelpers.getLocationAttendanceReport(location);
      setReportData(data);
    } catch (err) {
      console.error('Error loading attendance report:', err);
      setError('Failed to load attendance report');
      toast.error('Failed to load attendance report');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const getStatusDisplay = (status: string, hours: number) => {
    if (status === 'present') {
      return `${hours}h attended`;
    } else if (status === 'excused') {
      return 'Excused absence';
    } else {
      return 'Unexcused absence';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'attendance-report-status-badge present';
      case 'excused':
        return 'attendance-report-status-badge excused';
      default:
        return 'attendance-report-status-badge unexcused';
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Client Name', 'Status', 'Hours', 'Excused'];
    const csvContent = [
      headers.join(','),
      ...reportData.map(record => [
        formatDate(record.date),
        `"${record.clientName}"`,
        getStatusDisplay(record.status, record.hours),
        record.hours,
        record.excused ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance-report-${location.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Report exported to CSV');
  };

  const generateSummary = () => {
    const totalRecords = reportData.length;
    const presentRecords = reportData.filter(r => r.status === 'present').length;
    const excusedRecords = reportData.filter(r => r.status === 'excused').length;
    const unexcusedRecords = reportData.filter(r => r.status === 'unexcused').length;
    const totalHours = reportData.reduce((sum, r) => sum + (r.hours || 0), 0);
    const uniqueClients = new Set(reportData.map(r => r.clientId)).size;

    return {
      totalRecords,
      presentRecords,
      excusedRecords,
      unexcusedRecords,
      totalHours,
      uniqueClients
    };
  };

  const summary = generateSummary();

  if (isLoading) {
    return (
      <div className="attendance-report-overlay">
        <Card className="attendance-report-container">
          <CardContent className="p-6">
            <div className="attendance-report-loading">
              <div className="attendance-report-loading-content">
                <div className="attendance-report-loading-spinner"></div>
                <p className="attendance-report-loading-text">Loading attendance report...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="attendance-report-overlay">
      <Card className="attendance-report-container">
        <CardContent className="p-0">
          {/* Header */}
          <div className="attendance-report-header">
            <div>
              <h2 className="attendance-report-title">
                Attendance Report - {location}
              </h2>
              <p className="attendance-report-subtitle">
                Last 6 months • {summary.totalRecords} records • {summary.uniqueClients} clients
              </p>
            </div>
            <div className="attendance-report-actions">
              <Button
                onClick={exportToCSV}
                variant="outline"
                size="sm"
                className="attendance-report-button"
              >
                <DownloadIcon className="h-4 w-4" />
                Export CSV
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                size="sm"
                className="attendance-report-button"
              >
                <XIcon className="h-4 w-4" />
                Close
              </Button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="attendance-report-summary">
            <div className="attendance-report-stats-grid">
              <div className="attendance-report-stat-item">
                <div className="attendance-report-stat-value present">{summary.presentRecords}</div>
                <div className="attendance-report-stat-label">Present</div>
              </div>
              <div className="attendance-report-stat-item">
                <div className="attendance-report-stat-value excused">{summary.excusedRecords}</div>
                <div className="attendance-report-stat-label">Excused</div>
              </div>
              <div className="attendance-report-stat-item">
                <div className="attendance-report-stat-value unexcused">{summary.unexcusedRecords}</div>
                <div className="attendance-report-stat-label">Unexcused</div>
              </div>
              <div className="attendance-report-stat-item">
                <div className="attendance-report-stat-value hours">{summary.totalHours}h</div>
                <div className="attendance-report-stat-label">Total Hours</div>
              </div>
            </div>
          </div>

          {/* Report Content */}
          <div className="attendance-report-content">
            {error ? (
              <div className="attendance-report-error-state">
                <div className="attendance-report-error-icon">
                  <FileTextIcon className="h-12 w-12 mx-auto mb-2" />
                </div>
                <p className="attendance-report-error-title">Error loading report</p>
                <p className="attendance-report-error-description">{error}</p>
                <Button onClick={loadReportData} variant="outline" className="attendance-report-button">
                  Try Again
                </Button>
              </div>
            ) : reportData.length === 0 ? (
              <div className="attendance-report-empty-state">
                <div className="attendance-report-empty-icon">
                  <FileTextIcon className="h-12 w-12 mx-auto mb-2" />
                </div>
                <p className="attendance-report-empty-title">No attendance records found</p>
                <p className="attendance-report-empty-description">No check-ins found for {location} in the last 6 months</p>
              </div>
            ) : (
              <div className="attendance-report-table-container">
                <table className="attendance-report-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Client</th>
                      <th>Status</th>
                      <th>Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((record) => (
                      <tr key={record.id}>
                        <td className="attendance-report-date">
                          {formatDate(record.date)}
                        </td>
                        <td>
                          <div className="attendance-report-client-info">
                            <div className="attendance-report-client-avatar">
                              {record.clientInitials}
                            </div>
                            <span className="attendance-report-client-name">{record.clientName}</span>
                          </div>
                        </td>
                        <td>
                          <span className={getStatusColor(record.status)}>
                            {getStatusDisplay(record.status, record.hours)}
                          </span>
                        </td>
                        <td className="attendance-report-hours">
                          {record.hours > 0 ? `${record.hours}h` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
