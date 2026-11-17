import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Plus, Trash2, Edit3, Check, DollarSign, Calendar, Layers, ShieldCheck, Home, Heart, ShoppingBag } from 'lucide-react';

const GOAL_COLORS = [
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#f97316', // Orange
];

const DEFAULT_GOALS = [
  { id: 'goal-1', title: 'Building House', target: 50000000, allocatedPct: 40, color: '#10b981' },
  { id: 'goal-2', title: 'Fixed Deposit', target: 20000000, allocatedPct: 25, color: '#f59e0b' },
  { id: 'goal-3', title: 'Health Package', target: 5000000, allocatedPct: 15, color: '#3b82f6' },
  { id: 'goal-4', title: 'Food & Bills', target: 3000000, allocatedPct: 10, color: '#ec4899' },
  { id: 'goal-5', title: 'Emergency Fund', target: 10000000, allocatedPct: 10, color: '#8b5cf6' }
];

const DEFAULT_EXPENSES = [
  { id: 'exp-1', title: 'Groceries', amount: 45000, category: 'Food', date: new Date().toISOString().split('T')[0] },
  { id: 'exp-2', title: 'Transport', amount: 35000, category: 'Commute', date: new Date().toISOString().split('T')[0] },
  { id: 'exp-3', title: 'Utilities', amount: 80000, category: 'Bills', date: new Date(Date.now() - 86400000).toISOString().split('T')[0] }
];

export default function Planning() {
  const [activeTab, setActiveTab] = useState('savings'); // 'savings' | 'expenses'
  
  // Base allocation mode: 'deposit' (on each deposit) or 'balance' (on current savings balance)
  const [allocationMode, setAllocationMode] = useState(() => {
    return localStorage.getItem('dc_planning_allocation_mode') || 'deposit';
  });

  // Base amounts
  const [monthlyDeposit, setMonthlyDeposit] = useState(() => {
    const saved = localStorage.getItem('dc_planning_monthly_savings');
    return saved ? Number(saved) : 2500000;
  });

  const [currentSavingsBalance, setCurrentSavingsBalance] = useState(() => {
    const saved = localStorage.getItem('dc_planning_savings_balance');
    return saved ? Number(saved) : 25000000;
  });

  // Goals State
  const [goals, setGoals] = useState(() => {
    try {
      const saved = localStorage.getItem('dc_planning_goals');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((g, idx) => ({ ...g, color: g.color || GOAL_COLORS[idx % GOAL_COLORS.length] }));
      }
      return DEFAULT_GOALS;
    } catch {
      return DEFAULT_GOALS;
    }
  });

  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalPct, setNewGoalPct] = useState('10');
  const [editingTargetId, setEditingTargetId] = useState(null);

  // Expense State
  const [expenses, setExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem('dc_planning_expenses');
      return saved ? JSON.parse(saved) : DEFAULT_EXPENSES;
    } catch {
      return DEFAULT_EXPENSES;
    }
  });

  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Food');
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Persist storage
  useEffect(() => {
    localStorage.setItem('dc_planning_allocation_mode', allocationMode);
  }, [allocationMode]);

  useEffect(() => {
    localStorage.setItem('dc_planning_monthly_savings', String(monthlyDeposit));
  }, [monthlyDeposit]);

  useEffect(() => {
    localStorage.setItem('dc_planning_savings_balance', String(currentSavingsBalance));
  }, [currentSavingsBalance]);

  useEffect(() => {
    localStorage.setItem('dc_planning_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('dc_planning_expenses', JSON.stringify(expenses));
  }, [expenses]);

  // Goal updates
  const handleUpdateGoalPct = (id, newPct) => {
    const clamped = Math.max(0, Math.min(100, Number(newPct) || 0));
    setGoals(goals.map(g => g.id === id ? { ...g, allocatedPct: clamped } : g));
  };

  const handleUpdateGoalTarget = (id, newTarget) => {
    const val = Math.max(0, Number(newTarget) || 0);
    setGoals(goals.map(g => g.id === id ? { ...g, target: val } : g));
  };

  const handleDeleteGoal = (id) => {
    if (goals.length <= 1) return;
    setGoals(goals.filter(g => g.id !== id));
  };

  const handleAddGoal = (e) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;
    const targetVal = Number(newGoalTarget) || 5000000;
    const pctVal = Math.min(100, Math.max(1, Number(newGoalPct) || 10));
    const newG = {
      id: `goal-${Date.now()}`,
      title: newGoalTitle.trim(),
      target: targetVal,
      allocatedPct: pctVal,
      color: GOAL_COLORS[goals.length % GOAL_COLORS.length]
    };
    setGoals([...goals, newG]);
    setNewGoalTitle('');
    setNewGoalTarget('');
    setNewGoalPct('10');
    setShowAddGoal(false);
  };

  // Active base capital for calculations
  const activeBaseCapital = allocationMode === 'deposit' ? monthlyDeposit : currentSavingsBalance;

  // Circle math & goal stats
  const totalAllocatedPct = goals.reduce((acc, g) => acc + (Number(g.allocatedPct) || 0), 0);
  const normalizedGoals = goals.map((g, idx) => {
    const rawPct = Number(g.allocatedPct) || 0;
    const effectivePct = totalAllocatedPct > 0 ? (rawPct / totalAllocatedPct) * 100 : 0;
    const savedAmount = Math.round((rawPct / 100) * activeBaseCapital);
    const target = Number(g.target) || 1;
    const remainingBalance = Math.max(0, target - savedAmount);
    const progressPct = Math.min(100, Math.round((savedAmount / target) * 100));

    return {
      ...g,
      color: g.color || GOAL_COLORS[idx % GOAL_COLORS.length],
      effectivePct,
      savedAmount,
      remainingBalance,
      progressPct
    };
  });

  const radius = 68;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;
  let cumulativePct = 0;

  // Expenses Calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const todayTotal = expenses
    .filter(e => e.date === todayStr)
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const weekTotal = expenses
    .filter(e => new Date(e.date) >= startOfWeek)
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const monthTotal = expenses
    .filter(e => new Date(e.date) >= startOfMonth)
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const yearTotal = todayTotal > 0 ? todayTotal * 365 : (monthTotal > 0 ? monthTotal * 12 : weekTotal * 52);

  const handleAddExpense = (e) => {
    e.preventDefault();
    const amt = Number(expenseAmount);
    if (!amt || amt <= 0) return;
    const newEntry = {
      id: `exp-${Date.now()}`,
      title: expenseTitle.trim() || expenseCategory,
      amount: amt,
      category: expenseCategory,
      date: expenseDate || todayStr
    };
    setExpenses([newEntry, ...expenses]);
    setExpenseTitle('');
    setExpenseAmount('');
  };

  const handleDeleteExpense = (id) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 pt-4 sm:pt-6 pb-24 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* Minimal Tab Switcher */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab('savings')}
              className={`px-6 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer ${
                activeTab === 'savings'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Saving goals
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('expenses')}
              className={`px-6 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer ${
                activeTab === 'expenses'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Expenses
            </button>
          </div>
        </div>

        {/* ── TAB 1: SAVING GOALS ── */}
        {activeTab === 'savings' && (
          <div className="space-y-6">

            {/* Base Allocation Switcher: Each Deposit vs Current Savings Balance */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                  Distribution Base
                </span>
                <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setAllocationMode('deposit')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      allocationMode === 'deposit'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    On Each Deposit
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllocationMode('balance')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      allocationMode === 'balance'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    On Current Savings Balance
                  </button>
                </div>
              </div>

              {/* Amount Input for Active Mode */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
                  {allocationMode === 'deposit' ? 'Monthly Deposit:' : 'Savings Balance:'}
                </span>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">UGX</span>
                  {allocationMode === 'deposit' ? (
                    <input
                      type="number"
                      step="50000"
                      min="50000"
                      value={monthlyDeposit}
                      onChange={(e) => setMonthlyDeposit(Math.max(0, Number(e.target.value) || 0))}
                      className="pl-11 pr-3 py-1.5 w-36 sm:w-44 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-emerald-500"
                    />
                  ) : (
                    <input
                      type="number"
                      step="500000"
                      min="100000"
                      value={currentSavingsBalance}
                      onChange={(e) => setCurrentSavingsBalance(Math.max(0, Number(e.target.value) || 0))}
                      className="pl-11 pr-3 py-1.5 w-36 sm:w-44 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-emerald-500"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Donut Circle Representation & Action Bar */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center relative">
              <div className="w-full flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Goals Allocation Circle
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-600">({totalAllocatedPct}%)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddGoal(!showAddGoal)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Goal</span>
                </button>
              </div>

              {/* Donut Circle */}
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center my-2">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 180 180">
                  <circle
                    cx="90"
                    cy="90"
                    r={radius}
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-slate-100 dark:text-slate-800"
                  />
                  {normalizedGoals.map((g) => {
                    const strokeDasharray = `${(g.effectivePct / 100) * circumference} ${circumference}`;
                    const strokeDashoffset = -((cumulativePct / 100) * circumference);
                    cumulativePct += g.effectivePct;
                    return (
                      <circle
                        key={g.id}
                        cx="90"
                        cy="90"
                        r={radius}
                        fill="transparent"
                        stroke={g.color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-300"
                      />
                    );
                  })}
                </svg>

                {/* Donut Center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {allocationMode === 'deposit' ? 'Monthly' : 'Balance'}
                  </span>
                  <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-mono leading-tight">
                    UGX {(activeBaseCapital / 1000).toLocaleString()}k
                  </span>
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                    Distributed
                  </span>
                </div>
              </div>

              {/* Color legend pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 w-full text-xs">
                {normalizedGoals.map((g) => (
                  <div key={g.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-bold">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
                    <span className="text-slate-800 dark:text-slate-200">{g.title}</span>
                    <span className="text-slate-400 font-mono font-semibold">{g.allocatedPct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Goal Form (Conditional) */}
            {showAddGoal && (
              <form onSubmit={handleAddGoal} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm animate-in fade-in">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                  Add New Goal Package
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Goal Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Land Purchase"
                      value={newGoalTitle}
                      onChange={(e) => setNewGoalTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Target Amount (UGX)</label>
                    <input
                      type="number"
                      required
                      step="500000"
                      placeholder="10000000"
                      value={newGoalTarget}
                      onChange={(e) => setNewGoalTarget(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Percentage Share (%)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="100"
                      value={newGoalPct}
                      onChange={(e) => setNewGoalPct(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddGoal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                  >
                    Save Goal
                  </button>
                </div>
              </form>
            )}

            {/* ── GOAL CARDS: EACH IN THE COLOR OF ITS REPRESENTATION ON THE CIRCLE ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Goal Breakdown Cards ({normalizedGoals.length})
                </h4>
                <span className="text-[11px] text-slate-400 font-medium">Edit percentages directly below</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {normalizedGoals.map((g) => (
                  <div
                    key={g.id}
                    className="rounded-3xl p-5 border-2 transition-all shadow-sm flex flex-col justify-between relative overflow-hidden bg-white dark:bg-slate-900"
                    style={{
                      borderColor: g.color,
                      boxShadow: `0 4px 18px ${g.color}15`
                    }}
                  >
                    {/* Top color bar accent */}
                    <div
                      className="absolute top-0 left-0 right-0 h-1.5"
                      style={{ backgroundColor: g.color }}
                    />

                    <div>
                      {/* Card Header: Title, Color Badge & Delete */}
                      <div className="flex items-center justify-between mb-3 pt-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: g.color }}
                          />
                          <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                            {g.title}
                          </h3>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-xs font-mono font-black px-2.5 py-0.5 rounded-full text-white shadow-sm"
                            style={{ backgroundColor: g.color }}
                          >
                            {g.allocatedPct}%
                          </span>

                          {goals.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteGoal(g.id)}
                              className="text-slate-400 hover:text-rose-500 p-1 transition"
                              title="Delete Goal"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 3 Key Stats: Target, Saved (Cash at Hand), Remaining */}
                      <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-800/80 mb-3 text-xs">
                        {/* Target */}
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Target
                          </span>
                          {editingTargetId === g.id ? (
                            <div className="flex items-center gap-1 mt-0.5">
                              <input
                                type="number"
                                step="500000"
                                value={g.target}
                                onChange={(e) => handleUpdateGoalTarget(g.id, e.target.value)}
                                className="w-full px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs font-bold"
                              />
                              <button
                                type="button"
                                onClick={() => setEditingTargetId(null)}
                                className="text-emerald-600 font-bold p-0.5"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => setEditingTargetId(g.id)}
                              className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate cursor-pointer hover:underline"
                              title="Click to edit target"
                            >
                              UGX {(g.target / 1000).toLocaleString()}k
                            </div>
                          )}
                        </div>

                        {/* Saved (Cash at Hand) */}
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Saved
                          </span>
                          <div
                            className="font-mono font-black mt-0.5 truncate"
                            style={{ color: g.color }}
                          >
                            UGX {(g.savedAmount / 1000).toLocaleString()}k
                          </div>
                        </div>

                        {/* Remaining */}
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Remaining
                          </span>
                          <div className="font-mono font-bold text-rose-500 mt-0.5 truncate">
                            UGX {(g.remainingBalance / 1000).toLocaleString()}k
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar in Goal's Color */}
                      <div className="space-y-1 mb-3">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                          <span>Target Achieved</span>
                          <span className="font-mono font-bold" style={{ color: g.color }}>{g.progressPct}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${g.progressPct}%`,
                              backgroundColor: g.color
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Interactive Percentage Slider */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-[11px] font-bold text-slate-500">
                          Adjust Allocation Share:
                        </span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={g.allocatedPct}
                            onChange={(e) => handleUpdateGoalPct(g.id, e.target.value)}
                            className="w-12 px-1.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs font-bold text-right"
                          />
                          <span className="text-xs font-bold text-slate-400">%</span>
                        </div>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={g.allocatedPct}
                        onChange={(e) => handleUpdateGoalPct(g.id, e.target.value)}
                        className="w-full h-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 cursor-pointer"
                        style={{ accentColor: g.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ── TAB 2: EXPENSES ── */}
        {activeTab === 'expenses' && (
          <div className="space-y-6">
            
            {/* 4 Minimal Time-Based Expense Cards: Today, Week, Month, Year */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Today</span>
                <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono mt-1">
                  UGX {todayTotal.toLocaleString()}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Week</span>
                <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono mt-1">
                  UGX {weekTotal.toLocaleString()}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Month</span>
                <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono mt-1">
                  UGX {monthTotal.toLocaleString()}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Year</span>
                <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                  UGX {yearTotal.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Quick Add Expense Form */}
            <form onSubmit={handleAddExpense} className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Expense item (e.g. Fuel)"
                    value={expenseTitle}
                    onChange={(e) => setExpenseTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    required
                    step="1000"
                    placeholder="Amount (UGX)"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono font-bold"
                  />
                </div>
                <div>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold"
                  >
                    {['Food', 'Commute', 'Bills', 'Family', 'Medical', 'Other'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <button
                    type="submit"
                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-sm cursor-pointer"
                  >
                    + Add Expense
                  </button>
                </div>
              </div>
            </form>

            {/* Expenses Log */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>Recent Expenses</span>
                <span>{expenses.length} records</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-80 overflow-y-auto">
                {expenses.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">No expenses recorded yet.</div>
                ) : (
                  expenses.map((e) => (
                    <div key={e.id} className="px-4 py-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{e.title}</p>
                        <p className="text-[10px] text-slate-400">{e.date} &bull; {e.category}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          UGX {Number(e.amount).toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(e.id)}
                          className="text-slate-400 hover:text-rose-500 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
