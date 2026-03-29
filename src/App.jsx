import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import HackathonDetail from './pages/HackathonDetail';
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import UserDashboard from './pages/UserDashboard';
import OrganizerDashboard from './pages/OrganizerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import LoginUser from './pages/LoginUser';
import LoginOrganizer from './pages/LoginOrganizer';
import LoginAdmin from './pages/LoginAdmin';
import SignupUser from './pages/SignupUser';
import SignupOrganizer from './pages/SignupOrganizer';
import SignupAdmin from './pages/SignupAdmin';
import ForgotPassword from './pages/ForgotPassword';
import ChatBot from "./components/ChatBot";
import { createPortal } from 'react-dom';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/dashboard/user" element={<UserDashboard />} />
        <Route path="/dashboard/organizer" element={<OrganizerDashboard />} />

        <Route path="/login-user" element={<LoginUser />} />
        <Route path="/login-organizer" element={<LoginOrganizer />} />
        <Route path="/login-admin" element={<LoginAdmin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/signup-user" element={<SignupUser />} />
        <Route path="/signup-organizer" element={<SignupOrganizer />} />
        <Route path="/signup-admin" element={<SignupAdmin />} />

        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/hackathon/:id" element={<HackathonDetail />} />
          <Route path="/Organiser" element={<Navigate to="/dashboard/organizer" replace />} />
          <Route path="/Admin" element={<Navigate to="/admin" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>
      </Routes>
   {createPortal(<ChatBot />, document.body)}
    </Router>
  );
}

export default App;