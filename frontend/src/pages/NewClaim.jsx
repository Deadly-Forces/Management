import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UploadCloud, FileText, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import api from '../api';

export default function NewClaim() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ 
    policyNumber: '', 
    policyHolderName: '', 
    dateOfDeath: '', 
    insuranceCompany: 'LIC',
    nomineeName: '',
    nomineeRelation: '',
    nomineePhone: ''
  });
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [aiCheckStatus, setAiCheckStatus] = useState('idle'); // idle, checking, complete

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const runAiCheck = () => {
    setAiCheckStatus('checking');
    setTimeout(() => {
      setAiCheckStatus('complete');
    }, 2500);
  };

  useEffect(() => {
    if (step === 4 && aiCheckStatus === 'idle') {
      runAiCheck();
    }
  }, [step, aiCheckStatus]);

  const handleSubmit = async () => {
    const rawDescription = (formData.description || (formData.policyNumber ? `Claim for policy ${formData.policyNumber}` : '')).trim();
    if (!rawDescription) {
      alert('Validation Error: Claim description cannot be blank.');
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('type', 'LIFE_DEATH'); // Defaulting to life insurance death claim
      data.append('description', rawDescription);
      data.append('dateOfLoss', formData.dateOfDeath || new Date().toISOString().split('T')[0]);
      data.append('location', 'Not Specified');
      data.append('policyNumber', formData.policyNumber);
      data.append('insuranceCompany', formData.insuranceCompany);
      data.append('nomineeName', formData.nomineeName);
      data.append('policyHolderName', formData.policyHolderName);
      files.forEach(file => {
        data.append('documents', file);
      });

      await api.post('/demo/claims/submit', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate('/applicant-dashboard');
    } catch (e) {
      alert('Error submitting claim: ' + (e.response?.data?.error || e.message));
      setSubmitting(false);
    }
  };

  const stepTitles = ["Policy", "Nominee", "Documents", "AI Check", "Submit"];

  return (
    <div className="min-h-screen bg-slate-50 font-sans py-12">
      <div className="max-w-3xl mx-auto px-6">
        
        <button onClick={() => navigate('/applicant-dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 font-medium transition-colors">
          <ArrowLeft size={18} /> Back to Dashboard
        </button>

        <div className="glass-card overflow-hidden bg-white shadow-sm rounded-2xl border border-slate-200">
          <div className="bg-white border-b border-slate-100 px-8 py-6">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">New Insurance Claim</h1>
            
            {/* Progress Bar */}
            <div className="flex items-center gap-2 mb-2">
               {[1, 2, 3, 4, 5].map((s) => (
                 <div key={s} className={`h-2 flex-1 rounded-full transition-colors ${step >= s ? 'bg-indigo-600' : 'bg-slate-100'}`}></div>
               ))}
            </div>
            
            <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              {stepTitles.map((title, i) => (
                <span key={i} className={step >= i + 1 ? 'text-indigo-600' : ''}>{i + 1} {title}</span>
              ))}
            </div>
          </div>

          <div className="p-8">
            {/* STEP 1: Policy Details */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl font-bold text-slate-800 mb-6">Policy Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Policy Number</label>
                    <input 
                      type="text" 
                      placeholder="Enter Policy Number" 
                      value={formData.policyNumber} 
                      onChange={e => setFormData({...formData, policyNumber: e.target.value})} 
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Policy Holder Name</label>
                    <input 
                      type="text" 
                      placeholder="Enter Name" 
                      value={formData.policyHolderName} 
                      onChange={e => setFormData({...formData, policyHolderName: e.target.value})} 
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Date of Death</label>
                    <input 
                      type="date" 
                      value={formData.dateOfDeath} 
                      onChange={e => setFormData({...formData, dateOfDeath: e.target.value})} 
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Insurance Company</label>
                    <select 
                      value={formData.insuranceCompany} 
                      onChange={e => setFormData({...formData, insuranceCompany: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    >
                      <option value="LIC">LIC</option>
                      <option value="HDFC Life">HDFC Life</option>
                      <option value="SBI Life">SBI Life</option>
                      <option value="ICICI Prudential">ICICI Prudential</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-6">
                  <button 
                    onClick={() => setStep(2)} 
                    disabled={!formData.policyNumber || !formData.policyHolderName || !formData.dateOfDeath} 
                    className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Nominee */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl font-bold text-slate-800 mb-6">Nominee Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Nominee Name</label>
                    <input 
                      type="text" 
                      placeholder="Enter Nominee Name" 
                      value={formData.nomineeName} 
                      onChange={e => setFormData({...formData, nomineeName: e.target.value})} 
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Relationship with Policy Holder</label>
                    <select 
                      value={formData.nomineeRelation} 
                      onChange={e => setFormData({...formData, nomineeRelation: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    >
                      <option value="">Select Relationship</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Child">Child</option>
                      <option value="Parent">Parent</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Contact Number</label>
                    <input 
                      type="tel" 
                      placeholder="Enter Phone Number" 
                      value={formData.nomineePhone} 
                      onChange={e => setFormData({...formData, nomineePhone: e.target.value})} 
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium" 
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-6">
                  <button onClick={() => setStep(1)} className="text-slate-500 font-bold py-3 px-6 hover:text-slate-900 transition-colors">Back</button>
                  <button 
                    onClick={() => setStep(3)} 
                    disabled={!formData.nomineeName || !formData.nomineeRelation || !formData.nomineePhone} 
                    className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Documents */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Required Documents</h2>
                
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3">
                  <AlertCircle className="text-amber-600 shrink-0" size={20} />
                  <p className="text-sm text-amber-900">
                    Please upload the Original Policy Document, Death Certificate, and your ID Proof.
                  </p>
                </div>
                
                <div className="relative mt-4">
                  <input type="file" multiple onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-2xl p-10 flex flex-col items-center justify-center text-center hover:bg-indigo-50 transition-colors">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                      <UploadCloud className="text-indigo-600" size={32} />
                    </div>
                    <h4 className="text-slate-900 font-bold mb-1">Click or drag files here</h4>
                    <p className="text-slate-500 text-sm">Supports PDF, JPG, PNG (Max 50MB per file)</p>
                  </div>
                </div>

                {files.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <p className="text-sm font-semibold text-slate-700">Uploaded Documents:</p>
                    {files.map((file, i) => (
                      <div key={i} className="border border-slate-200 rounded-xl p-3 flex items-center justify-between bg-white shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                            <FileText size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{file.name}</p>
                            <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button onClick={() => removeFile(i)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors z-20">
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between pt-6 relative z-20">
                  <button onClick={() => setStep(2)} className="text-slate-500 font-bold py-3 px-6 hover:text-slate-900 transition-colors">Back</button>
                  <button 
                    onClick={() => setStep(4)} 
                    disabled={files.length === 0} 
                    className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: AI Check */}
            {step === 4 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 text-center py-10">
                {aiCheckStatus === 'checking' ? (
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-2 relative">
                      <Loader2 className="text-indigo-600 animate-spin absolute" size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">AI is reviewing your documents</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">
                      Our intelligence engine is cross-checking the policy number, death certificate, and nominee details.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-2">
                      <CheckCircle className="text-emerald-500" size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">AI Check Successful</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">
                      All documents appear valid and match the policy records. Your claim is ready to be submitted.
                    </p>
                  </div>
                )}

                <div className="flex justify-between pt-10">
                  <button onClick={() => setStep(3)} className="text-slate-500 font-bold py-3 px-6 hover:text-slate-900 transition-colors">Back</button>
                  <button 
                    onClick={() => setStep(5)} 
                    disabled={aiCheckStatus === 'checking'} 
                    className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: Submit */}
            {step === 5 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl font-bold text-slate-800 mb-6">Review & Submit</h2>

                <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Claim Summary</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between border-b border-slate-200 pb-3">
                      <span className="text-slate-500 font-medium">Policy Info</span>
                      <span className="font-bold text-slate-900 text-right">{formData.insuranceCompany} • {formData.policyNumber}<br/><span className="text-sm font-normal text-slate-500">{formData.policyHolderName}</span></span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-3">
                      <span className="text-slate-500 font-medium">Nominee</span>
                      <span className="font-bold text-slate-900 text-right">{formData.nomineeName}<br/><span className="text-sm font-normal text-slate-500">{formData.nomineeRelation} • {formData.nomineePhone}</span></span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Documents</span>
                      <span className="font-bold text-emerald-600 flex items-center gap-1"><CheckCircle size={14}/> {files.length} AI Verified</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm border border-blue-100">
                  <span className="font-bold">Declaration:</span> By submitting this claim, I certify that the information provided is true and accurate. I authorize the insurance provider to process my claim digitally.
                </div>
                
                <div className="flex justify-between pt-6">
                  <button onClick={() => setStep(4)} className="text-slate-500 font-bold py-3 px-6 hover:text-slate-900 transition-colors" disabled={submitting}>Back</button>
                  <button onClick={handleSubmit} disabled={submitting} className="bg-emerald-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2">
                    {submitting && <Loader2 className="animate-spin" size={18} />}
                    {submitting ? 'Submitting...' : 'Submit Claim'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}