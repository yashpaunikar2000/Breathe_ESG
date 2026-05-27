import { useEffect, useState } from "react";

const sourceOptions = [
  { value: "sap", label: "SAP fuel/procurement" },
  { value: "utility", label: "Utility electricity" },
  { value: "travel", label: "Corporate travel" },
];

const apiBase = import.meta.env.VITE_API_BASE_URL || "";

function App() {
  const [clients, setClients] = useState([]);
  const [records, setRecords] = useState([]);
  const [file, setFile] = useState(null);
  const [sourceType, setSourceType] = useState("sap");
  const [clientId, setClientId] = useState("");
  const [ingestionMethod, setIngestionMethod] = useState("csv_upload");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetch(`${apiBase}/api/clients/`)
      .then((res) => res.json())
      .then(setClients)
      .catch(console.error);
    fetchRecords();
  }, []);

  const fetchRecords = () => {
    const query = statusFilter ? `?status=${statusFilter}` : "";
    fetch(`${apiBase}/api/records/${query}`)
      .then((res) => res.json())
      .then(setRecords)
      .catch(console.error);
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!clientId || !file) return;
    const data = new FormData();
    data.append("file", file);
    data.append("source_type", sourceType);
    data.append("ingestion_method", ingestionMethod);
    data.append("client_id", clientId);

    const response = await fetch(`${apiBase}/api/ingest/`, {
      method: "POST",
      body: data,
    });
    if (response.ok) {
      fetchRecords();
    } else {
      console.error("Upload failed", await response.text());
    }
  };

  const reviewRecord = async (id, action) => {
    const response = await fetch(`${apiBase}/api/records/${id}/review/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reviewed_by: "analyst@example.com" }),
    });
    if (response.ok) {
      fetchRecords();
    }
  };

  return (
    <div className="page-shell">
      <header>
        <h1>Breathe ESG Prototype</h1>
        <p>Upload realistic SAP, utility, and travel source files for analyst review.</p>
      </header>

      <section className="panel">
        <h2>Upload source data</h2>
        <form onSubmit={handleUpload} className="upload-form">
          <label>
            Client
            <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">Select client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Source type
            <select value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
              {sourceOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Ingestion method
            <select value={ingestionMethod} onChange={(e) => setIngestionMethod(e.target.value)}>
              <option value="csv_upload">CSV upload</option>
              <option value="api_pull">API pull</option>
              <option value="manual">Manual</option>
            </select>
          </label>
          <label>
            File
            <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} />
          </label>
          <button type="submit">Upload and ingest</button>
        </form>
      </section>

      <section className="panel">
        <h2>Review dashboard</h2>
        <label>
          Status filter
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
        <button onClick={fetchRecords}>Refresh</button>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Client</th>
              <th>Source</th>
              <th>Scope</th>
              <th>Date</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Unit</th>
              <th>Emissions</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>{record.id}</td>
                <td>{record.client}</td>
                <td>{record.source_type}</td>
                <td>{record.scope}</td>
                <td>{record.activity_date || "-"}</td>
                <td>{record.source_category}</td>
                <td>{record.normalized_quantity ?? "-"}</td>
                <td>{record.normalized_unit}</td>
                <td>{record.emission_kg_co2e?.toFixed(2) ?? "-"}</td>
                <td>{record.status}</td>
                <td>
                  {record.status === "pending" && (
                    <>
                      <button onClick={() => reviewRecord(record.id, "approve")}>Approve</button>
                      <button onClick={() => reviewRecord(record.id, "reject")}>Reject</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default App;
