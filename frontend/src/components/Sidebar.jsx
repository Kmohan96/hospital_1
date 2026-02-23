import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const linksByRole = {
  admin: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/patients', label: 'Patient Registration' },
    { to: '/doctors', label: 'Doctor Management' },
    { to: '/appointments', label: 'Appointments' },
    { to: '/lab', label: 'Lab' },
    { to: '/beds', label: 'Bed Management' },
  ],
  receptionist: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/patients', label: 'Patient Registration' },
    { to: '/appointments', label: 'Appointments' },
    { to: '/lab', label: 'Lab' },
    { to: '/beds', label: 'Bed Management' },
  ],
  doctor: [
    { to: '/doctor/appointments', label: 'Appointments' },
    { to: '/lab', label: 'Lab' },
  ],
};

const Sidebar = () => {
  const { user } = useAuth();
  const links = linksByRole[user?.role] || [];

  return (
    <aside className="sidebar">
      <nav>
        {links.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
