'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Flame,
  CheckCircle2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Info,
  Check,
  X,
} from 'lucide-react';
import { FounderCheckin, FounderStats } from '@/types';
import { FOUNDER_EXPERIMENT_START_DATE } from '@/lib/founder180';

export default function Founder180Page() {
  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [stats, setStats] = useState<FounderStats | null>(null);
  const [history, setHistory] = useState<FounderCheckin[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string>('');

  // Daily Check-In Form State
  const [workCompleted, setWorkCompleted] = useState<boolean>(false);
  const [salesCompleted, setSalesCompleted] = useState<boolean>(false);
  const [bodyCompleted, setBodyCompleted] = useState<boolean>(false);
  const [sleepCompleted, setSleepCompleted] = useState<boolean>(false);

  // Fetch check-in data and stats
  const fetchData = useCallback(async (dateToFetch: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/founder-checkins?date=${dateToFetch}`);
      if (!res.ok) throw new Error('Failed to load data');
      const data = await res.json();

      setStats(data.stats);
      setHistory(data.history || []);

      if (data.checkin) {
        setWorkCompleted(Boolean(data.checkin.workCompleted));
        setSalesCompleted(Boolean(data.checkin.salesCompleted));
        setBodyCompleted(Boolean(data.checkin.bodyCompleted));
        setSleepCompleted(Boolean(data.checkin.sleepCompleted));
      } else {
        setWorkCompleted(false);
        setSalesCompleted(false);
        setBodyCompleted(false);
        setSleepCompleted(false);
      }
    } catch (err) {
      console.error('Error fetching founder 180 data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(selectedDate);
  }, [selectedDate, fetchData]);

  // Handle Save / Toggle submit
  const handleSave = async (updatedValues?: {
    work?: boolean;
    sales?: boolean;
    body?: boolean;
    sleep?: boolean;
  }) => {
    const work = updatedValues?.work !== undefined ? updatedValues.work : workCompleted;
    const sales = updatedValues?.sales !== undefined ? updatedValues.sales : salesCompleted;
    const body = updatedValues?.body !== undefined ? updatedValues.body : bodyCompleted;
    const sleep = updatedValues?.sleep !== undefined ? updatedValues.sleep : sleepCompleted;

    try {
      setSaving(true);
      setSaveMessage('');
      const res = await fetch('/api/founder-checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          workCompleted: work,
          salesCompleted: sales,
          bodyCompleted: body,
          sleepCompleted: sleep,
        }),
      });

      if (!res.ok) throw new Error('Failed to save');
      const data = await res.json();

      setStats(data.stats);
      setHistory(data.history || []);
      setSaveMessage('Saved');
      setTimeout(() => setSaveMessage(''), 2000);
    } catch (err) {
      console.error('Error saving check-in:', err);
      setSaveMessage('Error saving');
    } finally {
      setSaving(false);
    }
  };

  const toggleWork = () => {
    const newVal = !workCompleted;
    setWorkCompleted(newVal);
    handleSave({ work: newVal });
  };

  const toggleSales = () => {
    const newVal = !salesCompleted;
    setSalesCompleted(newVal);
    handleSave({ sales: newVal });
  };

  const toggleBody = () => {
    const newVal = !bodyCompleted;
    setBodyCompleted(newVal);
    handleSave({ body: newVal });
  };

  const toggleSleep = () => {
    const newVal = !sleepCompleted;
    setSleepCompleted(newVal);
    handleSave({ sleep: newVal });
  };

  // Live Score calculations for current selection
  const completedCount =
    (workCompleted ? 1 : 0) +
    (salesCompleted ? 1 : 0) +
    (bodyCompleted ? 1 : 0) +
    (sleepCompleted ? 1 : 0);
  const currentScore = completedCount * 20;
  const showedUp = completedCount >= 3;

  // Date navigation helpers
  const shiftDate = (days: number) => {
    const d = new Date(`${selectedDate}T00:00:00`);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const isToday = selectedDate === getTodayStr();

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-cockpit-bg text-cockpit-text p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cockpit-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-meaven-blue" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-100">
              180-Day Founder
            </h1>
          </div>
          <p className="text-xs md:text-sm text-cockpit-muted mt-1">
            Consistency tracking over 180 days with a 4-item daily check-in.
          </p>
        </div>

        {/* Start Date Indicator */}
        <div className="flex items-center gap-2 bg-cockpit-surface border border-cockpit-border px-3 py-1.5 rounded-lg text-xs text-cockpit-muted self-start md:self-auto">
          <Calendar className="w-3.5 h-3.5 text-meaven-blue" />
          <span>Experiment Start: <strong className="text-slate-200">{FOUNDER_EXPERIMENT_START_DATE}</strong></span>
        </div>
      </div>

      {/* Progress Cards Row */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Main Day Progress */}
          <div className="bg-cockpit-surface border border-cockpit-border rounded-xl p-4 shadow-cockpit-card flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-cockpit-muted">Experiment Progress</span>
              <Sparkles className="w-4 h-4 text-meaven-blue" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-100">
                {stats.formattedDay}
              </div>
              <div className="w-full bg-cockpit-border rounded-full h-2 mt-2 overflow-hidden">
                <div
                  className="bg-meaven-blue h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, (stats.currentDay / 180) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          {/* 7-Day Average */}
          <div className="bg-cockpit-surface border border-cockpit-border rounded-xl p-4 shadow-cockpit-card flex flex-col justify-between space-y-2">
            <span className="text-xs font-medium text-cockpit-muted">7-Day Average</span>
            <div className="text-2xl font-bold text-slate-100">
              {stats.sevenDayAvg}%
            </div>
            <span className="text-[11px] text-cockpit-subtle">
              7 Days: {stats.sevenDayAvg}%
            </span>
          </div>

          {/* 30-Day Average */}
          <div className="bg-cockpit-surface border border-cockpit-border rounded-xl p-4 shadow-cockpit-card flex flex-col justify-between space-y-2">
            <span className="text-xs font-medium text-cockpit-muted">30-Day Average</span>
            <div className="text-2xl font-bold text-slate-100">
              {stats.thirtyDayAvg}%
            </div>
            <span className="text-[11px] text-cockpit-subtle">
              30 Days: {stats.thirtyDayAvg}%
            </span>
          </div>

          {/* Overall Average */}
          <div className="bg-cockpit-surface border border-cockpit-border rounded-xl p-4 shadow-cockpit-card flex flex-col justify-between space-y-2">
            <span className="text-xs font-medium text-cockpit-muted">Overall Average</span>
            <div className="text-2xl font-bold text-slate-100">
              {stats.overallAvg}%
            </div>
            <span className="text-[11px] text-cockpit-subtle">
              Overall: {stats.overallAvg}% ({stats.totalCheckinDays} check-in{stats.totalCheckinDays === 1 ? '' : 's'})
            </span>
          </div>
        </div>
      )}

      {/* Main Check-In Card & Date Navigator */}
      <div className="bg-cockpit-surface border border-cockpit-border rounded-xl p-5 md:p-6 shadow-cockpit-card space-y-6">
        {/* Date Selector Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cockpit-border/60 pb-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => shiftDate(-1)}
              className="p-1.5 rounded-lg bg-cockpit-border/40 hover:bg-cockpit-border text-cockpit-text transition-all"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="bg-cockpit-card border border-cockpit-border rounded-lg px-3 py-1.5 text-xs md:text-sm text-slate-100 focus:outline-none focus:border-meaven-blue"
            />
            <button
              onClick={() => shiftDate(1)}
              className="p-1.5 rounded-lg bg-cockpit-border/40 hover:bg-cockpit-border text-cockpit-text transition-all"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {!isToday && (
              <button
                onClick={() => setSelectedDate(getTodayStr())}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-meaven-blue/20 text-meaven-light border border-meaven-blue/30 hover:bg-meaven-blue/30 transition-all"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Today</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs md:text-sm text-cockpit-muted">
              {formatDateLabel(selectedDate)}
            </span>
            {saveMessage && (
              <span className="text-xs text-emerald-400 font-medium animate-pulse">
                {saveMessage}
              </span>
            )}
          </div>
        </div>

        {/* 4 Check-In Questions */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">
            Daily Check-In
          </h2>

          <div className="grid grid-cols-1 gap-3">
            {/* 1. Work */}
            <div
              onClick={toggleWork}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer select-none ${
                workCompleted
                  ? 'bg-meaven-blue/10 border-meaven-blue/50 text-slate-100'
                  : 'bg-cockpit-card border-cockpit-border text-cockpit-muted hover:border-cockpit-subtle'
              }`}
            >
              <div className="mt-0.5">
                <input
                  type="checkbox"
                  checked={workCompleted}
                  onChange={() => {}} // handled by parent onClick
                  className="w-5 h-5 accent-meaven-blue rounded cursor-pointer"
                />
              </div>
              <div className="flex-1">
                <div className="text-sm md:text-base font-semibold text-slate-100 flex items-center justify-between">
                  <span>Work</span>
                  {workCompleted && <span className="text-xs text-meaven-light font-bold">+20 pts</span>}
                </div>
                <div className="text-xs md:text-sm text-cockpit-muted mt-0.5">
                  Completed my most important Meaven work
                </div>
              </div>
            </div>

            {/* 2. Sales */}
            <div
              onClick={toggleSales}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer select-none ${
                salesCompleted
                  ? 'bg-meaven-blue/10 border-meaven-blue/50 text-slate-100'
                  : 'bg-cockpit-card border-cockpit-border text-cockpit-muted hover:border-cockpit-subtle'
              }`}
            >
              <div className="mt-0.5">
                <input
                  type="checkbox"
                  checked={salesCompleted}
                  onChange={() => {}}
                  className="w-5 h-5 accent-meaven-blue rounded cursor-pointer"
                />
              </div>
              <div className="flex-1">
                <div className="text-sm md:text-base font-semibold text-slate-100 flex items-center justify-between">
                  <span>Sales</span>
                  {salesCompleted && <span className="text-xs text-meaven-light font-bold">+20 pts</span>}
                </div>
                <div className="text-xs md:text-sm text-cockpit-muted mt-0.5">
                  Did 5 meaningful sales actions
                </div>
              </div>
            </div>

            {/* 3. Body */}
            <div
              onClick={toggleBody}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer select-none ${
                bodyCompleted
                  ? 'bg-meaven-blue/10 border-meaven-blue/50 text-slate-100'
                  : 'bg-cockpit-card border-cockpit-border text-cockpit-muted hover:border-cockpit-subtle'
              }`}
            >
              <div className="mt-0.5">
                <input
                  type="checkbox"
                  checked={bodyCompleted}
                  onChange={() => {}}
                  className="w-5 h-5 accent-meaven-blue rounded cursor-pointer"
                />
              </div>
              <div className="flex-1">
                <div className="text-sm md:text-base font-semibold text-slate-100 flex items-center justify-between">
                  <span>Body</span>
                  {bodyCompleted && <span className="text-xs text-meaven-light font-bold">+20 pts</span>}
                </div>
                <div className="text-xs md:text-sm text-cockpit-muted mt-0.5">
                  Did 30+ minutes of movement/workout
                </div>
              </div>
            </div>

            {/* 4. Sleep */}
            <div
              onClick={toggleSleep}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer select-none ${
                sleepCompleted
                  ? 'bg-meaven-blue/10 border-meaven-blue/50 text-slate-100'
                  : 'bg-cockpit-card border-cockpit-border text-cockpit-muted hover:border-cockpit-subtle'
              }`}
            >
              <div className="mt-0.5">
                <input
                  type="checkbox"
                  checked={sleepCompleted}
                  onChange={() => {}}
                  className="w-5 h-5 accent-meaven-blue rounded cursor-pointer"
                />
              </div>
              <div className="flex-1">
                <div className="text-sm md:text-base font-semibold text-slate-100 flex items-center justify-between">
                  <span>Sleep</span>
                  {sleepCompleted && <span className="text-xs text-meaven-light font-bold">+20 pts</span>}
                </div>
                <div className="text-xs md:text-sm text-cockpit-muted mt-0.5">
                  Got 7+ hours of sleep
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Score Summary Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-cockpit-card border border-cockpit-border">
          <div className="flex items-center gap-3">
            <div className="text-2xl md:text-3xl font-black text-slate-100">
              {isToday ? "Today's Score" : 'Score'}: {currentScore}%
            </div>
            <span className="text-xs text-cockpit-muted font-medium bg-cockpit-surface px-2.5 py-1 rounded-full border border-cockpit-border">
              {completedCount} / 4 completed
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-cockpit-muted">Showed Up:</span>
            {showedUp ? (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full">
                <Check className="w-3.5 h-3.5" />
                YES
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-500/15 border border-slate-500/30 px-3 py-1 rounded-full">
                <X className="w-3.5 h-3.5" />
                NO
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Daily History Section */}
      <div className="bg-cockpit-surface border border-cockpit-border rounded-xl p-5 md:p-6 shadow-cockpit-card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">
            Check-In History
          </h2>
          <span className="text-xs text-cockpit-muted">
            {history.length} entry{history.length === 1 ? '' : 's'} recorded
          </span>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-8 text-cockpit-muted text-xs md:text-sm border border-dashed border-cockpit-border rounded-xl">
            No check-in history recorded yet. Complete today&apos;s check-in above to start logging.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {history.map((entry) => {
              const isEntrySelected = entry.date === selectedDate;
              return (
                <div
                  key={entry.id}
                  onClick={() => setSelectedDate(entry.date)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isEntrySelected
                      ? 'bg-meaven-blue/15 border-meaven-blue shadow-sm'
                      : 'bg-cockpit-card border-cockpit-border hover:border-cockpit-subtle'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-200">
                      {formatDateLabel(entry.date)}
                    </span>
                    <span className="text-xs font-bold text-slate-100 bg-cockpit-surface px-2 py-0.5 rounded border border-cockpit-border">
                      {entry.calculatedScore}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-cockpit-muted">
                    <span>
                      {(entry.workCompleted ? 1 : 0) +
                        (entry.salesCompleted ? 1 : 0) +
                        (entry.bodyCompleted ? 1 : 0) +
                        (entry.sleepCompleted ? 1 : 0)}{' '}
                      / 4 items
                    </span>

                    {entry.calculatedShowedUp ? (
                      <span className="text-[11px] font-semibold text-emerald-400">
                        Showed Up: YES
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-400">
                        Showed Up: NO
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
