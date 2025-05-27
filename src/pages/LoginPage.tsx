import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, LogIn, UserPlus, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../db';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { User } from '../types';

const LoginPage: React.FC = () => {
  const { login, signUp } = useAuth();
  const navigate = useNavigate();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingAccounts, setExistingAccounts] = useState<User[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  
  // Field-specific error states
  const [usernameError, setUsernameError] = useState<string | undefined>();
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | undefined>();
  
  // Load existing accounts
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const users = await db.users.toArray();
        setExistingAccounts(users);
      } catch (error) {
        console.error('Failed to load existing accounts:', error);
      } finally {
        setIsLoadingAccounts(false);
      }
    };
    
    loadAccounts();
  }, []);

  // Validation functions
  const validateUsername = () => {
    if (!isLoginMode) {
      if (!username.trim()) {
        setUsernameError('Username is required');
        return false;
      } else if (username.length < 3) {
        setUsernameError('Username must be at least 3 characters');
        return false;
      }
    }
    setUsernameError(undefined);
    return true;
  };
  
  const validateEmail = () => {
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError(undefined);
    return true;
  };
  
  const validatePassword = () => {
    if (!password.trim()) {
      setPasswordError('Password is required');
      return false;
    } else if (!isLoginMode && password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError(undefined);
    return true;
  };
  
  const validateConfirmPassword = () => {
    if (!isLoginMode) {
      if (!confirmPassword.trim()) {
        setConfirmPasswordError('Please confirm your password');
        return false;
      } else if (password !== confirmPassword) {
        setConfirmPasswordError('Passwords do not match');
        return false;
      }
    }
    setConfirmPasswordError(undefined);
    return true;
  };

  const validateForm = () => {
    const isUsernameValid = validateUsername();
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    const isConfirmPasswordValid = validateConfirmPassword();
    
    return isUsernameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isLoginMode) {
        await login(email, password);
      } else {
        await signUp(username, email, password);
      }
      navigate('/');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectAccount = (user: User) => {
    setEmail(user.email);
    setUsername(user.username);
    setIsLoginMode(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 text-primary-800 mb-4">
            <MessageSquare size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Feedback Sync</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {isLoginMode ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-all duration-300 animate-fade-in">
          {error && (
            <div className="mb-4 p-3 bg-error-50 text-error-800 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Show existing accounts if available */}
          {existingAccounts.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Existing accounts on this device:
              </h3>
              <div className="space-y-2">
                {existingAccounts.map(user => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectAccount(user)}
                    className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center mr-3">
                      <span className="text-primary-800 dark:text-primary-200 font-medium">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{user.username}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                Select an account or create a new one below
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLoginMode && (
              <Input
                label="Username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={validateUsername}
                placeholder="Enter your username"
                fullWidth
                required
                error={usernameError}
              />
            )}

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={validateEmail}
              placeholder="Enter your email"
              fullWidth
              required
              error={emailError}
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={validatePassword}
              placeholder="Enter your password"
              fullWidth
              required
              error={passwordError}
            />

            {!isLoginMode && (
              <Input
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={validateConfirmPassword}
                placeholder="Confirm your password"
                fullWidth
                required
                error={confirmPasswordError}
              />
            )}

            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              fullWidth
              className="mt-6"
              icon={isLoginMode ? <LogIn size={18} /> : <UserPlus size={18} />}
            >
              <span className='ml-2'>{isLoginMode ? 'Sign In' : 'Sign Up'}</span>
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                // Clear all errors when switching modes
                setError(null);
                setUsernameError(undefined);
                setEmailError(undefined);
                setPasswordError(undefined);
                setConfirmPasswordError(undefined);
              }}
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              {isLoginMode
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>

          {/* Add a button to refresh accounts */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={async () => {
                setIsLoadingAccounts(true);
                try {
                  // Trigger a sync to get latest accounts
                  const { syncService } = await import('../services/syncService');
                  await syncService.syncNow();
                  
                  // Reload accounts
                  const users = await db.users.toArray();
                  setExistingAccounts(users);
                } catch (error) {
                  console.error('Failed to refresh accounts:', error);
                } finally {
                  setIsLoadingAccounts(false);
                }
              }}
              disabled={isLoadingAccounts}
              className="text-sm flex items-center justify-center mx-auto text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              {isLoadingAccounts ? (
                <RefreshCw size={14} className="animate-spin mr-1" />
              ) : (
                <RefreshCw size={14} className="mr-1" />
              )}
              Refresh accounts
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          This app works offline and syncs when you're online.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

