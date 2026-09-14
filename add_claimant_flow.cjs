const fs = require('fs');
const path = require('path');

const frontendDir = 'd:/sih/frontend';
const backendDir = 'd:/sih/backend';

// ---------------------------------------------------------
// 1. UPDATE CSS (Poppins Font, Modern Utility Classes)
// ---------------------------------------------------------
const cssCode = `@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
@import "tailwindcss";

body {
  background-color: #f8fafc;
  font-family: 'Poppins', -apple-system, sans-serif;
  color: #0f172a;
  -webkit-font-smoothing: antialiased;
}

/* Modern Polished Button */
.btn-primary {
  @apply bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium px-6 py-2.5 rounded-xl shadow-[0_4px_14px_0_rgb(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-0.5 transition-all duration-200;
}

.btn-secondary {
  @apply bg-white text-slate-700 font-medium px-6 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm transition-all;
}

/* Glass/Soft Card */
.glass-card {
  @apply bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)];
}
`;
fs.writeFileSync(path.join(frontendDir, 'src/index.css'), cssCode);

// ---------------------------------------------------------
// 2. UPDATE APP.JSX
// ---------------------------------------------------------
const appJsCode = `import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Queue from './pages/Queue';
import Cockpit from './pages/Cockpit';
import NewClaim from './pages/NewClaim';
import ApplicantDashboard from './pages/ApplicantDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/queue" element={<Queue />} />
        <Route path="/cockpit/:id" element={<Cockpit />} />
        <Route path="/new-claim" element={<NewClaim />} />
        <Route path="/applicant-dashboard" element={<ApplicantDashboard />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;`;
fs.writeFileSync(path.join(frontendDir, 'src/App.jsx'), appJsCode);

// ---------------------------------------------------------
// 3. HIGHLY POLISHED LOGIN PAGE
// ---------------------------------------------------------
const loginCode = `import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hexagon, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import api from '../api';

export default function Login() {
  const [role, setRole] = useState('Claimant');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/demo/login', { role });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      
      if (res.data.role === 'Administrator') navigate('/dashboard');
      else if (res.data.role === 'Human_Verifier') navigate('/queue');
      else navigate('/applicant-dashboard'); // Claimant
    } catch (err) {
      alert('Login failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-slate-50">
      {/* Left Column - Branding */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 p-12 flex-col justify-between relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-500 blur-3xl"></div>
          <div className="absolute top-1/2 right-12 w-64 h-64 rounded-full bg-indigo-500 blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 text-white mb-12">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">
              <Hexagon className="text-blue-400" size={24} />
            </div>
            <span className="text-2xl font-bold tracking-wide">ClaimPilot AI</span>
          </div>
          
          <h1 className="text-5xl font-bold text-white leading-[1.15] mb-6">
            The intelligent way to process claims.
          </h1>
          <p className="text-lg text-blue-200/80 max-w-md font-light leading-relaxed">
            Automate data extraction, run instant fraud checks, and accelerate settlement approvals with our enterprise-grade AI engine.
          </p>
        </div>

        <div className="relative z-10 flex gap-8">
          <div className="flex flex-col gap-2">
            <ShieldCheck className="text-blue-400" size={28} />
            <h3 className="text-white font-semibold">Bank-grade Security</h3>
            <p className="text-sm text-blue-200/60">AES-256 encryption & SOC2.</p>
          </div>
          <div className="flex flex-col gap-2">
            <Zap className="text-amber-400" size={28} />
            <h3 className="text-white font-semibold">Sub-second Triage</h3>
            <p className="text-sm text-blue-200/60">Instant AI risk assessment.</p>
          </div>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <div className="w-full max-w-md glass-card p-10">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h2>
            <p className="text-slate-500">Sign in to your secure portal.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Access Level</label>
              <div className="relative">
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow font-medium"
                >
                  <option value="Claimant">Applicant (Submit a Claim)</option>
                  <option value="Human_Verifier">Adjuster (Review Claims)</option>
                  <option value="Administrator">Administrator (Dashboard)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="btn-primary w-full flex justify-center items-center gap-2 py-3.5 text-base"
              >
                {loading ? 'Authenticating...' : 'Continue to Portal'} 
                {!loading && <ArrowRight size={18} />}
              </button>
            </div>
            
            <p className="text-center text-sm text-slate-500 mt-6">
              By logging in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}`;
fs.writeFileSync(path.join(frontendDir, 'src/pages/Login.jsx'), loginCode);

// ---------------------------------------------------------
// 4. NEW CLAIMANT DASHBOARD & SUBMISSION FORM
// ---------------------------------------------------------
const appDashboardCode = `import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Hexagon, LogOut, PlusCircle, FileText, Clock, CheckCircle2 } from 'lucide-react';
import api from '../api';

export default function ApplicantDashboard() {
  const navigate = useNavigate();
  const [claims, setClaims] = useState([]);

  useEffect(() => {
    // We fetch claims specific to this tenant/user
    api.get('/demo/claims').then(res => {
      // In demo, we just show all, but we filter out DRAFTs if we want
      setClaims(res.data);
    }).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600">
            <Hexagon size={24} fill="currentColor" />
            <span className="font-bold text-lg text-slate-900 tracking-tight">ClaimPilot</span>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium">
            <span className="text-slate-600">Applicant Portal</span>
            <button onClick={() => navigate('/login')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-10">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">My Claims</h1>
            <p className="text-slate-500">Track the status of your insurance claims in real-time.</p>
          </div>
          <Link to="/new-claim" className="btn-primary flex items-center gap-2">
            <PlusCircle size={18} /> File New Claim
          </Link>
        </div>

        {claims.length === 0 ? (
          <div className="glass-card p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
              <FileText size={32} />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No claims filed yet</h3>
            <p className="text-slate-500 mb-6">You don't have any active claims. Click the button below to start.</p>
            <Link to="/new-claim" className="btn-secondary">Start a Claim</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {claims.map(claim => (
              <div key={claim._id} className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-indigo-200 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={\`w-12 h-12 rounded-full flex items-center justify-center shrink-0 \${claim.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}\`}>
                    {claim.status === 'APPROVED' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-slate-900">{claim.claimId}</h3>
                      <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full border border-slate-200 uppercase tracking-wide">
                        {claim.claimType.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-slate-500 text-sm">{claim.description}</p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end">
                  <span className="text-sm font-semibold text-slate-500 mb-1">Current Status</span>
                  <span className={\`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border \${
                    claim.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                    claim.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                    'bg-indigo-50 text-indigo-700 border-indigo-200'
                  }\`}>
                    {claim.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}`;
fs.writeFileSync(path.join(frontendDir, 'src/pages/ApplicantDashboard.jsx'), appDashboardCode);

const newClaimCode = `import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UploadCloud, File, X } from 'lucide-react';
import api from '../api';

export default function NewClaim() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ type: 'AUTO', description: '' });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post('/demo/claims/submit', formData);
      navigate('/applicant-dashboard');
    } catch (e) {
      alert('Error submitting claim: ' + e.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans py-12">
      <div className="max-w-3xl mx-auto px-6">
        
        <button onClick={() => navigate('/applicant-dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 font-medium transition-colors">
          <ArrowLeft size={18} /> Back to Dashboard
        </button>

        <div className="glass-card overflow-hidden">
          {/* Progress Header */}
          <div className="bg-white border-b border-slate-100 px-8 py-6">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">File a New Claim</h1>
            <div className="flex items-center gap-2">
               <div className={\`h-1.5 flex-1 rounded-full \${step >= 1 ? 'bg-indigo-600' : 'bg-slate-200'}\`}></div>
               <div className={\`h-1.5 flex-1 rounded-full \${step >= 2 ? 'bg-indigo-600' : 'bg-slate-200'}\`}></div>
               <div className={\`h-1.5 flex-1 rounded-full \${step >= 3 ? 'bg-indigo-600' : 'bg-slate-200'}\`}></div>
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium uppercase tracking-wider">Step {step} of 3</p>
          </div>

          <div className="p-8">
            {/* STEP 1: Details */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Claim Type</label>
                  <select 
                    value={formData.type} 
                    onChange={e => setFormData({...formData, type: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="AUTO">Auto - Collision / Damage</option>
                    <option value="PROPERTY">Property - Home / Fire / Water</option>
                    <option value="LIFE_DEATH">Life Insurance - Death Benefit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Incident Description</label>
                  <textarea 
                    rows={4}
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Briefly describe what happened..."
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium resize-none"
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <button onClick={() => setStep(2)} disabled={!formData.description} className="btn-primary">Next Step</button>
                </div>
              </div>
            )}

            {/* STEP 2: Upload */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-lg font-bold text-slate-900">Upload Evidence</h3>
                <p className="text-slate-500 text-sm">Please upload police reports, repair estimates, or death certificates. Our AI will automatically extract the necessary data.</p>
                
                {!file ? (
                  <div className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-2xl p-12 flex flex-col items-center justify-center text-center hover:bg-indigo-50 transition-colors cursor-pointer" onClick={() => setFile('Document_Scan_HQ.pdf')}>
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                      <UploadCloud className="text-indigo-600" size={32} />
                    </div>
                    <h4 className="text-slate-900 font-bold mb-1">Click or drag files here</h4>
                    <p className="text-slate-500 text-sm">Supports PDF, JPG, PNG (Max 50MB)</p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl p-4 flex items-center justify-between bg-white shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                        <File size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{file}</p>
                        <p className="text-xs text-slate-500">2.4 MB • PDF Document</p>
                      </div>
                    </div>
                    <button onClick={() => setFile(null)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                      <X size={18} />
                    </button>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <button onClick={() => setStep(1)} className="btn-secondary">Back</button>
                  <button onClick={() => setStep(3)} disabled={!file} className="btn-primary">Review Claim</button>
                </div>
              </div>
            )}

            {/* STEP 3: Review */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Claim Summary</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Type</span>
                      <span className="font-bold text-slate-900">{formData.type.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Description</span>
                      <span className="font-medium text-slate-900 max-w-xs text-right">{formData.description}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Attached Files</span>
                      <span className="font-medium text-indigo-600 flex items-center gap-1"><File size={14}/> {file}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between pt-4">
                  <button onClick={() => setStep(2)} className="btn-secondary" disabled={submitting}>Back</button>
                  <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex items-center gap-2">
                    {submitting ? 'Submitting & Processing...' : 'Submit Claim'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}`;
fs.writeFileSync(path.join(frontendDir, 'src/pages/NewClaim.jsx'), newClaimCode);


// ---------------------------------------------------------
// 5. BACKEND API FOR CLAIMANT SUBMISSION
// ---------------------------------------------------------
const demoControllerPath = path.join(backendDir, 'src/controllers/demoController.js');
let demoController = fs.readFileSync(demoControllerPath, 'utf8');

if (!demoController.includes('submitClaimantClaim')) {
  demoController += `
exports.submitClaimantClaim = async (req, res) => {
  try {
    const { type, description } = req.body;
    
    // Simulate finding the logged-in user (Claimant)
    const user = await User.findOne({ email: 'admin@acme.com' }); // Mocking the claimant for demo
    
    const newClaim = await Claim.create({
      tenantId: req.tenantId,
      claimantId: user._id,
      claimType: type,
      description: description,
      status: 'DOCUMENTS_PROCESSING',
      aiAnalysis: { 
        summary: 'Extracting data from applicant uploads...', 
        consistencyScore: 0, 
        detectedIssues: [], 
        recommendedAction: 'Wait for AI' 
      }
    });

    // Simulate AI Pipeline Background Processing
    setTimeout(async () => {
      const claimToUpdate = await Claim.findById(newClaim._id);
      if(claimToUpdate) {
        claimToUpdate.status = 'READY_FOR_HUMAN_REVIEW';
        claimToUpdate.aiAnalysis = {
          summary: 'Applicant documents processed successfully by AI Engine.',
          consistencyScore: 94,
          detectedIssues: [],
          recommendedAction: 'Adjuster Review Required'
        };
        await claimToUpdate.save();

        // Create mock extraction based on user input type
        if (type === 'LIFE_DEATH') {
          await Extraction.create({ claimId: claimToUpdate._id, tenantId: req.tenantId, fieldCategory: 'Beneficiary', description: 'Jane Applicant', aiData: { value: 'Verified', confidence: 99 }});
        } else {
          await Extraction.create({ claimId: claimToUpdate._id, tenantId: req.tenantId, fieldCategory: 'LineItem', description: 'Customer Uploaded Estimate', aiData: { value: 2500.00, confidence: 88 }});
        }
      }
    }, 3000);

    res.json(newClaim);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
`;
  fs.writeFileSync(demoControllerPath, demoController);
}

const demoRoutesPath = path.join(backendDir, 'src/routes/demoRoutes.js');
let demoRoutes = fs.readFileSync(demoRoutesPath, 'utf8');

if (!demoRoutes.includes('submitClaimantClaim')) {
  demoRoutes = demoRoutes.replace(
    'updateClaimStatus, simulateIngestion } = require',
    'updateClaimStatus, simulateIngestion, submitClaimantClaim } = require'
  );
  demoRoutes = demoRoutes.replace(
    'module.exports = router;',
    'router.post(\'/claims/submit\', protect, submitClaimantClaim);\n\nmodule.exports = router;'
  );
  fs.writeFileSync(demoRoutesPath, demoRoutes);
}

console.log('Claimant flow & highly polished UI injected successfully.');
