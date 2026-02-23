import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AppointmentsPage from './pages/AppointmentsPage';
import BedManagementPage from './pages/BedManagementPage';
import DashboardPage from './pages/DashboardPage';
import DoctorAppointmentsPage from './pages/DoctorAppointmentsPage';
import DoctorsPage from './pages/DoctorsPage';
import LabPage from './pages/LabPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import PatientsPage from './pages/PatientsPage';
import RegisterPage from './pages/RegisterPage';
import { useAuth } from './context/AuthContext';

const HomeRedirect = () => {
  const { user } = useAuth();
  if (user?.role === 'doctor') return <Navigate to="/doctor/appointments" replace />;
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<ProtectedRoute roles={['admin', 'receptionist']}><DashboardPage /></ProtectedRoute>} />
        <Route path="/patients" element={<ProtectedRoute roles={['admin', 'receptionist']}><PatientsPage /></ProtectedRoute>} />
        <Route
          path="/doctors"
          element={<ProtectedRoute roles={['admin']}><DoctorsPage /></ProtectedRoute>}
        />
        <Route path="/appointments" element={<ProtectedRoute roles={['admin', 'receptionist']}><AppointmentsPage /></ProtectedRoute>} />
        <Route path="/doctor/appointments" element={<ProtectedRoute roles={['doctor']}><DoctorAppointmentsPage /></ProtectedRoute>} />
        <Route path="/lab" element={<ProtectedRoute roles={['admin', 'doctor', 'receptionist']}><LabPage /></ProtectedRoute>} />
        <Route path="/beds" element={<ProtectedRoute roles={['admin', 'receptionist']}><BedManagementPage /></ProtectedRoute>} />
      </Route>
      <Route path="/" element={<ProtectedRoute><HomeRedirect /></ProtectedRoute>} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
