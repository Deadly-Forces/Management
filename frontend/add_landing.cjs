const fs = require('fs');
const path = require('path');

const baseDir = 'd:/sih/frontend';

const files = {
  'src/App.jsx': `import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Queue from './pages/Queue';
import Cockpit from './pages/Cockpit';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/queue" element={<Queue />} />
        <Route path="/cockpit/:id" element={<Cockpit />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;`,

  'src/pages/Landing.jsx': `import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, Layers, ChevronRight, Activity, Cpu } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 selection:bg-indigo-500/30 font-sans overflow-x-hidden">
      {/* High-End Tech Background (Grid + Glowing Orbs) */}
      <div className="fixed inset-0 z-0 opacity-20 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute top-0 -left-20 w-[500px] h-[500px] bg-indigo-600 rounded-full mix-blend-screen filter blur-[150px] opacity-20 animate-pulse"></div>
      <div className="absolute top-40 -right-20 w-[600px] h-[600px] bg-cyan-600 rounded-full mix-blend-screen filter blur-[150px] opacity-10"></div>

      {/* Corporate Glass Header */}
      <header className="relative z-50 border-b border-white/5 bg-[#030712]/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 bg-indigo-500/20 border border-indigo-500/30 rounded-xl flex items-center justify-center">
              <Layers className="text-indigo-400" size={20} />
            </div>
            <span className="font-black text-2xl tracking-tight text-white">ClaimPilot <span className="text-indigo-500">AI</span></span>
          </div>
          <nav className="hidden md:flex gap-10 text-sm font-semibold text-slate-400">
            <a href="#platform" className="hover:text-white transition-colors">Platform</a>
            <a href="#solutions" className="hover:text-white transition-colors">Solutions</a>
            <a href="#security" className="hover:text-white transition-colors">Security</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden md:block text-sm font-semibold text-slate-300 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link to="/login" className="px-6 py-2.5 text-sm font-bold text-white bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg transition-all backdrop-blur-md">
              Access Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold tracking-widest uppercase mb-10">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
          Enterprise Engine v3.0 Now Live
        </div>
        
        <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-white mb-8 leading-[1.1]">
          Adjudication, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400">
            Powered by Intelligence.
          </span>
        </h1>
        
        <p className="max-w-3xl mx-auto text-xl text-slate-400 mb-12 leading-relaxed font-medium">
          The premier B2B SaaS platform for modern insurance carriers. 
          Process <strong className="text-slate-200 font-bold">Auto, Property, and Life Insurance</strong> claims in seconds. 
          AI extracts the data. Human experts verify the truth.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link to="/login" className="group flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-lg font-bold rounded-xl transition-all shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)] border border-indigo-400/50 hover:scale-105">
            Launch Platform <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/login" className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-lg font-bold rounded-xl transition-all hover:scale-105">
            Claim Your Account
          </Link>
        </div>

        {/* Abstract UI Preview / Dashboard Mock */}
        <div className="mt-24 relative mx-auto max-w-5xl">
          <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent z-20 h-full w-full pointer-events-none"></div>
          
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md p-3 shadow-2xl relative z-10 transform perspective-1000 rotate-x-12 scale-105">
            {/* Top glowing edge */}
            <div className="absolute -top-px left-32 right-32 h-px bg-gradient-to-r from-indigo-500/0 via-indigo-400/80 to-indigo-500/0 shadow-[0_0_20px_rgba(99,102,241,0.8)]"></div>
            
            <div className="rounded-xl bg-[#0a0f1c] border border-white/5 h-[400px] flex flex-col overflow-hidden relative">
              {/* Fake UI Header */}
              <div className="h-12 border-b border-white/5 flex items-center px-4 gap-4">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/20 border border-rose-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50"></div>
                </div>
                <div className="h-4 w-48 bg-white/5 rounded mx-auto"></div>
              </div>
              {/* Fake UI Content */}
              <div className="flex-1 p-6 flex flex-col items-center justify-center text-slate-500 relative">
                 <div className="absolute top-6 left-6 right-6 bottom-6 border border-white/5 rounded-lg flex items-center justify-center bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')]">
                   <div className="text-center">
                     <Activity size={64} className="mx-auto mb-6 text-indigo-500/50 animate-pulse" />
                     <p className="font-mono text-sm tracking-widest uppercase text-indigo-400/70">Encrypted Adjuster Cockpit Instance</p>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bento Grid Features - Premium SaaS look */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-32 border-t border-white/5">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Built for the Enterprise.</h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto font-medium">Uncompromising security, unparalleled extraction accuracy, and strict human-in-the-loop workflows.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1 md:col-span-2 p-10 rounded-3xl bg-[#0a0f1c] border border-white/5 relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
            <Cpu className="text-indigo-400 mb-8" size={40} strokeWidth={1.5} />
            <h3 className="text-3xl font-bold text-white mb-4">Multi-Modal Extraction Engine</h3>
            <p className="text-slate-400 text-lg leading-relaxed max-w-lg">Our proprietary AI instantly parses 50-page medical reports, auto body repair estimates, and state-issued death certificates with 99.8% accuracy.</p>
            <div className="absolute right-0 bottom-0 w-96 h-96 bg-indigo-500/10 blur-[100px] group-hover:bg-indigo-500/20 transition-colors"></div>
          </div>
          
          <div className="p-10 rounded-3xl bg-[#0a0f1c] border border-white/5 group hover:border-emerald-500/30 transition-colors">
            <ShieldCheck className="text-emerald-400 mb-8" size={40} strokeWidth={1.5} />
            <h3 className="text-2xl font-bold text-white mb-4">Human-in-the-Loop</h3>
            <p className="text-slate-400 leading-relaxed">AI prepares the data. Humans verify the truth. Strict state machines enforce mandatory adjuster verification on every single claim line item.</p>
          </div>
          
          <div className="p-10 rounded-3xl bg-[#0a0f1c] border border-white/5 group hover:border-amber-500/30 transition-colors">
            <Zap className="text-amber-400 mb-8" size={40} strokeWidth={1.5} />
            <h3 className="text-2xl font-bold text-white mb-4">Sub-Second Triage</h3>
            <p className="text-slate-400 leading-relaxed">Claims are ingested, scored for fraud risk, and routed to the correct adjuster tier before the policyholder even closes the app.</p>
          </div>
          
          <div className="col-span-1 md:col-span-2 p-10 rounded-3xl bg-[#0a0f1c] border border-white/5 relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
             <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent"></div>
             <h3 className="text-3xl font-bold text-white mb-4 relative z-10">Military-Grade Isolation</h3>
             <p className="text-slate-400 text-lg leading-relaxed max-w-lg relative z-10">Strict multi-tenant architecture. Your data is isolated, encrypted at rest via AES-256, and never used to train public LLM models.</p>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#030712] py-12 text-center text-slate-500 font-medium">
        <p>&copy; 2026 ClaimPilot AI Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}`
};

Object.entries(files).forEach(([filepath, content]) => {
  fs.writeFileSync(path.join(baseDir, filepath), content);
});

console.log('Premium Landing Page deployed.');
