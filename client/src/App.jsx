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

function App() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isAdminView, setIsAdminView] = useState(window.location.hash === '#admin');

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
      {/* Scroll indicator bar */}
      <div
        className={style.scrollProgress}
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Animated vector particle canvas */}
      <ParticleBackground />

      {/* Premium ambient backdrop blobs */}
      <div className={style.blobContainer}>
        <div className={`${style.glowBlob} ${style.blobOne}`} />
        <div className={`${style.glowBlob} ${style.blobTwo}`} />
        <div className={`${style.glowBlob} ${style.blobThree}`} />
      </div>

      <Navbar />
      <Hero />
      <About />
      <Experience />
      <ErrorBoundary>
        <Project />
      </ErrorBoundary>
      <Contact />
      <ChatBot />
    </div>
  );
}

export default App;
