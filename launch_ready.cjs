const fs = require('fs');
const path = require('path');

const backendDir = 'd:/sih/backend';
const frontendDir = 'd:/sih/frontend';

// ---------------------------------------------------------
// 1. BACKEND: Add Full Lifecycle & Ingestion Endpoints
// ---------------------------------------------------------
let demoControllerPath = path.join(backendDir, 'src/controllers/demoController.js');
let demoController = fs.readFileSync(demoControllerPath, 'utf8');

if (!demoController.includes('updateClaimStatus')) {
  demoController += `
exports.updateClaimStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const claim = await Claim.findOne({ claimId: req.params.id, tenantId: req.tenantId });
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    
    claim.status = status;
    await claim.save();
    res.json(claim);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.simulateIngestion = async (req, res) => {
  try {
    const user = await User.findOne({ tenantId: req.tenantId });
    const isLife = Math.random() > 0.5;
    
    const newClaim = await Claim.create({
      tenantId: req.tenantId,
      claimantId: user._id,
      claimType: isLife ? 'LIFE_DEATH' : 'AUTO',
      description: isLife ? 'Automated Death Benefit Submission' : 'Automated Collision Submission',
      status: 'READY_FOR_HUMAN_REVIEW',
      aiAnalysis: { 
        summary: 'AI Pipeline ingestion complete. Ready for adjuster review.', 
        consistencyScore: Math.floor(Math.random() * 20) + 80, 
        detectedIssues: [], 
        recommendedAction: 'Verify line items' 
      }
    });

    if (isLife) {
      await Extraction.create({ claimId: newClaim._id, tenantId: req.tenantId, fieldCategory: 'Beneficiary', description: 'John Doe Jr.', aiData: { value: 'Verified', confidence: 99 }});
      await Extraction.create({ claimId: newClaim._id, tenantId: req.tenantId, fieldCategory: 'DeathCert', description: 'State Registry API', aiData: { value: 'Authentic', confidence: 98 }});
    } else {
      await Extraction.create({ claimId: newClaim._id, tenantId: req.tenantId, fieldCategory: 'LineItem', description: 'Rear Bumper Assembly', aiData: { value: 1200.00, confidence: 91 }});
      await Extraction.create({ claimId: newClaim._id, tenantId: req.tenantId, fieldCategory: 'LineItem', description: 'Paint & Blending', aiData: { value: 350.00, confidence: 85 }});
    }

    res.json(newClaim);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
`;
  fs.writeFileSync(demoControllerPath, demoController);
}

let demoRoutesPath = path.join(backendDir, 'src/routes/demoRoutes.js');
let demoRoutes = fs.readFileSync(demoRoutesPath, 'utf8');

if (!demoRoutes.includes('updateClaimStatus')) {
  demoRoutes = demoRoutes.replace(
    'const { demoLogin, getClaims, getClaimDetails } = require(\'../controllers/demoController\');',
    'const { demoLogin, getClaims, getClaimDetails, updateClaimStatus, simulateIngestion } = require(\'../controllers/demoController\');'
  );
  demoRoutes = demoRoutes.replace(
    'module.exports = router;',
    'router.put(\'/claims/:id/status\', protect, updateClaimStatus);\nrouter.post(\'/ingest\', protect, simulateIngestion);\n\nmodule.exports = router;'
  );
  fs.writeFileSync(demoRoutesPath, demoRoutes);
}


// ---------------------------------------------------------
// 2. FRONTEND: Connect UI buttons to Backend Database
// ---------------------------------------------------------

const cockpitCode = `
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import api from '../api';

export default function Cockpit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [verifications, setVerifications] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api.get(\`/demo/claims/\${id}\`).then(res => {
      setData(res.data);
      const initialVerifs = {};
      res.data.extractions.forEach(ext => { initialVerifs[ext._id] = null; });
      setVerifications(initialVerifs);
    }).catch(console.error);
  }, [id]);

  if (!data) return <div className="p-8 flex items-center justify-center h-screen bg-[#f5f5f5] text-gray-500">Loading secure claim data...</div>;

  const { claim, extractions } = data;
  const isDeathClaim = claim.claimType === 'LIFE_DEATH';
  const allVerified = Object.values(verifications).every(v => v !== null);

  const toggleVerify = (extId, status) => setVerifications(prev => ({ ...prev, [extId]: status }));

  const handleFinalDecision = async (status) => {
    setIsSubmitting(true);
    try {
      await api.put(\`/demo/claims/\${id}/status\`, { status });
      navigate('/queue');
    } catch (err) {
      alert('Failed to update claim: ' + err.message);
      setIsSubmitting(false);
    }
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
        <div className="flex gap-3">
          <button 
            onClick={() => handleFinalDecision('REJECTED')}
            disabled={isSubmitting}
            className="btn-material bg-white text-red-600 hover:bg-gray-50"
          >
            Reject / Refer to SIU
          </button>
          <button 
            onClick={() => handleFinalDecision('APPROVED')}
            disabled={!allVerified || isSubmitting}
            className={\`btn-material flex items-center gap-2 \${allVerified ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-500 shadow-none cursor-not-allowed'}\`}
          >
            {isSubmitting ? 'Processing...' : <><CheckCircle2 size={18} /> Approve Settlement</>}
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
                 <div className="text-center mt-20 border-8 border-double border-gray-300 py-20 px-8">
                   <h2 className="text-3xl font-serif mb-4 uppercase tracking-widest font-bold">Certificate of Death</h2>
                   <p className="text-lg font-mono">STATE REGISTRY</p>
                 </div>
               ) : (
                 <div className="text-center text-gray-500 font-bold text-xl mt-40">
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
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Verification Required</h3>
              <div className="space-y-4">
                {extractions.map(ext => (
                  <div key={ext._id} className="border border-gray-200 rounded p-4 shadow-sm bg-white">
                    <div className="flex justify-between items-start mb-1">
                       <p className="text-sm font-medium text-gray-900">{ext.description}</p>
                       <span className="text-sm font-bold">{typeof ext.aiData.value === 'number' ? \`$\${ext.aiData.value.toFixed(2)}\` : ext.aiData.value}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">AI Confidence: <span className="font-bold text-green-600">{ext.aiData.confidence}%</span></p>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => toggleVerify(ext._id, true)}
                        className={\`flex-1 py-2 text-xs uppercase font-medium rounded border transition-colors \${verifications[ext._id] === true ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}\`}
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => toggleVerify(ext._id, false)}
                        className={\`flex-1 py-2 text-xs uppercase font-medium rounded border transition-colors \${verifications[ext._id] === false ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}\`}
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

const dashboardCode = `
import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { Activity, Clock, ShieldCheck, AlertOctagon, PlusCircle } from 'lucide-react';
import api from '../api';

export default function Dashboard() {
  const role = localStorage.getItem('role') || 'Administrator';
  const [ingesting, setIngesting] = useState(false);

  const simulateIngestion = async () => {
    setIngesting(true);
    try {
      await api.post('/demo/ingest');
      alert('Success! A new claim has been ingested through the AI pipeline and is awaiting review in the Triage Queue.');
    } catch (err) {
      alert('Error ingesting claim: ' + err.message);
    } finally {
      setIngesting(false);
    }
  };

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
        <header className="bg-[#1976d2] text-white shadow-md h-16 flex items-center justify-between px-6 shrink-0 z-10">
          <h2 className="text-lg font-medium tracking-wide">Executive Overview</h2>
          <button 
            onClick={simulateIngestion} 
            disabled={ingesting}
            className="btn-material bg-white text-[#1976d2] hover:bg-gray-50 flex items-center gap-2"
          >
            <PlusCircle size={18} />
            {ingesting ? 'Processing...' : 'Simulate Inbound Claim'}
          </button>
        </header>
        
        <main className="p-6 flex-1 overflow-auto">
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
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-[#1976d2] font-medium">CLM-9921</td>
                  <td className="px-6 py-4 text-gray-800">Life / Death</td>
                  <td className="px-6 py-4 text-green-600 font-medium">99%</td>
                  <td className="px-6 py-4 text-gray-500 text-right">2 hrs ago</td>
                </tr>
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}`;
fs.writeFileSync(path.join(frontendDir, 'src/pages/Dashboard.jsx'), dashboardCode);

console.log('Launch-ready features deployed.');
