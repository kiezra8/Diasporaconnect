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
  const [notification, setNotification] = useState('');

  // Form states
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

  // Load and protect session
  useEffect(() => {
    const auth = getAuthSession();
    if (!auth || auth.email !== AUTHORIZED_TESTER.email) {
      navigate('/signin');
      return;
    }
    setSession(auth);
  }, [navigate]);

  // Listen to portal updates
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

  // Deposit Submit
  const handleDepositSubmit = (e) => {
    e.preventDefault();
    if (!depositAmount || Number(depositAmount) <= 0) return;
    submitDepositRequest(depositAmount, depositMethod, depositRef || `REF-${Date.now().toString().slice(-6)}`, depositNotes);
    showNotification('Deposit request submitted! It has been routed to the Accountant and Admin queue for approval.');
    setDepositRef('');
    setDepositNotes('');
    setClientTab('statement');
  };

  // Withdraw Submit
  const handleWithdrawSubmit = (e) => {
    e.preventDefault();
    const amt = Number(withdrawAmount);
    if (!amt || amt <= 0) return;
    if (amt > portalData.client.savingsBalance) {
      alert(`Withdrawal exceeds available liquid savings of ${portalData.client.savingsBalance.toLocaleString()} UGX.`);
      return;
    }
    submitWithdrawalRequest(amt, withdrawDest, withdrawReason);
    showNotification('Withdrawal request submitted for Accountant compliance review.');
    setWithdrawAmount('');
    setWithdrawDest('');
    setClientTab('statement');
  };

  // Support Submit
  const handleSupportSubmit = (e) => {
    e.preventDefault();
    submitSupportTicket(supportSubject, supportCategory, supportMessage);
    showNotification('Support inquiry sent to Diaspora Member Liaison Officer.');
    setSupportSubject('');
    setSupportMessage('');
  };

  // Admin / Accountant Action: Approve Deposit
  const handleApproveDeposit = (reqId) => {
    approveDeposit(reqId);
    showNotification('Deposit approved! Member shares and financial statement updated automatically.');
  };

  // Admin Action: Distribute Farm Dairy Dividends
  const handleDistributeDairy = () => {
    const share = distributeFarmDividend(25000000);
    showNotification(`Dairy surplus distributed! Credited ${share.toLocaleString()} UGX to member shares and financial statement.`);
  };

  // Coffee Action: Record Purchase
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

  // Coffee Action: Record Sale & Auto-Distribute
  const handleCoffeeSaleSubmit = (e) => {
    e.preventDefault();
    const tons = Number(coffeeTonsSell);
    const priceUSD = Number(coffeePriceSellUSD);
    const totalUSD = tons * priceUSD;
    const totalUGX = totalUSD * 3700; // Exchange rate approx 3700 UGX
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

  if (!session) {
    return null;
  }

  const { client, financialStatement, depositRequests, farmManagement, coffeeManagement, secretary, board } = portalData;

  return (
    <div style={{ backgroundColor: '#f8fafc', color: '#1e293b', minHeight: '100vh', paddingTop: '82px' }}>
      {/* ── TOP SWITCHBOARD HEADER ── */}
      <section style={{ background: '#0f172a', color: '#fff', borderBottom: '2px solid #b8860b', padding: '24px 20px' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'inline-block', background: 'rgba(184, 134, 11, 0.2)', border: '1px solid rgba(184, 134, 11, 0.4)', borderRadius: '20px', padding: '4px 12px', fontSize: '11px', color: '#f3c74d', letterSpacing: '2px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>
                Authorized Testing Environment
              </div>
              <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 'clamp(22px, 3vw, 32px)', margin: '0 0 6px', color: '#ffffff' }}>
                DIASPORA CONNECT <span style={{ color: '#d4af37' }}>PORTAL &amp; SYSTEMS</span>
              </h1>
              <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                Logged in as: <strong style={{ color: '#fff' }}>{session.email}</strong> ({session.name} &bull; Member No: {client.memberNo})
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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

          {/* ── 5 BRANCHES SELECTOR (AS DRAWN IN NOTEBOOK) ── */}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px' }}>
            <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '10px', fontWeight: '600' }}>
              Select Active Branch to Test:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {[
                { key: 'client', label: '👤 Client (User Portal)', desc: 'Member Shares, Ledger & Requests' },
                { key: 'secretary', label: '📋 Secretary', desc: 'Minutes, Circulars & Resolutions' },
                { key: 'admin', label: '🏛️ Admin & Internal Systems', desc: 'SACCO, Farm & Coffee Software' },
                { key: 'board', label: '👥 Board Members', desc: 'Strategic KPIs & Governance' },
                { key: 'accountant', label: '💼 Accountant', desc: 'Ledger & Approval Sync' }
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

      {/* ── NOTIFICATION BANNER ── */}
      {notification && (
        <div style={{ background: '#10b981', color: '#ffffff', padding: '12px 20px', textAlign: 'center', fontSize: '13.5px', fontWeight: '600', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}>
          ✨ {notification}
        </div>
      )}

      {/* ── MAIN CONTENT AREA ── */}
      <main style={{ maxWidth: '1240px', margin: '0 auto', padding: '30px 20px 80px' }}>

        {/* ════════════════════════════════════════════════════════════════
            BRANCH 1: CLIENT (USER'S PORTAL)
            Sub-branches from diagram:
            - Shares
            - Financial statement
            - Request to deposit more
            - Request to withdraw
            - Customer support
            Constraint: Systems can't be accessed by members, but shares &
            statement update automatically from the systems!
           ════════════════════════════════════════════════════════════════ */}
        {activeBranch === 'client' && (
          <div>
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)', marginBottom: '24px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: '24px', color: '#0f172a', margin: '0 0 4px' }}>
                    MEMBER PORTAL DASHBOARD
                  </h2>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                    Welcome, {client.name}. View your share capital, audited financial ledger, and request transactions.
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

              {/* ─ SYSTEM RESTRICTION NOTICE FOR MEMBERS ─ */}
              <div style={{ background: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)', border: '1px solid #fde047', borderRadius: '10px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                <div style={{ fontSize: '24px' }}>🔒</div>
                <div>
                  <strong style={{ color: '#854d0e', fontSize: '13.5px' }}>Automatic Real-Time System Synchronization Active:</strong>
                  <p style={{ margin: '3px 0 0', color: '#713f12', fontSize: '12.5px', lineHeight: '1.45' }}>
                    As per SACCO security governance, internal management software (SACCO Core, Farm Livestock Management, and Coffee Buying/Selling Systems) cannot be accessed directly by general members. However, <strong>your shares and financial statements below update automatically in real-time</strong> whenever farm yields, coffee export sales, or deposit approvals are processed by SACCO administrators.
                  </p>
                </div>
              </div>

              {/* ── CLIENT SUB-BRANCH 1: SHARES ── */}
              {clientTab === 'shares' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Total Share Units</span>
                      <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '28px', color: '#0f172a', margin: '8px 0 4px' }}>{client.sharesCount} Units</h3>
                      <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>@ {client.shareUnitPrice.toLocaleString()} UGX / share</span>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Total Shareholding Value</span>
                      <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '28px', color: '#b8860b', margin: '8px 0 4px' }}>{client.totalShareValue.toLocaleString()} UGX</h3>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Deeded Freehold Farmland Trust</span>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Liquid Savings Balance</span>
                      <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '28px', color: '#0f172a', margin: '8px 0 4px' }}>{client.savingsBalance.toLocaleString()} UGX</h3>
                      <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: '600' }}>Available for withdrawal / transfer</span>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Dividends Earned (YTD)</span>
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

              {/* ── CLIENT SUB-BRANCH 2: FINANCIAL STATEMENT ── */}
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

              {/* ── CLIENT SUB-BRANCH 3: REQUEST TO DEPOSIT MORE ── */}
              {clientTab === 'deposit' && (
                <div style={{ maxWidth: '640px' }}>
                  <h3 style={{ margin: '0 0 8px', fontFamily: 'Cinzel, serif', fontSize: '18px', color: '#0f172a' }}>Request Additional Share or Savings Deposit</h3>
                  <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '13.5px' }}>
                    Select your payment method and submit deposit reference. Once the Accountant reconciles the receipt, your shares and statement will update automatically.
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

              {/* ── CLIENT SUB-BRANCH 4: REQUEST TO WITHDRAW ── */}
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

              {/* ── CLIENT SUB-BRANCH 5: CUSTOMER SUPPORT ── */}
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
            BRANCH 3: BOARD MEMBERS PORTAL
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
            Accountant reconciles deposits and when approved, member shares
            and financial statements update automatically!
           ════════════════════════════════════════════════════════════════ */}
        {activeBranch === 'accountant' && (
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
            <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: '24px', color: '#0f172a', margin: '0 0 6px' }}>
              ACCOUNTANT'S TREASURY &amp; LEDGER SYNC
            </h2>
            <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '14px' }}>
              Reconcile incoming bank/mobile money payments. <strong>Approving a deposit here immediately updates the member's share count and financial statement in real-time.</strong>
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
            BRANCH 5: ADMIN & INTERNAL MANAGEMENT SYSTEMS
            Systems:
            1. SACCO Management System Software
            2. Farm Management System Software
            3. Coffee Management System Software (Buying & Selling Coffee)
           ════════════════════════════════════════════════════════════════ */}
        {activeBranch === 'admin' && (
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: '24px', color: '#0f172a', margin: '0 0 4px' }}>
                  ADMINISTRATIVE CORE MANAGEMENT SYSTEMS
                </h2>
                <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                  Back-office software inaccessible to general members. Operations triggered here synchronize live to member statements.
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

            {/* ── INTERNAL SYSTEM 1: SACCO MANAGEMENT SYSTEM ── */}
            {adminSystemTab === 'sacco' && (
              <div>
                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                  <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '18px', color: '#0f172a', margin: '0 0 10px' }}>
                    SACCO Core Banking &amp; Share Registry Engine
                  </h3>
                  <p style={{ fontSize: '13.5px', color: '#475569', margin: '0 0 16px' }}>
                    Manages member share capital, statutory savings, and loan portfolios compliant with the Co-operative Societies Act of Uganda.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                    <div style={{ background: '#fff', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Statutory Reserve Fund</span>
                      <strong style={{ display: 'block', fontSize: '18px', color: '#0f172a', marginTop: '4px' }}>420,000,000 UGX</strong>
                    </div>
                    <div style={{ background: '#fff', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Total Share Capital</span>
                      <strong style={{ display: 'block', fontSize: '18px', color: '#b8860b', marginTop: '4px' }}>1,850,000,000 UGX</strong>
                    </div>
                    <div style={{ background: '#fff', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Annual Dividend Yield Target</span>
                      <strong style={{ display: 'block', fontSize: '18px', color: '#16a34a', marginTop: '4px' }}>14.8% Compound</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── INTERNAL SYSTEM 2: FARM MANAGEMENT SYSTEM ── */}
            {adminSystemTab === 'farm' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '18px', color: '#0f172a', margin: '0 0 4px' }}>
                      Commercial Dairy &amp; Farmland Management System
                    </h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                      Tracks live herds, veterinary vaccination cycles, and automated cold-chain milk chilling depots.
                    </p>
                  </div>
                  <button
                    onClick={handleDistributeDairy}
                    style={{
                      background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                      color: '#fff',
                      padding: '10px 18px',
                      borderRadius: '8px',
                      border: 'none',
                      fontWeight: '700',
                      cursor: 'pointer',
                      fontSize: '13px',
                      boxShadow: '0 3px 10px rgba(22, 163, 74, 0.3)'
                    }}
                  >
                    🥛 Distribute Dairy Yield Proceeds to Members
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>Total Herd Count</span>
                    <strong style={{ display: 'block', fontSize: '22px', color: '#0f172a', marginTop: '4px' }}>{farmManagement.totalHerdCount} Head</strong>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>Daily Milk Output</span>
                    <strong style={{ display: 'block', fontSize: '22px', color: '#16a34a', marginTop: '4px' }}>{farmManagement.dailyMilkAvgLiters} Liters/Day</strong>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>Silage Bunkers Stored</span>
                    <strong style={{ display: 'block', fontSize: '22px', color: '#b8860b', marginTop: '4px' }}>{farmManagement.totalSilageTons} Metric Tons</strong>
                  </div>
                </div>

                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead style={{ background: '#f8fafc', color: '#475569' }}>
                      <tr>
                        <th style={{ padding: '10px 14px' }}>Herd ID</th>
                        <th style={{ padding: '10px 14px' }}>Breed / Genetics</th>
                        <th style={{ padding: '10px 14px' }}>Quantity</th>
                        <th style={{ padding: '10px 14px' }}>Lactation Status</th>
                        <th style={{ padding: '10px 14px' }}>Farm Paddock Location</th>
                        <th style={{ padding: '10px 14px' }}>Avg Yield / Cow</th>
                      </tr>
                    </thead>
                    <tbody>
                      {farmManagement.herds.map((h) => (
                        <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 14px', fontWeight: '700' }}>{h.id}</td>
                          <td style={{ padding: '10px 14px' }}>{h.breed}</td>
                          <td style={{ padding: '10px 14px', fontWeight: '600' }}>{h.count} head</td>
                          <td style={{ padding: '10px 14px' }}>{h.status}</td>
                          <td style={{ padding: '10px 14px' }}>{h.location}</td>
                          <td style={{ padding: '10px 14px', color: '#16a34a', fontWeight: '600' }}>{h.avgYield}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── INTERNAL SYSTEM 3: COFFEE MANAGEMENT SYSTEM (BUYING & SELLING COFFEE) ── */}
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
