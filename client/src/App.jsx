import React, { useEffect, useState } from 'react';
import style from "./App.module.css";
import Navbar from './components/Navbar/Navbar';
import Hero from './components/Hero/Hero';
import About from './components/About/About';
import Experience from './components/Experience/Experience';
import Project from './components/Project/Project';
import ErrorBoundary from './components/ErrorBoundary';
import Contact from './components/Contact/Contact';
import ParticleBackground from './components/ParticleBackground/ParticleBackground';
import ChatBot from './components/ChatBot/ChatBot';
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import HUD from './components/HUD/HUD';
import CustomCursor from './components/CustomCursor/CustomCursor';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

function App() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isAdminView, setIsAdminView] = useState(window.location.hash === '#admin');
  const [scanlinesActive, setScanlinesActive] = useState(true); // Default to ON for cyber immersion
  const [theme, setTheme] = useState("cyan");
  const [aboutData, setAboutData] = useState(null);

  useEffect(() => {
    const fetchAboutData = async () => {
      try {
        let apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
        apiBaseUrl = apiBaseUrl.trim().replace(/\/$/, '');
        const res = await fetch(`${apiBaseUrl}/api/portfolio/about`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.about) {
            setAboutData(data.about);
          }
        }
      } catch (error) {
        console.warn('Failed to load portfolio dynamic profile details:', error);
      }
    };
    fetchAboutData();
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      setIsAdminView(window.location.hash === '#admin');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  useEffect(() => {
    if (isAdminView) return;

    // Initialize Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // smooth exponential easing
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
    });

    let animId;
    function raf(time) {
      lenis.raf(time);
      animId = requestAnimationFrame(raf);
    }

    animId = requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      cancelAnimationFrame(animId);
    };
  }, [isAdminView]);

  useEffect(() => {
    if (isAdminView) return; // Disable scroll tracker in admin mode

    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        const progress = (window.scrollY / totalScroll) * 100;
        setScrollProgress(progress);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isAdminView]);

  if (isAdminView) {
    return (
      <div className={style.App}>
        <ParticleBackground />
        <div className={style.blobContainer}>
          <div className={`${style.glowBlob} ${style.blobOne}`} />
          <div className={`${style.glowBlob} ${style.blobTwo}`} />
        </div>
        <ErrorBoundary>
          <AdminDashboard />
        </ErrorBoundary>
      </div>
    );
  }

  return (
    <div className={style.App}>
      <CustomCursor />
      {scanlinesActive && <div className="crt-overlay" />}
      
      {/* HUD overlays and controllers */}
      <HUD 
        theme={theme} 
        setTheme={setTheme} 
        scanlinesActive={scanlinesActive} 
        setScanlinesActive={setScanlinesActive} 
      />

      {/* Scroll indicator bar */}
      <div
        className={style.scrollProgress}
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Animated vector particle canvas */}
      <ParticleBackground theme={theme} />

      {/* Premium ambient backdrop blobs */}
      <div className={style.blobContainer}>
        <div className={`${style.glowBlob} ${style.blobOne}`} />
        <div className={`${style.glowBlob} ${style.blobTwo}`} />
        <div className={`${style.glowBlob} ${style.blobThree}`} />
      </div>

      <Navbar aboutData={aboutData} />
      <Hero aboutData={aboutData} />
      <About aboutData={aboutData} />
      <Experience />
      <ErrorBoundary>
        <Project />
      </ErrorBoundary>
      <Contact aboutData={aboutData} />
      <ChatBot aboutData={aboutData} />
    </div>
  );
}

export default App;
