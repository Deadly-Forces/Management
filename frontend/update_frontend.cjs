const fs = require('fs');
const path = require('path');

const baseDir = 'd:/sih/frontend';

const files = {
  'src/index.css': `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #f8fafc;
  font-family: 'Inter', -apple-system, sans-serif;
  color: #0f172a;
}

/* Custom scrollbar for dense data panes */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}`,

  'src/components/Sidebar.jsx': `import { Link, useLocation } from 'react-router-dom';
import { Home, List, FileText, LogOut, Briefcase } from 'lucide-react';

export default function Sidebar({ role }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900';

  return (
    <div className="w-56 bg-white border-r border-slate-200 min-h-screen flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Briefcase className="text-indigo-600" size={20} />
          <h1 className="text-lg font-bold tracking-tight text-slate-900">ClaimPilot AI</h1>
        </div>
        <div className="mt-2 text-xs font-medium text-slate-500 uppercase tracking-wider">{role.replace('_', ' ')}</div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {(role === 'Administrator' || role === 'Agent') && (
          <Link to="/dashboard" className={\`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors \${isActive('/dashboard')}\`}>
            <Home size={16} /> Dashboard
          </Link>
        )}
        {(role === 'Human_Verifier' || role === 'Administrator') && (
          <Link to="/queue" className={\`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors \${isActive('/queue')}\`}>
            <List size={16} /> Triage Queue
          </Link>
        )}
      </nav>
      <div className="p-3 border-t border-slate-200">
        <Link to="/login" className="flex items-center gap-3 px-3 py-2 text-sm rounded-md text-slate-600 hover:bg-slate-50 transition-colors">
          <LogOut size={16} /> Sign out
        </Link>
      </div>
    </div>
  );
}`,

  'src/pages/Login.jsx': `import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase } from 'lucide-react';

export default function Login() {
  const [role, setRole] = useState('Human_Verifier');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    localStorage.setItem('role', role);
    if (role === 'Administrator') navigate('/dashboard');
    else navigate('/queue');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-sm w-full bg-white rounded-md shadow-sm border border-slate-200 p-8">
        <div className="flex flex-col items-center mb-8">
          <Briefcase className="text-indigo-600 mb-3" size={32} />
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">ClaimPilot System Login</h2>
          <p className="text-sm text-slate-500 mt-1">Authorized personnel only</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Simulate Role</label>
            <select 
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-sm border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 rounded-md border text-slate-900"
            >
              <option value="Human_Verifier">Adjuster (Human Verifier)</option>
              <option value="Administrator">Risk Manager (Administrator)</option>
              <option value="Claimant">Claimant</option>
            </select>
          </div>
          <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
            Authenticate
          </button>
        </form>
      </div>
    </div>
  );
}`,

  'src/pages/Dashboard.jsx': `import Sidebar from '../components/Sidebar';
import { BarChart3, Clock, CheckCircle, AlertTriangle, Search } from 'lucide-react';

export default function Dashboard() {
  const role = localStorage.getItem('role') || 'Administrator';

  const metrics = [
    { label: "Straight-Through %", value: "24.5%", icon: CheckCircle, trend: "+2.1%" },
    { label: "Avg Processing Time", value: "14m 30s", icon: Clock, trend: "-1m 15s" },
    { label: "Labor Hours Saved", value: "1,240 hrs", icon: BarChart3, trend: "+120 hrs" },
    { label: "SIU Referrals", value: "12", icon: AlertTriangle, trend: "-3" }
  ];

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-8 shrink-0">
          <h2 className="text-sm font-semibold text-slate-800">Executive Dashboard</h2>
        </header>
        
        {/* Main Content */}
        <main className="p-8 flex-1 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {metrics.map((m, i) => (
              <div key={i} className="bg-white p-5 rounded-md border border-slate-200 shadow-sm flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{m.label}</p>
                  <m.icon className="text-slate-400" size={16} />
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-2xl font-bold text-slate-900 tracking-tight">{m.value}</p>
                  <span className={\`text-xs font-medium \${m.trend.startsWith('+') ? 'text-emerald-600' : 'text-slate-500'}\`}>{m.trend}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-md border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-slate-900">Recent AI Extractions Audit</h3>
              <div className="relative">
                <Search className="absolute left-2.5 top-2 text-slate-400" size={14} />
                <input type="text" placeholder="Search claims..." className="pl-8 pr-4 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
            </div>
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Claim ID</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Confidence</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Date Processed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {['CLM-1234', 'CLM-1235', 'CLM-1236', 'CLM-1237', 'CLM-1238'].map((id, i) => (
                  <tr key={id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-indigo-600">{id}</td>
                    <td className="px-5 py-3 text-slate-700">{98 - i * 5}%</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        APPROVED
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">Oct 24, 2026 14:32 EST</td>
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
import { Search, Filter } from 'lucide-react';

export default function Queue() {
  const role = localStorage.getItem('role') || 'Human_Verifier';
  const navigate = useNavigate();

  const mockClaims = [
    { id: 'CLM-600322', type: 'Auto - Collision', status: 'READY_FOR_HUMAN_REVIEW', fraudScore: 12, date: 'Oct 24, 2026' },
    { id: 'CLM-600323', type: 'Property - Fire', status: 'READY_FOR_HUMAN_REVIEW', fraudScore: 85, date: 'Oct 24, 2026' },
    { id: 'CLM-600324', type: 'Auto - Comprehensive', status: 'UNDER_HUMAN_REVIEW', fraudScore: 4, date: 'Oct 23, 2026' },
    { id: 'CLM-600325', type: 'Property - Water', status: 'READY_FOR_HUMAN_REVIEW', fraudScore: 22, date: 'Oct 23, 2026' },
    { id: 'CLM-600326', type: 'Auto - Collision', status: 'READY_FOR_HUMAN_REVIEW', fraudScore: 8, date: 'Oct 22, 2026' }
  ];

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-14 bg-white border-b border-slate-200 flex justify-between items-center px-8 shrink-0">
          <h2 className="text-sm font-semibold text-slate-800">Triage Queue</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 text-slate-400" size={14} />
              <input type="text" placeholder="Filter ID or Type..." className="pl-8 pr-4 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50">
              <Filter size={14} /> Filters
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-8 flex-1 overflow-auto">
          <div className="bg-white rounded-md border border-slate-200 shadow-sm">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Claim ID</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Policy Type</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Fraud Risk</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Submitted</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {mockClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-5 py-3 font-medium text-slate-900">{claim.id}</td>
                    <td className="px-5 py-3 text-slate-600">{claim.type}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className={\`w-2 h-2 rounded-full \${claim.fraudScore > 50 ? 'bg-red-500' : 'bg-emerald-500'}\`}></div>
                        <span className="text-slate-700 font-medium">{claim.fraudScore}/100</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        {claim.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{claim.date}</td>
                    <td className="px-5 py-3 text-right">
                      <button 
                        onClick={() => navigate(\`/cockpit/\${claim.id}\`)}
                        className="text-indigo-600 hover:text-indigo-800 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Open Cockpit &rarr;
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
import { ArrowLeft, Check, X, AlertTriangle, FileText, ChevronRight } from 'lucide-react';

export default function Cockpit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lineItems, setLineItems] = useState([
    { id: 1, desc: "Front Bumper Replacement (OEM)", aiAmount: 850.00, accepted: null, confidence: 92 },
    { id: 2, desc: "Labor - Body Shop (4.5 hours)", aiAmount: 405.00, accepted: null, confidence: 98 },
    { id: 3, desc: "Paint supplies & clear coat", aiAmount: 150.00, accepted: null, confidence: 85 },
    { id: 4, desc: "Diagnostic fee (OBD-II scan)", aiAmount: 85.00, accepted: null, confidence: 99 }
  ]);

  const allReviewed = lineItems.every(item => item.accepted !== null);
  const totalAmount = lineItems.reduce((acc, item) => acc + (item.accepted !== false ? item.aiAmount : 0), 0);

  const toggleLineItem = (itemId, accept) => {
    setLineItems(items => items.map(i => i.id === itemId ? { ...i, accepted: accept } : i));
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden font-sans">
      {/* Top Workspace Header */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 flex justify-between items-center shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/queue')} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="h-4 w-px bg-slate-300"></div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500 font-medium">Claims</span>
            <ChevronRight size={14} className="text-slate-400" />
            <span className="font-bold text-slate-900">{id}</span>
          </div>
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            READY FOR REVIEW
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-3 py-1.5 bg-white text-rose-600 border border-slate-300 rounded shadow-sm text-sm font-medium hover:bg-rose-50 hover:border-rose-200 transition-colors flex items-center gap-2">
            <AlertTriangle size={14} /> Flag for SIU
          </button>
          <button 
            disabled={!allReviewed}
            className={\`px-4 py-1.5 rounded shadow-sm text-sm font-medium transition-all \${allReviewed ? 'bg-indigo-600 text-white hover:bg-indigo-700 border border-transparent' : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'}\`}
          >
            Approve Settlement
          </button>
        </div>
      </header>

      {/* Dual Pane Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Pane: Document Viewer (55% width) */}
        <div className="w-[55%] flex flex-col border-r border-slate-200 bg-slate-100">
          <div className="h-10 bg-white border-b border-slate-200 px-4 flex items-center shrink-0">
            <FileText size={14} className="text-slate-400 mr-2" />
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Original Evidence</span>
          </div>
          <div className="flex-1 overflow-auto p-6 flex justify-center bg-slate-200/50">
            {/* Mock PDF Document */}
            <div className="bg-white shadow-sm border border-slate-200 w-full max-w-2xl h-[800px] flex items-center justify-center relative">
               <div className="text-slate-300 text-center">
                 <p className="font-semibold text-xl tracking-widest uppercase mb-2">Estimate_Final.pdf</p>
                 <p className="text-sm">Document securely loaded via S3</p>
               </div>
            </div>
          </div>
        </div>

        {/* Right Pane: Data Extraction (45% width) */}
        <div className="w-[45%] flex flex-col bg-white">
          <div className="h-10 bg-slate-50 border-b border-slate-200 px-4 flex items-center shrink-0">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Extracted Metadata & Line Items</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5">
            {/* AI Summary Block */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">AI Summary</h3>
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded text-sm text-slate-700 leading-relaxed">
                Estimate aligns with standard OEM replacement rates for this vehicle class. 
                <span className="font-semibold text-emerald-700 ml-1">No anomalous labor hours detected.</span>
              </div>
            </div>

            {/* Line Items List */}
            <div>
              <div className="flex justify-between items-end mb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Settlement Items</h3>
                <span className="text-xs font-medium text-slate-500">Requires manual verification</span>
              </div>
              
              <div className="space-y-2">
                {lineItems.map(item => (
                  <div key={item.id} className={\`border rounded-md transition-colors \${item.accepted === true ? 'border-emerald-200 bg-emerald-50/30' : item.accepted === false ? 'border-rose-200 bg-rose-50/30' : 'border-slate-200 hover:border-slate-300'}\`}>
                    <div className="p-3 flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{item.desc}</p>
                        <p className="text-xs text-slate-500 mt-0.5">AI Confidence: {item.confidence}%</p>
                      </div>
                      <div className="text-right">
                        <p className={\`text-sm font-bold \${item.accepted === false ? 'text-slate-400 line-through' : 'text-slate-900'}\`}>
                          \${item.aiAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Action Row */}
                    <div className={\`flex border-t divide-x divide-slate-200 \${item.accepted === true ? 'border-emerald-200 divide-emerald-200' : item.accepted === false ? 'border-rose-200 divide-rose-200' : 'border-slate-200'}\`}>
                      <button 
                        onClick={() => toggleLineItem(item.id, true)}
                        className={\`flex-1 py-1.5 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-bl-md transition-colors \${item.accepted === true ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'}\`}
                      >
                        <Check size={14} strokeWidth={item.accepted === true ? 3 : 2} /> Accept
                      </button>
                      <button 
                        onClick={() => toggleLineItem(item.id, false)}
                        className={\`flex-1 py-1.5 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-br-md transition-colors \${item.accepted === false ? 'bg-rose-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-700'}\`}
                      >
                        <X size={14} strokeWidth={item.accepted === false ? 3 : 2} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Bottom Total Footer */}
          <div className="p-5 border-t border-slate-200 bg-white flex justify-between items-center shrink-0">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Settlement</span>
              <span className="text-xs text-slate-400 mt-0.5">{allReviewed ? 'Ready for approval' : 'Pending line item review'}</span>
            </div>
            <span className="font-bold text-2xl text-slate-900 tracking-tight">\${totalAmount.toFixed(2)}</span>
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

console.log('Enterprise UX redesign complete.');
