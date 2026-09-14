import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Hexagon, LogOut, PlusCircle, FileText, Clock, CheckCircle2, AlertTriangle, XCircle, Shield, FileCheck, IndianRupee } from 'lucide-react';
import api from '../api';

export default function ApplicantDashboard() {
  const navigate = useNavigate();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyClaims = () => {
    // Fetch claims isolated to the authenticated claimant
    api.get('/demo/my-claims')
      .then(res => {
        setClaims(res.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMyClaims();
    // Poll every 5s while claims are processing
    const interval = setInterval(fetchMyClaims, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  const getDecisionBadge = (decision) => {
    if (!decision) return null;
    switch (decision) {
      case 'APPROVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={13} /> AI: APPROVE
          </span>
        );
      case 'REJECT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle size={13} /> AI: REJECT
          </span>
        );
      case 'ESCALATE':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle size={13} /> AI: ESCALATE
          </span>
        );
    }
  };

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
            <button onClick={handleLogout} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-10">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">My Claims</h1>
            <p className="text-slate-500">Track real-time AI document extraction, validation, and claim triage.</p>
          </div>
          <Link to="/new-claim" className="btn-primary flex items-center gap-2">
            <PlusCircle size={18} /> File New Claim
          </Link>
        </div>

        {loading ? (
          <div className="glass-card p-12 text-center text-slate-500">Loading your claims...</div>
        ) : claims.length === 0 ? (
          <div className="glass-card p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
              <FileText size={32} />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No claims filed yet</h3>
            <p className="text-slate-500 mb-6">You don't have any active claims under your account.</p>
            <Link to="/new-claim" className="btn-secondary">Start a Claim</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {claims.map(claim => (
              <div key={claim._id} className="glass-card p-6 flex flex-col gap-4 hover:border-indigo-200 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                      claim.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' :
                      claim.status === 'REJECTED' ? 'bg-rose-100 text-rose-600' :
                      claim.status === 'DOCUMENTS_PROCESSING' ? 'bg-amber-100 text-amber-600 animate-pulse' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {claim.status === 'APPROVED' ? <CheckCircle2 size={24} /> :
                       claim.status === 'REJECTED' ? <XCircle size={24} /> :
                       <Clock size={24} />}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-slate-900">{claim.claimId}</h3>
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full border border-slate-200 uppercase tracking-wide">
                          {claim.claimType ? claim.claimType.replace('_', ' ') : 'AUTO'}
                        </span>
                        {getDecisionBadge(claim.aiDecision)}
                      </div>
                      <p className="text-slate-600 text-sm">{claim.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:items-end">
                    <span className="text-xs font-semibold text-slate-500 mb-1">Current Status</span>
                    <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border ${
                      claim.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      claim.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      claim.status === 'DOCUMENTS_PROCESSING' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                      'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}>
                      {claim.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Extracted Entities Card Section */}
                <div className="mt-2 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50/70 p-3 rounded-xl">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Shield size={16} className="text-indigo-500 shrink-0" />
                    <div>
                      <span className="text-slate-400 block font-medium">Policy Number</span>
                      <span className="font-semibold text-slate-900">
                        {claim.policyNumber || 'Detecting...'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700">
                    <IndianRupee size={16} className="text-emerald-500 shrink-0" />
                    <div>
                      <span className="text-slate-400 block font-medium">Extracted Amount</span>
                      <span className="font-semibold text-slate-900">
                        {claim.extractedAmount != null ? `₹${Number(claim.extractedAmount).toLocaleString()}` : 'Calculating...'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700">
                    <FileCheck size={16} className="text-blue-500 shrink-0" />
                    <div>
                      <span className="text-slate-400 block font-medium">AI Triage Decision</span>
                      <span className="font-semibold text-slate-900">
                        {claim.aiDecision || 'In Progress'}
                      </span>
                    </div>
                  </div>
                </div>

                {claim.aiAnalysis?.summary && (
                  <p className="text-xs text-slate-500 italic bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                    {claim.aiAnalysis.summary}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}