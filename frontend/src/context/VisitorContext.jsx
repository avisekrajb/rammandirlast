// context/VisitorContext.jsx
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { v4 as uuidv4 } from 'uuid';

const VisitorContext = createContext(null);

export const useVisitor = () => {
  const context = useContext(VisitorContext);
  if (!context) {
    throw new Error('useVisitor must be used within VisitorProvider');
  }
  return context;
};

/**
 * Visitor tracking.
 *
 * `sessionId` is a per-tab UUID used to group a browsing session together. It
 * is deliberately NOT what drives the visitor totals: every reload and every
 * new tab mints a new sessionId, so counting distinct sessionIds inflates the
 * numbers with no real visitor behind them.
 *
 * The real totals are counted per IP address per day on the server
 * (see Visitor.distinctVisitorsByIp). One network = one visit, so a refresh
 * loop or 20 tabs do not add 20 visitors.
 */
export const VisitorProvider = ({ children }) => {
  const location = useLocation();
  const [visitorId, setVisitorId] = useState(null);
  const [totalVisits, setTotalVisits] = useState(0);
  const trackedPages = useRef(new Set());
  const entryTime = useRef(null);
  const currentPage = useRef('');
  const isTracking = useRef(false);

  // Per-tab session ID. sessionStorage (not localStorage) is intentional:
  // a new tab is a new session, which is what "session" means for analytics.
  useEffect(() => {
    try {
      let sessionId = sessionStorage.getItem('visitor_session_id');
      if (!sessionId) {
        sessionId = uuidv4();
        sessionStorage.setItem('visitor_session_id', sessionId);
      }
      setVisitorId(sessionId);

      // Visit counter for this tab. sessionStorage is cleared when the tab
      // closes, so this resets naturally and never drifts upward.
      const count = parseInt(sessionStorage.getItem('visitor_visit_count') || '0', 10) + 1;
      sessionStorage.setItem('visitor_visit_count', String(count));
      sessionStorage.setItem('visitor_session_started', 'true');
      setTotalVisits(count);
    } catch (error) {
      console.error('Visitor session error:', error);
    }
  }, []);

  // Update time spent on page
  const updateTimeSpent = async (page, timeSpent) => {
    if (!visitorId) return;
    try {
      await api.post('/visitors/time', {
        sessionId: visitorId,
        page,
        timeSpent,
      });
    } catch (error) {
      console.error('Error updating time spent:', error);
    }
  };

  // Track page views
  useEffect(() => {
    if (!visitorId || isTracking.current) return;

    const currentPath = location.pathname;
    const pageTitle = document.title || 'Shree Ramchandra Temple';

    const pageKey = `${currentPath}`;
    if (trackedPages.current.has(pageKey)) {
      if (entryTime.current && currentPage.current) {
        const timeSpent = Math.floor((Date.now() - entryTime.current) / 1000);
        if (timeSpent > 0) {
          updateTimeSpent(currentPage.current, timeSpent);
        }
      }
      entryTime.current = Date.now();
      currentPage.current = currentPath;
      return;
    }

    trackedPages.current.add(pageKey);

    const trackVisitor = async () => {
      try {
        isTracking.current = true;

        await api.post('/visitors/track', {
          sessionId: visitorId,
          page: currentPath,
          pageTitle: pageTitle,
          referrer: document.referrer || '',
          userAgent: navigator.userAgent,
          // Whether this browser profile is seeing the site for the first
          // time. Note this is a client-side flag only — the authoritative
          // "new vs returning" decision is made server-side from the IP.
          isNewVisitor: totalVisits <= 1,
          visitCount: totalVisits,
        });

        entryTime.current = Date.now();
        currentPage.current = currentPath;
      } catch (error) {
        console.error('Error tracking visitor:', error);
      } finally {
        isTracking.current = false;
      }
    };

    const timeoutId = setTimeout(trackVisitor, 500);

    return () => {
      clearTimeout(timeoutId);
    };
    // totalVisits is read inside trackVisitor but the effect must only re-run
    // when the page or the session changes, not on every counter bump.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, visitorId]);

  // Track time spent on page when leaving
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (entryTime.current && currentPage.current) {
        const timeSpent = Math.floor((Date.now() - entryTime.current) / 1000);
        if (timeSpent > 0) {
          updateTimeSpent(currentPage.current, timeSpent);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload();
    };
  }, []);

  return (
    <VisitorContext.Provider value={{ visitorId, totalVisits }}>
      {children}
    </VisitorContext.Provider>
  );
};