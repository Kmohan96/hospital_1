import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import { bedApi, bedTransferApi, wardApi } from '../api/resources';

const BedManagementPage = () => {
  const [wards, setWards] = useState([]);
  const [beds, setBeds] = useState([]);
  const [wardForm, setWardForm] = useState({ name: '', ward_type: '', total_beds: 0 });
  const [bedForm, setBedForm] = useState({ ward: '', bed_number: '', is_icu: false, is_occupied: false, current_patient: '' });
  const [transferForm, setTransferForm] = useState({ patient: '', from_bed: '', to_bed: '', reason: '' });

  const loadData = async () => {
    const [wardRes, bedRes] = await Promise.all([wardApi.list(), bedApi.list()]);
    setWards(wardRes.data.results || wardRes.data);
    setBeds(bedRes.data.results || bedRes.data);
  };

  useEffect(() => {
    Promise.all([wardApi.list(), bedApi.list()]).then(([wardRes, bedRes]) => {
      setWards(wardRes.data.results || wardRes.data);
      setBeds(bedRes.data.results || bedRes.data);
    });
  }, []);

  return (
    <section>
      <h1>Bed & Ward Management</h1>
      <p>Wards configured: {wards.length}</p>
      <form className="card form-grid" onSubmit={async (e) => { e.preventDefault(); await wardApi.create({ ...wardForm, total_beds: Number(wardForm.total_beds) }); setWardForm({ name: '', ward_type: '', total_beds: 0 }); loadData(); }}>
        <h3>Create Ward</h3>
        <input required placeholder="Ward Name" value={wardForm.name} onChange={(e) => setWardForm((prev) => ({ ...prev, name: e.target.value }))} />
        <input required placeholder="Ward Type" value={wardForm.ward_type} onChange={(e) => setWardForm((prev) => ({ ...prev, ward_type: e.target.value }))} />
        <input required type="number" placeholder="Total Beds" value={wardForm.total_beds} onChange={(e) => setWardForm((prev) => ({ ...prev, total_beds: e.target.value }))} />
        <button type="submit">Add Ward</button>
      </form>

      <form className="card form-grid" onSubmit={async (e) => { e.preventDefault(); await bedApi.create({ ...bedForm, ward: Number(bedForm.ward), current_patient: bedForm.current_patient ? Number(bedForm.current_patient) : null }); setBedForm({ ward: '', bed_number: '', is_icu: false, is_occupied: false, current_patient: '' }); loadData(); }}>
        <h3>Add Bed</h3>
        <input required placeholder="Ward ID" value={bedForm.ward} onChange={(e) => setBedForm((prev) => ({ ...prev, ward: e.target.value }))} />
        <input required placeholder="Bed Number" value={bedForm.bed_number} onChange={(e) => setBedForm((prev) => ({ ...prev, bed_number: e.target.value }))} />
        <label>
          <input type="checkbox" checked={bedForm.is_icu} onChange={(e) => setBedForm((prev) => ({ ...prev, is_icu: e.target.checked }))} /> ICU Bed
        </label>
        <label>
          <input type="checkbox" checked={bedForm.is_occupied} onChange={(e) => setBedForm((prev) => ({ ...prev, is_occupied: e.target.checked }))} /> Occupied
        </label>
        <input placeholder="Current Patient ID" value={bedForm.current_patient} onChange={(e) => setBedForm((prev) => ({ ...prev, current_patient: e.target.value }))} />
        <button type="submit">Add Bed</button>
      </form>

      <form className="card form-grid" onSubmit={async (e) => { e.preventDefault(); await bedTransferApi.create({ patient: Number(transferForm.patient), from_bed: transferForm.from_bed ? Number(transferForm.from_bed) : null, to_bed: Number(transferForm.to_bed), reason: transferForm.reason }); setTransferForm({ patient: '', from_bed: '', to_bed: '', reason: '' }); loadData(); }}>
        <h3>Transfer Patient</h3>
        <input required placeholder="Patient ID" value={transferForm.patient} onChange={(e) => setTransferForm((prev) => ({ ...prev, patient: e.target.value }))} />
        <input placeholder="From Bed ID" value={transferForm.from_bed} onChange={(e) => setTransferForm((prev) => ({ ...prev, from_bed: e.target.value }))} />
        <input required placeholder="To Bed ID" value={transferForm.to_bed} onChange={(e) => setTransferForm((prev) => ({ ...prev, to_bed: e.target.value }))} />
        <textarea placeholder="Reason" value={transferForm.reason} onChange={(e) => setTransferForm((prev) => ({ ...prev, reason: e.target.value }))} />
        <button type="submit">Transfer</button>
      </form>

      <DataTable
        columns={[
          { key: 'id', label: 'Bed ID' },
          { key: 'ward', label: 'Ward ID' },
          { key: 'bed_number', label: 'Bed Number' },
          { key: 'is_icu', label: 'ICU', render: (row) => (row.is_icu ? 'Yes' : 'No') },
          { key: 'is_occupied', label: 'Occupied', render: (row) => (row.is_occupied ? 'Yes' : 'No') },
        ]}
        rows={beds}
        actions={(row) => (
          <button className="danger" type="button" onClick={async () => { await bedApi.remove(row.id); loadData(); }}>Delete</button>
        )}
      />
    </section>
  );
};

export default BedManagementPage;
