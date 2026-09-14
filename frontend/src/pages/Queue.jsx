
import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { io } from 'socket.io-client';

export default function Queue() {
  const role = localStorage.getItem('role') || 'Human_Verifier';
  const navigate = useNavigate();
  const [claims, setClaims] = useState([]);

  useEffect(() => {
    // Initial fetch
    api.get('/demo/claims').then(res => setClaims(res.data)).catch(console.error);

    // Socket.io connection for real-time updates
    const socket = io('http://localhost:5000');
    
    socket.on('claim_updated', (updatedClaim) => {
      setClaims(prev => {
        const exists = prev.find(c => c.claimId === updatedClaim.claimId);
        if (exists) {
          return prev.map(c => c.claimId === updatedClaim.claimId ? updatedClaim : c);
        } else {
          return [updatedClaim, ...prev];
        }
      });
      
      // Optional: Add a simple toast or sound notification here
      console.log('Real-time claim update received:', updatedClaim.claimId);
    });

    return () => socket.disconnect();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-canvas font-sans text-white">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col border-l border-border">
        <header className="bg-panel border-b border-border h-16 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold tracking-wide text-white">Active Triage Queue</h2>
            <span className="bg-primary/20 text-primary px-2.5 py-0.5 rounded text-xs font-mono font-bold border border-primary/30">LIVE</span>
          </div>
        </header>

        <main className="p-6 flex-1 overflow-auto">
          <div className="bg-panel border border-border rounded-xl shadow-panel overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-mono text-xs uppercase tracking-wider text-gray-400">Claim ID</th>
                  <th className="px-6 py-4 font-mono text-xs uppercase tracking-wider text-gray-400">Type</th>
                  <th className="px-6 py-4 font-mono text-xs uppercase tracking-wider text-gray-400">AI Confidence</th>
                  <th className="px-6 py-4 font-mono text-xs uppercase tracking-wider text-gray-400">Status</th>
                  <th className="px-6 py-4 font-mono text-xs uppercase tracking-wider text-gray-400 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {claims.map((c) => (
                  <tr key={c._id} className="hover:bg-surface transition-colors">
                    <td className="px-6 py-4 font-mono text-primary font-medium">{c.claimId}</td>
                    <td className="px-6 py-4 text-gray-200">{c.claimType.replace('_', ' ')}</td>
                    <td className="px-6 py-4 font-medium">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${c.aiAnalysis.consistencyScore > 80 ? 'bg-success-bg text-success border border-success-border' : c.aiAnalysis.consistencyScore > 50 ? 'bg-warning-bg text-warning border border-warning-border' : 'bg-danger-bg text-danger border border-danger-border'}`}>
                        {c.aiAnalysis.consistencyScore}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-surface text-gray-300 border border-border rounded text-xs font-bold uppercase tracking-wide">
                        {c.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => navigate(`/cockpit/${c.claimId}`)}
                        className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-md text-xs font-bold transition-all shadow-glow"
                      >
                        Inspect
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
}