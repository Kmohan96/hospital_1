import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import { appointmentApi } from '../api/resources';

const initialForm = {
  patient: '',
  doctor: '',
  appointment_date: '',
  reason: '',
};

const AppointmentsPage = () => {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchRows = async () => {
    const { data } = await appointmentApi.list();
    setRows(data.results || data);
  };

  useEffect(() => {
    appointmentApi.list().then(({ data }) => setRows(data.results || data));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    try {
      await appointmentApi.create({
        patient_id: Number(form.patient),
        doctor_user_id: Number(form.doctor),
        appointment_date: new Date(form.appointment_date).toISOString(),
        reason: form.reason,
      });
      setSuccess('Appointment created successfully.');
      setForm(initialForm);
      fetchRows();
    } catch (err) {
      const detail = err?.response?.data;
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail || { detail: 'Unable to create appointment' }));
    }
  };

  return (
    <section>
      <h1>Appointment Management</h1>
      <form className="card form-grid" onSubmit={handleSubmit}>
        <input required placeholder="Patient ID" value={form.patient} onChange={(e) => setForm((prev) => ({ ...prev, patient: e.target.value }))} />
        <input required placeholder="Doctor User ID" value={form.doctor} onChange={(e) => setForm((prev) => ({ ...prev, doctor: e.target.value }))} />
        <input required type="datetime-local" value={form.appointment_date} onChange={(e) => setForm((prev) => ({ ...prev, appointment_date: e.target.value }))} />
        <textarea placeholder="Reason" value={form.reason} onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))} />
        <button type="submit">Book Appointment</button>
      </form>
      {error ? <p className="error-text">{error}</p> : null}
      {success ? <p>{success}</p> : null}
      <DataTable
        columns={[
          { key: 'id', label: 'ID' },
          { key: 'patient', label: 'Patient ID' },
          { key: 'doctor', label: 'Doctor ID' },
          { key: 'appointment_date', label: 'Date & Time' },
          { key: 'token_number', label: 'Token' },
          { key: 'status', label: 'Status' },
        ]}
        rows={rows}
        actions={(row) => (
          <div className="inline-actions">
            <button type="button" onClick={async () => { await appointmentApi.approve(row.id); fetchRows(); }}>Approve</button>
            <button type="button" onClick={async () => { await appointmentApi.reject(row.id); fetchRows(); }}>Reject</button>
            <button type="button" onClick={async () => { await appointmentApi.cancel(row.id); fetchRows(); }}>Cancel</button>
            <button className="danger" type="button" onClick={async () => { await appointmentApi.remove(row.id); fetchRows(); }}>Delete</button>
          </div>
        )}
      />
    </section>
  );
};

export default AppointmentsPage;
