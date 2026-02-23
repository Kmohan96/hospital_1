const SummaryCard = ({ label, value }) => (
  <div className="card summary-card">
    <p>{label}</p>
    <h3>{value ?? 0}</h3>
  </div>
);

export default SummaryCard;
