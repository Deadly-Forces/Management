import { useState, useEffect } from 'react';
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
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${claim.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
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
                  <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border ${
                    claim.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                    claim.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                    'bg-indigo-50 text-indigo-700 border-indigo-200'
                  }`}>
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
}