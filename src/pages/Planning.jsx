import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Plus, Trash2, Calendar, DollarSign, PieChart, Shield, Home, Heart, ShoppingBag, Layers, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';

const DEFAULT_GOALS = [
  { id: 'goal-1', title: 'Building House / Property', target: 50000000, allocatedPct: 40, icon: 'home' },
  { id: 'goal-2', title: 'Fixed Deposit / Wealth Fund', target: 20000000, allocatedPct: 25, icon: 'shield' },
  { id: 'goal-3', title: 'Health Package / Insurance', target: 5000000, allocatedPct: 15, icon: 'heart' },
  { id: 'goal-4', title: 'Food & Household Bills', target: 3000000, allocatedPct: 10, icon: 'shopping' },
  { id: 'goal-5', title: 'Emergency Reserve', target: 10000000, allocatedPct: 10, icon: 'layers' }
];

const DEFAULT_EXPENSES = [
  { id: 'exp-1', title: 'Fresh Groceries & Produce', amount: 45000, category: 'Food & Groceries', date: new Date().toISOString().split('T')[0] },
  { id: 'exp-2', title: 'Fuel & Commute', amount: 35000, category: 'Transport', date: new Date().toISOString().split('T')[0] },
  { id: 'exp-3', title: 'Electricity & Water Utilities', amount: 80000, category: 'Utilities', date: new Date(Date.now() - 86400000).toISOString().split('T')[0] }
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
      return saved ? JSON.parse(saved) : DEFAULT_GOALS;
    } catch {
      return DEFAULT_GOALS;
    }
  });

  // New Goal Form
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

  // New Expense Form
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Food & Groceries');
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('dc_planning_monthly_savings', String(totalMonthlySavings));
  }, [totalMonthlySavings]);

  useEffect(() => {
    localStorage.setItem('dc_planning_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('dc_planning_expenses', JSON.stringify(expenses));
  }, [expenses]);

  // Savings Calculations
  const totalAllocatedPct = goals.reduce((acc, g) => acc + (Number(g.allocatedPct) || 0), 0);
  const remainingPct = 100 - totalAllocatedPct;

  const handleUpdateGoalPct = (id, newPct) => {
    const clamped = Math.max(0, Math.min(100, Number(newPct) || 0));
    setGoals(goals.map(g => g.id === id ? { ...g, allocatedPct: clamped } : g));
  };

  const handleUpdateGoalTarget = (id, newTarget) => {
    const val = Math.max(0, Number(newTarget) || 0);
    setGoals(goals.map(g => g.id === id ? { ...g, target: val } : g));
  };

  const handleDeleteGoal = (id) => {
    if (goals.length <= 1) {
      alert('Keep at least one savings goal.');
      return;
    }
    setGoals(goals.filter(g => g.id !== id));
  };

  const handleAddGoal = (e) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;
    const targetVal = Number(newGoalTarget) || 5000000;
    const pctVal = Math.min(100, Math.max(0, Number(newGoalPct) || 10));
    const newG = {
      id: `goal-${Date.now()}`,
      title: newGoalTitle.trim(),
      target: targetVal,
      allocatedPct: pctVal,
      icon: 'target'
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

  // Daily Total (Expenses on Today's Date)
  const todayTotal = expenses
    .filter(e => e.date === todayStr)
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Weekly Total (Last 7 days or current week)
  const weekTotal = expenses
    .filter(e => new Date(e.date) >= startOfWeek)
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Monthly Total (Current calendar month)
  const monthTotal = expenses
    .filter(e => new Date(e.date) >= startOfMonth)
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Cumulative Average Mounting to Yearly
  // If user has expenses recorded today, mount daily * 365, or mount current month * 12
  const projectedYearlyFromDaily = todayTotal > 0 ? todayTotal * 365 : (monthTotal > 0 ? monthTotal * 12 : weekTotal * 52);
  const projectedMonthlyFromDaily = todayTotal > 0 ? todayTotal * 30 : monthTotal;

  const handleAddExpense = (e) => {
    e.preventDefault();
    const amt = Number(expenseAmount);
    if (!amt || amt <= 0) {
      alert('Please enter a valid expense amount.');
      return;
    }
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 pt-20 pb-32 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Target className="w-4 h-4" />
            Financial Advisory &amp; Planning
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Personal &amp; Savings Planning
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Break down your savings into life goals and track daily expenses as they mount from weekly to yearly automatically.
          </p>
        </div>

        {/* Navigation Switcher Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab('savings')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer ${
                activeTab === 'savings'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <PieChart className="w-4 h-4" />
              <span>Savings Goals Breakdown</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('expenses')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer ${
                activeTab === 'expenses'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Daily &rarr; Yearly Expense Tracker</span>
            </button>
          </div>
        </div>

        {/* TAB 1: SAVINGS BREAKDOWN */}
        {activeTab === 'savings' && (
          <div className="space-y-6">

            {/* Total Monthly Savings Input Banner */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Input Monthly Savings Capacity</span>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">Total Monthly Savings (UGX)</h2>
                  <p className="text-xs text-slate-500">Every goal below receives its exact share based on your percentage distribution.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">UGX</span>
                    <input
                      type="number"
                      min="50000"
                      step="50000"
                      value={totalMonthlySavings}
                      onChange={(e) => setTotalMonthlySavings(Math.max(0, Number(e.target.value) || 0))}
                      className="pl-12 pr-4 py-2.5 w-48 sm:w-56 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-base font-black text-emerald-700 dark:text-emerald-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddGoal(!showAddGoal)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Goal</span>
                  </button>
                </div>
              </div>

              {/* Allocation Progress Bar */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                  <span className="text-slate-600 dark:text-slate-400">Allocation Status:</span>
                  <span className={totalAllocatedPct === 100 ? 'text-emerald-600' : totalAllocatedPct > 100 ? 'text-rose-600' : 'text-amber-600'}>
                    {totalAllocatedPct}% Allocated {remainingPct > 0 ? `(${remainingPct}% Unassigned)` : totalAllocatedPct > 100 ? `(${totalAllocatedPct - 100}% Exceeded)` : '(Balanced 100%)'}
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                  {goals.map((g, idx) => {
                    const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-teal-500', 'bg-indigo-500'];
                    const color = colors[idx % colors.length];
                    return (
                      <div
                        key={g.id}
                        style={{ width: `${Math.min(100, g.allocatedPct)}%` }}
                        className={`h-full ${color} transition-all duration-300`}
                        title={`${g.title}: ${g.allocatedPct}%`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal/Inline Add Goal */}
            {showAddGoal && (
              <form onSubmit={handleAddGoal} className="bg-emerald-50/80 dark:bg-emerald-950/20 p-5 rounded-3xl border border-emerald-300 dark:border-emerald-800/40 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">Create Custom Savings Goal</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Goal Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Children Education Fund"
                      value={newGoalTitle}
                      onChange={(e) => setNewGoalTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Target Capital (UGX)</label>
                    <input
                      type="number"
                      required
                      min="100000"
                      step="100000"
                      placeholder="e.g. 15000000"
                      value={newGoalTarget}
                      onChange={(e) => setNewGoalTarget(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Savings Allocation (%)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="100"
                      value={newGoalPct}
                      onChange={(e) => setNewGoalPct(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddGoal(false)}
                    className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold"
                  >
                    Save Goal
                  </button>
                </div>
              </form>
            )}

            {/* Goals Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {goals.map((g) => {
                const monthlyAllocated = Math.round((totalMonthlySavings * (Number(g.allocatedPct) || 0)) / 100);
                const monthsToTarget = monthlyAllocated > 0 ? Math.ceil(g.target / monthlyAllocated) : 0;
                const yearsToTarget = (monthsToTarget / 12).toFixed(1);

                return (
                  <div
                    key={g.id}
                    className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                            <Target className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">{g.title}</h3>
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              UGX {monthlyAllocated.toLocaleString()} / mo ({g.allocatedPct}%)
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteGoal(g.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Remove Goal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Distribution Slider */}
                      <div className="mt-4 space-y-1">
                        <div className="flex justify-between text-[11px] font-bold text-slate-500">
                          <span>Monthly Share</span>
                          <span className="font-mono text-slate-800 dark:text-slate-200">{g.allocatedPct}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={g.allocatedPct}
                          onChange={(e) => handleUpdateGoalPct(g.id, e.target.value)}
                          className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
                        />
                      </div>

                      {/* Target Capital Input */}
                      <div className="mt-3">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Target Goal Capital</label>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono font-bold text-slate-400">UGX</span>
                          <input
                            type="number"
                            min="100000"
                            step="100000"
                            value={g.target}
                            onChange={(e) => handleUpdateGoalTarget(g.id, e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1 text-xs font-mono font-black text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Footer Progress Stat */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] flex items-center justify-between text-slate-500">
                      <span>Timeline:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {monthsToTarget > 0 ? `${monthsToTarget} months (~${yearsToTarget} yrs)` : 'Paused'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* TAB 2: EXPENSES (DAILY -> MOUNTING TO YEARLY) */}
        {activeTab === 'expenses' && (
          <div className="space-y-6">

            {/* Mount Summary Cards (Daily, Weekly, Monthly, Yearly) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Today's Daily Spend</span>
                <span className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400 font-mono block mt-1">
                  UGX {todayTotal.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Logged today</span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Weekly Total</span>
                <span className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 font-mono block mt-1">
                  UGX {weekTotal.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">This week (7 days)</span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Monthly Mounted</span>
                <span className="text-lg sm:text-xl font-black text-blue-600 dark:text-blue-400 font-mono block mt-1">
                  UGX {projectedMonthlyFromDaily.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Auto-mounting</span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-emerald-500/30 bg-emerald-500/5 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">Yearly Cumulative Spend</span>
                <span className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono block mt-1">
                  UGX {projectedYearlyFromDaily.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Mounts to 365 Days</span>
              </div>
            </div>

            {/* Add Expense Entry Form */}
            <form onSubmit={handleAddExpense} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Plus className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Log Daily Expense</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Expense Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Milk & Bread, Cab fare"
                    value={expenseTitle}
                    onChange={(e) => setExpenseTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Amount (UGX) *</label>
                  <input
                    type="number"
                    required
                    min="500"
                    step="500"
                    placeholder="50000"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono font-bold text-rose-600 dark:text-rose-400"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold"
                  >
                    <option value="Food & Groceries">Food &amp; Groceries</option>
                    <option value="Transport">Transport &amp; Fuel</option>
                    <option value="Utilities">Utilities (Water, Power, Net)</option>
                    <option value="Rent & Housing">Rent &amp; Housing</option>
                    <option value="Health & Medical">Health &amp; Medical</option>
                    <option value="Education">Education &amp; Tuition</option>
                    <option value="Family Support">Family Support</option>
                    <option value="Other">Other Personal</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-medium"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition"
                >
                  Record Expense
                </button>
              </div>
            </form>

            {/* Expenses History List */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">Logged Expenses ({expenses.length})</h3>
                <span className="text-[11px] text-slate-400 font-medium">Auto-mounts to cumulative projection</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {expenses.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No expenses recorded yet. Log your daily spends above.
                  </div>
                ) : (
                  expenses.map((item) => (
                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-950/50 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold text-xs">
                          -
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-semibold text-slate-400">{item.category}</span>
                            <span className="text-[10px] text-slate-400">&middot;</span>
                            <span className="text-[10px] text-slate-400 font-mono">{item.date}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono font-black text-rose-600 dark:text-rose-400 text-xs">
                          - UGX {Number(item.amount).toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(item.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition"
                          title="Delete Expense"
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
