const fs = require('fs');
const path = require('path');

const backendDir = 'd:/sih/backend';
const frontendDir = 'd:/sih/frontend';

// ---------------------------------------------------------
// 1. BACKEND SCHEMA & SEED LOGIC
// ---------------------------------------------------------
const userCode = `const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  mobileNo: { type: String, unique: true, sparse: true },
  password: { type: String }, // Optional for claimants using OTP
  otp: { type: String },
  role: { 
    type: String, 
    enum: ['Claimant', 'Agent', 'Human_Verifier', 'Administrator'], 
    required: true 
  },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function() {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);`;
fs.writeFileSync(path.join(backendDir, 'src/models/User.js'), userCode);

const authControllerCode = `const User = require('../models/User');
const Tenant = require('../models/Tenant');
const jwt = require('jsonwebtoken');

const generateToken = (id, role, tenantId) => {
  return jwt.sign({ id, role, tenantId }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
};

exports.requestOtp = async (req, res) => {
  try {
    const { name, mobileNo } = req.body;
    let tenant = await Tenant.findOne(); 
    if(!tenant) tenant = await Tenant.create({ name: 'Acme Insurance', subscriptionTier: 'ENTERPRISE' });
    
    let user = await User.findOne({ mobileNo });
    if (!user) {
      user = await User.create({ name, mobileNo, role: 'Claimant', tenantId: tenant._id });
    }
    
    user.otp = '123456'; // Mock OTP for demo purposes
    await user.save();
    
    console.log(\`[Twilio Mock] Sent OTP 123456 to \${mobileNo}\`);
    res.json({ success: true, message: 'OTP sent to mobile.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { mobileNo, otp } = req.body;
    const user = await User.findOne({ mobileNo });
    
    if (!user || user.otp !== otp) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }
    
    user.otp = null;
    await user.save();
    
    res.json({ token: generateToken(user._id, user.role, user.tenantId), role: user.role });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (user && (await user.matchPassword(password))) {
      res.json({ token: generateToken(user._id, user.role, user.tenantId), role: user.role });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
};
`;
fs.writeFileSync(path.join(backendDir, 'src/controllers/authController.js'), authControllerCode);

const authRoutesCode = `const express = require('express');
const { login, requestOtp, verifyOtp } = require('../controllers/authController');
const router = express.Router();

router.post('/login', login);
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);

module.exports = router;`;
fs.writeFileSync(path.join(backendDir, 'src/routes/authRoutes.js'), authRoutesCode);

// Seed script to initialize Admin and Verifier
const seedCode = `const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Tenant = require('./models/Tenant');
const User = require('./models/User');

const seed = async () => {
  await connectDB();
  
  const tenantCount = await Tenant.countDocuments();
  if (tenantCount === 0) {
    const tenant = await Tenant.create({ name: 'Acme Insurance', subscriptionTier: 'ENTERPRISE' });
    await User.create({ name: 'System Admin', email: 'admin@acme.com', password: 'password123', role: 'Administrator', tenantId: tenant._id });
    await User.create({ name: 'Jane Verifier', email: 'verifier@acme.com', password: 'password123', role: 'Human_Verifier', tenantId: tenant._id });
    console.log('Seeded Admin (admin@acme.com) and Verifier (verifier@acme.com) with password123');
  } else {
    console.log('Database already seeded with employee users.');
  }
  process.exit(0);
};
seed();`;
fs.writeFileSync(path.join(backendDir, 'src/seed.js'), seedCode);

// ---------------------------------------------------------
// 2. FRONTEND: REAL AUTHENTICATION UI
// ---------------------------------------------------------
const loginReactCode = `import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hexagon, ArrowRight, ShieldCheck, Zap, Lock, Mail, Smartphone, User } from 'lucide-react';
import api from '../api';

export default function Login() {
  const [tab, setTab] = useState('applicant'); // 'applicant' or 'employee'
  const [step, setStep] = useState(1); // 1 = Details, 2 = OTP
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Applicant State
  const [name, setName] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [otp, setOtp] = useState('');

  // Employee State
  const [email, setEmail] = useState('admin@acme.com');
  const [password, setPassword] = useState('password123');

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/request-otp', { name, mobileNo });
      setStep(2); // Move to OTP input
    } catch (err) {
      alert('Failed to send OTP: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { mobileNo, otp });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      navigate('/applicant-dashboard');
    } catch (err) {
      alert('Invalid OTP: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      
      if (res.data.role === 'Administrator') navigate('/dashboard');
      else navigate('/queue');
    } catch (err) {
      alert('Login failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-slate-50">
      {/* Left Column - Branding */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-500 blur-3xl"></div>
          <div className="absolute top-1/2 right-12 w-64 h-64 rounded-full bg-indigo-500 blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 text-white mb-12">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">
              <Hexagon className="text-blue-400" size={24} />
            </div>
            <span className="text-2xl font-bold tracking-wide">ClaimPilot AI</span>
          </div>
          
          <h1 className="text-5xl font-bold text-white leading-[1.15] mb-6">
            The intelligent way to process claims.
          </h1>
        </div>

        <div className="relative z-10 flex gap-8">
          <div className="flex flex-col gap-2">
            <ShieldCheck className="text-blue-400" size={28} />
            <h3 className="text-white font-semibold">Bank-grade Security</h3>
            <p className="text-sm text-blue-200/60">AES-256 encryption.</p>
          </div>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <div className="w-full max-w-md glass-card p-10">
          
          {/* Tabs */}
          <div className="flex bg-slate-100 rounded-lg p-1 mb-8">
            <button 
              onClick={() => { setTab('applicant'); setStep(1); }} 
              className={\`flex-1 py-2 text-sm font-semibold rounded-md transition-all \${tab === 'applicant' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}\`}
            >
              Applicant Login
            </button>
            <button 
              onClick={() => setTab('employee')} 
              className={\`flex-1 py-2 text-sm font-semibold rounded-md transition-all \${tab === 'employee' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}\`}
            >
              Employee Login
            </button>
          </div>

          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              {tab === 'applicant' ? 'Track your claim' : 'Employee Portal'}
            </h2>
            <p className="text-slate-500">
              {tab === 'applicant' ? 'Sign in securely with your mobile number.' : 'Sign in using your corporate credentials.'}
            </p>
          </div>

          {/* APPLICANT FLOW */}
          {tab === 'applicant' && step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Mobile Number</label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input type="tel" required value={mobileNo} onChange={e => setMobileNo(e.target.value)} placeholder="+1 (555) 000-0000" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
                {loading ? 'Sending...' : 'Send Verification OTP'}
              </button>
            </form>
          )}

          {tab === 'applicant' && step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl mb-4">
                <p className="text-sm text-indigo-800">For this demo, the OTP has been hardcoded to: <strong className="text-xl">123456</strong></p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Enter 6-Digit OTP</label>
                <input type="text" maxLength={6} required value={otp} onChange={e => setOtp(e.target.value)} placeholder="• • • • • •" className="w-full text-center tracking-[1em] font-bold text-xl py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>
              <button type="button" onClick={() => setStep(1)} className="w-full text-sm text-slate-500 hover:text-indigo-600 font-medium">Change Mobile Number</button>
            </form>
          )}

          {/* EMPLOYEE FLOW */}
          {tab === 'employee' && (
            <form onSubmit={handleEmployeeLogin} className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-300">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Corporate Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <div className="flex gap-2 mb-4">
                <button type="button" onClick={() => {setEmail('admin@acme.com'); setPassword('password123');}} className="text-xs bg-slate-200 px-2 py-1 rounded text-slate-600 hover:bg-slate-300">Use Admin</button>
                <button type="button" onClick={() => {setEmail('verifier@acme.com'); setPassword('password123');}} className="text-xs bg-slate-200 px-2 py-1 rounded text-slate-600 hover:bg-slate-300">Use Verifier</button>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
                {loading ? 'Authenticating...' : 'Sign In as Employee'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}`;
fs.writeFileSync(path.join(frontendDir, 'src/pages/Login.jsx'), loginReactCode);

console.log('Real authentication logic and OTP flow generated.');
