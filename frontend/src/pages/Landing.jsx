import { Link } from 'react-router-dom';
import { Shield, Zap, FileText, ArrowRight, CheckCircle2, ChevronRight, Activity, Smartphone } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans overflow-hidden selection:bg-indigo-200">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-indigo-400/30 to-purple-400/30 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-gradient-to-br from-blue-400/20 to-teal-300/20 blur-[120px]" />
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[50%] rounded-full bg-gradient-to-tr from-pink-300/20 to-orange-300/20 blur-[120px]" />
      </div>

      {/* Modern Header */}
      <header className="relative z-50 py-6 px-6 md:px-12 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Zap size={22} className="fill-white/20" />
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900">ClaimPilot<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">AI</span></span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="hidden md:block text-slate-600 font-bold hover:text-indigo-600 transition-colors">
            Employee Portal
          </Link>
          <Link to="/login" className="bg-slate-900 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-full font-bold transition-all shadow-md hover:shadow-xl hover:shadow-indigo-200 flex items-center gap-2">
            File a Claim <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 pt-4 pb-12 lg:pt-8 lg:pb-16 px-6 md:px-12 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
        
        {/* Left: Text Content */}
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs uppercase tracking-widest mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Now Live for Enterprise
          </div>
          
          <h1 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-4">
            The intelligent way to <br className="hidden lg:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600">
              settle claims fast.
            </span>
          </h1>
          
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
            Automate Auto, Property, and Life Insurance claim extraction with AI, while maintaining 100% compliance through our strict human-in-the-loop review system.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <Link to="/login" className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-6 py-3 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-2 transform hover:-translate-y-1">
              Start Demo <ChevronRight size={20} />
            </Link>
            <Link to="/login" className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 px-6 py-3 rounded-2xl font-bold text-lg transition-all shadow-sm flex items-center justify-center gap-2">
              View Dashboard
            </Link>
          </div>
          
          <div className="mt-8 flex items-center justify-center lg:justify-start gap-6 text-sm font-bold text-slate-500">
            <div className="flex items-center gap-1.5"><CheckCircle2 className="text-emerald-500" size={18}/> Zero Setup</div>
            <div className="flex items-center gap-1.5"><CheckCircle2 className="text-emerald-500" size={18}/> Bank-grade Security</div>
          </div>
        </div>

        {/* Right: Feature Image / UI Mockup */}
        <div className="flex-1 w-full relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100 to-purple-50 transform rotate-3 rounded-[3rem]"></div>
          <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border-8 border-white bg-white">
            <img 
              src="/images/hero.jpg" 
              alt="Insurance adjusters reviewing claims" 
              className="w-full h-auto object-cover transform hover:scale-105 transition-transform duration-700"
            />
            {/* Floating UI Element */}
            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-xl border border-white flex items-center gap-3 animate-bounce-slow">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                <Shield size={20} className="fill-emerald-600/20" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">AI Check Successful</p>
                <p className="text-[10px] font-semibold text-slate-500">Claim CLM-8001 Ready for human review</p>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Colorful Features Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-12 border-t border-slate-200/60 bg-white/50 backdrop-blur-3xl rounded-t-[3rem]">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">Designed for modern carriers.</h2>
          <p className="text-base text-slate-600 font-medium">We combine bleeding-edge AI models with strict regulatory compliance frameworks to drastically reduce adjudication time.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-blue-100 transition-all group">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FileText size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Multi-Modal Extraction</h3>
            <p className="text-slate-500 font-medium leading-relaxed mb-6">
              Automatically extract line items from auto repair estimates, property damage reports, and death certificates instantly.
            </p>
            <div className="rounded-xl overflow-hidden h-32 relative">
              <img src="/images/scan.jpg" className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity" alt="Document extraction" />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent"></div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-emerald-100 transition-all group">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Shield size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Human-in-the-Loop</h3>
            <p className="text-slate-500 font-medium leading-relaxed mb-6">
              Our strict state machine enforces manual verification of every AI-extracted data point before settlement approval.
            </p>
            <div className="rounded-xl overflow-hidden h-32 relative">
              <img src="/images/human.jpg" className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity" alt="Human verification" />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/40 to-transparent"></div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-purple-100 transition-all group">
            <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Activity size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Instant Triage</h3>
            <p className="text-slate-500 font-medium leading-relaxed mb-6">
              Claims are instantly scored for fraud risk and routed to the appropriate adjuster queue based on severity.
            </p>
            <div className="rounded-xl overflow-hidden h-32 relative">
              <img src="/images/ai.jpg" className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity" alt="Instant Triage" />
              <div className="absolute inset-0 bg-gradient-to-t from-purple-900/40 to-transparent"></div>
            </div>
          </div>

        </div>
      </section>

      {/* Footer CTA */}
      <footer className="relative z-10 bg-slate-900 py-20 px-6 text-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-indigo-600/30 blur-[100px] rounded-full pointer-events-none"></div>
        <h2 className="relative text-3xl md:text-5xl font-black text-white mb-6">Ready to launch your claim pilot?</h2>
        <p className="relative text-indigo-200 text-lg mb-10 max-w-2xl mx-auto font-medium">Join top enterprise insurance carriers who are accelerating their claims processing today.</p>
        <Link to="/login" className="relative inline-flex items-center gap-2 bg-white hover:bg-indigo-50 text-slate-900 px-8 py-4 rounded-2xl font-bold text-lg transition-transform hover:scale-105 shadow-xl">
          Get Started Now <ArrowRight size={20} />
        </Link>
      </footer>

    </div>
  );
}