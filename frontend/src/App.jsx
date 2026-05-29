import { useEffect, useState } from "react";

const sourceOptions = [
  { value: "sap", label: "SAP Fuel / Procurement (Scope 1)" },
  { value: "utility", label: "Utility Electricity Portal (Scope 2)" },
  { value: "travel", label: "Corporate Travel Concur (Scope 3)" },
];

function App() {
  const [clients, setClients] = useState([]);
  const [records, setRecords] = useState([]);
  const [file, setFile] = useState(null);
  const [sourceType, setSourceType] = useState("sap");
  const [clientId, setClientId] = useState("");
  const [ingestionMethod, setIngestionMethod] = useState("csv_upload");
  
  // Dashboard states
  const [statusFilter, setStatusFilter] = useState("");
  const [scopeFilter, setScopeFilter] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null); // { success: boolean, msg: string }

  useEffect(() => {
    fetch("/api/clients/")
      .then((res) => res.json())
      .then((data) => {
        setClients(data);
        if (data.length > 0) {
          setClientId(data[0].id.toString());
        }
      })
      .catch(console.error);
    fetchRecords();
  }, []);

  const fetchRecords = () => {
    fetch("/api/records/")
      .then((res) => res.json())
      .then(setRecords)
      .catch(console.error);
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!clientId || !file) {
      setUploadStatus({ success: false, msg: "Please select a client and choose a CSV file." });
      return;
    }
    const data = new FormData();
    data.append("file", file);
    data.append("source_type", sourceType);
    data.append("ingestion_method", ingestionMethod);
    data.append("client_id", clientId);

    setUploadStatus({ success: true, msg: "Processing ingestion..." });

    const response = await fetch("/api/ingest/", {
      method: "POST",
      body: data,
    });
    if (response.ok) {
      setUploadStatus({ success: true, msg: `Successfully ingested "${file.name}"!` });
      setFile(null);
      // Reset file input element visually
      event.target.reset();
      fetchRecords();
    } else {
      const errText = await response.text();
      setUploadStatus({ success: false, msg: `Ingestion failed: ${errText}` });
    }
  };

  const reviewRecord = async (id, action) => {
    const response = await fetch(`/api/records/${id}/review/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reviewed_by: "sustainability_analyst@breatheesg.com" }),
    });
    if (response.ok) {
      const updated = await response.json();
      // Update record in list and drawer
      setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
      if (selectedRecord && selectedRecord.id === id) {
        setSelectedRecord((prev) => ({ ...prev, ...updated }));
      }
    }
  };

  // Map clients for easy display
  const clientMap = clients.reduce((acc, c) => ({ ...acc, [c.id]: c.name }), {});

  // Compute stats on valid records (exclude rejected rows from green inventory total)
  const activeRecords = records.filter(r => r.status !== "rejected");
  const scope1Total = activeRecords.filter(r => r.scope === "scope_1").reduce((sum, r) => sum + (r.emission_kg_co2e || 0), 0);
  const scope2Total = activeRecords.filter(r => r.scope === "scope_2").reduce((sum, r) => sum + (r.emission_kg_co2e || 0), 0);
  const scope3Total = activeRecords.filter(r => r.scope === "scope_3").reduce((sum, r) => sum + (r.emission_kg_co2e || 0), 0);
  const emissionsSum = scope1Total + scope2Total + scope3Total;

  // Filter records based on visual selection
  const filteredRecords = records.filter((r) => {
    const statusMatch = !statusFilter || r.status === statusFilter;
    const scopeMatch = !scopeFilter || r.scope === scopeFilter;
    return statusMatch && scopeMatch;
  });

  return (
    <div className="page-shell">
      {/* Dynamic Header */}
      <header>
        <div className="brand">
          <div className="brand-icon">B</div>
          <div className="brand-info">
            <h1>Breathe ESG</h1>
            <p>Enterprise Carbon Accounting Ingestion Engine</p>
          </div>
        </div>

        <div className="client-selector-header">
          <label htmlFor="client-select">Active Client Context:</label>
          <select 
            id="client-select" 
            value={clientId} 
            onChange={(e) => setClientId(e.target.value)}
          >
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} ({client.code})
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Carbon Metrics Summary Bar */}
      <section className="metrics-grid">
        <div className="metric-card scope-1">
          <div className="metric-label">Scope 1 (Direct Fuel)</div>
          <div className="metric-value">{scope1Total.toLocaleString(undefined, { maximumFractionDigits: 1 })}</div>
          <div className="metric-unit">kg CO₂e</div>
        </div>
        <div className="metric-card scope-2">
          <div className="metric-label">Scope 2 (Electricity)</div>
          <div className="metric-value">{scope2Total.toLocaleString(undefined, { maximumFractionDigits: 1 })}</div>
          <div className="metric-unit">kg CO₂e</div>
        </div>
        <div className="metric-card scope-3">
          <div className="metric-label">Scope 3 (Travel & Lodging)</div>
          <div className="metric-value">{scope3Total.toLocaleString(undefined, { maximumFractionDigits: 1 })}</div>
          <div className="metric-unit">kg CO₂e</div>
        </div>
        <div className="metric-card total">
          <div className="metric-label">Total Inventory (Net)</div>
          <div className="metric-value">{emissionsSum.toLocaleString(undefined, { maximumFractionDigits: 1 })}</div>
          <div className="metric-unit">kg CO₂e</div>
        </div>
      </section>

      {/* Ingestion & Work Area */}
      <div className="drawer-container">
        
        {/* Main Content Pane */}
        <div className="main-content">
          
          {/* Upload Panel */}
          <section className="panel">
            <h2>
              <span style={{ color: "var(--primary)" }}>✦</span> Ingest New Source File
            </h2>
            
            <form onSubmit={handleUpload} className="upload-form">
              <div className="form-group">
                <label>Data Integration Source</label>
                <select value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
                  {sourceOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Ingestion Pipeline</label>
                <select value={ingestionMethod} onChange={(e) => setIngestionMethod(e.target.value)}>
                  <option value="csv_upload">Secure CSV Upload</option>
                  <option value="api_pull">Automated API Fetch</option>
                  <option value="manual">Manual Analyst Key</option>
                </select>
              </div>

              <div className="form-group">
                <label>Target File</label>
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={(e) => {
                    setFile(e.target.files[0]);
                    setUploadStatus(null);
                  }} 
                />
              </div>

              <button type="submit" className="btn-primary">
                Ingest & Normalize
              </button>
            </form>

            {uploadStatus && (
              <div style={{
                marginTop: "16px",
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: 600,
                backgroundColor: uploadStatus.success ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                color: uploadStatus.success ? "var(--success)" : "var(--danger)",
                border: `1px solid ${uploadStatus.success ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}`
              }}>
                {uploadStatus.msg}
              </div>
            )}
          </section>

          {/* Audit & Review Dashboard */}
          <section className="panel">
            <div className="filter-bar">
              <h2>
                <span style={{ color: "var(--primary)" }}>✦</span> Analyst Review Console
              </h2>

              <div className="filters">
                <div className="filter-group">
                  <label>Status:</label>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">All Statuses</option>
                    <option value="pending">Pending Review</option>
                    <option value="approved">Approved & Locked</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Reporting Scope:</label>
                  <select value={scopeFilter} onChange={(e) => setScopeFilter(e.target.value)}>
                    <option value="">All Scopes</option>
                    <option value="scope_1">Scope 1 Direct</option>
                    <option value="scope_2">Scope 2 Indirect</option>
                    <option value="scope_3">Scope 3 Value Chain</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Record ID</th>
                    <th>Client</th>
                    <th>Source Type</th>
                    <th>Scope</th>
                    <th>Activity Date</th>
                    <th>Source Category</th>
                    <th>Normalized Qty</th>
                    <th>Footprint</th>
                    <th>Status</th>
                    <th>Review Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan="10" style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px" }}>
                        No records found matching active filter. Upload a CSV to populate.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record) => {
                      const isSelected = selectedRecord && selectedRecord.id === record.id;
                      const hasErrors = record.validation_errors && record.validation_errors.length > 0;
                      const isSuspicious = record.is_suspicious;
                      
                      return (
                        <tr 
                          key={record.id} 
                          className={`table-row ${isSelected ? "active-row" : ""}`}
                          onClick={() => setSelectedRecord(record)}
                        >
                          <td>#{record.id}</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{clientMap[record.client] || `ID: ${record.client}`}</div>
                          </td>
                          <td>
                            <span style={{ textTransform: "uppercase", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                              {record.source_type}
                            </span>
                          </td>
                          <td>
                            <span className={`scope-tag ${record.scope}`}>
                              {record.scope.replace("_", " ")}
                            </span>
                          </td>
                          <td>{record.activity_date || "-"}</td>
                          <td>
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              <span>{record.source_category}</span>
                              {hasErrors && (
                                <div className="error-pill">⚠ Failed Parsing</div>
                              )}
                              {!hasErrors && isSuspicious && (
                                <div className="warning-pill">⚠ Suspicious Row</div>
                              )}
                            </div>
                          </td>
                          <td>
                            {record.normalized_quantity !== null ? (
                              <span style={{ fontWeight: 600 }}>
                                {record.normalized_quantity.toLocaleString()} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>{record.normalized_unit}</span>
                              </span>
                            ) : "-"}
                          </td>
                          <td>
                            {record.emission_kg_co2e !== null ? (
                              <span style={{ fontWeight: 700, color: "var(--primary)" }}>
                                {record.emission_kg_co2e.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg
                              </span>
                            ) : "-"}
                          </td>
                          <td>
                            <span className={`status-badge ${record.status}`}>
                              <span style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                backgroundColor: "currentColor",
                                display: "inline-block"
                              }}></span>
                              {record.status}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group" onClick={(e) => e.stopPropagation()}>
                              {record.status === "pending" && (
                                <>
                                  <button 
                                    className="btn-sm approve" 
                                    onClick={() => reviewRecord(record.id, "approve")}
                                  >
                                    Approve
                                  </button>
                                  <button 
                                    className="btn-sm reject" 
                                    onClick={() => reviewRecord(record.id, "reject")}
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {record.status !== "pending" && (
                                <span style={{ color: "var(--text-dim)", fontSize: "0.8rem", fontWeight: 600 }}>
                                  ✓ Locked for Audit
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Dynamic Side Audit Inspector */}
        {selectedRecord && (
          <div className="audit-drawer">
            <div className="drawer-header">
              <h3>Audit Inspector</h3>
              <button className="close-btn" onClick={() => setSelectedRecord(null)}>✕</button>
            </div>

            <div className="inspector-section">
              <span className="inspector-label">System Record ID</span>
              <span className="inspector-value">#{selectedRecord.id} (Database Node)</span>
            </div>

            <div className="inspector-section">
              <span className="inspector-label">Reporting Scope</span>
              <div>
                <span className={`scope-tag ${selectedRecord.scope}`} style={{ fontSize: "0.85rem" }}>
                  {selectedRecord.scope.toUpperCase().replace("_", " ")}
                </span>
              </div>
            </div>

            <div className="inspector-section">
              <span className="inspector-label">Activity Date</span>
              <span className="inspector-value">{selectedRecord.activity_date || "Missing/Unparseable"}</span>
            </div>

            {selectedRecord.facility_code && (
              <div className="inspector-section">
                <span className="inspector-label">Origin Facility Code / Plant</span>
                <span className="inspector-value">{selectedRecord.facility_code}</span>
              </div>
            )}

            {(selectedRecord.origin || selectedRecord.destination) && (
              <div className="inspector-section">
                <span className="inspector-label">Route Info</span>
                <span className="inspector-value">
                  {selectedRecord.origin || "?"} ➔ {selectedRecord.destination || "?"} ({selectedRecord.mode})
                </span>
              </div>
            )}

            <div className="inspector-section">
              <span className="inspector-label">Quantities & Normalization</span>
              <span className="inspector-value" style={{ lineHeight: "1.4" }}>
                Raw Input: <strong>{selectedRecord.quantity !== null && selectedRecord.quantity !== undefined ? `${selectedRecord.quantity} ${selectedRecord.quantity_unit}` : "Missing / Unparseable"}</strong><br/>
                Normalized: <strong>{selectedRecord.normalized_quantity !== null && selectedRecord.normalized_quantity !== undefined ? `${selectedRecord.normalized_quantity} ${selectedRecord.normalized_unit}` : "Missing / Unparseable"}</strong>
              </span>
            </div>

            <div className="inspector-section">
              <span className="inspector-label">Carbon Accounting Output</span>
              <span className="inspector-value" style={{
                color: "var(--primary)",
                fontWeight: 800,
                fontSize: "1.05rem",
                borderColor: "rgba(16, 185, 129, 0.3)"
              }}>
                {selectedRecord.emission_kg_co2e !== null 
                  ? `${selectedRecord.emission_kg_co2e.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg CO₂e` 
                  : "Calculation Failed"}
              </span>
            </div>

            {selectedRecord.validation_errors && selectedRecord.validation_errors.length > 0 && (
              <div className="inspector-section">
                <span className="inspector-label" style={{ color: "var(--danger)" }}>Parsing Anomalies</span>
                <div style={{
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  padding: "10px",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  color: "var(--danger)"
                }}>
                  {selectedRecord.validation_errors.map((err, idx) => (
                    <div key={idx} style={{ marginBottom: "4px" }}>• {err}</div>
                  ))}
                </div>
              </div>
            )}

            {selectedRecord.is_suspicious && (
              <div className="inspector-section">
                <span className="inspector-label" style={{ color: "var(--warning)" }}>Review Alert Flags</span>
                <div style={{
                  backgroundColor: "rgba(245, 158, 11, 0.1)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  padding: "10px",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  color: "var(--warning)"
                }}>
                  • Input values exceed standard single-row auditing thresholds.<br/>
                  • Audit Trail review strongly recommended before locking.
                </div>
              </div>
            )}

            <div className="inspector-section">
              <span className="inspector-label">Raw Source JSON</span>
              <pre className="json-payload">
                {JSON.stringify(selectedRecord.raw_row, null, 2)}
              </pre>
            </div>

            <div style={{ borderTop: "1px solid var(--panel-border)", paddingTop: "16px", marginTop: "auto" }}>
              <span className="inspector-label" style={{ display: "block", marginBottom: "8px" }}>Review Status & Auditing</span>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className={`status-badge ${selectedRecord.status}`} style={{ fontSize: "0.85rem", padding: "6px 12px" }}>
                  {selectedRecord.status}
                </span>

                {selectedRecord.status === "pending" ? (
                  <div className="btn-group">
                    <button 
                      className="btn-sm approve" 
                      onClick={() => reviewRecord(selectedRecord.id, "approve")}
                    >
                      Approve & Lock
                    </button>
                    <button 
                      className="btn-sm reject" 
                      onClick={() => reviewRecord(selectedRecord.id, "reject")}
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <span style={{ fontSize: "0.8rem", color: "var(--text-dim)", fontWeight: 600 }}>
                    Audited by {selectedRecord.reviewed_by}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
