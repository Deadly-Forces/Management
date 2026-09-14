
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
                <div className={`p-3 rounded-full bg-gray-50 ${kpi.color}`}>
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
}