import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Toaster } from "sonner";
import { Trash2Icon, LogOut, Users, ArrowLeft } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { authHelpers } from '../supabase-client.js';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'employee';
  created_at: string;
  updated_at: string;
}

export default function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('employee');
  const [userName, setUserName] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // Load user role and all users
  useEffect(() => {
    const loadUserAndUsers = async () => {
      try {
        // First, get the current user and their role
        const user = await authHelpers.getCurrentUser();
        if (user) {
          setCurrentUserId(user.id);
          const userData = await authHelpers.getUserRole(user.id);
          setUserRole(userData.role);
          setUserName(userData.name);
          
          // Only load users if current user is admin
          if (userData.role === 'admin') {
            const allUsers = await authHelpers.getAllUsers();
            setUsers(allUsers);
          } else {
            toast.error('Access denied. Only administrators can view user management.');
            navigate('/dashboard');
          }
        }
      } catch (error) {
        console.error('Error loading user or users:', error);
        toast.error('Error loading data');
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserAndUsers();
  }, [navigate]);

  // Handle user deletion
  const handleDeleteUser = async (userId: string, userName: string, event: React.MouseEvent) => {
    event.stopPropagation();

    // Check if user is admin
    if (userRole !== 'admin') {
      toast.error('Only administrators can delete users');
      return;
    }

    // Prevent deleting self
    if (userId === currentUserId) {
      toast.error('You cannot delete your own account');
      return;
    }

    // Confirm deletion
    if (window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone and will immediately revoke their access to the portal.`)) {
      try {
        await authHelpers.deleteUser(userId);

        // Remove user from state
        const updatedUsers = users.filter(user => user.id !== userId);
        setUsers(updatedUsers);

        toast.success(`${userName} has been deleted successfully`);
      } catch (error: any) {
        console.error('Error deleting user:', error);
        toast.error(error.message || 'Error deleting user');
      }
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await authHelpers.signOut();
      // Clear local storage
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      sessionStorage.removeItem('isAuthenticated');
      sessionStorage.removeItem('userRole');
      sessionStorage.removeItem('userName');
      // Redirect to login
      window.location.href = '/login';
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Error logging out');
    }
  };

  // Handle back to dashboard
  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  // Get user initials
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading user management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Toaster />

      <header className="dashboard-header">
        <div className="header-content">
          <div>
            <h1 className="dashboard-title">User Management</h1>
            <p className="dashboard-subtitle">Manage user accounts and permissions</p>
            <p className="user-info">Welcome, {userName} ({userRole})</p>
          </div>
          <div className="header-actions">
            <button
              onClick={handleBackToDashboard}
              className="back-button"
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="logout-button"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="users-section">
        <div className="section-header">
          <Users className="h-5 w-5" />
          <h2>All Users ({users.length})</h2>
        </div>

        <div className="users-grid">
          {users.map(user => (
            <Card
              key={user.id}
              className={`user-card ${user.role === 'admin' ? 'admin-user' : 'employee-user'} ${user.id === currentUserId ? 'current-user' : ''}`}
            >
              <CardContent className="user-card-content">
                <div className="user-info">
                  <Avatar className="user-avatar">
                    <AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="user-details">
                    <h3 className="user-name">
                      {user.name}
                      {user.id === currentUserId && <span className="current-user-badge">(You)</span>}
                    </h3>
                    <p className="user-email">{user.email}</p>
                    <div className="user-meta">
                      <span className={`user-role ${user.role}`}>
                        {user.role === 'admin' ? '👑 Administrator' : '👤 Employee'}
                      </span>
                      <span className="user-created">
                        Joined: {formatDate(user.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
                {userRole === 'admin' && user.id !== currentUserId && (
                  <button
                    className="user-delete-btn"
                    onClick={(e) => handleDeleteUser(user.id, user.name, e)}
                    title="Delete user account"
                  >
                    <Trash2Icon className="trash-icon" />
                  </button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {users.length === 0 && (
          <div className="empty-state">
            <Users className="h-12 w-12 text-gray-400" />
            <h3>No users found</h3>
            <p>There are no users in the system.</p>
          </div>
        )}
      </div>
    </div>
  );
}
