import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from './ToastContext';

const AdminLogsContext = createContext(null);

// Mirrors ADMIN_LOG_LIMIT in backend/src/controllers/adminController.js. Only
// used for optimistic local trimming; the server is the real authority.
const LOG_LIMIT = 50;

export const useAdminLogs = () => {
  const context = useContext(AdminLogsContext);
  if (!context) {
    throw new Error('useAdminLogs must be used within AdminLogsProvider');
  }
  return context;
};

export const AdminLogsProvider = ({ children }) => {
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    retained: 0,
    limit: LOG_LIMIT,
  });

  // Fetch logs
  /**
   * Fetch the retained logs (newest first, capped at 50 on the server).
   *
   * Stats come from the dedicated /stats endpoint rather than being derived
   * from the loaded page. Deriving them from the list meant the panel reported
   * at most 50 "total" entries no matter how many had actually been recorded.
   */
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        api.get('/admin/activity'),
        api.get('/admin/activity/stats').catch(() => null),
      ]);

      const logsData = Array.isArray(logsRes.data) ? logsRes.data : [];

      // Newest first: the server sorts, but sorting here keeps the guarantee
      // even if a future change returns an unsorted list.
      logsData.sort(
        (a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
      );
      setLogs(logsData);

      if (statsRes?.data?.data) {
        setStats(statsRes.data.data);
      } else {
        // Fallback only if /stats is unreachable.
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(startOfToday);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const monthAgo = new Date(startOfToday);
        monthAgo.setMonth(monthAgo.getMonth() - 1);

        setStats({
          total: logsData.length,
          today: logsData.filter((l) => new Date(l.timestamp) >= startOfToday).length,
          thisWeek: logsData.filter((l) => new Date(l.timestamp) >= weekAgo).length,
          thisMonth: logsData.filter((l) => new Date(l.timestamp) >= monthAgo).length,
        });
      }
    } catch (error) {
      console.error('Error fetching admin logs:', error);
      setLogs([]);
      setStats({ total: 0, today: 0, thisWeek: 0, thisMonth: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Add a new log entry.
   *
   * The response is nested under `data`, so the previous version inserted the
   * whole `{ success, data }` envelope into the list and the panel rendered an
   * empty row for it. Unwrap first, and respect the retention cap locally so
   * the UI drops the oldest entry immediately rather than after a refetch.
   */
  const addLog = useCallback(async (action, details = {}) => {
    try {
      const response = await api.post('/admin/activity/log', {
        action,
        details,
      });

      const created = response?.data?.data || null;
      if (created) {
        setLogs((prev) => [created, ...prev].slice(0, LOG_LIMIT));
      }

      // Stats now come from the server, so refresh rather than guessing.
      fetchLogs();
      return created;
    } catch (error) {
      console.error('Error adding log:', error);
      // Don't show toast for log errors
      return null;
    }
  }, [fetchLogs]);

  // Get logs by type
  const getLogsByType = useCallback((type) => {
    return logs.filter(log => log.action?.includes(type) || log.type === type);
  }, [logs]);

  // Get recent logs (already newest-first, so a plain head slice is correct)
  const getRecentLogs = useCallback((limit = 10) => {
    return logs.slice(0, limit);
  }, [logs]);

  // Clear logs (admin only)
  const clearLogs = useCallback(async () => {
    if (!window.confirm('Are you sure you want to clear all admin logs?')) return;
    try {
      await api.delete('/admin/activity');
      setLogs([]);
      setStats({
        total: 0,
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        retained: 0,
        limit: LOG_LIMIT,
      });
      showToast('Admin logs cleared successfully', 'success');
    } catch (error) {
      console.error('Error clearing logs:', error);
      showToast('Failed to clear logs', 'error');
    }
  }, [showToast]);

  // Initial fetch
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <AdminLogsContext.Provider
      value={{
        logs,
        loading,
        stats,
        fetchLogs,
        addLog,
        getLogsByType,
        getRecentLogs,
        clearLogs,
      }}
    >
      {children}
    </AdminLogsContext.Provider>
  );
};