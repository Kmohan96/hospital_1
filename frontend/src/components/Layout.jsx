import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = () => (
  <div className="app-shell">
    <Sidebar />
    <div className="content-shell">
      <Navbar />
      <main className="content-area">
        <Outlet />
      </main>
    </div>
  </div>
);

export default Layout;
