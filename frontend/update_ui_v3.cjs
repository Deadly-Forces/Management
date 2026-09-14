const fs = require('fs');
const path = require('path');

const baseDir = 'd:/sih/frontend';

const files = {
  'src/index.css': `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #f1f5f9;
  font-family: 'Inter', -apple-system, sans-serif;
  color: #0f172a;
}

/* Advanced Scrollbar */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: #f1f5f9; }
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

/* Custom utility for a subtle inner shadow on the cockpit viewer */
.inner-viewer-shadow {
  box-shadow: inset 0 2px 10px rgba(0,0,0,0.1);
}
`,

  'src/components/Sidebar.jsx': `import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Layers, ShieldAlert, LogOut, Hexagon } from 'lucide-react';

export default function Sidebar({ role }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path 
    ? 'bg-indigo-600/10 text-indigo-400 border-r-2 border-indigo-500' 
    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200';

  return (
    <div className="w-64 bg-slate-950 min-h-screen flex flex-col font-sans border-r border-slate-900 shadow-xl z-20">
      <div className="h-16 flex items-center px-6 border-b border-slate-800/60">
        <Hexagon className="text-indigo-500 mr-3 shrink-0" size={24} strokeWidth={2.5} />
        <div>
          <h1 className="text-lg font-bold tracking-wide text-slate-100">ClaimPilot</h1>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mt-0.5">{role.replace('_', ' ')}</p>
        </div>
      </div>
      
      <div className="p-4">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 px-2">Main Menu</p>
        <nav className="space-y-1">
          {(role === 'Administrator' || role === 'Agent') && (
            <Link to="/dashboard" className={\`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all \${isActive('/dashboard')}\`}>
              <LayoutDashboard size={18} /> Executive Overview
            </Link>
          )}
          {(role === 'Human_Verifier' || role === 'Administrator') && (
            <Link to="/queue" className={\`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all \${isActive('/queue')}\`}>
              <Layers size={18} /> Global Triage Queue
            </Link>
          )}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-slate-800/60">
        <Link to="/login" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all">
          <LogOut size={18} /> Terminate Session
        </Link>
      </div>
    </div>
  );
}`,

  'src/pages/Dashboard.jsx': `import Sidebar from '../components/Sidebar';
import { Activity, Clock, ShieldCheck, AlertOctagon, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const role = localStorage.getItem('role') || 'Administrator';

  const kpis = [
    { label: "Straight-Through Processing", value: "24.5%", sub: "Target: 30%", icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Avg Adjudication Time", value: "14m 30s", sub: "Down 1.2m this week", icon: Clock, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { label: "Labor Hours Saved", value: "1,240", sub: "Estimated $42k saved", icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "SIU Fraud Referrals", value: "48", sub: "Action required on 12", icon: AlertOctagon, color: "text-rose-500", bg: "bg-rose-500/10" }
  ];

  return (
    <div className="flex bg-slate-100 min-h-screen">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 shadow-sm z-10">
          <h2 className="text-lg font-bold text-slate-800">Command Center</h2>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Systems Operational
            </span>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="p-8 flex-1 overflow-auto">
          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {kpis.map((kpi, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative overflow-hidden group hover:border-slate-300 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className={\`p-3 rounded-lg \${kpi.bg}\`}>
                    <kpi.icon className={kpi.color} size={24} />
                  </div>
                  <Activity size={16} className="text-slate-300 group-hover:text-slate-400 transition-colors" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-1">{kpi.value}</h3>
                <p className="text-sm font-semibold text-slate-600 mb-1">{kpi.label}</p>
                <p className="text-xs font-medium text-slate-400">{kpi.sub}</p>
                {/* Decorative background element */}
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-slate-50 rounded-full opacity-50 pointer-events-none group-hover:scale-110 transition-transform"></div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-bold text-slate-900">Live Adjudication Feed</h3>
              </div>
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider rounded-tl-lg rounded-bl-lg">Claim ID</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">AI Confidence</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider rounded-tr-lg rounded-br-lg text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { id: 'CLM-9921', type: 'Life / Death', conf: 99, time: '2 mins ago', alert: false },
                    { id: 'CLM-9920', type: 'Auto - Collision', conf: 82, time: '14 mins ago', alert: true },
                    { id: 'CLM-9919', type: 'Property - Fire', conf: 95, time: '1 hr ago', alert: false }
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-4 font-semibold text-indigo-600">{row.id}</td>
                      <td className="px-4 py-4 font-medium text-slate-700">{row.type}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden w-24">
                            <div className={\`h-full \${row.alert ? 'bg-amber-400' : 'bg-emerald-500'}\`} style={{ width: \`\${row.conf}%\` }}></div>
                          </div>
                          <span className="text-xs font-bold text-slate-600">{row.conf}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs font-medium text-slate-400 text-right">{row.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="col-span-1 bg-slate-900 rounded-xl border border-slate-800 shadow-lg p-6 text-white relative overflow-hidden">
               <h3 className="text-base font-bold text-white mb-6 relative z-10">System Alerts</h3>
               <div className="space-y-4 relative z-10">
                 <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                   <h4 className="text-sm font-bold text-rose-400 flex items-center gap-2"><AlertOctagon size={16}/> High Risk Spike</h4>
                   <p className="text-xs text-slate-300 mt-2 leading-relaxed">Auto claims in region FL-02 showing 40% higher anomaly rates in the last 24hrs.</p>
                 </div>
                 <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                   <h4 className="text-sm font-bold text-indigo-400 flex items-center gap-2"><Clock size={16}/> SLA Warning</h4>
                   <p className="text-xs text-slate-300 mt-2 leading-relaxed">3 Life Insurance claims approaching 48hr regulatory review limit.</p>
                 </div>
               </div>
               {/* Aesthetic graphic */}
               <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}`,

  'src/pages/Queue.jsx': `import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ShieldAlert, FileHeart, Car, Home } from 'lucide-react';

export default function Queue() {
  const role = localStorage.getItem('role') || 'Human_Verifier';
  const navigate = useNavigate();

  // MOCK DATA INCLUDES NEW DEATH INSURANCE FEATURE
  const claims = [
    { id: 'CLM-8001', claimant: 'Estate of Robert Ford', policy: 'POL-LIFE-992', type: 'Life / Death', icon: FileHeart, status: 'READY_FOR_REVIEW', risk: 8, amount: '$500,000' },
    { id: 'CLM-8002', claimant: 'Sarah Jenkins', policy: 'POL-AUTO-110', type: 'Auto - Collision', icon: Car, status: 'READY_FOR_REVIEW', risk: 72, amount: '$4,250' },
    { id: 'CLM-8003', claimant: 'Marcus Vance', policy: 'POL-PROP-442', type: 'Property - Fire', icon: Home, status: 'UNDER_REVIEW', risk: 14, amount: '$12,400' },
    { id: 'CLM-8004', claimant: 'Estate of Helen Cho', policy: 'POL-LIFE-414', type: 'Life / Death', icon: FileHeart, status: 'READY_FOR_REVIEW', risk: 45, amount: '$250,000' }
  ];

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex justify-between items-center px-8 shrink-0 shadow-sm z-10">
          <h2 className="text-lg font-bold text-slate-800">Global Triage Queue</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input type="text" placeholder="Search ID, Claimant, Policy..." className="pl-10 pr-4 py-2 text-sm font-medium border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-72 bg-slate-50" />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 shadow-sm">
              <Filter size={16} /> Filter
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-8 flex-1 overflow-auto">
          <div className="bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">Claim Details</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">Type & Exposure</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest w-48">AI Fraud Risk</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {claims.map((c) => (
                  <tr key={c.id} className="hover:bg-indigo-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-indigo-700 text-base">{c.id}</div>
                      <div className="text-slate-500 font-medium mt-1">{c.claimant}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{c.policy}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-semibold text-slate-800 mb-1">
                        <c.icon size={16} className="text-slate-400" /> {c.type}
                      </div>
                      <div className="text-sm font-bold text-slate-600">{c.amount}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className={c.risk > 50 ? 'text-rose-600' : 'text-emerald-600'}>Score: {c.risk}/100</span>
                          {c.risk > 50 && <ShieldAlert size={14} className="text-rose-500" />}
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                          <div className={\`h-full \${c.risk > 50 ? 'bg-rose-500' : 'bg-emerald-500'}\`} style={{ width: \`\${c.risk}%\` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black bg-amber-100 text-amber-800 border border-amber-200 shadow-sm uppercase tracking-wide">
                        {c.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => navigate(\`/cockpit/\${c.id}\`)}
                        className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-indigo-700 hover:shadow transition-all group-hover:scale-105"
                      >
                        Launch Cockpit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}`,

  'src/pages/Cockpit.jsx': `import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, AlertOctagon, FileText, Activity, ShieldCheck } from 'lucide-react';

export default function Cockpit() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // LOGIC TO HANDLE BOTH AUTO AND LIFE/DEATH CLAIMS
  const isDeathClaim = id === 'CLM-8001' || id === 'CLM-8004';

  const [lifeVerifications, setLifeVerifications] = useState({
    deathCert: null,
    beneficiary: null,
    ssnMatch: null
  });

  const [autoItems, setAutoItems] = useState([
    { id: 1, desc: "Front Bumper OEM", amount: 850, accepted: null },
    { id: 2, desc: "Labor (4.5 hrs)", amount: 405, accepted: null },
    { id: 3, desc: "Diagnostics", amount: 85, accepted: null }
  ]);

  const allLifeVerified = Object.values(lifeVerifications).every(v => v !== null);
  const allAutoVerified = autoItems.every(i => i.accepted !== null);
  const canApprove = isDeathClaim ? allLifeVerified : allAutoVerified;

  const totalAuto = autoItems.reduce((acc, item) => acc + (item.accepted !== false ? item.amount : 0), 0);

  return (
    <div className="h-screen flex flex-col bg-slate-900 overflow-hidden font-sans text-slate-200">
      {/* Heavy-Duty Workspace Header */}
      <header className="h-16 bg-slate-950 border-b border-slate-800 px-6 flex justify-between items-center shrink-0 z-10 shadow-2xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/queue')} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="h-6 w-px bg-slate-800"></div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-black text-white tracking-tight">{id}</h1>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-widest">
                Review Required
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              {isDeathClaim ? 'Life Insurance / Death Benefit' : 'Auto Collision'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-slate-900 text-rose-500 border border-rose-500/30 rounded-lg shadow-sm text-sm font-bold hover:bg-rose-500/10 transition-colors flex items-center gap-2">
            <AlertOctagon size={16} /> Escalate to SIU
          </button>
          <button 
            disabled={!canApprove}
            className={\`px-6 py-2 rounded-lg shadow-lg text-sm font-bold tracking-wide transition-all \${canApprove ? 'bg-indigo-600 text-white hover:bg-indigo-500 border border-indigo-400' : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'}\`}
          >
            {isDeathClaim ? 'Authorize Payout' : 'Approve Settlement'}
          </button>
        </div>
      </header>

      {/* Dual Pane Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Pane: Document Viewer */}
        <div className="w-[50%] flex flex-col border-r border-slate-800 bg-slate-900/50 relative inner-viewer-shadow">
          <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur border border-slate-800 px-4 py-2 rounded-lg flex items-center gap-3 z-10">
            <FileText size={16} className="text-indigo-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
              {isDeathClaim ? 'Official Death Certificate' : 'Repair Estimate PDF'}
            </span>
          </div>
          <div className="flex-1 overflow-auto p-8 flex justify-center items-center">
            {/* Mock High-End PDF Viewer */}
            <div className="bg-slate-100 w-full max-w-2xl h-[800px] rounded-sm shadow-2xl flex flex-col items-center justify-center relative overflow-hidden border border-slate-400">
               {isDeathClaim ? (
                 <div className="text-slate-800 text-center px-12 border-[8px] border-double border-slate-300 py-24 m-12">
                   <h2 className="font-serif text-3xl font-black mb-6 border-b-2 border-slate-800 pb-4">CERTIFICATE OF DEATH</h2>
                   <p className="font-mono text-lg font-bold mb-2">NAME: ROBERT FORD</p>
                   <p className="font-mono text-lg font-bold mb-8">DATE: OCT 12, 2026</p>
                   <div className="w-32 h-32 border-4 border-slate-400 rounded-full mx-auto flex items-center justify-center opacity-30">
                     <span className="font-serif font-bold rotate-[-30deg]">OFFICIAL SEAL</span>
                   </div>
                 </div>
               ) : (
                 <div className="text-slate-400 font-black text-2xl tracking-widest uppercase">AUTO_ESTIMATE.PDF</div>
               )}
            </div>
          </div>
        </div>

        {/* Right Pane: AI Extractions */}
        <div className="w-[50%] flex flex-col bg-slate-950 relative">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* AI Core Analysis */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-inner">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Activity size={16} className="text-indigo-500" /> AI Core Analysis
              </h3>
              
              {isDeathClaim ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                    <div>
                      <p className="text-sm font-bold text-slate-200">Vital Records API Check</p>
                      <p className="text-xs text-slate-400 mt-1">Matched with State Registry. No anomalies.</p>
                    </div>
                    <ShieldCheck className="text-emerald-500" size={24} />
                  </div>
                  <div className="flex justify-between items-center p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg">
                    <div>
                      <p className="text-sm font-bold text-slate-200">Beneficiary Validation</p>
                      <p className="text-xs text-slate-400 mt-1">Jane Ford (Spouse) confirmed via Policy #992.</p>
                    </div>
                    <span className="text-xs font-black text-indigo-400 bg-indigo-500/20 px-2 py-1 rounded">99.8% MATCH</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-300 leading-relaxed font-medium">
                  Estimate aligns with standard OEM replacement rates for this vehicle class. 
                  <span className="text-emerald-400 ml-2">No anomalous labor hours detected.</span>
                </p>
              )}
            </div>

            {/* Actionable Items */}
            <div>
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">
                {isDeathClaim ? 'Required Verifications' : 'Settlement Line Items'}
              </h3>

              {isDeathClaim ? (
                <div className="space-y-3">
                  {[
                    { key: 'deathCert', label: 'Verify Death Certificate Authenticity' },
                    { key: 'beneficiary', label: 'Approve Beneficiary (Jane Ford)' },
                    { key: 'ssnMatch', label: 'Confirm SSN Deceased Registry Match' }
                  ].map(item => (
                    <div key={item.key} className={\`p-4 rounded-xl border transition-all \${lifeVerifications[item.key] === true ? 'bg-emerald-500/10 border-emerald-500/30' : lifeVerifications[item.key] === false ? 'bg-rose-500/10 border-rose-500/30' : 'bg-slate-900 border-slate-800'}\`}>
                      <p className="text-sm font-bold text-slate-200 mb-4">{item.label}</p>
                      <div className="flex gap-3">
                        <button onClick={() => setLifeVerifications(prev => ({...prev, [item.key]: true}))} className={\`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wide transition-all \${lifeVerifications[item.key] === true ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}\`}>
                          <CheckCircle2 size={16} /> Verify
                        </button>
                        <button onClick={() => setLifeVerifications(prev => ({...prev, [item.key]: false}))} className={\`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wide transition-all \${lifeVerifications[item.key] === false ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}\`}>
                          <XCircle size={16} /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {autoItems.map(item => (
                    <div key={item.id} className={\`p-4 rounded-xl border transition-all \${item.accepted === true ? 'bg-emerald-500/10 border-emerald-500/30' : item.accepted === false ? 'bg-rose-500/10 border-rose-500/30' : 'bg-slate-900 border-slate-800'}\`}>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-bold text-slate-200">{item.desc}</span>
                        <span className={\`text-sm font-black \${item.accepted === false ? 'text-slate-600 line-through' : 'text-white'}\`}>\${item.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => setAutoItems(prev => prev.map(i => i.id === item.id ? {...i, accepted: true} : i))} className={\`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wide transition-all \${item.accepted === true ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}\`}>
                          <CheckCircle2 size={16} /> Accept
                        </button>
                        <button onClick={() => setAutoItems(prev => prev.map(i => i.id === item.id ? {...i, accepted: false} : i))} className={\`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wide transition-all \${item.accepted === false ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}\`}>
                          <XCircle size={16} /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Bottom Total Footer */}
          <div className="p-6 border-t border-slate-800 bg-slate-950 flex justify-between items-center shrink-0 z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <div className="flex flex-col">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{isDeathClaim ? 'Lump Sum Beneficiary Payout' : 'Total Approved Settlement'}</span>
              <span className="text-xs font-semibold text-slate-400 mt-1">{canApprove ? 'Ready for authorization' : 'Pending verifications'}</span>
            </div>
            <span className="font-black text-3xl text-white tracking-tight">
              {isDeathClaim ? '$500,000.00' : \`$\${totalAuto.toFixed(2)}\`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}`
};

Object.entries(files).forEach(([filepath, content]) => {
  fs.writeFileSync(path.join(baseDir, filepath), content);
});

console.log('UI 3.0 Pro & Life Insurance Feature deployed.');
