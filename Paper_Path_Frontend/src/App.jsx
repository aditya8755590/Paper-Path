import React, { useEffect, useState } from 'react';

// ==========================================
// 1. COMPONENT IMPORTS
// ==========================================
// Navigation bar displayed at the top when a user is logged in
import Navbar from './components/Navbar';
// Authentication views: login/signup form and email OTP verification
import LoginView from './components/LoginView';
import OtpView from './components/OtpView';
// Main application views: paper feed, reading/AI tutor mode, and user profile
import DashboardView from './components/DashboardView';
import ReaderView from './components/ReaderView';
import ProfileView from './components/ProfileView';

// ==========================================
// 2. SERVICES & HOOKS
// ==========================================
// Backend API helper modules for Auth, Library, and Papers
import { authService, libraryService, paperService } from './services/api';
// Global popup notification system (toasts)
import { ToastContainer, useToast } from './components/Toast';

export default function App() {
  // ==========================================
  // 3. APPLICATION STATE MANAGEMENT
  // ==========================================

  // Controls which page/screen is currently displayed ('login' | 'otp' | 'dashboard' | 'reader' | 'profile')
  const [view, setView] = useState('login');

  // Holds the authenticated user object (e.g. { _id, name, email }) or null if logged out
  const [user, setUser] = useState(null);

  // Array of all academic research papers loaded from the backend
  const [papers, setPapers] = useState([]);

  // Array of papers bookmarked / saved to the user's personal library
  const [savedPapers, setSavedPapers] = useState([]);

  // Array of papers the user has previously opened and read
  const [readHistory, setReadHistory] = useState([]);

  // The specific paper currently opened inside the ReaderView & AI Tutor
  const [currentPaper, setCurrentPaper] = useState(null);

  // Global loading spinner flag for network requests
  const [isLoading, setIsLoading] = useState(false);

  // Toggles the auth screen mode between 'login' and 'register'
  const [authMode, setAuthMode] = useState('login');

  // Error message string shown on the login/register screen (if any)
  const [authError, setAuthError] = useState('');

  // Stores the user's email temporarily while waiting for them to enter the OTP
  const [pendingEmail, setPendingEmail] = useState('');

  // Error message string for invalid or expired OTP entries
  const [otpError, setOtpError] = useState('');

  // Custom hook for displaying toast alert notifications across the app
  const { toasts, toast, removeToast } = useToast();

  // ==========================================
  // 4. THEME CONFIGURATION (Dark / Light Mode)
  // ==========================================
  // Reads saved theme from localStorage, defaulting to 'dark'
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  // Synchronizes the 'dark' CSS class on <html> whenever theme state changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Toggles between dark and light modes
  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  // ==========================================
  // 5. SESSION RESTORATION ON MOUNT
  // ==========================================
  // Checks if a valid JWT token exists in localStorage on initial page load.
  // If valid, fetches the user's profile and immediately navigates to the dashboard.
  useEffect(() => {
    const restoreSession = async () => {
      setIsLoading(true);
      try {
        const storedProfile = await authService.getProfile();
        if (storedProfile && storedProfile._id) {
          setUser(storedProfile);
          setView('dashboard');
        }
      } catch (err) {
        // If token is missing, expired, or invalid, stay on the login screen
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  // ==========================================
  // 6. AUTHENTICATION HANDLERS
  // ==========================================

  /**
   * Handles user login submission.
   * If the account requires OTP verification, switches to the OTP screen.
   * Otherwise, sets the user state and directs to the dashboard.
   */
  const handleLogin = async (e, email, password) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError('');

    try {
      const result = await authService.login({ email, password });

      if (result.requiresOtp) {
        // Account exists but email is not yet verified -> transition to OTP screen
        setPendingEmail(result.email || email);
        setOtpError('');
        setView('otp');
        toast.info(`Verification code sent to ${result.email || email} 📧`);
      } else {
        // Account verified & authenticated -> set user and go to dashboard
        setUser(result);
        setView('dashboard');
        toast.success(`Welcome back, ${result.name || 'Researcher'}! 👋`);
      }
    } catch (error) {
      const msg = error.message || 'Login failed. Please try again.';
      setAuthError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles new account registration.
   * Usually sends an OTP to verify the user's email before granting access.
   */
  const handleRegister = async (e, name, email, password) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError('');

    try {
      const result = await authService.register({ name, email, password });

      if (result.requiresOtp) {
        // Standard flow: OTP sent to user's inbox -> show verification screen
        setPendingEmail(result.email || email);
        setOtpError('');
        setView('otp');
        toast.success(`Account created! Verification code sent to ${result.email || email} 📧`);
      } else {
        // Fallback or demo mode where OTP is bypassed
        setUser(result);
        setView('dashboard');
      }
    } catch (error) {
      const msg = error.message || 'Registration failed. Please try again.';
      setAuthError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Submits the 6-digit OTP code to the backend.
   * On success: stores the JWT, saves the user state, and opens the dashboard.
   */
  const handleOtpSuccess = async (otp) => {
    setIsLoading(true);
    setOtpError('');
    try {
      const verifiedUser = await authService.verifyOtp({ email: pendingEmail, otp });
      setUser(verifiedUser);
      setPendingEmail('');
      setView('dashboard');
      toast.success(`Email verified! Welcome, ${verifiedUser.name || 'Researcher'}! 🎉`);
    } catch (error) {
      const msg = error.message || 'Invalid or expired OTP.';
      setOtpError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Resends a new OTP code if the user didn't receive the previous one.
   */
  const handleOtpResend = async () => {
    try {
      await authService.resendOtp({ email: pendingEmail });
      toast.info(`New verification code sent to ${pendingEmail}`);
    } catch (error) {
      toast.error(error.message || 'Failed to resend code.');
    }
  };

  /**
   * Logs out the user by removing the stored JWT, clearing state, and returning to login.
   */
  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setCurrentPaper(null);
    setAuthError('');
    setAuthMode('login');
    setView('login');
    toast.info('You have been logged out. See you soon! 👋');
  };

  // ==========================================
  // 7. DATA FETCHING (Papers & User Library)
  // ==========================================
  /**
   * Fetches the global paper feed and the user's personal saved library in parallel.
   * Uses Promise.allSettled so if one request fails, the other can still succeed.
   */
  const fetchDashboardData = async () => {
    setIsLoading(true);

    try {
      const [fetchedPapers, libraryData] = await Promise.allSettled([
        paperService.list(),
        libraryService.getLibrary(),
      ]);

      const papersResult = fetchedPapers.status === 'fulfilled' ? fetchedPapers.value : [];
      const libraryResult = libraryData.status === 'fulfilled'
        ? libraryData.value
        : { savedPapers: [], readHistory: [] };

      setPapers(papersResult);
      setSavedPapers(libraryResult.savedPapers || []);
      setReadHistory(libraryResult.readHistory || []);
    } catch (error) {
      console.error('Could not load dashboard data', error);
      setPapers([]);
      setSavedPapers([]);
      setReadHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Automatically fetch papers when entering dashboard or profile if not already loaded
  useEffect(() => {
    if ((view === 'dashboard' || view === 'profile') && papers.length === 0) {
      fetchDashboardData();
    }
  }, [view]);

  // ==========================================
  // 8. PAPER ACTIONS (Read & Bookmark)
  // ==========================================
  /**
   * Opens a paper in the ReaderView with AI Tutor support.
   * Also notifies the backend to record this paper in the user's reading history.
   */
  const openPaper = async (paper) => {
    setCurrentPaper(paper);

    try {
      await libraryService.trackPaper(paper._id);
    } catch (error) {
      console.error('Could not track paper', error);
    }

    // Add to local reading history list if not already present
    if (!readHistory.find((item) => item._id === paper._id)) {
      setReadHistory([paper, ...readHistory]);
    }

    setView('reader');
  };

  /**
   * Toggles bookmarking/saving a paper to the user's personal library.
   * If already saved -> unsaves it (DELETE).
   * If not saved -> saves it (POST).
   */
  const toggleSave = async (paper) => {
    if (!paper || !paper._id) return;
    const paperId = paper._id;

    // CASE 1: Paper is already saved -> Remove from library
    if (savedPapers.find((sp) => sp._id === paperId)) {
      try {
        await libraryService.unsavePaper(paperId);
        setSavedPapers((prev) => prev.filter((sp) => sp._id !== paperId));
        toast.info('Paper removed from your library.');
      } catch (error) {
        console.error('Could not unsave paper', error);
        toast.error('Failed to remove paper. Please try again.');
      }
      return;
    }

    // CASE 2: Paper is not yet saved -> Add to library
    const paperToSave = papers.find((p) => p._id === paperId)
      || readHistory.find((p) => p._id === paperId)
      || paper;

    try {
      await libraryService.savePaper(paperId);
      setSavedPapers((prev) => [...prev, paperToSave]);
      toast.success('Paper saved to your library! 📚');
    } catch (error) {
      console.error('Could not save paper', error);
      toast.error('Failed to save paper. Please try again.');
    }
  };

  // ==========================================
  // 9. VIEW RENDERING & ROUTING
  // ==========================================
  return (
    <div className="min-h-screen font-sans relative">
      {/* Top Navigation Bar: rendered only when logged in and outside login screen */}
      {user && view !== 'login' && (
        <Navbar
          user={user}
          onLogout={handleLogout}
          setView={setView}
          currentView={view}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      )}

      {/* Main Content Area: dynamically renders the component corresponding to the active view state */}
      <main className="max-w-7xl mx-auto relative z-10">
        {(() => {
          switch (view) {
            case 'login':
              return (
                <LoginView
                  onLogin={handleLogin}
                  onRegister={handleRegister}
                  isLoading={isLoading}
                  authMode={authMode}
                  setAuthMode={setAuthMode}
                  authError={authError}
                />
              );
            case 'otp':
              return (
                <OtpView
                  email={pendingEmail}
                  onSuccess={handleOtpSuccess}
                  onResend={handleOtpResend}
                  isLoading={isLoading}
                  error={otpError}
                />
              );
            case 'dashboard':
              return (
                <DashboardView
                  papers={papers}
                  savedPapers={savedPapers}
                  readHistory={readHistory}
                  isLoading={isLoading}
                  onOpenPaper={openPaper}
                  onToggleSave={toggleSave}
                />
              );
            case 'reader':
              return (
                <ReaderView
                  paper={currentPaper}
                  isSaved={!!currentPaper && !!savedPapers.find((sp) => sp._id === currentPaper._id)}
                  onToggleSave={() => currentPaper && toggleSave(currentPaper)}
                  onBack={() => setView('dashboard')}
                />
              );
            case 'profile':
              return (
                <ProfileView
                  user={user}
                  savedPapers={savedPapers}
                  readHistory={readHistory}
                  onLogout={handleLogout}
                  setView={setView}
                />
              );
            default:
              return (
                <LoginView
                  onLogin={handleLogin}
                  onRegister={handleRegister}
                  isLoading={isLoading}
                  authMode={authMode}
                  setAuthMode={setAuthMode}
                  authError={authError}
                />
              );
          }
        })()}
      </main>

      {/* Global floating toast notification container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}