import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Queue from './pages/Queue';
import Cockpit from './pages/Cockpit';
import NewClaim from './pages/NewClaim';
import ApplicantDashboard from './pages/ApplicantDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/queue" element={<Queue />} />
        <Route path="/cockpit/:id" element={<Cockpit />} />
        <Route path="/new-claim" element={<NewClaim />} />
        <Route path="/applicant-dashboard" element={<ApplicantDashboard />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;