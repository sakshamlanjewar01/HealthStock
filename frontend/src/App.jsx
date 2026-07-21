import React, { useState, useEffect, Suspense } from 'react';
import { Settings, HelpCircle, LogOut, X, Shield, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ConfirmProvider, useConfirm } from './context/ConfirmContext';
import HealthIntelligenceCenter from './pages/HealthIntelligenceCenter';
import { HealthStoreProvider } from './context/HealthStoreContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Landing from './pages/Landing';
import ResetPassword from './pages/ResetPassword';
import Logo from './components/Logo';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';

// Lazy load modal features
const SettingsModal = React.lazy(() => import('./features/settings').then(m => ({ default: m.SettingsModal })));

function AppContent() {
  const { user, loading, logout } = useAuth();
  const confirm = useConfirm();
  const [authView, setAuthView] = useState('landing');
  const [resetToken, setResetToken] = useState('');
  const [logoutMessage, setLogoutMessage] = useState('');

  const handleLogout = async () => {
    const isConfirmed = await confirm('Are you sure you want to sign out of your HealthStock account?');
    if (!isConfirmed) return;
    await logout();
    setLogoutMessage('You have been signed out successfully.');
    setAuthView('login');
    setTimeout(() => setLogoutMessage(''), 4000);
  };
  const [activeModal, setActiveModal] = useState(null); // 'settings', 'privacy', 'terms', 'docs'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Check URL query parameters for reset token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setResetToken(token);
      setAuthView('reset-password');
      // Clean up URL parameters without reloading
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Scroll to top whenever the active tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);



  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans relative">
        {/* Parallax Blobs even on load */}
        <div className="ambient-glow-wrapper">
          <div className="ambient-blob ambient-blob-teal" />
          <div className="ambient-blob ambient-blob-blue" />
        </div>
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 font-semibold mt-4 tracking-wider uppercase">Loading Session...</p>
      </div>
    );
  }

  return (
    <>
      {user ? (
        <div className={`min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans relative ${user?.accessibilityLargeText ? 'accessibility-large-text' : ''}`}>
      {/* 1. AMBIENT GLOW BACKDROP (Removed for light theme) */}
      <div className="hidden"></div>

      {/* 2. MOBILE TOP HEADER */}
      <header className="md:hidden h-14 bg-white border-b border-slate-100 sticky top-0 z-40 px-4 flex items-center justify-between shrink-0" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        {/* HealthStock brand — aligned to left */}
        <div className="flex items-center gap-1.5 select-none">
          <div className="w-6 h-6 bg-[#0F2F57] rounded-md flex items-center justify-center shadow-sm">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="9" y="2" width="6" height="20" rx="2" fill="white" />
              <rect x="2" y="9" width="20" height="6" rx="2" fill="white" />
            </svg>
          </div>
          <span className="text-base font-bold tracking-tight text-[#0F2F57]">
            HealthStock
          </span>
        </div>

        {/* User Profile Avatar with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-extrabold text-[12px] avatar-initials shrink-0 cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-sm"
          >
            {user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
          </button>
          
          {profileDropdownOpen && (
            <>
              {/* Overlay transparent backdrop to close dropdown */}
              <div 
                className="fixed inset-0 z-40 cursor-default" 
                onClick={() => setProfileDropdownOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-200/90 rounded-3xl shadow-xl p-4 pt-6 pb-8 z-50 animate-scaleUp text-left space-y-3">
                {/* User Info Header in Dropdown */}
                <div className="px-4 py-3 bg-slate-50/80 rounded-xl mb-2 border border-slate-100/80">
                  <p className="text-sm font-extrabold text-[#0F2F57] truncate">{user?.name || 'User Profile'}</p>
                  <p className="text-[11px] text-slate-400 font-medium truncate">{user?.email || 'Active Account'}</p>
                </div>

                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    setActiveModal('settings');
                  }}
                  className="w-full text-left px-4 py-4 text-xs font-extrabold text-[#0F2F57] hover:bg-[#0B53FA]/10 hover:text-[#0B53FA] rounded-xl transition-all flex items-center gap-3 cursor-pointer"
                >
                  <Settings className="w-4.5 h-4.5 text-slate-400" />
                  <span>Settings</span>
                </button>

                <div className="h-px bg-slate-100 my-1" />

                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-4 py-4 text-xs font-extrabold text-rose-500 hover:bg-rose-50 rounded-xl transition-all flex items-center gap-3 cursor-pointer"
                >
                  <LogOut className="w-4.5 h-4.5 text-rose-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* 3. DESKTOP SIDEBAR (Visible on md+ screens only) */}
      <Sidebar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setActiveModal={setActiveModal}
        logout={handleLogout}
      />

      {/* 4. MAIN WORKSPACE CONTENT CONTAINER (Right side / Main scrolling panel) */}
      <div className="flex-1 flex flex-col min-w-0 pb-24 md:pb-0 overflow-y-auto">
        <main className="flex-1 py-2 sm:py-4 flex flex-col">
          <HealthIntelligenceCenter activeTab={activeTab} setActiveTab={setActiveTab} />
        </main>

        {/* PROFESSIONAL FOOTER */}
        <footer className="mt-auto py-6 sm:py-8 px-6 lg:px-12 bg-white border-t border-slate-100 relative z-10">
          <div className="max-w-7xl mx-auto">

            {/* Desktop Footer (hidden on mobile) */}
            <div className="hidden md:flex flex-row justify-between items-center py-4">
              {/* Brand */}
              <div className="flex flex-col items-start gap-1 w-1/3 text-left">
                <div className="flex items-center gap-3">
                  <Logo className="w-9 h-9" />
                  <div className="flex flex-col leading-none">
                    <span className="text-xl font-extrabold text-[#0F2F57] tracking-tight">Healthstock</span>
                    <span className="text-[9px] font-extrabold text-[#94A3B8] uppercase tracking-[0.25em] mt-1">
                      INTELLIGENCE
                    </span>
                  </div>
                </div>
              </div>
              {/* Links */}
              <div className="flex items-center justify-center gap-6 w-1/3">
                <button onClick={() => setActiveModal('privacy')} className="text-[11px] font-bold text-[#4B6B8B] hover:text-[#0F2F57] transition-colors cursor-pointer">Privacy</button>
                <span className="text-slate-300 font-bold">•</span>
                <button onClick={() => setActiveModal('terms')} className="text-[11px] font-bold text-[#4B6B8B] hover:text-[#0F2F57] transition-colors cursor-pointer">Terms</button>
                <span className="text-slate-300 font-bold">•</span>
                <button onClick={() => setActiveModal('docs')} className="text-[11px] font-bold text-[#4B6B8B] hover:text-[#0F2F57] flex items-center gap-1.5 transition-colors cursor-pointer">
                  <HelpCircle className="w-3.5 h-3.5 text-[#4B6B8B]" /> Support
                </button>
              </div>
              {/* Disclaimer & Copyright */}
              <div className="flex flex-col items-end gap-1.5 text-right w-1/3">
                <p className="text-[9px] text-[#95A6B7] leading-relaxed font-bold max-w-xs">
                  Secure medication adherence tracking. <br />Not a substitute for professional medical advice.
                </p>
                <p className="text-[9px] font-black text-[#95A6B7]">
                  &copy; {new Date().getFullYear()} HealthStock Inc.
                </p>
              </div>
            </div>

            {/* Mobile Footer (hidden on desktop) */}
            <div className="flex md:hidden flex-col items-center text-center gap-5">
              {/* Logo */}
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-3">
                  <Logo className="w-10 h-10" />
                  <div className="flex flex-col leading-none text-left">
                    <span className="text-2xl font-extrabold text-[#0F2F57] tracking-tight">Healthstock</span>
                    <span className="text-[10px] font-extrabold text-[#94A3B8] uppercase tracking-[0.25em] mt-1">
                      INTELLIGENCE
                    </span>
                  </div>
                </div>
              </div>

              {/* Links Row */}
              <div className="flex items-center justify-center gap-4">
                <button onClick={() => setActiveModal('privacy')} className="text-[12px] font-bold text-[#4B6B8B] hover:text-[#0F2F57] transition-colors cursor-pointer">Privacy</button>
                <div className="w-1 h-1 rounded-full bg-[#C9D6E4]"></div>
                <button onClick={() => setActiveModal('terms')} className="text-[12px] font-bold text-[#4B6B8B] hover:text-[#0F2F57] transition-colors cursor-pointer">Terms</button>
                <div className="w-1 h-1 rounded-full bg-[#C9D6E4]"></div>
                <button onClick={() => setActiveModal('docs')} className="text-[12px] font-bold text-[#4B6B8B] hover:text-[#0F2F57] flex items-center gap-1.5 transition-colors cursor-pointer">
                  <HelpCircle className="w-3.5 h-3.5" /> Support
                </button>
              </div>

              {/* Disclaimer */}
              <p className="text-[11px] text-slate-400 max-w-[320px] leading-relaxed font-medium">
                Secure medication adherence tracking. Not a substitute for professional medical advice.
              </p>

              {/* Copyright */}
              <p className="text-[11px] font-bold text-[#95A6B7]">
                &copy; {new Date().getFullYear()} HealthStock Inc.
              </p>
            </div>

          </div>
        </footer>
        </div>
        </div>
      ) : authView === 'landing' ? (
        <Landing onNavigate={setAuthView} setActiveModal={setActiveModal} />
      ) : (
        <div className="h-screen overflow-hidden bg-[#E1F2F6] flex flex-col font-sans relative">
          {logoutMessage && (
            <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-[#0F2F57] text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-extrabold animate-bounce border border-white/10">
              <Check className="w-4.5 h-4.5 text-[#10B981]" />
              <span>{logoutMessage}</span>
            </div>
          )}
          {/* Persistent Navbar on Auth pages — identical to Landing navbar */}
          <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 lg:px-20 bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm transition-all h-20">

            {/* Logo — HealthStock INTELLIGENCE */}
            <button onClick={() => setAuthView('landing')} className="flex items-center gap-2.5 cursor-pointer shrink-0 border-none bg-transparent">
              <Logo className="w-9 h-9" />
              <div className="flex flex-col leading-none text-left">
                <div className="text-[17px] font-extrabold tracking-tight leading-none">
                  <span className="text-[#0F2F57]">Health</span>
                  <span className="text-[#10B981]">stock</span>
                </div>
                <span className="text-[#95A6B7] text-[8px] font-bold tracking-[0.06em] uppercase mt-1">
                  Track <span className="text-[#0B53FA]">•</span> Manage <span className="text-[#10B981]">•</span> Live Well
                </span>
              </div>
            </button>

            {/* Center Nav Links */}
            <div className="hidden lg:flex items-center gap-10">
              {['Home', 'Features', 'Benefits'].map((link) => (
                <button key={link} onClick={() => setAuthView('landing')}
                  className="text-[14px] font-bold text-[#4B6B8B] hover:text-[#0F2F57] transition-colors cursor-pointer border-none bg-transparent">
                  {link}
                </button>
              ))}
            </div>

            {/* Right Buttons — same as Landing */}
            <div className="flex items-center gap-3">
              <button onClick={() => setAuthView('login')}
                className="px-5 py-2 border border-[#E2E8F0] text-[#0F2F57] bg-white hover:bg-slate-50 text-[13px] font-bold rounded-[8px] transition-all shadow-sm cursor-pointer">
                Log in
              </button>
              <button onClick={() => setAuthView('signup')}
                className="px-5 py-2 bg-[#0B53FA] hover:bg-[#0043D6] text-white text-[13px] font-bold rounded-[8px] shadow-sm transition-all cursor-pointer">
                Get Started
              </button>
            </div>
          </nav>

          <div className="ambient-glow-wrapper">
            <div className="ambient-blob ambient-blob-teal" />
            <div className="ambient-blob ambient-blob-blue" />
            <div className="ambient-blob ambient-blob-purple" />
          </div>
          <div className="flex-1 overflow-hidden">
            {authView === 'reset-password' ? (
              <ResetPassword token={resetToken} onComplete={() => setAuthView('login')} />
            ) : authView === 'login' ? (
              <Login onToggleView={() => setAuthView('signup')} />
            ) : (
              <Signup onToggleView={() => setAuthView('login')} />
            )}
          </div>
        </div>
      )}

      {/* 5. MOBILE BOTTOM TAB NAVIGATION BAR (Sticky bottom-bar on mobile only, if logged in) */}
      {user && <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />}
      {activeModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-slate-950/65 backdrop-blur-sm animate-fadeIn">
          {/* Backdrop Click Closer */}
          <div className="absolute inset-0 cursor-pointer" onClick={() => setActiveModal(null)} />

          {/* Modal Container - slides from bottom on mobile, centered on desktop */}
          <div className="bg-white p-5 sm:p-8 rounded-t-3xl sm:rounded-3xl border border-slate-100 w-full sm:max-w-xl relative z-10 max-h-[90vh] sm:max-h-[85vh] overflow-y-auto no-scrollbar shadow-2xl animate-scaleUp">
            {/* Mobile drag handle */}
            <div className="sm:hidden w-10 h-1 bg-slate-300 rounded-full mx-auto mb-4" />

            {/* Close Button */}
            <button
              onClick={() => setActiveModal(null)}
              aria-label="Close modal"
              className="absolute top-5 right-5 z-30 p-2 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 rounded-full transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>

            
            {/* Settings Modal */}
            {activeModal === 'settings' && (
              <Suspense fallback={<div className="p-8 text-center text-slate-500 font-semibold">Loading Settings...</div>}>
                <SettingsModal onClose={() => setActiveModal(null)} />
              </Suspense>
            )}


            {activeModal === 'privacy' && (
              <div className="space-y-6 text-left">
                {/* 1. Header Row */}
                <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] -mt-2">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-[#EFF6FF] rounded-2xl flex items-center justify-center shrink-0 relative">
                      <Shield className="w-7 h-7 text-[#2563EB]" />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#10B981] rounded-full border-2 border-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white stroke-[4]" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-[#061D4C] tracking-tight">Privacy Policy</h3>
                      <p className="text-[10px] text-[#00966C] font-extrabold uppercase tracking-widest mt-0.5">Healthcare Privacy Standard</p>
                    </div>
                  </div>
                </div>

                {/* 2. Info Banner Box */}
                <div className="bg-[#EFF6FF] border border-[#DBEAFE] rounded-2xl p-4 flex items-start gap-3.5 shadow-sm">
                  <div className="w-6 h-6 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-[10px] font-extrabold shrink-0 mt-0.5">
                    i
                  </div>
                  <p className="text-xs text-[#061D4C] font-semibold leading-relaxed">
                    At <strong className="text-[#2563EB]">HealthStock</strong>, we prioritize your healthcare information privacy. This policy outlines how patient metadata, dosing history logs, and medication catalogs are managed and protected.
                  </p>
                </div>

                {/* 3. Sections Content List */}
                <div className="space-y-5 py-2">
                  {/* Section 1 */}
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-[#EFF6FF] rounded-xl flex items-center justify-center shrink-0">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <rect x="15" y="11" width="7" height="9" rx="1.5" />
                        <path d="M17 11V9a2 2 0 0 1 4 0v2" />
                      </svg>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-[#061D4C] text-[13px] tracking-tight">1. Protected Health Information (PHI)</h4>
                      <p className="text-xs text-[#64748B] leading-relaxed font-semibold">
                        All health compliance records, dosing events, and schedules are stored securely inside private MongoDB collections. These records are mapped directly to individual secure accounts and are never shared or leaked.
                      </p>
                    </div>
                  </div>

                  <div className="h-px bg-[#E2E8F0]" />

                  {/* Section 2 */}
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-[#E6F7F0] rounded-xl flex items-center justify-center shrink-0">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-[#061D4C] text-[13px] tracking-tight">2. Encryption and Storage</h4>
                      <p className="text-xs text-[#64748B] leading-relaxed font-semibold">
                        User session credentials use secure HTTP-only cookies paired with salted BCrypt password hashing. We enforce JSON Web Token (JWT) validations across all API endpoints to protect against malicious cross-site scripting attempts.
                      </p>
                    </div>
                  </div>

                  <div className="h-px bg-[#E2E8F0]" />

                  {/* Section 3 */}
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-[#F3E8FF] rounded-xl flex items-center justify-center shrink-0">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9333EA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <ellipse cx="12" cy="5" rx="9" ry="3" />
                        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                        <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
                        <path d="M12 17l4 2v-4" />
                      </svg>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-[#061D4C] text-[13px] tracking-tight">3. Local Data Isolation</h4>
                      <p className="text-xs text-[#64748B] leading-relaxed font-semibold">
                        All diagnostic reports and PDF summaries compile entirely within the client container using client-side canvas render engines. Your data is isolated to private application runtimes.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 4. Footer Row */}
                <div className="pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] font-bold text-[#64748B]">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-[#E6F7F0] rounded-full flex items-center justify-center">
                      <Shield className="w-3.5 h-3.5 text-[#10B981]" />
                    </div>
                    <span>Last modified: <strong className="text-[#2563EB]">June 2026.</strong></span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span>For questions or privacy concerns,</span>
                    <a href="mailto:security@healthstock.intel" className="flex items-center gap-1 text-[#2563EB] hover:underline">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                      security@healthstock.intel
                    </a>
                  </div>
                </div>
              </div>
            )}

            {activeModal === 'terms' && (
              <div className="space-y-6 text-left">
                {/* 1. Header Row */}
                <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] -mt-2">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-[#EFF6FF] rounded-2xl flex items-center justify-center shrink-0 relative">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="8" y1="13" x2="16" y2="13" />
                        <line x1="8" y1="17" x2="14" y2="17" />
                      </svg>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#10B981] rounded-full border-2 border-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white stroke-[4]" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-[#061D4C] tracking-tight">Terms of Use</h3>
                      <p className="text-[10px] text-[#00966C] font-extrabold uppercase tracking-widest mt-0.5">Healthcare Dashboard Terms & Disclaimer</p>
                    </div>
                  </div>
                </div>

                {/* 2. Info Banner Box */}
                <div className="bg-[#EFF6FF] border border-[#DBEAFE] rounded-2xl p-4 flex items-start gap-3.5 shadow-sm">
                  <div className="w-6 h-6 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-[10px] font-extrabold shrink-0 mt-0.5">
                    i
                  </div>
                  <p className="text-xs text-[#061D4C] font-semibold leading-relaxed">
                    Welcome to <strong className="text-[#2563EB]">HealthStock</strong>. By logging in or registering, you agree to comply with the terms of use detailed below.
                  </p>
                </div>

                {/* 3. Sections Content List */}
                <div className="space-y-5 py-2">
                  {/* Section 1 */}
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-[#EFF6FF] rounded-xl flex items-center justify-center shrink-0">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="6" />
                        <circle cx="12" cy="12" r="2" />
                      </svg>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-[#061D4C] text-[13px] tracking-tight">1. Scope of Service</h4>
                      <p className="text-xs text-[#64748B] leading-relaxed font-semibold font-semibold">
                        HealthStock acts strictly as a compliance logging helper and inventory depletion reminder simulator. It does <strong className="text-[#2563EB]">NOT</strong> provide professional medical advice, diagnostic services, or direct pharmacist consultations.
                      </p>
                    </div>
                  </div>

                  <div className="h-px bg-[#E2E8F0]" />

                  {/* Section 2 */}
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-[#E6F7F0] rounded-xl flex items-center justify-center shrink-0">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                        <path d="M3 20h18" />
                      </svg>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-[#061D4C] text-[13px] tracking-tight">2. Adherence Metrics Disclaimer</h4>
                      <p className="text-xs text-[#64748B] leading-relaxed font-semibold">
                        The compliance score computations and weekday insights are mathematically evaluated based solely on user inputs. These figures should not replace clinical consultations or automated prescription schedules.
                      </p>
                    </div>
                  </div>

                  <div className="h-px bg-[#E2E8F0]" />

                  {/* Section 3 */}
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-[#F3E8FF] rounded-xl flex items-center justify-center shrink-0">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9333EA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <circle cx="12" cy="11" r="3" />
                        <path d="M8 17a5 5 0 0 1 8 0" />
                      </svg>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-[#061D4C] text-[13px] tracking-tight">3. Account Integrity</h4>
                      <p className="text-xs text-[#64748B] leading-relaxed font-semibold">
                        Users are responsible for setting strong credentials and verifying that medication details match prescribed directions.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 4. Footer Accept Banner */}
                <div className="p-4 bg-[#F0FDF4] border border-[#DCFCE7] rounded-2xl flex items-center gap-3 shadow-sm text-[11px] font-bold text-[#64748B]">
                  <div className="w-6 h-6 bg-[#E6F7F0] rounded-full flex items-center justify-center shrink-0">
                    <Shield className="w-3.5 h-3.5 text-[#10B981]" />
                  </div>
                  <p className="leading-relaxed font-semibold">
                    By continuing usage of this system, you confirm you accept these terms.
                  </p>
                </div>
              </div>
            )}

            {activeModal === 'docs' && (
              <div className="space-y-6 text-left">
                {/* 1. Header Row */}
                <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] -mt-2">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-[#EFF6FF] rounded-2xl flex items-center justify-center shrink-0 relative">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                      </svg>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#2563EB] rounded-full border-2 border-white flex items-center justify-center text-[8px] font-black text-white">
                        i
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-[#061D4C] tracking-tight">Documentation & Guide</h3>
                      <p className="text-[10px] text-[#00966C] font-extrabold uppercase tracking-widest mt-0.5">Advanced User Manual</p>
                    </div>
                  </div>
                </div>

                {/* 2. Cards Content List */}
                <div className="space-y-4">
                  {/* Card 1 */}
                  <div className="bg-white border border-[#E2E8F0] rounded-3xl p-5 flex gap-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-[#EFF6FF] rounded-2xl flex items-center justify-center shrink-0 relative">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v2" />
                        <rect x="5" y="6" width="14" height="16" rx="2" />
                        <line x1="9" y1="14" x2="15" y2="14" />
                        <line x1="12" y1="11" x2="12" y2="17" />
                      </svg>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#2563EB] rounded-full border-2 border-white flex items-center justify-center text-white">
                        <span className="text-[10px] font-bold">+</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="font-extrabold text-[#061D4C] text-[14px] tracking-tight">1. Add Your Medications</h4>
                      <p className="text-xs text-[#64748B] leading-relaxed font-semibold">
                        Go to the <strong className="text-[#2563EB]">"Inventory"</strong> tab, click <strong className="text-[#2563EB]">"Add New Medicine"</strong>, and specify details. Capacity indicates your box capacity, and stock tracking reflects current reserves.
                      </p>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="bg-white border border-[#E2E8F0] rounded-3xl p-5 flex gap-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-[#E6F7F0] rounded-2xl flex items-center justify-center shrink-0 relative">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                        <path d="M9 14l2 2 4-4" />
                      </svg>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#10B981] rounded-full border-2 border-white flex items-center justify-center">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12,6 12,12 16,14" />
                        </svg>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="font-extrabold text-[#061D4C] text-[14px] tracking-tight">2. Log Daily Intakes</h4>
                      <p className="text-xs text-[#64748B] leading-relaxed font-semibold">
                        Use the <strong className="text-[#10B981]">"Dose Simulator"</strong> tab to record daily intakes. Clicking <strong className="text-[#10B981]">"Taken"</strong> decreases current stock by 1, whereas <strong className="text-[#10B981]">"Skip"</strong> or <strong className="text-[#10B981]">"Miss"</strong> registers compliance reports without reducing quantity.
                      </p>
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div className="bg-white border border-[#E2E8F0] rounded-3xl p-5 flex gap-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-[#F3E8FF] rounded-2xl flex items-center justify-center shrink-0 relative">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9333EA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                        <path d="M3 20h18" />
                        <path d="M4 10l8-5 8 5" />
                      </svg>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#9333EA] rounded-full border-2 border-white flex items-center justify-center">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="font-extrabold text-[#061D4C] text-[14px] tracking-tight">3. Refills & Exports</h4>
                      <p className="text-xs text-[#64748B] leading-relaxed font-semibold">
                        Low inventory stocks trigger warnings in the notification bell. In the <strong className="text-[#9333EA]">"Refills"</strong> tab, clicking <strong className="text-[#9333EA]">"Process Refill"</strong> resets current stock back to max box capacity. Export PDF summaries directly from the <strong className="text-[#9333EA]">"History"</strong> tab.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ConfirmProvider>
        <HealthStoreProvider>
          <AppContent />
        </HealthStoreProvider>
      </ConfirmProvider>
    </AuthProvider>
  );
}
