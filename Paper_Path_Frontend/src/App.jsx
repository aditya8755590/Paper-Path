import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import LoginView from './components/LoginView';
import OtpView from './components/OtpView';
import DashboardView from './components/DashboardView';
import ReaderView from './components/ReaderView';
import ProfileView from './components/ProfileView';
import { authService, libraryService, paperService } from './services/api';
import { ToastContainer, useToast } from './components/Toast';

export default function App() {
  const [view, setView] = useState('login');
  const [user, setUser] = useState(null);
  const [papers, setPapers] = useState([]);
  const [savedPapers, setSavedPapers] = useState([]);
  const [readHistory, setReadHistory] = useState([]);
  const [currentPaper, setCurrentPaper] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authError, setAuthError] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');   // email waiting for OTP
  const [otpError, setOtpError] = useState('');           // error from verifyOtp
  const { toasts, toast, removeToast } = useToast();

  // 🌓 Theme State
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  //  Check stored session token on mount
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
        // Token invalid or expired — stay on login
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  const handleLogin = async (e, email, password) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError('');

    try {
      const result = await authService.login({ email, password });

      if (result.requiresOtp) {
        // Account exists but email not verified — show OTP screen
        setPendingEmail(result.email || email);
        setOtpError('');
        setView('otp');
        toast.info(`Verification code sent to ${result.email || email} 📧`);
      } else {
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

  const handleRegister = async (e, name, email, password) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError('');

    try {
      const result = await authService.register({ name, email, password });

      if (result.requiresOtp) {
        // Normal flow — OTP sent, show verification screen
        setPendingEmail(result.email || email);
        setOtpError('');
        setView('otp');
        toast.success(`Account created! Verification code sent to ${result.email || email} 📧`);
      } else {
        // Fallback/demo mode — no OTP needed
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

  /** Called by OtpView when user submits a code. */
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

  /** Called by OtpView resend button. */
  const handleOtpResend = async () => {
    try {
      await authService.resendOtp({ email: pendingEmail });
      toast.info(`New verification code sent to ${pendingEmail}`);
    } catch (error) {
      toast.error(error.message || 'Failed to resend code.');
    }
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setCurrentPaper(null);
    setAuthError('');
    setAuthMode('login');
    setView('login');
    toast.info('You have been logged out. See you soon! 👋');
  };

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

  useEffect(() => {
    if ((view === 'dashboard' || view === 'profile') && papers.length === 0) {
      fetchDashboardData();
    }
  }, [view]);

  const openPaper = async (paper) => {
    setCurrentPaper(paper);

    try {
      await libraryService.trackPaper(paper._id);
    } catch (error) {
      console.error('Could not track paper', error);
    }

    if (!readHistory.find((item) => item._id === paper._id)) {
      setReadHistory([paper, ...readHistory]);
    }

    setView('reader');
  };

  const toggleSave = async (paper) => {
    if (!paper || !paper._id) return;
    const paperId = paper._id;

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

    // Paper may be in papers feed, savedPapers, or readHistory — find from all
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

  return (
    <div className="min-h-screen font-sans relative">
      {user && view !== 'login' && <Navbar user={user} onLogout={handleLogout} setView={setView} currentView={view} theme={theme} toggleTheme={toggleTheme} />}

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

      {/* Global toast notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}