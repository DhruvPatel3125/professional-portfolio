import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './AdminDashboard.module.css';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // overview | chats | inquiries | system

  // Data states
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionMessages, setSessionMessages] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Search and Filter states
  const [searchInquiry, setSearchInquiry] = useState('');
  const [searchChat, setSearchChat] = useState('');
  const [deviceFilter, setDeviceFilter] = useState('all');

  const messagesEndRef = useRef(null);
  let apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
  apiBaseUrl = apiBaseUrl.trim().replace(/\/$/, '');

  useEffect(() => {
    const savedKey = localStorage.getItem('portfolio_admin_passcode');
    if (savedKey) {
      testPasscode(savedKey);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'chats' && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [sessionMessages, loadingMessages, activeTab]);

  const testPasscode = async (keyToTest) => {
    setIsLoading(true);
    setLoginError('');
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': keyToTest
        }
      });

      if (response.ok) {
        localStorage.setItem('portfolio_admin_passcode', keyToTest);
        setPasscode(keyToTest);
        setIsAuthenticated(true);
        loadDashboardData(keyToTest);
      } else {
        localStorage.removeItem('portfolio_admin_passcode');
        setLoginError('Incorrect Passcode. Access Denied.');
      }
    } catch (err) {
      setLoginError('Could not establish backend server connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!passcode.trim()) return;
    testPasscode(passcode);
  };

  const handleLogout = () => {
    localStorage.removeItem('portfolio_admin_passcode');
    setPasscode('');
    setIsAuthenticated(false);
  };

  const loadDashboardData = async (key) => {
    setIsLoading(true);
    const token = key || passcode;
    try {
      const statsRes = await fetch(`${apiBaseUrl}/api/admin/stats`, {
        headers: { 'Authorization': token }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      const sessionsRes = await fetch(`${apiBaseUrl}/api/admin/sessions`, {
        headers: { 'Authorization': token }
      });
      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setSessions(sessionsData.sessions);
      }

      const inquiriesRes = await fetch(`${apiBaseUrl}/api/admin/inquiries`, {
        headers: { 'Authorization': token }
      });
      if (inquiriesRes.ok) {
        const inquiriesData = await inquiriesRes.json();
        setInquiries(inquiriesData.inquiries);
      }
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectChatSession = async (session) => {
    setSelectedSession(session);
    setLoadingMessages(true);
    setSessionMessages([]);
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/sessions/${session.sessionId}`, {
        headers: { 'Authorization': passcode }
      });
      if (response.ok) {
        const data = await response.json();
        setSessionMessages(data.messages);
      }
    } catch (err) {
      console.error('Error loading session conversation:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const deleteInquiryItem = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this inquiry?')) return;
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/inquiries/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': passcode }
      });

      if (response.ok) {
        setInquiries(prev => prev.filter(item => item._id !== id));
        loadDashboardData(passcode);
      }
    } catch (err) {
      console.error('Error deleting inquiry:', err);
    }
  };

  // Filtered inquiries list
  const filteredInquiries = inquiries.filter(inq => {
    const term = searchInquiry.toLowerCase();
    return (
      inq.name.toLowerCase().includes(term) ||
      inq.email.toLowerCase().includes(term) ||
      inq.message.toLowerCase().includes(term) ||
      inq.location.toLowerCase().includes(term)
    );
  });

  // Filtered chat sessions list
  const filteredSessions = sessions.filter(session => {
    const term = searchChat.toLowerCase();
    const matchesSearch = 
      session.location.toLowerCase().includes(term) ||
      session.ipAddress.toLowerCase().includes(term) ||
      session.os.toLowerCase().includes(term) ||
      session.browser.toLowerCase().includes(term) ||
      session.sessionId.toLowerCase().includes(term);

    const matchesDevice = 
      deviceFilter === 'all' || 
      session.device.toLowerCase() === deviceFilter.toLowerCase();

    return matchesSearch && matchesDevice;
  });

  // Animation constants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  if (!isAuthenticated) {
    return (
      <div className={styles.loginContainer}>
        {/* Animated background rings */}
        <div className={styles.glowRing1}></div>
        <div className={styles.glowRing2}></div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={styles.loginCard}
        >
          <div className={styles.avatar}>DP</div>
          <h2>Dhruv Patel</h2>
          <p className={styles.subtitle}>Portfolio Admin Portal</p>
          <form onSubmit={handleLoginSubmit} className={styles.loginForm}>
            <div className={styles.passcodeInputWrapper}>
              <input
                type="password"
                placeholder="Enter Admin Passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className={styles.loginInput}
                disabled={isLoading}
              />
              <div className={styles.inputGlowBorder}></div>
            </div>
            <button type="submit" className={styles.loginBtn} disabled={isLoading}>
              {isLoading ? (
                <div className={styles.btnLoadingRow}>
                  <div className={styles.smallSpinner}></div> Authenticating...
                </div>
              ) : 'Access Dashboard'}
            </button>
            <AnimatePresence>
              {loginError && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={styles.loginError}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block' }}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  {loginError}
                </motion.p>
              )}
            </AnimatePresence>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardLayout}>
      {/* SIDEBAR NAVIGATION */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarBrand}>
          <div className={styles.brandLogo}>DP</div>
          <div className={styles.brandTitle}>
            <h3>Dhruv Patel</h3>
            <span>Admin Suite</span>
          </div>
        </div>

        <div className={styles.sidebarStatus}>
          <div className={styles.statusDotRow}>
            <span className={styles.pulsingDot}></span>
            <strong>MongoDB Atlas:</strong> Connected
          </div>
          <span className={styles.dbHost}>cluster0.mongodb.net</span>
        </div>

        <nav className={styles.sidebarNav}>
          <button
            className={`${styles.navItem} ${activeTab === 'overview' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span className={styles.navIcon}>
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
            </span> Dashboard Overview
          </button>
          <button
            className={`${styles.navItem} ${activeTab === 'chats' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('chats')}
          >
            <span className={styles.navIcon}>
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </span> Chat Dialogues
            {sessions.length > 0 && <span className={styles.badge}>{sessions.length}</span>}
          </button>
          <button
            className={`${styles.navItem} ${activeTab === 'inquiries' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('inquiries')}
          >
            <span className={styles.navIcon}>
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </span> Inbox Requests
            {inquiries.length > 0 && <span className={styles.badgePink}>{inquiries.length}</span>}
          </button>
          <button
            className={`${styles.navItem} ${activeTab === 'system' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('system')}
          >
            <span className={styles.navIcon}>
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </span> System Status
          </button>
        </nav>

        <div className={styles.sidebarFooter}>
          <a href="/" className={styles.portfolioLinkBtn} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            View Portfolio
          </a>
          <button onClick={handleLogout} className={styles.sidebarLogoutBtn} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Logout Session
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className={styles.mainContent}>
        {/* TOP STATUS HEADER BAR */}
        <header className={styles.topBar}>
          <div className={styles.pageInfo}>
            <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Controller</h1>
            <p>Monitor visitor interactions and chatbot analytics</p>
          </div>
          <div className={styles.topBarActions}>
            <button onClick={() => loadDashboardData(passcode)} className={styles.topBarRefreshBtn} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
              </svg>
              Sync Database
            </button>
          </div>
        </header>

        {/* TAB 1: OVERVIEW */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && stats && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit="hidden"
              key="overview-tab"
              className={styles.tabContent}
            >
              {/* STATS MATRIX CARDS */}
              <div className={styles.overviewGrid}>
                <motion.div variants={cardVariants} className={styles.metricCard}>
                  <div className={styles.metricCardHeader}>
                    <span>Unique Conversations</span>
                    <span className={styles.metricIcon}>
                      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                    </span>
                  </div>
                  <div className={styles.metricValue}>{stats.totalSessions}</div>
                  <div className={styles.metricTrend}>
                    <span className={styles.trendUp}>↑ Active</span> since chatbot launch
                  </div>
                  <div className={styles.metricCardGlow1}></div>
                </motion.div>

                <motion.div variants={cardVariants} className={styles.metricCard}>
                  <div className={styles.metricCardHeader}>
                    <span>AI Model Calls</span>
                    <span className={styles.metricIcon}>
                      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                        <rect x="9" y="9" width="6" height="6"></rect>
                        <line x1="9" y1="1" x2="9" y2="4"></line>
                        <line x1="15" y1="1" x2="15" y2="4"></line>
                        <line x1="9" y1="20" x2="9" y2="23"></line>
                        <line x1="15" y1="20" x2="15" y2="23"></line>
                        <line x1="20" y1="9" x2="23" y2="9"></line>
                        <line x1="20" y1="15" x2="23" y2="15"></line>
                        <line x1="1" y1="9" x2="4" y2="9"></line>
                        <line x1="1" y1="15" x2="4" y2="15"></line>
                      </svg>
                    </span>
                  </div>
                  <div className={styles.metricValue}>{stats.totalMessages}</div>
                  <div className={styles.metricTrend}>
                    Llama 3.1 Model responses
                  </div>
                  <div className={styles.metricCardGlow2}></div>
                </motion.div>

                <motion.div variants={cardVariants} className={styles.metricCard}>
                  <div className={styles.metricCardHeader}>
                    <span>Contact Form Inquiries</span>
                    <span className={styles.metricIcon}>
                      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                      </svg>
                    </span>
                  </div>
                  <div className={styles.metricValue}>{stats.totalInquiries}</div>
                  <div className={styles.metricTrend}>
                    Dynamic submissions logged
                  </div>
                  <div className={styles.metricCardGlow3}></div>
                </motion.div>
              </div>

              {/* GRAPHS AND ANALYTICS */}
              <div className={styles.chartsGrid}>
                <motion.div variants={cardVariants} className={styles.chartPanel}>
                  <h2>Device Matrix</h2>
                  <div className={styles.radialStatsRow}>
                    <div className={styles.radialStatCol}>
                      <div className={styles.radialCircle}>
                        <svg viewBox="0 0 36 36" className={styles.circularChart}>
                          <path className={styles.circleBg} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          <path 
                            className={`${styles.circle} ${styles.cyanCircle}`} 
                            strokeDasharray={`${(stats.devices.Desktop / (stats.totalSessions || 1)) * 100}, 100`} 
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                          />
                        </svg>
                        <span className={styles.radialVal}>
                          {Math.round((stats.devices.Desktop / (stats.totalSessions || 1)) * 100)}%
                        </span>
                      </div>
                      <span className={styles.radialLabel} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" style={{ marginRight: '6px' }}><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                        Desktop ({stats.devices.Desktop})
                      </span>
                    </div>

                    <div className={styles.radialStatCol}>
                      <div className={styles.radialCircle}>
                        <svg viewBox="0 0 36 36" className={styles.circularChart}>
                          <path className={styles.circleBg} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          <path 
                            className={`${styles.circle} ${styles.purpleCircle}`} 
                            strokeDasharray={`${(stats.devices.Mobile / (stats.totalSessions || 1)) * 100}, 100`} 
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                          />
                        </svg>
                        <span className={styles.radialVal}>
                          {Math.round((stats.devices.Mobile / (stats.totalSessions || 1)) * 100)}%
                        </span>
                      </div>
                      <span className={styles.radialLabel} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" style={{ marginRight: '6px' }}><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                        Mobile ({stats.devices.Mobile})
                      </span>
                    </div>

                    <div className={styles.radialStatCol}>
                      <div className={styles.radialCircle}>
                        <svg viewBox="0 0 36 36" className={styles.circularChart}>
                          <path className={styles.circleBg} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          <path 
                            className={`${styles.circle} ${styles.pinkCircle}`} 
                            strokeDasharray={`${(stats.devices.Tablet / (stats.totalSessions || 1)) * 100}, 100`} 
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                          />
                        </svg>
                        <span className={styles.radialVal}>
                          {Math.round((stats.devices.Tablet / (stats.totalSessions || 1)) * 100)}%
                        </span>
                      </div>
                      <span className={styles.radialLabel} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" style={{ marginRight: '6px' }}><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                        Tablet ({stats.devices.Tablet})
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* POPULAR BOT CONVERSATIONS KEYWORDS */}
                <motion.div variants={cardVariants} className={styles.chartPanel}>
                  <h2>Frequently Logged User Queries</h2>
                  {stats.commonQueries && stats.commonQueries.length > 0 ? (
                    <div className={styles.queriesOverviewArea}>
                      {stats.commonQueries.map((q, idx) => (
                        <div key={idx} className={styles.questionChipRow}>
                          <span className={styles.chipText}>"{q.query}"</span>
                          <span className={styles.chipCount}>{q.count} times</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.emptyText}>No inquiries compiled yet.</p>
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: CHATS EXPLORER */}
          {activeTab === 'chats' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              key="chats-tab"
              className={`${styles.tabContent} ${styles.chatsWorkspace}`}
            >
              {/* SIDEBAR LIST */}
              <div className={styles.chatsSidebarCard}>
                <div className={styles.sidebarControls}>
                  <input
                    type="text"
                    placeholder="Search Location, IP, Browser..."
                    value={searchChat}
                    onChange={(e) => setSearchChat(e.target.value)}
                    className={styles.searchFilterInput}
                  />
                  <div className={styles.filterTabsRow}>
                    <button 
                      className={`${styles.filterBtn} ${deviceFilter === 'all' ? styles.filterBtnActive : ''}`} 
                      onClick={() => setDeviceFilter('all')}
                    >All</button>
                    <button 
                      className={`${styles.filterBtn} ${deviceFilter === 'desktop' ? styles.filterBtnActive : ''}`} 
                      onClick={() => setDeviceFilter('desktop')}
                    >Desktop</button>
                    <button 
                      className={`${styles.filterBtn} ${deviceFilter === 'mobile' ? styles.filterBtnActive : ''}`} 
                      onClick={() => setDeviceFilter('mobile')}
                    >Mobile</button>
                  </div>
                </div>

                <div className={styles.sidebarSessionItems}>
                  <AnimatePresence>
                    {filteredSessions.length === 0 ? (
                      <p className={styles.emptyText}>No matching logs found.</p>
                    ) : (
                      filteredSessions.map((session, idx) => (
                        <motion.button
                          key={session.sessionId}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          className={`${styles.sessionCardRow} ${selectedSession?.sessionId === session.sessionId ? styles.sessionCardRowSelected : ''}`}
                          onClick={() => selectChatSession(session)}
                        >
                          <div className={styles.sessionMetaLine}>
                            <span className={styles.sessionMetaDevice} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {session.device === 'Mobile' ? (
                                <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2.5" fill="none"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                              ) : session.device === 'Tablet' ? (
                                <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2.5" fill="none"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                              ) : (
                                <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2.5" fill="none"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                              )}
                              {session.device}
                            </span>
                            <span className={styles.sessionMetaBadge}>ID: ...{session.sessionId.slice(-6)}</span>
                          </div>
                          <div className={styles.sessionLocLine} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                              <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            {session.location}
                          </div>
                          <div className={styles.sessionTimeLine}>
                            {new Date(session.lastActivityAt).toLocaleDateString()} at {new Date(session.lastActivityAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </motion.button>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* DETAILED DIALOGUE VIEWER */}
              <div className={styles.chatViewerCard}>
                {selectedSession ? (
                  <div className={styles.viewerContainer}>
                    <div className={styles.viewerHeaderInfo}>
                      <div className={styles.visitorAvatar}>
                        {selectedSession.location.substring(0, 2).toUpperCase() || 'IP'}
                      </div>
                      <div>
                        <h2>Visitor Log - ...{selectedSession.sessionId.slice(-8)}</h2>
                        <div className={styles.visitorMetaTags}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="2" y1="12" x2="22" y2="12"></line>
                              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                            </svg>
                            {selectedSession.location}
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M5 12h14M12 5l7 7-7 7"></path>
                            </svg>
                            {selectedSession.ipAddress}
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="3"></circle>
                              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                            </svg>
                            {selectedSession.os} - {selectedSession.browser}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.viewerBubblesWindow}>
                      {loadingMessages ? (
                        <div className={styles.loaderCenter}>
                          <div className={styles.spinner}></div>
                          <p>Reading chat dialogue thread...</p>
                        </div>
                      ) : sessionMessages.length === 0 ? (
                        <p className={styles.emptyText}>No messages exchanged in this session.</p>
                      ) : (
                        <div className={styles.bubblesList}>
                          {sessionMessages.map((msg, idx) => (
                            <motion.div 
                              key={idx}
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                              className={`${styles.msgRow} ${msg.role === 'user' ? styles.msgRowUser : styles.msgRowBot}`}
                            >
                              <div className={styles.messageContentBlock}>
                                <div className={styles.senderHeader}>
                                  <strong>{msg.role === 'user' ? 'Visitor' : 'AI Assistant'}</strong>
                                  <span>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                                <div className={`${styles.dialogueBubble} ${msg.role === 'user' ? styles.dialogueBubbleUser : styles.dialogueBubbleBot}`}>
                                  {msg.content}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className={styles.viewerEmptyPrompt}>
                    <span className={styles.promptBigIcon}>
                      <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                    </span>
                    <h3>Dialogue Transcript Panel</h3>
                    <p>Select any visitor session from the sidebar to inspect complete AI assistant transcripts and client metadata logs.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 3: VISITOR INQUIRIES */}
          {activeTab === 'inquiries' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              key="inquiries-tab"
              className={styles.tabContent}
            >
              <div className={styles.inquiriesHeaderRow}>
                <input
                  type="text"
                  placeholder="Search name, email, query, or country..."
                  value={searchInquiry}
                  onChange={(e) => setSearchInquiry(e.target.value)}
                  className={styles.searchBarLarge}
                />
              </div>

              <AnimatePresence mode="popLayout">
                {filteredInquiries.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={styles.emptyStateCard}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                      <svg viewBox="0 0 24 24" width="40" height="40" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="22,12 16,12 14,15 10,15 8,12 2,12"></polyline>
                        <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
                      </svg>
                    </div>
                    No matching contact submissions in the inbox.
                  </motion.div>
                ) : (
                  <motion.div 
                    layout 
                    className={styles.inquiriesGrid}
                  >
                    {filteredInquiries.map((inq, idx) => (
                      <motion.div
                        key={inq._id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ duration: 0.3 }}
                        className={styles.inquiryCardItem}
                      >
                        <div className={styles.inquiryItemHeader}>
                          <div className={styles.inquiryUserMeta}>
                            <h4>{inq.name}</h4>
                            <a href={`mailto:${inq.email}`} className={styles.inquiryEmailLink} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2.5" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                              {inq.email}
                            </a>
                          </div>
                          <button 
                            onClick={() => deleteInquiryItem(inq._id)} 
                            className={styles.deleteCardBtn}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                            Delete
                          </button>
                        </div>

                        <div className={styles.inquiryTextBody}>
                          <p>"{inq.message}"</p>
                        </div>

                        <div className={styles.inquiryItemFooter}>
                          <div className={styles.inqFooterRow}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2.5" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                              Location:
                            </span> 
                            <strong>{inq.location}</strong>
                          </div>
                          <div className={styles.inqFooterRow}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2.5" fill="none"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                              Date:
                            </span> 
                            <strong>{new Date(inq.createdAt).toLocaleString()}</strong>
                          </div>
                          <div className={styles.inqFooterRow}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2.5" fill="none"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                              System:
                            </span> 
                            <span className={styles.agentString} title={inq.userAgent}>{inq.userAgent.slice(0, 50)}...</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* TAB 4: SYSTEM STATUS */}
          {activeTab === 'system' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              key="system-tab"
              className={styles.tabContent}
            >
              <div className={styles.systemStatusPanel}>
                <h2>Server Environment Configuration</h2>
                
                <div className={styles.systemMetricsRow}>
                  <div className={styles.sysCard}>
                    <strong>Server Status</strong>
                    <p className={styles.sysActiveText}>ACTIVE / ONLINE</p>
                  </div>
                  <div className={styles.sysCard}>
                    <strong>Database Provider</strong>
                    <p>MongoDB Atlas Cluster</p>
                  </div>
                  <div className={styles.sysCard}>
                    <strong>API Gateway</strong>
                    <p>Express Framework</p>
                  </div>
                  <div className={styles.sysCard}>
                    <strong>AI Language Service</strong>
                    <p>Groq llama-3.1-8b</p>
                  </div>
                </div>

                <div className={styles.systemLogScreen}>
                  <h3>Local Server System Logs</h3>
                  <div className={styles.logTerminal}>
                    <div className={styles.logLine}>[SYSTEM] Startup initialized: Port 3001</div>
                    <div className={styles.logLine}>[DB] Attempting Atlas Cluster connection...</div>
                    <div className={styles.logLine}>[DB] Connected successfully to host: cluster0.mongodb.net</div>
                    <div className={styles.logLine}>[AI] Loaded system prompts and developer knowledge base</div>
                    <div className={styles.logLine}>[CORS] Active rules: allowed frontends '*'</div>
                    <div className={styles.logLine}>[SYSTEM] Port 3001 is listening for API calls...</div>
                    <div className={styles.logLine}>[API] Logged {sessions.length} chats and {inquiries.length} dynamic inquiry messages successfully.</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
