const User = require('../models/User');
const Tenant = require('../models/Tenant');
const jwt = require('jsonwebtoken');

const generateToken = (id, role, tenantId) => {
  const expiresIn = (role === 'Claimant') ? '24h' : '8h';
  return jwt.sign(
    { id, userId: id, claimantId: id, role, tenantId },
    process.env.JWT_SECRET || 'secret',
    { expiresIn }
  );
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
    
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = randomOtp;
    await user.save();
    
    console.log(`[Twilio Mock] Sent OTP ${randomOtp} to ${mobileNo}`);
    res.json({ success: true, message: 'OTP sent to mobile.', demoOtp: randomOtp });
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
