import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const displayName = user?.first_name || user?.username || '';
  const identity = user?.role === 'doctor' ? `Dr. ${displayName}` : displayName;

  return (
    <header className="navbar">
      <div>
        <h2>Hospital Management System</h2>
        <p>{user ? `Signed in as ${identity} (${user.role})` : ''}</p>
      </div>
      <button className="danger" onClick={logout} type="button">
        Logout
      </button>
    </header>
  );
};

export default Navbar;
