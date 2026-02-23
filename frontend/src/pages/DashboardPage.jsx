import { useEffect, useState } from 'react';
import { dashboardApi } from '../api/resources';
import SummaryCard from '../components/SummaryCard';

const DashboardPage = () => {
  const [stats, setStats] = useState({
    total_patients: 0,
    total_doctors: 0,
    total_appointments: 0,
    beds_available: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await dashboardApi.stats();
      setStats(data);
    };
    fetchStats();
  }, []);

  return (
    <section>
      <h1>Dashboard</h1>
      <div className="summary-grid">
        <SummaryCard label="Total Patients" value={stats.total_patients} />
        <SummaryCard label="Total Doctors" value={stats.total_doctors} />
        <SummaryCard label="Total Appointments" value={stats.total_appointments} />
        <SummaryCard label="Beds Available" value={stats.beds_available} />
      </div>
    </section>
  );
};

export default DashboardPage;
