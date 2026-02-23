import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import { doctorApi } from '../api/resources';

const initialForm = {
  user_id: '',
  specialization: '',
  qualification: '',
  phone: '',
  bio: '',
  is_active: true,
};

const DoctorsPage = () => {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const fetchRows = async () => {
    const { data } = await doctorApi.list();
    setRows(data.results || data);
  };

  useEffect(() => {
    doctorApi.list().then(({ data }) => setRows(data.results || data));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = { ...form, user_id: Number(form.user_id) };
    if (editingId) {
      await doctorApi.update(editingId, payload);
    } else {
      await doctorApi.create(payload);
    }
    setForm(initialForm);
    setEditingId(null);
    fetchRows();
  };

  return (
    <section>
      <h1>Doctor Management</h1>
      <form className="card form-grid" onSubmit={handleSubmit}>
        <input required placeholder="Doctor User ID" value={form.user_id} onChange={(e) => setForm((prev) => ({ ...prev, user_id: e.target.value }))} />
        <input required placeholder="Specialization" value={form.specialization} onChange={(e) => setForm((prev) => ({ ...prev, specialization: e.target.value }))} />
        <input placeholder="Qualification" value={form.qualification} onChange={(e) => setForm((prev) => ({ ...prev, qualification: e.target.value }))} />
        <input required placeholder="Phone" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
        <textarea placeholder="Bio" value={form.bio} onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))} />
        <button type="submit">{editingId ? 'Update Doctor' : 'Add Doctor'}</button>
      </form>
      <DataTable
        columns={[
          { key: 'id', label: 'ID' },
          { key: 'user', label: 'Doctor', render: (row) => row.user?.username || '-' },
          { key: 'specialization', label: 'Specialization' },
          { key: 'phone', label: 'Phone' },
          { key: 'is_active', label: 'Status', render: (row) => (row.is_active ? 'Active' : 'Inactive') },
        ]}
        rows={rows}
        actions={(row) => (
          <div className="inline-actions">
            <button type="button" onClick={() => { setEditingId(row.id); setForm({ ...initialForm, ...row, user_id: row.user?.id || '' }); }}>Edit</button>
            <button className="danger" type="button" onClick={async () => { await doctorApi.remove(row.id); fetchRows(); }}>Delete</button>
          </div>
        )}
      />
    </section>
  );
};

export default DoctorsPage;
