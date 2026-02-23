import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import { appointmentApi } from '../api/resources';

const DoctorAppointmentsPage = () => {
  const [rows, setRows] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loadingPatient, setLoadingPatient] = useState(false);

  const fetchRows = async () => {
    const { data } = await appointmentApi.list();
    setRows(data.results || data);
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const updateStatus = async (appointmentId, nextStatus) => {
    if (nextStatus === 'approved') {
      await appointmentApi.approve(appointmentId);
    } else if (nextStatus === 'completed') {
      await appointmentApi.complete(appointmentId);
    } else if (nextStatus === 'cancelled') {
      await appointmentApi.cancel(appointmentId);
    }
    await fetchRows();
  };

  const viewPatient = async (appointmentId) => {
    setLoadingPatient(true);
    try {
      const { data } = await appointmentApi.patientDetail(appointmentId);
      setSelectedPatient(data);
    } finally {
      setLoadingPatient(false);
    }
  };

  return (
    <section>
      <h1>My Appointments</h1>
      <DataTable
        columns={[
          { key: 'id', label: 'ID' },
          { key: 'patient', label: 'Patient' },
          { key: 'appointment_date', label: 'Date' },
          { key: 'token_number', label: 'Token' },
          { key: 'status', label: 'Status' },
        ]}
        rows={rows}
        actions={(row) => (
          <div className="inline-actions">
            <button type="button" onClick={() => updateStatus(row.id, 'approved')}>Approve</button>
            <button type="button" onClick={() => updateStatus(row.id, 'completed')}>Complete</button>
            <button type="button" onClick={() => updateStatus(row.id, 'cancelled')}>Cancel</button>
            <button type="button" onClick={() => viewPatient(row.id)}>View Patient</button>
          </div>
        )}
      />

      {loadingPatient ? <p>Loading patient details...</p> : null}
      {selectedPatient ? (
        <div className="card">
          <h3>Patient Details</h3>
          <p><strong>ID:</strong> {selectedPatient.id}</p>
          <p><strong>Name:</strong> {selectedPatient.first_name} {selectedPatient.last_name}</p>
          <p><strong>Phone:</strong> {selectedPatient.phone}</p>
          <p><strong>Medical History:</strong> {selectedPatient.medical_history || 'N/A'}</p>
          <p><strong>Discharge Summary:</strong> {selectedPatient.discharge_summary || 'N/A'}</p>
        </div>
      ) : null}
    </section>
  );
};

export default DoctorAppointmentsPage;
