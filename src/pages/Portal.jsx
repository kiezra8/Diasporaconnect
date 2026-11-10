import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getPortalState,
  getAuthSession,
  clearAuthSession,
  submitDepositRequest,
  submitWithdrawalRequest,
  submitSupportTicket,
  approveDeposit,
  distributeFarmDividend,
  addCattleAnimal,
  logDailyMilkSession,
  addSaccoMemberYear2,
  togglePettyCashBanked,
  addCoffeePurchase,
  addCoffeeSaleAndDistribute,
  AUTHORIZED_TESTER
} from '../services/portalState';

export default function Portal() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [portalData, setPortalData] = useState(getPortalState());
  const [activeBranch, setActiveBranch] = useState('client'); // 'client' | 'secretary' | 'admin' | 'board' | 'accountant'
  const [clientTab, setClientTab] = useState('shares'); // 'shares' | 'statement' | 'deposit' | 'withdraw' | 'support'
  const [adminSystemTab, setAdminSystemTab] = useState('sacco'); // 'sacco' | 'farm' | 'coffee'
  const [saccoSubTab, setSaccoSubTab] = useState('year2'); // 'year2' | 'investors' | 'pettyCash'
  const [farmSubTab, setFarmSubTab] = useState('animals'); // 'animals' | 'milk' | 'health' | 'breeding' | 'feed'
  const [notification, setNotification] = useState('');

  // Client Form states
  const [depositAmount, setDepositAmount] = useState('1000000');
  const [depositMethod, setDepositMethod] = useState('MTN Mobile Money (+256 747 325 565)');
  const [depositRef, setDepositRef] = useState('');
  const [depositNotes, setDepositNotes] = useState('');

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDest, setWithdrawDest] = useState('');
  const [withdrawReason, setWithdrawReason] = useState('Personal Investment');

  const [supportSubject, setSupportSubject] = useState('');
  const [supportCategory, setSupportCategory] = useState('Shares & Dividends');
  const [supportMessage, setSupportMessage] = useState('');

  // JBS Farm Cattle Form
  const [cattleTag, setCattleTag] = useState('');
  const [cattleName, setCattleName] = useState('');
  const [cattleBreed, setCattleBreed] = useState('Friesian Purebred');
  const [cattleGender, setCattleGender] = useState('Female');
  const [cattleStage, setCattleStage] = useState('Money Maker / Milking');
  const [cattleYield, setCattleYield] = useState('22.0 L');
  const [cattlePaddock, setCattlePaddock] = useState('Paddock 2 (Luwero)');

  // JBS Farm Milk Logging Form
  const [milkMorning, setMilkMorning] = useState('1150');
  const [milkEvening, setMilkEvening] = useState('980');
  const [milkTemp, setMilkTemp] = useState('3.8°C');
  const [milkOffTaker, setMilkOffTaker] = useState('Brookside Dairy Uganda');
  const [milkRate, setMilkRate] = useState('1650');

  // JBS SACCO Add Member Form
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberNIN, setNewMemberNIN] = useState('');
  const [newMemberCategory, setNewMemberCategory] = useState('Saving Member & Investor');
  const [newMemberJan, setNewMemberJan] = useState('500000');

  // Coffee buying form
  const [coffeeFarmer, setCoffeeFarmer] = useState('');
  const [coffeeTypeBuy, setCoffeeTypeBuy] = useState('Arabica Bugisu AA');
  const [coffeeGradeBuy, setCoffeeGradeBuy] = useState('FAQ Clean');
  const [coffeeMoistureBuy, setCoffeeMoistureBuy] = useState('11.5%');
  const [coffeeBagsBuy, setCoffeeBagsBuy] = useState('50');
  const [coffeeKgBuy, setCoffeeKgBuy] = useState('3000');
  const [coffeeRateBuy, setCoffeeRateBuy] = useState('13000');

  // Coffee selling form
  const [coffeeBuyer, setCoffeeBuyer] = useState('');
  const [coffeeTypeSell, setCoffeeTypeSell] = useState('Arabica Bugisu AA Special');
  const [coffeeTonsSell, setCoffeeTonsSell] = useState('10');
  const [coffeePriceSellUSD, setCoffeePriceSellUSD] = useState('4700');
  const [coffeeProfitUGX, setCoffeeProfitUGX] = useState('38000000');

  // Protect route
  useEffect(() => {
    const auth = getAuthSession();
    if (!auth || auth.email !== AUTHORIZED_TESTER.email) {
      navigate('/signin');
      return;
    }
    setSession(auth);
  }, [navigate]);

  // Sync listener
  useEffect(() => {
    const handleUpdate = () => {
      setPortalData(getPortalState());
    };
    window.addEventListener('diaspora_portal_updated', handleUpdate);
    return () => window.removeEventListener('diaspora_portal_updated', handleUpdate);
  }, []);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4500);
  };

  const handleLogout = () => {
    clearAuthSession();
    navigate('/signin');
  };

  // Submit client deposit
  const handleDepositSubmit = (e) => {
    e.preventDefault();
    if (!depositAmount || Number(depositAmount) <= 0) return;
    submitDepositRequest(depositAmount, depositMethod, depositRef || `REF-${Date.now().toString().slice(-6)}`, depositNotes);
    showNotification('Deposit request submitted! Forwarded to Accountant for ledger reconciliation.');
    setDepositRef('');
    setDepositNotes('');
    setClientTab('statement');
  };

  // Submit client withdrawal
  const handleWithdrawSubmit = (e) => {
    e.preventDefault();
    const amt = Number(withdrawAmount);
    if (!amt || amt <= 0) return;
    if (amt > portalData.client.savingsBalance) {
      alert(`Withdrawal exceeds available liquid savings of ${portalData.client.savingsBalance.toLocaleString()} UGX.`);
      return;
    }
    submitWithdrawalRequest(amt, withdrawDest, withdrawReason);
    showNotification('Withdrawal request submitted for Accountant review.');
    setWithdrawAmount('');
    setWithdrawDest('');
    setClientTab('statement');
  };

  // Submit client support
  const handleSupportSubmit = (e) => {
    e.preventDefault();
    submitSupportTicket(supportSubject, supportCategory, supportMessage);
    showNotification('Support inquiry sent to Diaspora Member Liaison Officer.');
    setSupportSubject('');
    setSupportMessage('');
  };

  // Approve deposit
  const handleApproveDeposit = (reqId) => {
    approveDeposit(reqId);
    showNotification('Deposit approved! Member shares and financial statement synchronized in real-time.');
  };

  // Distribute farm dairy proceeds
  const handleDistributeDairy = () => {
    const share = distributeFarmDividend(25000000);
    showNotification(`Commercial dairy dividend distributed! +${share.toLocaleString()} UGX credited to member shares and financial statement.`);
  };

  // Add Animal to JBS Farm
  const handleAddAnimalSubmit = (e) => {
    e.preventDefault();
    const tag = cattleTag || `JBS-${String(portalData.farmSystem.animals.length + 1).padStart(3, '0')}`;
    addCattleAnimal({
      tagId: tag,
      name: cattleName || 'New Heifer',
      breed: cattleBreed,
      gender: cattleGender,
      stage: cattleStage,
      health: 'Healthy',
      dailyYield: cattleYield,
      sire: 'Alta Genetics 204',
      dam: 'JBS-Dam-09',
      paddock: cattlePaddock
    });
    showNotification(`Cattle ${tag} (${cattleName}) added to Farm Management System.`);
    setCattleTag('');
    setCattleName('');
  };

  // Log Milk Session
  const handleMilkLogSubmit = (e) => {
    e.preventDefault();
    logDailyMilkSession({
      date: new Date().toISOString().split('T')[0],
      morning: milkMorning,
      afternoon: 0,
      evening: milkEvening,
      chillingTemp: milkTemp,
      offTaker: milkOffTaker,
      ratePerL: milkRate
    });
    showNotification('Daily milk production logged and sent to chilling depot ledger.');
  };

  // Add SACCO Member (Year 2)
  const handleAddSaccoMember = (e) => {
    e.preventDefault();
    const janVal = Number(newMemberJan) || 0;
    addSaccoMemberYear2({
      name: newMemberName || 'New Diaspora Member',
      phone: newMemberPhone || '+256 700 000 000',
      nin: newMemberNIN || 'CM00000000UG',
      category: newMemberCategory,
      jan: janVal, feb: 0, mar: 0, apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0,
      total: janVal,
      savings: Math.max(0, janVal - 50000),
      noOfShares: Math.floor(janVal / 100000)
    });
    showNotification(`New member ${newMemberName} added to SACCO Management System.`);
    setNewMemberName('');
    setNewMemberPhone('');
    setNewMemberNIN('');
  };

  // Coffee Purchase
  const handleCoffeePurchaseSubmit = (e) => {
    e.preventDefault();
    const totalUGX = Number(coffeeKgBuy) * Number(coffeeRateBuy);
    addCoffeePurchase({
      farmerName: coffeeFarmer || 'Local Outgrower Co-op',
      coffeeType: coffeeTypeBuy,
      grade: coffeeGradeBuy,
      moisture: coffeeMoistureBuy,
      bags: Number(coffeeBagsBuy),
      netWeightKg: Number(coffeeKgBuy),
      ratePerKg: Number(coffeeRateBuy),
      totalUGX
    });
    showNotification(`Coffee purchase recorded: ${coffeeKgBuy} KG purchased from ${coffeeFarmer}. Warehouse inventory updated.`);
    setCoffeeFarmer('');
  };

  // Coffee Sale
  const handleCoffeeSaleSubmit = (e) => {
    e.preventDefault();
    const tons = Number(coffeeTonsSell);
    const priceUSD = Number(coffeePriceSellUSD);
    const totalUSD = tons * priceUSD;
    const totalUGX = totalUSD * 3700;
    const profitUGX = Number(coffeeProfitUGX);

    const clientShare = addCoffeeSaleAndDistribute({
      buyerName: coffeeBuyer || 'European Roastery Group',
      coffeeType: coffeeTypeSell,
      quantityTons: tons,
      pricePerTonUSD: priceUSD,
      totalValueUSD: totalUSD,
      totalValueUGX: totalUGX,
      profitMarginUGX: profitUGX
    }, 15000000);

    showNotification(`Coffee export contract completed! ${clientShare.toLocaleString()} UGX dividend auto-credited to member shares & statement.`);
    setCoffeeBuyer('');
  };

  if (!session) return null;

  const { client, financialStatement, depositRequests, saccoSystem, farmSystem, coffeeManagement, secretary, board } = portalData;

  return (
    <div style={{ backgroundColor: '#f8fafc', color: '#1e293b', minHeight: '100vh', paddingTop: '82px' }}>
      
      {/* ── TOP SWITCHBOARD HEADER (BRANCH NAVIGATION) ── */}
      <section style={{ background: '#0f172a', color: '#fff', borderBottom: '2px solid #b8860b', padding: '24px 20px' }}>
        <div style={{ maxWidth: '1260px', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'inline-block', background: 'rgba(184, 134, 11, 0.2)', border: '1px solid rgba(184, 134, 11, 0.4)', borderRadius: '20px', padding: '4px 12px', fontSize: '11px', color: '#f3c74d', letterSpacing: '2px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>
                Enterprise Testing Portal
              </div>
              <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 'clamp(22px, 3vw, 32px)', margin: '0 0 6px', color: '#ffffff' }}>
                DIASPORA CONNECT <span style={{ color: '#d4af37' }}>PORTALS &amp; SOFTWARE</span>
              </h1>
              <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                Testing Account: <strong style={{ color: '#fff' }}>{session.email}</strong> &bull; Member: {client.name} ({client.memberNo})
              </p>
            </div>

            <div>
              <button
                onClick={handleLogout}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#fca5a5',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600'
                }}
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* ── 5 BRANCHES FROM HANDWRITTEN DIAGRAM ── */}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px' }}>
            <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '10px', fontWeight: '600' }}>
              Select Active Portal / System Branch to Test:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {[
                { key: 'client', label: '👤 Client (Member Portal)', desc: 'Shares, Financial Ledger, Deposit & Withdraw' },
                { key: 'secretary', label: '📋 Secretary Portal', desc: 'Minutes, Resolutions & Circulars' },
                { key: 'admin', label: '🏛️ Admin & Enterprise Software', desc: 'JBS SACCO, Farm & Coffee Systems' },
                { key: 'board', label: '👥 Board of Directors', desc: 'Executive Governance & Asset KPIs' },
                { key: 'accountant', label: '💼 Accountant Portal', desc: 'Reconciliation & Real-Time Share Sync' }
              ].map((b) => (
                <button
                  key={b.key}
                  onClick={() => setActiveBranch(b.key)}
                  style={{
                    background: activeBranch === b.key ? 'linear-gradient(135deg, #b8860b 0%, #d4af37 100%)' : 'rgba(30, 41, 59, 0.8)',
                    color: activeBranch === b.key ? '#0f172a' : '#e2e8f0',
                    border: activeBranch === b.key ? '1px solid #f3c74d' : '1px solid rgba(255, 255, 255, 0.12)',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: activeBranch === b.key ? '700' : '500',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                    boxShadow: activeBranch === b.key ? '0 4px 15px rgba(184, 134, 11, 0.35)' : 'none'
                  }}
                >
                  <div>{b.label}</div>
                  <div style={{ fontSize: '10px', opacity: 0.85 }}>{b.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── NOTIFICATION TOAST ── */}
      {notification && (
        <div style={{ background: '#10b981', color: '#ffffff', padding: '12px 20px', textAlign: 'center', fontSize: '13.5px', fontWeight: '600', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}>
          ✨ {notification}
        </div>
      )}

      {/* ── MAIN CONTENT CONTAINER ── */}
      <main style={{ maxWidth: '1260px', margin: '0 auto', padding: '30px 20px 80px' }}>

        {/* ════════════════════════════════════════════════════════════════
            BRANCH 1: CLIENT (USER'S PORTAL)
            Sub-branches from diagram:
            - Shares
            - Financial statement
            - Request to deposit more
            - Request to withdraw
            - Customer support
            Constraint: Systems cannot be accessed by members, but shares &
            statement update automatically from the systems!
           ════════════════════════════════════════════════════════════════ */}
        {activeBranch === 'client' && (
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: '24px', color: '#0f172a', margin: '0 0 4px' }}>
                  CLIENT / MEMBER DASHBOARD
                </h2>
                <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                  Member: {client.name} &bull; Member No: {client.memberNo} &bull; {client.chapter}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { key: 'shares', label: '📊 Shares' },
                  { key: 'statement', label: '📄 Financial Statement' },
                  { key: 'deposit', label: '📥 Request to Deposit' },
                  { key: 'withdraw', label: '📤 Request to Withdraw' },
                  { key: 'support', label: '💬 Customer Support' }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setClientTab(tab.key)}
                    style={{
                      padding: '9px 15px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: clientTab === tab.key ? '#b8860b' : '#cbd5e1',
                      background: clientTab === tab.key ? '#b8860b' : '#ffffff',
                      color: clientTab === tab.key ? '#ffffff' : '#334155',
                      fontWeight: clientTab === tab.key ? '700' : '500',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ─ INSTITUTIONAL ACCESS CONTROL BANNER ─ */}
            <div style={{ background: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)', border: '1px solid #fde047', borderRadius: '10px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '22px' }}>
              <div style={{ fontSize: '26px' }}>🔒</div>
              <div>
                <strong style={{ color: '#854d0e', fontSize: '13.5px' }}>Member Security &amp; Real-Time Systems Synchronization:</strong>
                <p style={{ margin: '3px 0 0', color: '#713f12', fontSize: '12.5px', lineHeight: '1.45' }}>
                  In accordance with SACCO by-laws, internal management software (SACCO Core Engine, JBS Farm Operations, and Coffee Commodity Trading Systems) is strictly restricted to authorized administrative staff and farm operators. <strong>Your member shares and audited statement update automatically in real-time</strong> whenever farm dairy off-takes, coffee exports, or accountant deposits are executed.
                </p>
              </div>
            </div>

            {/* ── CLIENT TAB 1: SHARES ── */}
            {clientTab === 'shares' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Total Share Units</span>
                    <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '28px', color: '#0f172a', margin: '8px 0 4px' }}>{client.sharesCount} Units</h3>
                    <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>@ {client.shareUnitPrice.toLocaleString()} UGX / share</span>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Shareholding Asset Value</span>
                    <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '28px', color: '#b8860b', margin: '8px 0 4px' }}>{client.totalShareValue.toLocaleString()} UGX</h3>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Titled Freehold Land &amp; Herd Trust</span>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Liquid Savings Balance</span>
                    <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '28px', color: '#0f172a', margin: '8px 0 4px' }}>{client.savingsBalance.toLocaleString()} UGX</h3>
                    <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: '600' }}>Available for Immediate Withdrawal</span>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Total Dividends Earned</span>
                    <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '28px', color: '#16a34a', margin: '8px 0 4px' }}>+{client.dividendsYTD.toLocaleString()} UGX</h3>
                    <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>Dairy + Coffee + SACCO Interest</span>
                  </div>
                </div>

                <div style={{ background: '#f1f5f9', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 12px', color: '#0f172a', fontFamily: 'Cinzel, serif', fontSize: '16px' }}>Agricultural Asset Allocations</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                    <div style={{ background: '#fff', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                      <strong style={{ color: '#0f172a', display: 'block', marginBottom: '4px' }}>🐄 Dairy Herd Co-Ownership:</strong>
                      <span style={{ fontSize: '13px', color: '#475569' }}>5 Pedigree Friesian-cross heifers assigned in Luwero dairy unit. Daily milk collection credited quarterly.</span>
                    </div>
                    <div style={{ background: '#fff', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                      <strong style={{ color: '#0f172a', display: 'block', marginBottom: '4px' }}>☕ Coffee Outgrower Quota:</strong>
                      <span style={{ fontSize: '13px', color: '#475569' }}>2.5 Acres export quota allocated in Masaka &amp; Mbale. Export sales surplus credited automatically.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── CLIENT TAB 2: FINANCIAL STATEMENT ── */}
            {clientTab === 'statement' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                  <h3 style={{ margin: 0, fontFamily: 'Cinzel, serif', fontSize: '18px', color: '#0f172a' }}>
                    Audited Member Ledger &amp; Financial Statement
                  </h3>
                  <button
                    onClick={() => window.print()}
                    style={{ background: '#0f172a', color: '#fff', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12.5px', fontWeight: '600' }}
                  >
                    🖨️ Print / Save Statement PDF
                  </button>
                </div>

                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                      <tr>
                        <th style={{ padding: '12px 14px' }}>Date</th>
                        <th style={{ padding: '12px 14px' }}>Transaction Description</th>
                        <th style={{ padding: '12px 14px' }}>System Source</th>
                        <th style={{ padding: '12px 14px' }}>Reference</th>
                        <th style={{ padding: '12px 14px' }}>Amount (UGX)</th>
                        <th style={{ padding: '12px 14px' }}>Total Portfolio</th>
                        <th style={{ padding: '12px 14px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {financialStatement.map((tx) => (
                        <tr key={tx.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: '#64748b' }}>{tx.date}</td>
                          <td style={{ padding: '12px 14px', fontWeight: '600', color: '#0f172a' }}>{tx.description}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '600',
                              background: tx.type === 'coffee_dividend' ? '#fef3c7' : tx.type === 'farm_dividend' ? '#dcfce7' : '#e0e7ff',
                              color: tx.type === 'coffee_dividend' ? '#92400e' : tx.type === 'farm_dividend' ? '#166534' : '#3730a3'
                            }}>
                              {tx.category}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '12px' }}>{tx.ref}</td>
                          <td style={{ padding: '12px 14px', fontWeight: '700', color: tx.type.includes('withdraw') ? '#dc2626' : '#16a34a' }}>
                            {tx.type.includes('withdraw') ? '-' : '+'}{tx.amount.toLocaleString()} UGX
                          </td>
                          <td style={{ padding: '12px 14px', fontWeight: '600', color: '#0f172a' }}>
                            {tx.balance.toLocaleString()} UGX
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ color: '#16a34a', fontWeight: '600', fontSize: '12px' }}>&bull; {tx.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── CLIENT TAB 3: REQUEST TO DEPOSIT MORE ── */}
            {clientTab === 'deposit' && (
              <div style={{ maxWidth: '640px' }}>
                <h3 style={{ margin: '0 0 8px', fontFamily: 'Cinzel, serif', fontSize: '18px', color: '#0f172a' }}>Request Additional Share or Savings Deposit</h3>
                <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '13.5px' }}>
                  Select payment method and submit deposit reference. Once the Accountant verifies the receipt, your shares and statement update automatically.
                </p>

                <form onSubmit={handleDepositSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Select Pre-set or Custom Amount (UGX):</label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      {['500000', '1000000', '2000000', '5000000'].map((amt) => (
                        <button
                          type="button"
                          key={amt}
                          onClick={() => setDepositAmount(amt)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: depositAmount === amt ? '2px solid #b8860b' : '1px solid #cbd5e1',
                            background: depositAmount === amt ? 'rgba(184, 134, 11, 0.1)' : '#fff',
                            color: '#0f172a',
                            fontWeight: '600',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          {Number(amt).toLocaleString()} UGX ({Math.floor(Number(amt) / client.shareUnitPrice)} Shares)
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Payment Channel:</label>
                    <select
                      value={depositMethod}
                      onChange={(e) => setDepositMethod(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                    >
                      <option value="MTN Mobile Money (+256 747 325 565)">MTN Mobile Money (+256 747 325 565)</option>
                      <option value="Airtel Money (+256 747 325 565)">Airtel Money (+256 747 325 565)</option>
                      <option value="Bank Wire – Stanbic Bank Uganda (A/C: 9030018492019)">Bank Wire – Stanbic Bank Uganda</option>
                      <option value="Visa / Mastercard (Diaspora Card Gateway)">Visa / Mastercard (Diaspora Card Gateway)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Transaction ID / Mobile Money Reference:</label>
                    <input
                      type="text"
                      placeholder="e.g. MM-984128 or Bank Ref #..."
                      value={depositRef}
                      onChange={(e) => setDepositRef(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Allocation Notes:</label>
                    <input
                      type="text"
                      placeholder="e.g. Monthly contribution for dairy herd shares..."
                      value={depositNotes}
                      onChange={(e) => setDepositNotes(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{
                      background: '#b8860b',
                      color: '#fff',
                      padding: '12px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: '700',
                      fontSize: '14px',
                      boxShadow: '0 4px 12px rgba(184, 134, 11, 0.3)'
                    }}
                  >
                    Submit Deposit Request
                  </button>
                </form>
              </div>
            )}

            {/* ── CLIENT TAB 4: REQUEST TO WITHDRAW ── */}
            {clientTab === 'withdraw' && (
              <div style={{ maxWidth: '640px' }}>
                <h3 style={{ margin: '0 0 8px', fontFamily: 'Cinzel, serif', fontSize: '18px', color: '#0f172a' }}>Request Capital / Dividend Withdrawal</h3>
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px', fontSize: '13px' }}>
                  Available Liquid Savings for Immediate Withdrawal: <strong style={{ color: '#16a34a' }}>{client.savingsBalance.toLocaleString()} UGX</strong>
                  <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>*Titled land and dairy herd equity require a 30-day statutory notice for share redemption.</div>
                </div>

                <form onSubmit={handleWithdrawSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Withdrawal Amount (UGX):</label>
                    <input
                      type="number"
                      placeholder="e.g. 500000"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Payout Destination (Mobile Money or Bank Account):</label>
                    <input
                      type="text"
                      placeholder="e.g. MTN Mobile Money: +256 7XX XXX XXX or Stanbic A/C..."
                      value={withdrawDest}
                      onChange={(e) => setWithdrawDest(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Reason for Withdrawal:</label>
                    <select
                      value={withdrawReason}
                      onChange={(e) => setWithdrawReason(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                    >
                      <option value="Personal Investment">Personal Investment</option>
                      <option value="Family Support / Medical">Family Support / Medical</option>
                      <option value="School Fees">School Fees</option>
                      <option value="Business Working Capital">Business Working Capital</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    style={{
                      background: '#0f172a',
                      color: '#fff',
                      padding: '12px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: '700',
                      fontSize: '14px'
                    }}
                  >
                    Submit Withdrawal Request
                  </button>
                </form>
              </div>
            )}

            {/* ── CLIENT TAB 5: CUSTOMER SUPPORT ── */}
            {clientTab === 'support' && (
              <div>
                <h3 style={{ margin: '0 0 16px', fontFamily: 'Cinzel, serif', fontSize: '18px', color: '#0f172a' }}>Diaspora Member Support &amp; Liaison Desk</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                  <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 8px', color: '#0f172a' }}>📱 Instant WhatsApp Desk</h4>
                    <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#64748b' }}>Chat directly with our Kampala member liaison officer for immediate assistance.</p>
                    <a
                      href="https://wa.me/256747325565"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-block', background: '#25D366', color: '#fff', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontWeight: '700', fontSize: '13px' }}
                    >
                      Open WhatsApp (+256 747 325 565)
                    </a>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 8px', color: '#0f172a' }}>📞 Direct Phone Liaison</h4>
                    <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#64748b' }}>Mon &ndash; Sat, 8:00 AM &ndash; 6:00 PM East African Time.</p>
                    <a
                      href="tel:+256747325565"
                      style={{ display: 'inline-block', background: '#0f172a', color: '#fff', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontWeight: '700', fontSize: '13px' }}
                    >
                      Call +256 747 325 565
                    </a>
                  </div>
                </div>

                <div style={{ maxWidth: '640px' }}>
                  <h4 style={{ margin: '0 0 12px', color: '#0f172a' }}>Submit Written Inquiry or Support Ticket:</h4>
                  <form onSubmit={handleSupportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Category:</label>
                      <select
                        value={supportCategory}
                        onChange={(e) => setSupportCategory(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                      >
                        <option value="Shares & Dividends">Shares &amp; Dividends</option>
                        <option value="Dairy Farm Inspection Tour">Dairy Farm Inspection Tour</option>
                        <option value="Land Title Deed In Trust">Land Title Deed In Trust</option>
                        <option value="Financial Statement Reconciliation">Financial Statement Reconciliation</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Subject:</label>
                      <input
                        type="text"
                        required
                        placeholder="Brief summary..."
                        value={supportSubject}
                        onChange={(e) => setSupportSubject(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Message Details:</label>
                      <textarea
                        rows="3"
                        required
                        placeholder="How can our liaison desk assist you?..."
                        value={supportMessage}
                        onChange={(e) => setSupportMessage(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                      />
                    </div>

                    <button
                      type="submit"
                      style={{ background: '#b8860b', color: '#fff', padding: '10px 16px', borderRadius: '6px', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '13.5px' }}
                    >
                      Submit Ticket
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            BRANCH 2: SECRETARY PORTAL
           ════════════════════════════════════════════════════════════════ */}
        {activeBranch === 'secretary' && (
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
            <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: '24px', color: '#0f172a', margin: '0 0 6px' }}>
              SECRETARY'S DASHBOARD &amp; REGISTRY
            </h2>
            <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '14px' }}>
              Official repository for Board resolutions, AGM minutes, and statutory compliance filings.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
              {secretary.minutes.map((m) => (
                <div key={m.id} style={{ background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', background: '#0f172a', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>{m.id}</span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{m.date}</span>
                  </div>
                  <h4 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '15px' }}>{m.title}</h4>
                  <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>{m.summary}</p>
                  <div style={{ fontSize: '11.5px', color: '#b8860b', fontWeight: '600' }}>Signed: {m.signee}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            BRANCH 3: BOARD OF DIRECTORS PORTAL
           ════════════════════════════════════════════════════════════════ */}
        {activeBranch === 'board' && (
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
            <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: '24px', color: '#0f172a', margin: '0 0 6px' }}>
              BOARD OF DIRECTORS EXECUTIVE PORTAL
            </h2>
            <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: '14px' }}>
              Strategic oversight, fiduciary audit monitoring, and co-operative asset growth metrics.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Total SACCO Capital</span>
                <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '22px', color: '#0f172a', margin: '8px 0 0' }}>{board.kpis.totalAssetsUGX}</h3>
              </div>
              <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Active Diaspora Members</span>
                <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '22px', color: '#b8860b', margin: '8px 0 0' }}>{board.kpis.totalMembers} Shareholders</h3>
              </div>
              <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Commercial Dairy Herds</span>
                <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '22px', color: '#16a34a', margin: '8px 0 0' }}>{board.kpis.dairyCattleCount} Cattle</h3>
              </div>
              <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Titled Farmland In Trust</span>
                <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '22px', color: '#0f172a', margin: '8px 0 0' }}>{board.kpis.titledAcreage}</h3>
              </div>
            </div>

            <div style={{ background: '#f1f5f9', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 8px', color: '#0f172a', fontFamily: 'Cinzel, serif' }}>Governing Board Composition</h4>
              <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#475569' }}>
                Mr. Nyanzi Edrine (Chairperson) &bull; Ms. Namulindwa Mary Flavia (Vise Chairperson) &bull; Mr. Helera John Bahati (Secretary) &bull; Mrs. Miriam Halera (Treasurer) &bull; Ms. Ssanyu Phiona (Member Representative).
              </p>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            BRANCH 4: ACCOUNTANT PORTAL
           ════════════════════════════════════════════════════════════════ */}
        {activeBranch === 'accountant' && (
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
            <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: '24px', color: '#0f172a', margin: '0 0 6px' }}>
              ACCOUNTANT'S TREASURY &amp; LEDGER SYNC
            </h2>
            <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '14px' }}>
              Reconcile incoming bank and mobile money payments. <strong>Approving a deposit here instantly updates the member's share count and financial statement.</strong>
            </p>

            <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '16px', color: '#0f172a', margin: '0 0 12px' }}>
              Pending Member Deposit Reconciliations ({depositRequests.filter(r => r.status === 'Pending').length})
            </h3>

            {depositRequests.filter(r => r.status === 'Pending').length === 0 ? (
              <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', textAlign: 'center', color: '#64748b', fontSize: '13.5px' }}>
                ✅ All member deposits have been reconciled and synchronized into share ledgers.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {depositRequests.filter(r => r.status === 'Pending').map((req) => (
                  <div key={req.id} style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '15px' }}>{req.amount.toLocaleString()} UGX</span>
                        <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>Pending Verification</span>
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#475569' }}>
                        Method: <strong>{req.method}</strong> &bull; Ref: <strong>{req.reference}</strong>
                      </div>
                      {req.notes && <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>Notes: {req.notes}</div>}
                    </div>

                    <button
                      onClick={() => handleApproveDeposit(req.id)}
                      style={{
                        background: '#16a34a',
                        color: '#fff',
                        padding: '9px 18px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontSize: '13px',
                        boxShadow: '0 2px 8px rgba(22, 163, 74, 0.3)'
                      }}
                    >
                      ✓ Approve &amp; Sync to Shares
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            BRANCH 5: ADMIN & INTERNAL MANAGEMENT SOFTWARE
            Reverse Engineered from JBS Farm Management System:
            1. SACCO Management System (JBS Model: Year 1/2 monthly grid,
               Investor Money Maker program, Petty Cash)
            2. Farm Management System (JBS Model: Animals, Milk sessions,
               Health/Vaccination, Breeding, Feed/Silage)
            3. Coffee Management System (Outgrower Buying & Export Sales)
           ════════════════════════════════════════════════════════════════ */}
        {activeBranch === 'admin' && (
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: '24px', color: '#0f172a', margin: '0 0 4px' }}>
                  ADMINISTRATIVE ENTERPRISE MANAGEMENT SOFTWARE
                </h2>
                <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                  Enterprise platforms reverse-engineered from JBS Farm spec. Secured from client access.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { key: 'sacco', label: '🏛️ SACCO Management System' },
                  { key: 'farm', label: '🚜 Farm Management System' },
                  { key: 'coffee', label: '☕ Coffee Buying & Selling System' }
                ].map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setAdminSystemTab(s.key)}
                    style={{
                      padding: '9px 15px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: adminSystemTab === s.key ? '#b8860b' : '#cbd5e1',
                      background: adminSystemTab === s.key ? '#b8860b' : '#ffffff',
                      color: adminSystemTab === s.key ? '#ffffff' : '#334155',
                      fontWeight: adminSystemTab === s.key ? '700' : '500',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                ENTERPRISE SYSTEM 1: SACCO MANAGEMENT (JBS FARM REVERSE ENG)
               ══════════════════════════════════════════════════════════════ */}
            {adminSystemTab === 'sacco' && (
              <div>
                {/* SACCO Sub-tabs */}
                <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
                  {[
                    { key: 'year2', label: '📅 Financial Year 2 (12-Mo Ledger)' },
                    { key: 'investors', label: '🐄 Money Maker & Investor Club' },
                    { key: 'pettyCash', label: '💵 Cashier & Banked Tracking' }
                  ].map((sub) => (
                    <button
                      key={sub.key}
                      onClick={() => setSaccoSubTab(sub.key)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: 'none',
                        background: saccoSubTab === sub.key ? '#0f172a' : '#f1f5f9',
                        color: saccoSubTab === sub.key ? '#ffffff' : '#475569',
                        fontSize: '12.5px',
                        fontWeight: saccoSubTab === sub.key ? '700' : '500',
                        cursor: 'pointer'
                      }}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>

                {/* TAB 1: 12-MONTH MONTHLY SAVINGS & SHARE CONTRIBUTIONS GRID */}
                {saccoSubTab === 'year2' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                      <h4 style={{ margin: 0, fontFamily: 'Cinzel, serif', color: '#0f172a' }}>
                        Member Monthly Contribution &amp; Share Capital Ledger (Jan &ndash; Dec 2026)
                      </h4>
                      <button
                        onClick={() => window.print()}
                        style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                      >
                        📊 Export Ledger XLSX / CSV
                      </button>
                    </div>

                    <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '20px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', textAlign: 'left' }}>
                        <thead style={{ background: '#f8fafc', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>
                          <tr>
                            <th style={{ padding: '8px 10px' }}>Member Name</th>
                            <th style={{ padding: '8px 10px' }}>Category</th>
                            <th style={{ padding: '8px 10px' }}>Jan</th>
                            <th style={{ padding: '8px 10px' }}>Feb</th>
                            <th style={{ padding: '8px 10px' }}>Mar</th>
                            <th style={{ padding: '8px 10px' }}>Apr</th>
                            <th style={{ padding: '8px 10px' }}>May</th>
                            <th style={{ padding: '8px 10px' }}>Jun</th>
                            <th style={{ padding: '8px 10px' }}>Jul</th>
                            <th style={{ padding: '8px 10px' }}>Aug</th>
                            <th style={{ padding: '8px 10px' }}>Sep</th>
                            <th style={{ padding: '8px 10px' }}>Oct</th>
                            <th style={{ padding: '8px 10px' }}>Nov</th>
                            <th style={{ padding: '8px 10px' }}>Total (UGX)</th>
                            <th style={{ padding: '8px 10px' }}>Admin Fee</th>
                            <th style={{ padding: '8px 10px' }}>Savings Balance</th>
                            <th style={{ padding: '8px 10px' }}>Shares</th>
                            <th style={{ padding: '8px 10px' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {saccoSystem.membersYear2.map((m) => (
                            <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '8px 10px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap' }}>{m.name}</td>
                              <td style={{ padding: '8px 10px', fontSize: '10.5px', color: '#64748b' }}>{m.category}</td>
                              <td style={{ padding: '8px 10px' }}>{m.jan ? (m.jan / 1000) + 'k' : '-'}</td>
                              <td style={{ padding: '8px 10px' }}>{m.feb ? (m.feb / 1000) + 'k' : '-'}</td>
                              <td style={{ padding: '8px 10px' }}>{m.mar ? (m.mar / 1000) + 'k' : '-'}</td>
                              <td style={{ padding: '8px 10px' }}>{m.apr ? (m.apr / 1000) + 'k' : '-'}</td>
                              <td style={{ padding: '8px 10px' }}>{m.may ? (m.may / 1000) + 'k' : '-'}</td>
                              <td style={{ padding: '8px 10px' }}>{m.jun ? (m.jun / 1000) + 'k' : '-'}</td>
                              <td style={{ padding: '8px 10px' }}>{m.jul ? (m.jul / 1000) + 'k' : '-'}</td>
                              <td style={{ padding: '8px 10px' }}>{m.aug ? (m.aug / 1000) + 'k' : '-'}</td>
                              <td style={{ padding: '8px 10px' }}>{m.sep ? (m.sep / 1000) + 'k' : '-'}</td>
                              <td style={{ padding: '8px 10px' }}>{m.oct ? (m.oct / 1000) + 'k' : '-'}</td>
                              <td style={{ padding: '8px 10px' }}>{m.nov ? (m.nov / 1000) + 'k' : '-'}</td>
                              <td style={{ padding: '8px 10px', fontWeight: '700', color: '#0f172a' }}>{m.total.toLocaleString()}</td>
                              <td style={{ padding: '8px 10px', color: '#dc2626' }}>-{m.admin.toLocaleString()}</td>
                              <td style={{ padding: '8px 10px', fontWeight: '700', color: '#16a34a' }}>{m.savings.toLocaleString()}</td>
                              <td style={{ padding: '8px 10px', fontWeight: '700', color: '#b8860b' }}>{m.noOfShares}</td>
                              <td style={{ padding: '8px 10px' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '10px',
                                  fontWeight: '700',
                                  background: m.status === 'CLEARED' ? '#dcfce7' : '#fef3c7',
                                  color: m.status === 'CLEARED' ? '#166534' : '#92400e'
                                }}>
                                  {m.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Add Member Form */}
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', maxWidth: '700px' }}>
                      <h5 style={{ margin: '0 0 10px', color: '#0f172a', fontSize: '14px' }}>Register New SACCO Member to Year 2:</h5>
                      <form onSubmit={handleAddSaccoMember} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                        <input
                          type="text"
                          required
                          placeholder="Member Full Name"
                          value={newMemberName}
                          onChange={(e) => setNewMemberName(e.target.value)}
                          style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                        />
                        <input
                          type="text"
                          placeholder="Phone / WhatsApp"
                          value={newMemberPhone}
                          onChange={(e) => setNewMemberPhone(e.target.value)}
                          style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                        />
                        <input
                          type="text"
                          placeholder="National ID / NIN"
                          value={newMemberNIN}
                          onChange={(e) => setNewMemberNIN(e.target.value)}
                          style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                        />
                        <input
                          type="number"
                          placeholder="Initial Deposit (UGX)"
                          value={newMemberJan}
                          onChange={(e) => setNewMemberJan(e.target.value)}
                          style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                        />
                        <button
                          type="submit"
                          style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontWeight: '700', fontSize: '12.5px', cursor: 'pointer' }}
                        >
                          + Add Member
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* TAB 2: INVESTOR CLUB & MONEY MAKER (JBS FARM SPEC) */}
                {saccoSubTab === 'investors' && (
                  <div>
                    <h4 style={{ margin: '0 0 12px', fontFamily: 'Cinzel, serif', color: '#0f172a' }}>
                      Cattle Investment Programs &amp; "Money Maker" Club
                    </h4>
                    <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b' }}>
                      Standard Money Maker program: 8,000,000 UGX commitment generating 2 pedigree dairy heifers per annual cycle.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                      {saccoSystem.investorPrograms.map((inv) => (
                        <div key={inv.id} style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '11px', background: '#b8860b', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>{inv.category}</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              color: inv.status === 'CLEARED' ? '#166534' : '#92400e',
                              background: inv.status === 'CLEARED' ? '#dcfce7' : '#fef3c7',
                              padding: '2px 8px',
                              borderRadius: '4px'
                            }}>
                              {inv.status}
                            </span>
                          </div>
                          <h4 style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '15px' }}>{inv.name}</h4>
                          <div style={{ fontSize: '12.5px', color: '#475569', marginBottom: '8px' }}>
                            Program: <strong>{inv.programAmount.toLocaleString()} UGX</strong> &bull; Paid: <strong>{inv.investmentAmount.toLocaleString()} UGX</strong>
                          </div>
                          <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600', marginBottom: '4px' }}>
                            🐄 Cows Allocated: {inv.cowsPerYear} Head/Year
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                            Earmarked: {inv.assignedHeifers.join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: PETTY CASH & BANKED TRACKING (JBS FARM SPEC) */}
                {saccoSubTab === 'pettyCash' && (
                  <div>
                    <h4 style={{ margin: '0 0 12px', fontFamily: 'Cinzel, serif', color: '#0f172a' }}>
                      Petty Cash &amp; Banked Collection Management
                    </h4>
                    <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b' }}>
                      Track cash on hand, Airtel/MTN mobile money collections, and click to reconcile into bank deposits.
                    </p>

                    <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                        <thead style={{ background: '#f8fafc', color: '#475569' }}>
                          <tr>
                            <th style={{ padding: '10px 12px' }}>Tx ID</th>
                            <th style={{ padding: '10px 12px' }}>Date</th>
                            <th style={{ padding: '10px 12px' }}>Type</th>
                            <th style={{ padding: '10px 12px' }}>Category</th>
                            <th style={{ padding: '10px 12px' }}>Payment Channel</th>
                            <th style={{ padding: '10px 12px' }}>Amount (UGX)</th>
                            <th style={{ padding: '10px 12px' }}>Banked Status</th>
                            <th style={{ padding: '10px 12px' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {saccoSystem.pettyCash.map((tx) => (
                            <tr key={tx.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px 12px', fontWeight: '700' }}>{tx.id}</td>
                              <td style={{ padding: '10px 12px', color: '#64748b' }}>{tx.date}</td>
                              <td style={{ padding: '10px 12px', color: tx.type === 'Income' ? '#16a34a' : '#dc2626', fontWeight: '700' }}>{tx.type}</td>
                              <td style={{ padding: '10px 12px' }}>{tx.category}</td>
                              <td style={{ padding: '10px 12px', fontWeight: '600' }}>{tx.method}</td>
                              <td style={{ padding: '10px 12px', fontWeight: '700' }}>{tx.amount.toLocaleString()} UGX</td>
                              <td style={{ padding: '10px 12px' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  background: tx.isBanked ? '#dcfce7' : '#fee2e2',
                                  color: tx.isBanked ? '#166534' : '#991b1b'
                                }}>
                                  {tx.isBanked ? '✓ BANKED' : '⚠️ UNBANKED CASH'}
                                </span>
                              </td>
                              <td style={{ padding: '10px 12px' }}>
                                <button
                                  onClick={() => togglePettyCashBanked(tx.id)}
                                  style={{
                                    background: '#0f172a',
                                    color: '#fff',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    border: 'none',
                                    fontSize: '11px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Toggle Banked
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                ENTERPRISE SYSTEM 2: FARM MANAGEMENT (JBS FARM REVERSE ENG)
               ══════════════════════════════════════════════════════════════ */}
            {adminSystemTab === 'farm' && (
              <div>
                {/* Farm Sub-tabs (Directly matching JBS Farm navigation) */}
                <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  {[
                    { key: 'animals', label: '🐄 Animals (Cattle Directory)' },
                    { key: 'milk', label: '🥛 Milk Production & Off-take' },
                    { key: 'health', label: '💉 Health & Vaccination' },
                    { key: 'breeding', label: '🧬 Breeding & In-Calf' },
                    { key: 'feed', label: '🌾 Feed & Silage Nutrition' }
                  ].map((sub) => (
                    <button
                      key={sub.key}
                      onClick={() => setFarmSubTab(sub.key)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: 'none',
                        background: farmSubTab === sub.key ? '#0f172a' : '#f1f5f9',
                        color: farmSubTab === sub.key ? '#ffffff' : '#475569',
                        fontSize: '12.5px',
                        fontWeight: farmSubTab === sub.key ? '700' : '500',
                        cursor: 'pointer'
                      }}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>

                {/* FARM TAB 1: ANIMALS / CATTLE DIRECTORY (JBS FARM SPEC) */}
                {farmSubTab === 'animals' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                      <h4 style={{ margin: 0, fontFamily: 'Cinzel, serif', color: '#0f172a' }}>
                        Enterprise Cattle Herd Inventory ({farmSystem.animals.length} Head Registered)
                      </h4>
                      <button
                        onClick={handleDistributeDairy}
                        style={{
                          background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                          color: '#fff',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          border: 'none',
                          fontWeight: '700',
                          cursor: 'pointer',
                          fontSize: '12.5px'
                        }}
                      >
                        🥛 Distribute Commercial Dairy Proceeds to Members
                      </button>
                    </div>

                    <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '20px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                        <thead style={{ background: '#f8fafc', color: '#475569' }}>
                          <tr>
                            <th style={{ padding: '8px 10px' }}>Tag ID</th>
                            <th style={{ padding: '8px 10px' }}>Cow Name</th>
                            <th style={{ padding: '8px 10px' }}>Breed / Genetics</th>
                            <th style={{ padding: '8px 10px' }}>Gender</th>
                            <th style={{ padding: '8px 10px' }}>Program / Stage</th>
                            <th style={{ padding: '8px 10px' }}>Daily Yield</th>
                            <th style={{ padding: '8px 10px' }}>Health</th>
                            <th style={{ padding: '8px 10px' }}>Paddock Location</th>
                          </tr>
                        </thead>
                        <tbody>
                          {farmSystem.animals.map((a) => (
                            <tr key={a.tagId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '8px 10px', fontWeight: '700', color: '#0f172a' }}>{a.tagId}</td>
                              <td style={{ padding: '8px 10px', fontWeight: '600' }}>{a.name}</td>
                              <td style={{ padding: '8px 10px' }}>{a.breed}</td>
                              <td style={{ padding: '8px 10px' }}>{a.gender}</td>
                              <td style={{ padding: '8px 10px' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '10.5px',
                                  fontWeight: '600',
                                  background: a.stage.includes('Money Maker') ? '#fef3c7' : '#e0e7ff',
                                  color: a.stage.includes('Money Maker') ? '#92400e' : '#3730a3'
                                }}>
                                  {a.stage}
                                </span>
                              </td>
                              <td style={{ padding: '8px 10px', fontWeight: '700', color: '#16a34a' }}>{a.dailyYield}</td>
                              <td style={{ padding: '8px 10px' }}>
                                <span style={{ color: '#16a34a', fontWeight: '700' }}>&bull; {a.health}</span>
                              </td>
                              <td style={{ padding: '8px 10px', color: '#64748b' }}>{a.paddock}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Add Animal Form */}
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', maxWidth: '750px' }}>
                      <h5 style={{ margin: '0 0 10px', color: '#0f172a', fontSize: '14px' }}>Register New Cattle Animal (JBS Farm Model):</h5>
                      <form onSubmit={handleAddAnimalSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                        <input
                          type="text"
                          placeholder="Tag ID (e.g. JBS-007)"
                          value={cattleTag}
                          onChange={(e) => setCattleTag(e.target.value)}
                          style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                        />
                        <input
                          type="text"
                          required
                          placeholder="Cow Name"
                          value={cattleName}
                          onChange={(e) => setCattleName(e.target.value)}
                          style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                        />
                        <select
                          value={cattleBreed}
                          onChange={(e) => setCattleBreed(e.target.value)}
                          style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                        >
                          <option value="Friesian Purebred">Friesian Purebred</option>
                          <option value="Friesian Cross">Friesian Cross</option>
                          <option value="Jersey High-Butterfat">Jersey High-Butterfat</option>
                          <option value="Ayrshire Cross">Ayrshire Cross</option>
                          <option value="Ankole Dairy Genetics">Ankole Dairy Genetics</option>
                        </select>
                        <select
                          value={cattleStage}
                          onChange={(e) => setCattleStage(e.target.value)}
                          style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                        >
                          <option value="Money Maker / Milking">Money Maker / Milking</option>
                          <option value="In-Calf / Milking">In-Calf / Milking</option>
                          <option value="Breeding Heifer">Breeding Heifer</option>
                          <option value="Breeding Bull">Breeding Bull</option>
                        </select>
                        <button
                          type="submit"
                          style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontWeight: '700', fontSize: '12.5px', cursor: 'pointer' }}
                        >
                          + Register Animal
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* FARM TAB 2: MILK PRODUCTION & LOGGING (JBS FARM SPEC) */}
                {farmSubTab === 'milk' && (
                  <div>
                    <h4 style={{ margin: '0 0 12px', fontFamily: 'Cinzel, serif', color: '#0f172a' }}>
                      Daily Milk Milking Sessions &amp; Off-taker Dispatch
                    </h4>

                    <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '20px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                        <thead style={{ background: '#f8fafc', color: '#475569' }}>
                          <tr>
                            <th style={{ padding: '10px 12px' }}>Date</th>
                            <th style={{ padding: '10px 12px' }}>Morning (L)</th>
                            <th style={{ padding: '10px 12px' }}>Evening (L)</th>
                            <th style={{ padding: '10px 12px' }}>Daily Total</th>
                            <th style={{ padding: '10px 12px' }}>Chilling Temp</th>
                            <th style={{ padding: '10px 12px' }}>Off-Taker Processor</th>
                            <th style={{ padding: '10px 12px' }}>Rate / L</th>
                            <th style={{ padding: '10px 12px' }}>Daily Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {farmSystem.milkLogs.map((m, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px 12px', fontWeight: '700' }}>{m.date}</td>
                              <td style={{ padding: '10px 12px' }}>{m.morning} L</td>
                              <td style={{ padding: '10px 12px' }}>{m.evening} L</td>
                              <td style={{ padding: '10px 12px', fontWeight: '700', color: '#16a34a' }}>{m.total} Liters</td>
                              <td style={{ padding: '10px 12px', color: '#2563eb', fontWeight: '600' }}>{m.chillingTemp}</td>
                              <td style={{ padding: '10px 12px' }}>{m.offTaker}</td>
                              <td style={{ padding: '10px 12px' }}>{m.ratePerL} UGX</td>
                              <td style={{ padding: '10px 12px', fontWeight: '700', color: '#0f172a' }}>{m.totalRevenueUGX.toLocaleString()} UGX</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Log Session Form */}
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', maxWidth: '750px' }}>
                      <h5 style={{ margin: '0 0 10px', color: '#0f172a', fontSize: '14px' }}>Log New Milking Session:</h5>
                      <form onSubmit={handleMilkLogSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                        <input
                          type="number"
                          placeholder="Morning (Liters)"
                          value={milkMorning}
                          onChange={(e) => setMilkMorning(e.target.value)}
                          style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                        />
                        <input
                          type="number"
                          placeholder="Evening (Liters)"
                          value={milkEvening}
                          onChange={(e) => setMilkEvening(e.target.value)}
                          style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                        />
                        <input
                          type="text"
                          placeholder="Chilling Temp (e.g. 3.8°C)"
                          value={milkTemp}
                          onChange={(e) => setMilkTemp(e.target.value)}
                          style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                        />
                        <input
                          type="number"
                          placeholder="Rate / Liter (UGX)"
                          value={milkRate}
                          onChange={(e) => setMilkRate(e.target.value)}
                          style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                        />
                        <button
                          type="submit"
                          style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontWeight: '700', fontSize: '12.5px', cursor: 'pointer' }}
                        >
                          + Log Production
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* FARM TAB 3: HEALTH & VACCINATION (JBS FARM SPEC) */}
                {farmSubTab === 'health' && (
                  <div>
                    <h4 style={{ margin: '0 0 12px', fontFamily: 'Cinzel, serif', color: '#0f172a' }}>
                      Veterinary Health, Immunization &amp; Disease Control
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                      {farmSystem.healthLogs.map((h) => (
                        <div key={h.id} style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>Cow Tag: {h.tagId}</span>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>{h.date}</span>
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#b8860b', marginBottom: '4px' }}>{h.condition}</div>
                          <div style={{ fontSize: '12.5px', color: '#334155', marginBottom: '6px' }}>{h.treatment}</div>
                          <div style={{ fontSize: '11.5px', color: '#64748b' }}>Attending Vet: {h.vet} &bull; <strong style={{ color: '#16a34a' }}>{h.status}</strong></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* FARM TAB 4: BREEDING & IN-CALF SCHEDULE (JBS FARM SPEC) */}
                {farmSubTab === 'breeding' && (
                  <div>
                    <h4 style={{ margin: '0 0 12px', fontFamily: 'Cinzel, serif', color: '#0f172a' }}>
                      Artificial Insemination (AI) &amp; Expected Calving Calendar
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                      {farmSystem.breedingLogs.map((b) => (
                        <div key={b.id} style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>{b.cowName} ({b.tagId})</span>
                            <span style={{ fontSize: '11px', background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>In-Calf</span>
                          </div>
                          <div style={{ fontSize: '12.5px', color: '#475569', marginBottom: '4px' }}>AI Insemination: {b.aiDate}</div>
                          <div style={{ fontSize: '12px', color: '#b8860b', fontWeight: '600', marginBottom: '4px' }}>Semen: {b.sireSemen}</div>
                          <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#16a34a' }}>Expected Calving: {b.expectedCalving}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* FARM TAB 5: FEED & SILAGE NUTRITION (JBS FARM SPEC) */}
                {farmSubTab === 'feed' && (
                  <div>
                    <h4 style={{ margin: '0 0 12px', fontFamily: 'Cinzel, serif', color: '#0f172a' }}>
                      Pasture Fodder &amp; Silage Bunker Inventory
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                      {farmSystem.feedStock.map((f) => (
                        <div key={f.id} style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                          <span style={{ fontSize: '11px', background: '#0f172a', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>{f.type}</span>
                          <h4 style={{ margin: '8px 0 4px', color: '#0f172a', fontSize: '14.5px' }}>{f.name}</h4>
                          <div style={{ fontSize: '13px', color: '#475569', marginBottom: '6px' }}>
                            Current Stock: <strong style={{ color: '#16a34a' }}>{f.inStockTons} Tons</strong> / {f.capacityTons} Tons Capacity
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            Daily Consumption: {f.dailyIntakeKg} KG/Day
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                ENTERPRISE SYSTEM 3: COFFEE COMMODITY MANAGEMENT (BUY & SELL)
               ══════════════════════════════════════════════════════════════ */}
            {adminSystemTab === 'coffee' && (
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '18px', color: '#0f172a', margin: '0 0 4px' }}>
                    Coffee Commodity Management System (Buying &amp; Selling)
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                    Purchase high-grade Arabica and Robusta from outgrowers, manage parchment/FAQ inventory, and sell to international export off-takers.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>Warehouse Stock in Storage</span>
                    <strong style={{ display: 'block', fontSize: '22px', color: '#78350f', marginTop: '4px' }}>{(coffeeManagement.stockInWarehouseKg / 1000).toFixed(1)} Metric Tons</strong>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>Total Coffee Purchased</span>
                    <strong style={{ display: 'block', fontSize: '22px', color: '#0f172a', marginTop: '4px' }}>{coffeeManagement.totalPurchasesUGX.toLocaleString()} UGX</strong>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>Export Sales Revenue</span>
                    <strong style={{ display: 'block', fontSize: '22px', color: '#16a34a', marginTop: '4px' }}>{coffeeManagement.totalRevenueUGX.toLocaleString()} UGX</strong>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>Net Trading Margin</span>
                    <strong style={{ display: 'block', fontSize: '22px', color: '#b8860b', marginTop: '4px' }}>+{coffeeManagement.netTradingSurplusUGX.toLocaleString()} UGX</strong>
                  </div>
                </div>

                {/* ─ DUAL ACTION SECTIONS: BUYING & SELLING ─ */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '30px' }}>
                  
                  {/* COFFEE BUYING DESK */}
                  <div style={{ background: '#fefce8', padding: '20px', borderRadius: '12px', border: '1px solid #fef08a' }}>
                    <h4 style={{ margin: '0 0 12px', color: '#854d0e', fontFamily: 'Cinzel, serif', fontSize: '16px' }}>
                      ☕ 1. Outgrower Coffee Buying Desk
                    </h4>
                    <form onSubmit={handleCoffeePurchaseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '3px' }}>Farmer / Cooperative Name:</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Sipi Falls Arabica Growers"
                          value={coffeeFarmer}
                          onChange={(e) => setCoffeeFarmer(e.target.value)}
                          style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '3px' }}>Coffee Variety:</label>
                          <select
                            value={coffeeTypeBuy}
                            onChange={(e) => setCoffeeTypeBuy(e.target.value)}
                            style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                          >
                            <option value="Arabica Bugisu AA">Arabica Bugisu AA</option>
                            <option value="Arabica Drugar">Arabica Drugar</option>
                            <option value="Robusta Screen 18">Robusta Screen 18</option>
                            <option value="Robusta Kiboko">Robusta Kiboko</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '3px' }}>Net Weight (KG):</label>
                          <input
                            type="number"
                            required
                            value={coffeeKgBuy}
                            onChange={(e) => setCoffeeKgBuy(e.target.value)}
                            style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '3px' }}>Rate / KG (UGX):</label>
                          <input
                            type="number"
                            required
                            value={coffeeRateBuy}
                            onChange={(e) => setCoffeeRateBuy(e.target.value)}
                            style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '3px' }}>Total Payout:</label>
                          <div style={{ padding: '7px 10px', background: '#fff', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700', color: '#16a34a' }}>
                            {(Number(coffeeKgBuy) * Number(coffeeRateBuy)).toLocaleString()} UGX
                          </div>
                        </div>
                      </div>
                      <button
                        type="submit"
                        style={{ background: '#854d0e', color: '#fff', padding: '9px 16px', borderRadius: '6px', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '13px', marginTop: '6px' }}
                      >
                        Record Coffee Purchase
                      </button>
                    </form>
                  </div>

                  {/* COFFEE SELLING & EXPORT DESK */}
                  <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                    <h4 style={{ margin: '0 0 12px', color: '#166534', fontFamily: 'Cinzel, serif', fontSize: '16px' }}>
                      🚢 2. Coffee Export &amp; Sales Desk
                    </h4>
                    <form onSubmit={handleCoffeeSaleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '3px' }}>International Buyer / Exporter:</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Zurich Coffee Trading Co."
                          value={coffeeBuyer}
                          onChange={(e) => setCoffeeBuyer(e.target.value)}
                          style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '3px' }}>Coffee Grade:</label>
                          <input
                            type="text"
                            value={coffeeTypeSell}
                            onChange={(e) => setCoffeeTypeSell(e.target.value)}
                            style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '3px' }}>Quantity (Tons):</label>
                          <input
                            type="number"
                            required
                            value={coffeeTonsSell}
                            onChange={(e) => setCoffeeTonsSell(e.target.value)}
                            style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '3px' }}>Price / Ton (USD):</label>
                          <input
                            type="number"
                            required
                            value={coffeePriceSellUSD}
                            onChange={(e) => setCoffeePriceSellUSD(e.target.value)}
                            style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '3px' }}>Trading Profit (UGX):</label>
                          <input
                            type="number"
                            required
                            value={coffeeProfitUGX}
                            onChange={(e) => setCoffeeProfitUGX(e.target.value)}
                            style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        style={{
                          background: '#16a34a',
                          color: '#fff',
                          padding: '10px 16px',
                          borderRadius: '6px',
                          border: 'none',
                          fontWeight: '700',
                          cursor: 'pointer',
                          fontSize: '13px',
                          marginTop: '6px',
                          boxShadow: '0 3px 10px rgba(22, 163, 74, 0.3)'
                        }}
                      >
                        🚢 Log Export Sale &amp; Auto-Distribute Member Dividends
                      </button>
                    </form>
                  </div>
                </div>

                {/* RECENT COFFEE PURCHASES TABLE */}
                <h4 style={{ margin: '0 0 10px', color: '#0f172a', fontFamily: 'Cinzel, serif', fontSize: '15px' }}>
                  Recent Outgrower Coffee Purchases
                </h4>
                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '24px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                    <thead style={{ background: '#f8fafc', color: '#475569' }}>
                      <tr>
                        <th style={{ padding: '8px 12px' }}>ID</th>
                        <th style={{ padding: '8px 12px' }}>Date</th>
                        <th style={{ padding: '8px 12px' }}>Farmer</th>
                        <th style={{ padding: '8px 12px' }}>Coffee Type</th>
                        <th style={{ padding: '8px 12px' }}>Weight (KG)</th>
                        <th style={{ padding: '8px 12px' }}>Rate / KG</th>
                        <th style={{ padding: '8px 12px' }}>Total Payout</th>
                        <th style={{ padding: '8px 12px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coffeeManagement.buyingLogs.map((b) => (
                        <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 12px', fontWeight: '700' }}>{b.id}</td>
                          <td style={{ padding: '8px 12px', color: '#64748b' }}>{b.date}</td>
                          <td style={{ padding: '8px 12px', fontWeight: '600' }}>{b.farmerName}</td>
                          <td style={{ padding: '8px 12px' }}>{b.coffeeType}</td>
                          <td style={{ padding: '8px 12px' }}>{b.netWeightKg} KG</td>
                          <td style={{ padding: '8px 12px' }}>{b.ratePerKg.toLocaleString()} UGX</td>
                          <td style={{ padding: '8px 12px', fontWeight: '700', color: '#16a34a' }}>{b.totalUGX.toLocaleString()} UGX</td>
                          <td style={{ padding: '8px 12px' }}>{b.paymentStatus}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* RECENT COFFEE EXPORTS TABLE */}
                <h4 style={{ margin: '0 0 10px', color: '#0f172a', fontFamily: 'Cinzel, serif', fontSize: '15px' }}>
                  Recent Coffee Export Sales &amp; Dividend Allocations
                </h4>
                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                    <thead style={{ background: '#f8fafc', color: '#475569' }}>
                      <tr>
                        <th style={{ padding: '8px 12px' }}>Contract</th>
                        <th style={{ padding: '8px 12px' }}>Date</th>
                        <th style={{ padding: '8px 12px' }}>Buyer</th>
                        <th style={{ padding: '8px 12px' }}>Variety</th>
                        <th style={{ padding: '8px 12px' }}>Quantity</th>
                        <th style={{ padding: '8px 12px' }}>Contract Value</th>
                        <th style={{ padding: '8px 12px' }}>Member Dividend Pool</th>
                        <th style={{ padding: '8px 12px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coffeeManagement.sellingLogs.map((s) => (
                        <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 12px', fontWeight: '700' }}>{s.id}</td>
                          <td style={{ padding: '8px 12px', color: '#64748b' }}>{s.date}</td>
                          <td style={{ padding: '8px 12px', fontWeight: '600' }}>{s.buyerName}</td>
                          <td style={{ padding: '8px 12px' }}>{s.coffeeType}</td>
                          <td style={{ padding: '8px 12px' }}>{s.quantityTons} MT</td>
                          <td style={{ padding: '8px 12px', fontWeight: '700' }}>${s.totalValueUSD.toLocaleString()} ({s.totalValueUGX.toLocaleString()} UGX)</td>
                          <td style={{ padding: '8px 12px', color: '#16a34a', fontWeight: '700' }}>+{s.dividendPoolAllocatedUGX?.toLocaleString()} UGX</td>
                          <td style={{ padding: '8px 12px' }}>{s.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}
