import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import { patientApi } from '../api/resources';

const initialForm = {
  first_name: '',
  last_name: '',
  dob: '',
  gender: 'Male',
  phone: '',
  email: '',
  address: '',
  blood_group: '',
  emergency_contact: '',
  medical_history: '',
  discharge_summary: '',
};

const PatientsPage = () => {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const fetchRows = async () => {
    const { data } = await patientApi.list();
    setRows(data.results || data);
  };

  useEffect(() => {
    patientApi.list().then(({ data }) => setRows(data.results || data));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (editingId) {
      await patientApi.update(editingId, form);
    } else {
      await patientApi.create(form);
    }
    setForm(initialForm);
    setEditingId(null);
    fetchRows();
  };

  return (
    <section>
      <h1>Patient Management</h1>
      <form className="card form-grid" onSubmit={handleSubmit}>
        <input required placeholder="First Name" value={form.first_name} onChange={(e) => setForm((prev) => ({ ...prev, first_name: e.target.value }))} />
        <input required placeholder="Last Name" value={form.last_name} onChange={(e) => setForm((prev) => ({ ...prev, last_name: e.target.value }))} />
        <input required type="date" value={form.dob} onChange={(e) => setForm((prev) => ({ ...prev, dob: e.target.value }))} />
        <select value={form.gender} onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}>
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
        </select>
        <input required placeholder="Phone" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
        <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
        <input placeholder="Blood Group" value={form.blood_group} onChange={(e) => setForm((prev) => ({ ...prev, blood_group: e.target.value }))} />
        <input placeholder="Emergency Contact" value={form.emergency_contact} onChange={(e) => setForm((prev) => ({ ...prev, emergency_contact: e.target.value }))} />
        <textarea placeholder="Address" value={form.address} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} />
        <textarea placeholder="Medical History" value={form.medical_history} onChange={(e) => setForm((prev) => ({ ...prev, medical_history: e.target.value }))} />
        <textarea placeholder="Discharge Summary" value={form.discharge_summary} onChange={(e) => setForm((prev) => ({ ...prev, discharge_summary: e.target.value }))} />
        <button type="submit">{editingId ? 'Update Patient' : 'Add Patient'}</button>
      </form>
      <DataTable
        columns={[
          { key: 'id', label: 'ID' },
          { key: 'first_name', label: 'First Name' },
          { key: 'last_name', label: 'Last Name' },
          { key: 'phone', label: 'Phone' },
          { key: 'medical_history', label: 'Medical History' },
        ]}
        rows={rows}
        actions={(row) => (
          <div className="inline-actions">
            <button type="button" onClick={() => { setEditingId(row.id); setForm({ ...initialForm, ...row, dob: (row.dob || '').slice(0, 10) }); }}>Edit</button>
            <button className="danger" type="button" onClick={async () => { await patientApi.remove(row.id); fetchRows(); }}>Delete</button>
          </div>
        )}
      />
    </section>
  );
};

export default PatientsPage;
