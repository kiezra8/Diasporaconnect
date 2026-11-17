import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Plus, Trash2, Edit3, Check, DollarSign, Calendar } from 'lucide-react';

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
  
  // Savings State
  const [totalMonthlySavings, setTotalMonthlySavings] = useState(() => {
    const saved = localStorage.getItem('dc_planning_monthly_savings');
    return saved ? Number(saved) : 2500000;
  });

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

  const [isEditing, setIsEditing] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalPct, setNewGoalPct] = useState('10');

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

  useEffect(() => {
    localStorage.setItem('dc_planning_monthly_savings', String(totalMonthlySavings));
  }, [totalMonthlySavings]);

  useEffect(() => {
    localStorage.setItem('dc_planning_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('dc_planning_expenses', JSON.stringify(expenses));
  }, [expenses]);

  // Goal handlers
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

  // Circle / Donut SVG math
  const totalAllocatedPct = goals.reduce((acc, g) => acc + (Number(g.allocatedPct) || 0), 0);
  const normalizedGoals = goals.map((g, idx) => {
    const rawPct = Number(g.allocatedPct) || 0;
    const effectivePct = totalAllocatedPct > 0 ? (rawPct / totalAllocatedPct) * 100 : 0;
    const monthlyAmt = Math.round((rawPct / 100) * totalMonthlySavings);
    return {
      ...g,
      color: g.color || GOAL_COLORS[idx % GOAL_COLORS.length],
      effectivePct,
      monthlyAmt
    };
  });

  const radius = 68;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;
  let cumulativePct = 0;

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
            
            {/* Monthly Savings Quick Input */}
            <div className="bg-white dark:bg-slate-900 px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly Savings</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">UGX</span>
                <input
                  type="number"
                  min="50000"
                  step="50000"
                  value={totalMonthlySavings}
                  onChange={(e) => setTotalMonthlySavings(Math.max(0, Number(e.target.value) || 0))}
                  className="px-3 py-1.5 w-40 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Circle Breakdown & Summary */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                
                {/* SVG Donut Circle */}
                <div className="md:col-span-5 flex flex-col items-center justify-center">
                  <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 180 180">
                      {/* Background track */}
                      <circle
                        cx="90"
                        cy="90"
                        r={radius}
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        className="text-slate-100 dark:text-slate-800"
                      />
                      {/* Goal arcs */}
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
                            className="transition-all duration-500"
                          />
                        );
                      })}
                    </svg>
                    
                    {/* Circle Center Label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
                      <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-mono leading-tight">
                        UGX {(totalMonthlySavings / 1000).toLocaleString()}k
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">/ month</span>
                    </div>
                  </div>
                </div>

                {/* Goals Summary List */}
                <div className="md:col-span-7 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Goals Summary</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditing(!isEditing)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                          isEditing
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                        <span>{isEditing ? 'Done' : 'Edit'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddGoal(!showAddGoal)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Item</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary Rows */}
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {normalizedGoals.map((g) => (
                      <div
                        key={g.id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: g.color }}
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white truncate">{g.title}</p>
                            <p className="text-[10px] text-slate-400">Target: UGX {g.target.toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            UGX {g.monthlyAmt.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1.5 font-bold">({g.allocatedPct}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Edit Panel (Conditional) */}
            {isEditing && (
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                    Adjust Distribution &amp; Targets
                  </h4>
                  <span className="text-xs font-bold text-emerald-600 font-mono">Total: {totalAllocatedPct}%</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {goals.map((g) => (
                    <div key={g.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="truncate text-slate-900 dark:text-white">{g.title}</span>
                        {goals.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteGoal(g.id)}
                            className="text-rose-500 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={g.allocatedPct}
                          onChange={(e) => handleUpdateGoalPct(g.id, e.target.value)}
                          className="flex-1 accent-emerald-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                        />
                        <span className="text-xs font-mono font-bold w-10 text-right">{g.allocatedPct}%</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="text-slate-400">Target:</span>
                        <input
                          type="number"
                          step="500000"
                          value={g.target}
                          onChange={(e) => handleUpdateGoalTarget(g.id, e.target.value)}
                          className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-slate-800 dark:text-slate-200"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Goal Panel (Conditional) */}
            {showAddGoal && (
              <form onSubmit={handleAddGoal} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm animate-in fade-in">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                  Add New Goal
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Goal Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Farm Land"
                      value={newGoalTitle}
                      onChange={(e) => setNewGoalTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold"
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
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Allocation (%)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="100"
                      value={newGoalPct}
                      onChange={(e) => setNewGoalPct(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono font-bold"
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
