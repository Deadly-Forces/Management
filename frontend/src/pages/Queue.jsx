
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
                        onClick={() => navigate(`/cockpit/${c.claimId}`)}
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
}