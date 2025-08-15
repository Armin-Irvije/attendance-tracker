// src/pages/Login.tsx
import { useState } from 'react'; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock } from "lucide-react";
import { authHelpers } from './supabase-client';
import './styles/Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('employee');
  const [rememberMe, setRememberMe] = useState(() => {
    // Check if remember me was previously set
    return localStorage.getItem('rememberMe') === 'true';
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);


  // Force page reload to update authentication state
  const handleSuccessfulLogin = () => {
    window.location.href = '/dashboard';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Use Supabase authentication
      const { user } = await authHelpers.signIn(email, password);
      
      if (user) {
        // Get user role from the users table
        const userData = await authHelpers.getUserRole(user.id);
        
        // Store auth state based on remember me preference
        if (rememberMe) {
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('userRole', userData.role);
          localStorage.setItem('userName', userData.name || '');
          localStorage.setItem('userId', user.id);
          // Set expiration for 30 days
          const expirationDate = new Date();
          expirationDate.setDate(expirationDate.getDate() + 30);
          localStorage.setItem('authExpiration', expirationDate.toISOString());
        } else {
          sessionStorage.setItem('isAuthenticated', 'true');
          sessionStorage.setItem('userRole', userData.role);
          sessionStorage.setItem('userName', userData.name || '');
          sessionStorage.setItem('userId', user.id);
        }
        
        // Redirect to dashboard
        handleSuccessfulLogin();
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!email || !password || !name) {
      setError('Please enter email, password, and name');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Create user in Supabase Auth
      const { user } = await authHelpers.signUp(email, password, { name, role });
      
      if (user) {
        setSuccess('User created successfully! You can now log in.');
        setEmail('');
        setPassword('');
        setName('');
        setRole('employee');
        setIsSignup(false);
      }
    } catch (err: any) {
      setError(err.message || 'Error creating user');
      console.error('Signup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setError('');
    setSuccess('');
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <CardHeader className="login-header">
          <CardTitle className="login-title">Attendance Tracker</CardTitle>
          <CardDescription className="login-description">
            {isSignup ? 'Create a new account' : 'Enter your credentials to access your account'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={isSignup ? handleSignup : handleLogin} className="login-form">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="mb-4">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            
            <div className="form-group">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            {isSignup && (
              <>
                <div className="form-group">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </>
            )}
            
            <div className="form-group">
              <div className="form-row">
                <Label htmlFor="password">Password</Label>
                {!isSignup && (
                  <a 
                    href="#" 
                    className="forgot-password"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Password reset functionality would go here');
                    }}
                  >
                    Forgot password?
                  </a>
                )}
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {!isSignup && (
              <div className="remember-me-container">
                <button
                  type="button"
                  className={`toggle-switch ${rememberMe ? 'active' : ''}`}
                  onClick={() => {
                    const newValue = !rememberMe;
                    setRememberMe(newValue);
                    // Persist the remember me preference
                    if (newValue) {
                      localStorage.setItem('rememberMe', 'true');
                    } else {
                      localStorage.removeItem('rememberMe');
                    }
                  }}
                  aria-label="Remember me"
                >
                  <div className="toggle-slider"></div>
                </button>
                <div className="remember-me-content">
                  <Label className="remember-me-label">
                    Remember me for 30 days
                  </Label>
                  <div className="remember-me-info">
                    <Clock className="remember-me-icon" />
                    <span>Stay signed in on this device</span>
                  </div>
                </div>
              </div>
            )}
            
            <Button 
              type="submit" 
              className="submit-button" 
              disabled={isLoading}
            >
              {isLoading ? (isSignup ? "Creating account..." : "Signing in...") : (isSignup ? "Create account" : "Sign in")}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter>
          <div className="w-full text-center">
            <p className="login-footer mb-2">
              {isSignup ? 'Already have an account?' : "Don't have an account?"}
            </p>
            <Button 
              variant="link" 
              onClick={toggleMode}
              className="p-0 h-auto"
            >
              {isSignup ? 'Sign in instead' : 'Create account'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}