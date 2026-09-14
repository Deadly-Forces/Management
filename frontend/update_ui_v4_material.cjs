const fs = require('fs');
const path = require('path');

const baseDir = 'd:/sih/frontend';

const files = {
  'src/index.css': `@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #f5f5f5;
  font-family: 'Roboto', -apple-system, sans-serif;
  color: #212121;
}

/* Material Design Button styles */
.btn-material {
  @apply uppercase text-sm font-medium px-4 py-2 rounded shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:ring-offset-2;
}
.btn-primary {
  @apply bg-[#1976d2] text-white;
}
.btn-outlined {
  @apply border border-gray-300 text-[#1976d2] hover:bg-gray-50 shadow-none hover:shadow-none;
}
.btn-text {
  @apply text-[#1976d2] shadow-none hover:shadow-none hover:bg-[#1976d2]/10;
}

/* Material Card */
.mat-card {
  @apply bg-white rounded shadow-md border-0;
}
`,

  'src/components/Sidebar.jsx': `import { Link, useLocation } from 'react-router-dom';
import { Dashboard, ListAlt, ExitToApp, AccountCircle } from '@mui/icons-material'; // Will use lucide as fallback if MUI not installed, but let's stick to Lucide icons styled like Material
import { LayoutDashboard, Layers, LogOut, UserCircle } from 'lucide-react';

export default function Sidebar({ role }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path 
    ? 'bg-blue-50 text-[#1976d2]' 
    : 'text-gray-700 hover:bg-gray-100';

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col font-sans shadow-sm z-10">
      
      {/* User Profile Header (Material Style) */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-4">
        <UserCircle className="text-gray-400" size={40} />
        <div>
          <h2 className="text-sm font-medium text-gray-900">System User</h2>
          <p className="text-xs text-gray-500">{role.replace('_', ' ')}</p>
        </div>
      </div>
      
      <nav className="flex-1 py-2">
        {(role === 'Administrator' || role === 'Agent') && (
          <Link to="/dashboard" className={\`flex items-center gap-4 px-6 py-3 text-sm font-medium transition-colors \${isActive('/dashboard')}\`}>
            <LayoutDashboard size={20} className={location.pathname === '/dashboard' ? 'text-[#1976d2]' : 'text-gray-500'} /> Dashboard
          </Link>
        )}
        {(role === 'Human_Verifier' || role === 'Administrator') && (
          <Link to="/queue" className={\`flex items-center gap-4 px-6 py-3 text-sm font-medium transition-colors \${isActive('/queue')}\`}>
            <Layers size={20} className={location.pathname === '/queue' ? 'text-[#1976d2]' : 'text-gray-500'} /> Triage Queue
          </Link>
        )}
      </nav>

      <div className="border-t border-gray-200 py-2">
        <Link to="/login" className="flex items-center gap-4 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
          <LogOut size={20} className="text-gray-500" /> Sign out
        </Link>
      </div>
    </div>
  );
}`,

  'src/pages/Landing.jsx': `import { Link } from 'react-router-dom';
import { Shield, Zap, FileText } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#f5f5f5] font-sans">
      {/* Material Top App Bar */}
      <header className="bg-[#1976d2] text-white shadow-md h-16 flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <FileText size={24} />
          <span className="text-xl font-medium tracking-wide">ClaimPilot AI</span>
        </div>
        <Link to="/login" className="text-white uppercase text-sm font-medium hover:bg-white/10 px-4 py-2 rounded transition-colors">
          Sign In
        </Link>
      </header>

      {/* Hero Section */}
      <main className="bg-white shadow-sm border-b border-gray-200 pt-20 pb-24 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-medium text-gray-900 mb-6">
            Intelligent Claims Adjudication
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Process Auto, Property, and Life Insurance claims with AI. A strictly human-in-the-loop platform designed for enterprise carriers.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/login" className="btn-material btn-primary text-base px-6 py-3">
              Get Started
            </Link>
            <Link to="/login" className="btn-material btn-outlined text-base px-6 py-3">
              Learn More
            </Link>
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-medium text-gray-900 text-center mb-10">Enterprise Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="mat-card p-6 text-center">
            <div className="w-12 h-12 bg-blue-50 text-[#1976d2] rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={24} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Multi-Modal Extraction</h3>
            <p className="text-gray-600 text-sm">
              Automatically extract line items from auto repair estimates, property damage reports, and death certificates.
            </p>
          </div>

          <div className="mat-card p-6 text-center">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield size={24} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Human-in-the-Loop</h3>
            <p className="text-gray-600 text-sm">
              Strict state machine enforces manual verification of every AI-extracted data point before settlement approval.
            </p>
          </div>

          <div className="mat-card p-6 text-center">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap size={24} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Instant Triage</h3>
            <p className="text-gray-600 text-sm">
              Claims are instantly scored for fraud risk and routed to the appropriate adjuster queue based on severity.
            </p>
          </div>

        </div>
      </section>
    </div>
  );
}`,

  'src/pages/Dashboard.jsx': `import Sidebar from '../components/Sidebar';
import { Activity, Clock, ShieldCheck, AlertOctagon } from 'lucide-react';

export default function Dashboard() {
  const role = localStorage.getItem('role') || 'Administrator';

  const kpis = [
    { label: "Straight-Through %", value: "24.5%", icon: ShieldCheck, color: "text-green-600" },
    { label: "Avg Process Time", value: "14m 30s", icon: Clock, color: "text-[#1976d2]" },
    { label: "Labor Hours Saved", value: "1,240", icon: Activity, color: "text-purple-600" },
    { label: "SIU Referrals", value: "48", icon: AlertOctagon, color: "text-red-600" }
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f5f5]">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col">
        {/* Material Top App Bar */}
        <header className="bg-[#1976d2] text-white shadow-md h-16 flex items-center px-6 shrink-0 z-10">
          <h2 className="text-lg font-medium tracking-wide">Executive Overview</h2>
        </header>
        
        <main className="p-6 flex-1 overflow-auto">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {kpis.map((kpi, i) => (
              <div key={i} className="mat-card p-4 flex items-center gap-4">
                <div className={\`p-3 rounded-full bg-gray-50 \${kpi.color}\`}>
                  <kpi.icon size={28} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">{kpi.label}</p>
                  <p className="text-2xl font-normal text-gray-900 mt-1">{kpi.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Data Table Card */}
          <div className="mat-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-medium text-gray-900">Recent Adjudications</h3>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 font-medium text-gray-600 border-b border-gray-200">Claim ID</th>
                  <th className="px-6 py-3 font-medium text-gray-600 border-b border-gray-200">Type</th>
                  <th className="px-6 py-3 font-medium text-gray-600 border-b border-gray-200">Confidence</th>
                  <th className="px-6 py-3 font-medium text-gray-600 border-b border-gray-200 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[
                  { id: 'CLM-9921', type: 'Life / Death', conf: '99%' },
                  { id: 'CLM-9920', type: 'Auto - Collision', conf: '82%' },
                  { id: 'CLM-9919', type: 'Property - Fire', conf: '95%' }
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-[#1976d2] font-medium">{row.id}</td>
                    <td className="px-6 py-4 text-gray-800">{row.type}</td>
                    <td className="px-6 py-4 text-gray-800">{row.conf}</td>
                    <td className="px-6 py-4 text-gray-500 text-right">2 hrs ago</td>
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

  'src/pages/Queue.jsx': `import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import { FileText, Car, Home } from 'lucide-react';

export default function Queue() {
  const role = localStorage.getItem('role') || 'Human_Verifier';
  const navigate = useNavigate();

  const claims = [
    { id: 'CLM-8001', claimant: 'Robert Ford', type: 'Life / Death', status: 'READY_FOR_REVIEW', risk: 'Low (8/100)' },
    { id: 'CLM-8002', claimant: 'Sarah Jenkins', type: 'Auto - Collision', status: 'READY_FOR_REVIEW', risk: 'High (72/100)' },
    { id: 'CLM-8003', claimant: 'Marcus Vance', type: 'Property - Fire', status: 'UNDER_REVIEW', risk: 'Low (14/100)' }
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f5f5]">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col">
        {/* Material Top App Bar */}
        <header className="bg-[#1976d2] text-white shadow-md h-16 flex items-center justify-between px-6 shrink-0 z-10">
          <h2 className="text-lg font-medium tracking-wide">Triage Queue</h2>
        </header>

        <main className="p-6 flex-1 overflow-auto">
          <div className="mat-card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-medium text-gray-600">Claim ID</th>
                  <th className="px-6 py-4 font-medium text-gray-600">Claimant</th>
                  <th className="px-6 py-4 font-medium text-gray-600">Type</th>
                  <th className="px-6 py-4 font-medium text-gray-600">AI Fraud Risk</th>
                  <th className="px-6 py-4 font-medium text-gray-600">Status</th>
                  <th className="px-6 py-4 font-medium text-gray-600 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {claims.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-[#1976d2] font-medium">{c.id}</td>
                    <td className="px-6 py-4 text-gray-800">{c.claimant}</td>
                    <td className="px-6 py-4 text-gray-800">{c.type}</td>
                    <td className="px-6 py-4">
                      <span className={\`font-medium \${c.risk.includes('High') ? 'text-red-600' : 'text-green-600'}\`}>
                        {c.risk}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium">
                        {c.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => navigate(\`/cockpit/\${c.id}\`)}
                        className="btn-material btn-text"
                      >
                        Review
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
import { ArrowLeft } from 'lucide-react';

export default function Cockpit() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const isDeathClaim = id === 'CLM-8001';

  const [verifications, setVerifications] = useState(
    isDeathClaim 
      ? { deathCert: null, beneficiary: null } 
      : { bumper: null, labor: null }
  );

  const allVerified = Object.values(verifications).every(v => v !== null);

  return (
    <div className="flex flex-col h-screen bg-[#f5f5f5] font-sans text-[#212121]">
      {/* Material Top App Bar */}
      <header className="bg-[#1976d2] text-white shadow-md h-16 px-4 flex justify-between items-center shrink-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/queue')} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-lg font-medium tracking-wide">{id} Review</h1>
            <p className="text-xs text-blue-100">{isDeathClaim ? 'Life / Death Insurance' : 'Auto Collision'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-material bg-white text-red-600 hover:bg-gray-50">
            Refer to SIU
          </button>
          <button 
            disabled={!allVerified}
            className={\`btn-material \${allVerified ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-500 shadow-none cursor-not-allowed'}\`}
          >
            Approve Settlement
          </button>
        </div>
      </header>

      {/* Dual Pane Layout (Cards) */}
      <div className="flex-1 p-6 flex gap-6 overflow-hidden">
        
        {/* Left Card: Document Viewer */}
        <div className="flex-1 mat-card flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-medium text-gray-700">Original Evidence Document</h2>
          </div>
          <div className="flex-1 bg-gray-200 p-8 flex justify-center overflow-auto">
            <div className="w-full max-w-lg bg-white shadow-lg h-[800px] p-12">
               {isDeathClaim ? (
                 <div className="text-center">
                   <h2 className="text-2xl font-serif mb-4">CERTIFICATE OF DEATH</h2>
                   <p className="text-lg">STATE REGISTRY</p>
                 </div>
               ) : (
                 <div className="text-center text-gray-500 font-bold text-xl">
                   AUTO_ESTIMATE.PDF
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Right Card: Extractions */}
        <div className="w-[400px] mat-card flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-medium text-gray-700">Extracted Data & Verification</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded">
              <p className="text-sm text-blue-900">
                {isDeathClaim 
                  ? "Vital Records match confirmed. Verify beneficiary details below."
                  : "Estimate matches OEM standard rates. Verify line items below."}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Manual Checks Required</h3>
              
              <div className="space-y-4">
                {Object.keys(verifications).map(key => (
                  <div key={key} className="border border-gray-200 rounded p-4">
                    <p className="text-sm font-medium text-gray-900 mb-3">
                      {key === 'deathCert' ? 'Verify Death Certificate Authenticity' :
                       key === 'beneficiary' ? 'Approve Beneficiary (Jane Ford)' :
                       key === 'bumper' ? 'Front Bumper Replacement ($850)' : 
                       'Labor - 4.5 Hours ($405)'}
                    </p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setVerifications(prev => ({...prev, [key]: true}))}
                        className={\`flex-1 py-1.5 text-sm font-medium rounded border \${verifications[key] === true ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}\`}
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => setVerifications(prev => ({...prev, [key]: false}))}
                        className={\`flex-1 py-1.5 text-sm font-medium rounded border \${verifications[key] === false ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}\`}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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

console.log('Material Design deployed.');
