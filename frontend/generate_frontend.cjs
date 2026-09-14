const fs = require('fs');
const path = require('path');

const baseDir = 'd:/sih/frontend';

const dirs = [
  'src/pages',
  'src/components',
  'src/assets'
];

dirs.forEach(d => fs.mkdirSync(path.join(baseDir, d), { recursive: true }));

const files = {
  'tailwind.config.js': `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,

  'src/index.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #f3f4f6;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}`,

  'src/App.jsx': `import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Queue from './pages/Queue';
import Cockpit from './pages/Cockpit';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/queue" element={<Queue />} />
        <Route path="/cockpit/:id" element={<Cockpit />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;`,

  'src/components/Sidebar.jsx': `import { Link, useLocation } from 'react-router-dom';
import { Home, List, FileText, Settings, LogOut } from 'lucide-react';

export default function Sidebar({ role }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-800';

  return (
    <div className="w-64 bg-blue-900 text-white min-h-screen flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText /> ClaimPilot AI
        </h1>
        <p className="text-blue-300 text-sm mt-2">Role: {role}</p>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {(role === 'Administrator' || role === 'Agent') && (
          <Link to="/dashboard" className={\`flex items-center gap-3 p-3 rounded-lg transition-colors \${isActive('/dashboard')}\`}>
            <Home size={20} /> Dashboard
          </Link>
        )}
        {(role === 'Human_Verifier' || role === 'Administrator') && (
          <Link to="/queue" className={\`flex items-center gap-3 p-3 rounded-lg transition-colors \${isActive('/queue')}\`}>
            <List size={20} /> Triage Queue
          </Link>
        )}
      </nav>
      <div className="p-4">
        <Link to="/login" className="flex items-center gap-3 p-3 rounded-lg text-blue-100 hover:bg-blue-800 transition-colors">
          <LogOut size={20} /> Logout
        </Link>
      </div>
    </div>
  );
}`,

  'src/pages/Login.jsx': `import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-100 p-3 rounded-full mb-4">
            <Shield className="text-blue-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Sign in to ClaimPilot</h2>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Mock Role Select</label>
            <select 
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
            >
              <option value="Human_Verifier">Human Verifier (Adjuster)</option>
              <option value="Administrator">Administrator (Risk Manager)</option>
              <option value="Claimant">Claimant</option>
            </select>
          </div>
          <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            Sign In (Mock)
          </button>
        </form>
      </div>
    </div>
  );
}`,

  'src/pages/Dashboard.jsx': `import Sidebar from '../components/Sidebar';
import { BarChart3, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const role = localStorage.getItem('role') || 'Administrator';

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar role={role} />
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Executive Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg text-green-600"><CheckCircle /></div>
            <div>
              <p className="text-sm text-gray-500">Straight-Through %</p>
              <p className="text-2xl font-bold">24.5%</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg text-blue-600"><Clock /></div>
            <div>
              <p className="text-sm text-gray-500">Avg Processing Time</p>
              <p className="text-2xl font-bold">14m 30s</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg text-purple-600"><BarChart3 /></div>
            <div>
              <p className="text-sm text-gray-500">Labor Hours Saved</p>
              <p className="text-2xl font-bold">1,240 hrs</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg text-red-600"><AlertTriangle /></div>
            <div>
              <p className="text-sm text-gray-500">SIU Referrals</p>
              <p className="text-2xl font-bold">12</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold mb-4">Recent AI Extractions Audit</h2>
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-500 border-b">
                <th className="pb-3">Claim ID</th>
                <th className="pb-3">Confidence</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {['CLM-1234', 'CLM-1235', 'CLM-1236'].map((id, i) => (
                <tr key={id} className="border-b last:border-0">
                  <td className="py-4 font-medium">{id}</td>
                  <td className="py-4">{98 - i * 5}%</td>
                  <td className="py-4"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">APPROVED</span></td>
                  <td className="py-4 text-gray-500">Today</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}`,

  'src/pages/Queue.jsx': `import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';

export default function Queue() {
  const role = localStorage.getItem('role') || 'Human_Verifier';
  const navigate = useNavigate();

  const mockClaims = [
    { id: 'CLM-001', type: 'Auto', status: 'READY_FOR_HUMAN_REVIEW', fraudScore: 12, date: '2026-09-03' },
    { id: 'CLM-002', type: 'Property', status: 'READY_FOR_HUMAN_REVIEW', fraudScore: 85, date: '2026-09-03' },
    { id: 'CLM-003', type: 'Auto', status: 'UNDER_HUMAN_REVIEW', fraudScore: 4, date: '2026-09-02' }
  ];

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar role={role} />
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Triage Queue</h1>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr className="text-gray-600 border-b">
                <th className="p-4 font-semibold">Claim ID</th>
                <th className="p-4 font-semibold">Type</th>
                <th className="p-4 font-semibold">AI Fraud Risk</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {mockClaims.map((claim) => (
                <tr key={claim.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium">{claim.id}</td>
                  <td className="p-4">{claim.type}</td>
                  <td className="p-4">
                    <span className={\`px-2 py-1 rounded-full text-xs font-bold \${claim.fraudScore > 50 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}\`}>
                      {claim.fraudScore}/100
                    </span>
                  </td>
                  <td className="p-4 text-gray-500 text-sm">{claim.status.replace(/_/g, ' ')}</td>
                  <td className="p-4">
                    <button 
                      onClick={() => navigate(\`/cockpit/\${claim.id}\`)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}`,

  'src/pages/Cockpit.jsx': `import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, AlertOctagon } from 'lucide-react';

export default function Cockpit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lineItems, setLineItems] = useState([
    { id: 1, desc: "Front Bumper Replacement", aiAmount: 850, accepted: null },
    { id: 2, desc: "Labor (4 hours)", aiAmount: 400, accepted: null },
    { id: 3, desc: "Paint supplies", aiAmount: 150, accepted: null }
  ]);

  const allReviewed = lineItems.every(item => item.accepted !== null);

  const toggleLineItem = (itemId, accept) => {
    setLineItems(items => items.map(i => i.id === itemId ? { ...i, accepted: accept } : i));
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/queue')} className="text-gray-500 hover:text-gray-800"><ArrowLeft /></button>
          <h1 className="text-xl font-bold text-gray-900">Review Cockpit: {id}</h1>
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">READY_FOR_HUMAN_REVIEW</span>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg font-medium hover:bg-red-100 flex items-center gap-2">
            <AlertOctagon size={18} /> Refer to SIU
          </button>
          <button 
            disabled={!allReviewed}
            className={\`px-6 py-2 rounded-lg font-medium transition-colors \${allReviewed ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}\`}
          >
            Approve Settlement
          </button>
        </div>
      </header>

      {/* Dual Pane Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Document Viewer */}
        <div className="flex-1 bg-gray-900 flex items-center justify-center m-4 rounded-xl relative overflow-hidden border border-gray-300 shadow-inner">
          <div className="text-center text-gray-400">
            <div className="w-64 h-80 bg-white shadow-2xl rounded-lg mx-auto mb-4 flex items-center justify-center relative">
               <div className="absolute top-4 left-4 right-4 h-4 bg-gray-200 rounded"></div>
               <div className="absolute top-12 left-4 w-1/2 h-4 bg-gray-200 rounded"></div>
               <p className="text-gray-300 font-bold rotate-45 text-2xl">MOCK PDF</p>
            </div>
            <p>Original Document Evidence</p>
          </div>
        </div>

        {/* Right Pane: AI Extraction Data */}
        <div className="w-1/3 bg-white m-4 ml-0 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="p-6 border-b">
            <h2 className="text-lg font-bold">AI Extracted Data</h2>
            <p className="text-sm text-gray-500">Verify and accept/reject line items below.</p>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-sm text-blue-800 font-semibold mb-1">AI Summary</p>
              <p className="text-sm text-blue-900">The claimant is requesting $1,400 for auto repair. The parts align with standard market rates. Fraud risk is low (12%).</p>
            </div>

            <h3 className="font-semibold text-gray-700 mb-3">Line Items</h3>
            <div className="space-y-3">
              {lineItems.map(item => (
                <div key={item.id} className={\`border p-4 rounded-lg \${item.accepted === true ? 'border-green-400 bg-green-50' : item.accepted === false ? 'border-red-400 bg-red-50' : 'border-gray-200'}\`}>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium text-sm">{item.desc}</span>
                    <span className="font-bold">\${item.aiAmount}</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button 
                      onClick={() => toggleLineItem(item.id, true)}
                      className={\`flex-1 py-1.5 rounded flex items-center justify-center gap-1 text-sm font-medium \${item.accepted === true ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}\`}
                    >
                      <Check size={16} /> Accept
                    </button>
                    <button 
                      onClick={() => toggleLineItem(item.id, false)}
                      className={\`flex-1 py-1.5 rounded flex items-center justify-center gap-1 text-sm font-medium \${item.accepted === false ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}\`}
                    >
                      <X size={16} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-6 border-t bg-gray-50 rounded-b-xl flex justify-between items-center">
            <span className="font-bold text-gray-600">Total Settlement:</span>
            <span className="font-bold text-xl text-gray-900">\${lineItems.reduce((acc, item) => acc + (item.accepted !== false ? item.aiAmount : 0), 0)}</span>
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

console.log('Frontend scaffolding complete.');
