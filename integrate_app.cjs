const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------
// 1. BACKEND INTEGRATION
// ---------------------------------------------------------
const backendDir = 'd:/sih/backend';

// Create Demo Controller & Routes for seamless testing
fs.mkdirSync(path.join(backendDir, 'src/routes'), { recursive: true });
fs.mkdirSync(path.join(backendDir, 'src/controllers'), { recursive: true });

const demoControllerCode = `
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Claim = require('../models/Claim');
const Document = require('../models/Document');
const Extraction = require('../models/Extraction');
const jwt = require('jsonwebtoken');

exports.demoLogin = async (req, res) => {
  try {
    const { role } = req.body;
    
    // Clear DB for clean demo state
    await Tenant.deleteMany();
    await User.deleteMany();
    await Claim.deleteMany();
    await Document.deleteMany();
    await Extraction.deleteMany();

    const tenant = await Tenant.create({ name: 'Acme Insurance', subscriptionTier: 'ENTERPRISE' });
    const admin = await User.create({ tenantId: tenant._id, name: 'Admin User', email: 'admin@acme.com', password: 'password', role: 'Administrator' });
    const adjuster = await User.create({ tenantId: tenant._id, name: 'Jane Adjuster', email: 'jane@acme.com', password: 'password', role: 'Human_Verifier' });
    
    // Create Mock Claims
    const lifeClaim = await Claim.create({
      claimId: 'CLM-8001',
      tenantId: tenant._id,
      claimantId: admin._id,
      claimType: 'LIFE_DEATH',
      description: 'Life Insurance Payout',
      status: 'READY_FOR_HUMAN_REVIEW',
      aiAnalysis: { summary: 'Vital records match.', consistencyScore: 99, detectedIssues: [], recommendedAction: 'Approve' }
    });

    const autoClaim = await Claim.create({
      claimId: 'CLM-8002',
      tenantId: tenant._id,
      claimantId: admin._id,
      claimType: 'AUTO',
      description: 'Collision repair',
      status: 'READY_FOR_HUMAN_REVIEW',
      aiAnalysis: { summary: 'OEM Rates matched.', consistencyScore: 92, detectedIssues: [], recommendedAction: 'Approve' }
    });

    // Create Extractions
    await Extraction.create({ claimId: lifeClaim._id, tenantId: tenant._id, fieldCategory: 'Beneficiary', description: 'Jane Ford', aiData: { value: 'Verified', confidence: 99 }});
    await Extraction.create({ claimId: lifeClaim._id, tenantId: tenant._id, fieldCategory: 'DeathCert', description: 'State Registry', aiData: { value: 'Authentic', confidence: 98 }});

    await Extraction.create({ claimId: autoClaim._id, tenantId: tenant._id, fieldCategory: 'LineItem', description: 'Front Bumper OEM', aiData: { value: 850.00, confidence: 92 }});
    await Extraction.create({ claimId: autoClaim._id, tenantId: tenant._id, fieldCategory: 'LineItem', description: 'Labor (4.5 hrs)', aiData: { value: 405.00, confidence: 98 }});

    const targetUser = role === 'Administrator' ? admin : adjuster;
    const token = jwt.sign({ id: targetUser._id, role: targetUser.role, tenantId: tenant._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });

    res.json({ token, role: targetUser.role });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getClaims = async (req, res) => {
  try {
    const claims = await Claim.find({ tenantId: req.tenantId });
    res.json(claims);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getClaimDetails = async (req, res) => {
  try {
    const claim = await Claim.findOne({ claimId: req.params.id, tenantId: req.tenantId });
    const extractions = await Extraction.find({ claimId: claim._id, tenantId: req.tenantId });
    res.json({ claim, extractions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
`;
fs.writeFileSync(path.join(backendDir, 'src/controllers/demoController.js'), demoControllerCode);

const demoRoutesCode = `
const express = require('express');
const { demoLogin, getClaims, getClaimDetails } = require('../controllers/demoController');
const { protect } = require('../middlewares/auth');

const router = express.Router();
router.post('/login', demoLogin);
router.get('/claims', protect, getClaims);
router.get('/claims/:id', protect, getClaimDetails);

module.exports = router;
`;
fs.writeFileSync(path.join(backendDir, 'src/routes/demoRoutes.js'), demoRoutesCode);

// Patch app.js to use CORS and Demo Routes
const appJsPath = path.join(backendDir, 'src/app.js');
let appJsContent = fs.readFileSync(appJsPath, 'utf8');

if (!appJsContent.includes('cors(')) {
  appJsContent = "const cors = require('cors');\\n" + appJsContent;
  appJsContent = appJsContent.replace('app.use(express.json());', 'app.use(express.json());\\napp.use(cors());');
}
if (!appJsContent.includes('demoRoutes')) {
  appJsContent = appJsContent.replace('module.exports = app;', 'const demoRoutes = require("./routes/demoRoutes");\\napp.use("/api/demo", demoRoutes);\\n\\nmodule.exports = app;');
}
fs.writeFileSync(appJsPath, appJsContent);

// ---------------------------------------------------------
// 2. FRONTEND INTEGRATION
// ---------------------------------------------------------
const frontendDir = 'd:/sih/frontend';

const apiJsCode = `
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = \`Bearer \${token}\`;
  return config;
});

export default api;
`;
fs.writeFileSync(path.join(frontendDir, 'src/api.js'), apiJsCode);

// Update Login.jsx
const loginCode = `
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import api from '../api';

export default function Login() {
  const [role, setRole] = useState('Human_Verifier');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Hits the backend to generate fresh test data and return a real JWT
      const res = await api.post('/demo/login', { role });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      
      if (res.data.role === 'Administrator') navigate('/dashboard');
      else navigate('/queue');
    } catch (err) {
      alert('Failed to connect to backend: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center font-sans">
      <div className="mat-card p-8 w-full max-w-sm text-center">
        <Shield size={48} className="text-[#1976d2] mx-auto mb-4" />
        <h2 className="text-2xl font-medium text-gray-900 mb-6">System Login</h2>
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="text-left">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select User Role</label>
            <select 
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 focus:border-[#1976d2] focus:ring-1 focus:ring-[#1976d2] outline-none"
            >
              <option value="Human_Verifier">Adjuster (Verifier)</option>
              <option value="Administrator">Risk Manager (Admin)</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="btn-material btn-primary w-full py-3">
            {loading ? 'Authenticating & Seeding DB...' : 'Login (Live Integration)'}
          </button>
        </form>
      </div>
    </div>
  );
}`;
fs.writeFileSync(path.join(frontendDir, 'src/pages/Login.jsx'), loginCode);

// Update Queue.jsx
const queueCode = `
import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Queue() {
  const role = localStorage.getItem('role') || 'Human_Verifier';
  const navigate = useNavigate();
  const [claims, setClaims] = useState([]);

  useEffect(() => {
    api.get('/demo/claims').then(res => setClaims(res.data)).catch(console.error);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f5f5]">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col">
        <header className="bg-[#1976d2] text-white shadow-md h-16 flex items-center justify-between px-6 shrink-0 z-10">
          <h2 className="text-lg font-medium tracking-wide">Live Database Queue</h2>
        </header>

        <main className="p-6 flex-1 overflow-auto">
          <div className="mat-card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-medium text-gray-600">Claim ID</th>
                  <th className="px-6 py-4 font-medium text-gray-600">Type</th>
                  <th className="px-6 py-4 font-medium text-gray-600">AI Confidence</th>
                  <th className="px-6 py-4 font-medium text-gray-600">Status</th>
                  <th className="px-6 py-4 font-medium text-gray-600 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {claims.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-[#1976d2] font-medium">{c.claimId}</td>
                    <td className="px-6 py-4 text-gray-800">{c.claimType.replace('_', ' ')}</td>
                    <td className="px-6 py-4 font-medium text-green-600">{c.aiAnalysis.consistencyScore}%</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium">
                        {c.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => navigate(\`/cockpit/\${c.claimId}\`)}
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
}`;
fs.writeFileSync(path.join(frontendDir, 'src/pages/Queue.jsx'), queueCode);

// Update Cockpit.jsx
const cockpitCode = `
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../api';

export default function Cockpit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [verifications, setVerifications] = useState({});

  useEffect(() => {
    api.get(\`/demo/claims/\${id}\`).then(res => {
      setData(res.data);
      // Initialize verification state object for each line item
      const initialVerifs = {};
      res.data.extractions.forEach(ext => {
        initialVerifs[ext._id] = null;
      });
      setVerifications(initialVerifs);
    }).catch(console.error);
  }, [id]);

  if (!data) return <div className="p-8">Loading live data from MongoDB...</div>;

  const { claim, extractions } = data;
  const isDeathClaim = claim.claimType === 'LIFE_DEATH';
  const allVerified = Object.values(verifications).every(v => v !== null);

  const toggleVerify = (extId, status) => {
    setVerifications(prev => ({ ...prev, [extId]: status }));
  };

  return (
    <div className="flex flex-col h-screen bg-[#f5f5f5] font-sans text-[#212121]">
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

      <div className="flex-1 p-6 flex gap-6 overflow-hidden">
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

        <div className="w-[450px] mat-card flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-medium text-gray-700">Extracted AI Data (MongoDB)</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded">
              <p className="text-sm text-blue-900 font-medium mb-1">Backend AI Analysis:</p>
              <p className="text-sm text-blue-800">{claim.aiAnalysis.summary}</p>
            </div>

            <div>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Line Items extracted by Pipeline</h3>
              
              <div className="space-y-4">
                {extractions.map(ext => (
                  <div key={ext._id} className="border border-gray-200 rounded p-4">
                    <div className="flex justify-between items-start mb-1">
                       <p className="text-sm font-medium text-gray-900">{ext.description}</p>
                       <span className="text-sm font-bold">{typeof ext.aiData.value === 'number' ? \`$\${ext.aiData.value.toFixed(2)}\` : ext.aiData.value}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">AI Confidence: {ext.aiData.confidence}%</p>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => toggleVerify(ext._id, true)}
                        className={\`flex-1 py-1.5 text-sm font-medium rounded border \${verifications[ext._id] === true ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}\`}
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => toggleVerify(ext._id, false)}
                        className={\`flex-1 py-1.5 text-sm font-medium rounded border \${verifications[ext._id] === false ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}\`}
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
}`;
fs.writeFileSync(path.join(frontendDir, 'src/pages/Cockpit.jsx'), cockpitCode);

console.log('Frontend successfully wired to Backend APIs.');
