const fs = require('fs');
const path = require('path');

const backendDir = 'd:/sih/backend';

// Update Auth Controller to generate random OTP
const authControllerPath = path.join(backendDir, 'src/controllers/authController.js');
let authControllerCode = fs.readFileSync(authControllerPath, 'utf8');

authControllerCode = authControllerCode.replace(
  "user.otp = '123456'; // Mock OTP for demo purposes",
  "const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();\n    user.otp = randomOtp;"
);

authControllerCode = authControllerCode.replace(
  "console.log(`[Twilio Mock] Sent OTP 123456 to ${mobileNo}`);",
  "console.log(`[Twilio Mock] Sent OTP ${randomOtp} to ${mobileNo}`);"
);

// We need to return the OTP in the JSON response so the frontend demo can display it
authControllerCode = authControllerCode.replace(
  "res.json({ success: true, message: 'OTP sent to mobile.' });",
  "res.json({ success: true, message: 'OTP sent to mobile.', demoOtp: randomOtp });"
);

fs.writeFileSync(authControllerPath, authControllerCode);

// Update Frontend Login.jsx to show the dynamic OTP
const frontendDir = 'd:/sih/frontend';
const loginPath = path.join(frontendDir, 'src/pages/Login.jsx');
let loginCode = fs.readFileSync(loginPath, 'utf8');

// We need to add state for the demoOtp
if (!loginCode.includes('const [demoOtp, setDemoOtp]')) {
  loginCode = loginCode.replace(
    'const [otp, setOtp] = useState(\'\');',
    'const [otp, setOtp] = useState(\'\');\n  const [demoOtp, setDemoOtp] = useState(null);'
  );
}

loginCode = loginCode.replace(
  "await api.post('/auth/request-otp', { name, mobileNo });",
  "const res = await api.post('/auth/request-otp', { name, mobileNo });\n      setDemoOtp(res.data.demoOtp);"
);

loginCode = loginCode.replace(
  "<p className=\"text-sm text-indigo-800\">For this demo, the OTP has been hardcoded to: <strong className=\"text-xl\">123456</strong></p>",
  "<p className=\"text-sm text-indigo-800\">For this demo, your dynamic OTP is: <strong className=\"text-xl\">{demoOtp}</strong></p>"
);

fs.writeFileSync(loginPath, loginCode);

console.log("OTP logic updated to use random 6-digit numbers.");
