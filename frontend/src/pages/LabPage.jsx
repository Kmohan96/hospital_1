import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import { labApi } from '../api/resources';

const initialForm = {
  patient: '',
  doctor: '',
  test_name: '',
  booked_at: '',
  result_summary: '',
  status: 'booked',
  report_file: null,
};

const LabPage = () => {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(initialForm);

  const fetchRows = async () => {
    const { data } = await labApi.list();
    setRows(data.results || data);
  };

  useEffect(() => {
    labApi.list().then(({ data }) => setRows(data.results || data));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = new FormData();
    payload.append('patient', Number(form.patient));
    if (form.doctor) payload.append('doctor', Number(form.doctor));
    payload.append('test_name', form.test_name);
    payload.append('booked_at', form.booked_at);
    payload.append('result_summary', form.result_summary);
    payload.append('status', form.status);
    if (form.report_file) payload.append('report_file', form.report_file);

    await labApi.create(payload, true);
    setForm(initialForm);
    fetchRows();
  };

  return (
    <section>
      <h1>Laboratory Management</h1>
      <form className="card form-grid" onSubmit={handleSubmit}>
        <input required placeholder="Patient ID" value={form.patient} onChange={(e) => setForm((prev) => ({ ...prev, patient: e.target.value }))} />
        <input placeholder="Doctor ID" value={form.doctor} onChange={(e) => setForm((prev) => ({ ...prev, doctor: e.target.value }))} />
        <input required placeholder="Test Name" value={form.test_name} onChange={(e) => setForm((prev) => ({ ...prev, test_name: e.target.value }))} />
        <input required type="datetime-local" value={form.booked_at} onChange={(e) => setForm((prev) => ({ ...prev, booked_at: e.target.value }))} />
        <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}>
          <option value="booked">Booked</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <input type="file" accept=".pdf,.jpg,.png" onChange={(e) => setForm((prev) => ({ ...prev, report_file: e.target.files?.[0] || null }))} />
        <textarea placeholder="Result Summary" value={form.result_summary} onChange={(e) => setForm((prev) => ({ ...prev, result_summary: e.target.value }))} />
        <button type="submit">Book Lab Test</button>
      </form>
      <DataTable
        columns={[
          { key: 'id', label: 'ID' },
          { key: 'patient', label: 'Patient ID' },
          { key: 'test_name', label: 'Test Name' },
          { key: 'status', label: 'Status' },
          { key: 'report_file', label: 'Report', render: (row) => (row.report_file ? <a href={row.report_file} target="_blank" rel="noreferrer">Download</a> : 'N/A') },
        ]}
        rows={rows}
        actions={(row) => (
          <button className="danger" type="button" onClick={async () => { await labApi.remove(row.id); fetchRows(); }}>Delete</button>
        )}
      />
    </section>
  );
};

export default LabPage;
