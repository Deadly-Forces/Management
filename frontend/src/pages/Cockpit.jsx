import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, FileText, XCircle, ShieldCheck, AlertCircle, Eye, Bot, ShieldAlert, FileCheck, Check, X } from 'lucide-react';
import api from '../api';

export default function Cockpit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [verifications, setVerifications] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeDoc, setActiveDoc] = useState(0); // Index of currently viewed document

  useEffect(() => {
    api.get(`/demo/claims/${id}`).then(res => {
      setData(res.data);
      const initialVerifs = {};
      // default extractions to unverified (null)
      res.data.extractions.forEach(ext => { initialVerifs[ext._id] = null; });
      setVerifications(initialVerifs);
    }).catch(console.error);
  }, [id]);

  if (!data) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4 text-indigo-600 animate-pulse">
        <ShieldCheck size={48} />
        <p className="font-semibold tracking-wide uppercase text-sm">Loading Secure Workstation...</p>
      </div>
    </div>
  );

  const { claim, extractions, documents } = data;
  const isDeathClaim = claim.claimType === 'LIFE_DEATH';
  const allVerified = extractions.length === 0 || Object.values(verifications).every(v => v !== null);
  const aiScore = claim.aiAnalysis.consistencyScore || 0;

  const toggleVerify = (extId, status) => setVerifications(prev => ({ ...prev, [extId]: status }));

  const handleFinalDecision = async (status) => {
    setIsSubmitting(true);
    try {
      await api.put(`/demo/claims/${id}/status`, { status });
      navigate('/queue');
    } catch (err) {
      alert('Failed to update claim: ' + err.message);
      setIsSubmitting(false);
    }
  };

  const currentDocument = documents && documents.length > 0 ? documents[activeDoc] : null;

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Top App Bar - Google Workspace Style */}
      <header className="bg-white border-b border-slate-200 h-16 px-6 flex justify-between items-center shrink-0 z-10">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/queue')} className="p-2 -ml-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={22} />
          </button>
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-slate-900 leading-tight">Claim <span className="text-indigo-600">{id}</span></h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{claim.claimType.replace('_', ' ')} Review</p>
            </div>
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
              <ShieldCheck size={14} /> Human Verification Required
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleFinalDecision('REJECTED')}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-lg text-sm font-bold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all disabled:opacity-50"
          >
            Escalate to SIU
          </button>
          <button 
            onClick={() => handleFinalDecision('APPROVED')}
            disabled={!allVerified || isSubmitting}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-all flex items-center gap-2 
              ${allVerified 
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 hover:shadow-md' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'}`}
          >
            {isSubmitting ? 'Processing...' : <><CheckCircle2 size={18} /> Approve Settlement</>}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex gap-6 p-6 overflow-hidden">
        
        {/* Left Panel: Document Viewer (60%) */}
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
          {/* Document Tabs */}
          {documents && documents.length > 0 && (
            <div className="flex bg-slate-50 border-b border-slate-200 overflow-x-auto custom-scrollbar">
              {documents.map((doc, i) => (
                <button 
                  key={i}
                  onClick={() => setActiveDoc(i)}
                  className={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap
                    ${activeDoc === i ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                >
                  <FileText size={16} className={activeDoc === i ? 'text-indigo-600' : 'text-slate-400'} />
                  {doc.fileName}
                </button>
              ))}
            </div>
          )}
          
          {/* Document Content */}
          <div className="flex-1 bg-slate-100/50 p-6 flex flex-col items-center overflow-auto">
             {currentDocument ? (
               <div className="w-full max-w-4xl flex-1 bg-white shadow-md border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                 {currentDocument.fileUrl.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                   <div className="flex-1 flex items-center justify-center p-8 bg-slate-900">
                     <img src={currentDocument.fileUrl.startsWith('http') ? currentDocument.fileUrl : `http://localhost:5000${currentDocument.fileUrl}`} className="max-w-full max-h-full object-contain rounded shadow-lg" alt="Evidence Document" />
                   </div>
                 ) : (
                   <iframe src={currentDocument.fileUrl.startsWith('http') ? currentDocument.fileUrl : `http://localhost:5000${currentDocument.fileUrl}`} className="w-full h-full border-0 bg-white flex-1" title="Document Viewer" />
                 )}
               </div>
             ) : (
               <div className="m-auto text-center p-12 bg-white rounded-2xl shadow-sm border border-slate-200 max-w-sm">
                 <FileCheck size={48} className="text-slate-300 mx-auto mb-4" />
                 <h3 className="text-lg font-bold text-slate-800 mb-2">No Documents Available</h3>
                 <p className="text-sm text-slate-500">The claimant did not upload any standard documents for this claim.</p>
               </div>
             )}
          </div>
        </div>

        {/* Right Panel: AI & Extractions (40%) */}
        <div className="w-[450px] flex flex-col gap-6 overflow-hidden">
          
          {/* AI Insights Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 shrink-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                <Bot size={22} className="text-indigo-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">AI Intelligence Report</h2>
                <p className="text-xs text-slate-500">Automated Pipeline Summary</p>
              </div>
            </div>
            
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-4">
              <p className="text-sm text-slate-700 font-medium leading-relaxed">{claim.aiAnalysis.summary}</p>
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-semibold text-slate-500">Confidence Score</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${aiScore > 90 ? 'bg-emerald-500' : aiScore > 75 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${aiScore}%` }}></div>
                </div>
                <span className={`text-sm font-bold ${aiScore > 90 ? 'text-emerald-700' : aiScore > 75 ? 'text-amber-700' : 'text-rose-700'}`}>{aiScore}%</span>
              </div>
            </div>
          </div>

          {/* Extractions Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col flex-1 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-base font-bold text-slate-900">Extracted Data Points</h2>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">{extractions.length} items</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {!allVerified && extractions.length > 0 && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 items-start shadow-sm">
                  <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-900 font-medium leading-relaxed">
                    Action Required: Please review and verify all extracted data points below to unlock the settlement approval workflow.
                  </p>
                </div>
              )}

              {extractions.map(ext => {
                const isVerified = verifications[ext._id] === true;
                const isRejected = verifications[ext._id] === false;
                
                return (
                  <div key={ext._id} className={`border rounded-xl p-4 transition-all duration-200 shadow-sm
                    ${isVerified ? 'border-emerald-200 bg-emerald-50/30' : isRejected ? 'border-rose-200 bg-rose-50/30' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{ext.fieldCategory}</p>
                        <p className="text-sm font-bold text-slate-900">{ext.description}</p>
                      </div>
                      <span className="text-base font-black text-slate-800 bg-slate-100 px-3 py-1 rounded-lg">
                        {typeof ext.aiData.value === 'number' ? `$${ext.aiData.value.toFixed(2)}` : ext.aiData.value}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 mb-4">
                      <Bot size={14} className="text-indigo-400" />
                      <p className="text-xs text-slate-500 font-medium">Confidence: <span className="text-indigo-600 font-bold">{ext.aiData.confidence}%</span></p>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => toggleVerify(ext._id, true)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs uppercase font-bold rounded-lg border transition-all
                          ${isVerified ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700'}`}
                      >
                        <Check size={14} /> Accept
                      </button>
                      <button 
                        onClick={() => toggleVerify(ext._id, false)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs uppercase font-bold rounded-lg border transition-all
                          ${isRejected ? 'bg-rose-500 border-rose-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700'}`}
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  </div>
                );
              })}
              
              {extractions.length === 0 && (
                <div className="text-center py-10">
                  <ShieldAlert size={32} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-500">No data points were extracted for this claim.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}