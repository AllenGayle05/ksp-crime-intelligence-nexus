import CrimeTrendChart from "./components/CrimeTrendChart";
import CrimeMap from "./components/CrimeMap";
import CrimePrediction from "./components/CrimePrediction";

function App() {
  const crimeData = [
    {
      caseId: "CR001",
      crimeType: "Theft",
      district: "Bangalore Urban",
      status: "Open",
    },
    {
      caseId: "CR002",
      crimeType: "Robbery",
      district: "Mysore",
      status: "Closed",
    },
    {
      caseId: "CR003",
      crimeType: "Cyber Crime",
      district: "Hubli",
      status: "Investigating",
    },
    {
      caseId: "CR004",
      crimeType: "Assault",
      district: "Mangalore",
      status: "Open",
    },
  ];

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "auto" }}>
      <h1
        style={{
          textAlign: "center",
          fontSize: "60px",
          marginBottom: "10px",
        }}
      >
        KSP Crime Intelligence Nexus
      </h1>

      <p
        style={{
          textAlign: "center",
          fontSize: "24px",
          color: "#666",
        }}
      >
        AI-Powered Crime Analytics & Visualization Platform
      </p>

      <hr style={{ margin: "30px 0" }} />

      <div
        style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            border: "1px solid #ddd",
            padding: "20px",
            width: "220px",
            textAlign: "center",
            borderRadius: "10px",
            backgroundColor: "#f8f9fa",
          }}
        >
          <h3>Total Crimes</h3>
          <h2>1250</h2>
        </div>

        <div
          style={{
            border: "1px solid #ddd",
            padding: "20px",
            width: "220px",
            textAlign: "center",
            borderRadius: "10px",
            backgroundColor: "#f8f9fa",
          }}
        >
          <h3>Active Cases</h3>
          <h2>340</h2>
        </div>

        <div
          style={{
            border: "1px solid #ddd",
            padding: "20px",
            width: "220px",
            textAlign: "center",
            borderRadius: "10px",
            backgroundColor: "#f8f9fa",
          }}
        >
          <h3>High Risk Districts</h3>
          <h2>12</h2>
        </div>
      </div>

      <div style={{ marginTop: "50px" }}>
        <h2 style={{ textAlign: "center" }}>Crime Trend Analysis</h2>
        <CrimeTrendChart />
      </div>

      <div style={{ marginTop: "60px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          Recent Crime Records
        </h2>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1px solid #ddd",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f0f0f0" }}>
              <th style={{ padding: "12px", border: "1px solid #ddd" }}>
                Case ID
              </th>
              <th style={{ padding: "12px", border: "1px solid #ddd" }}>
                Crime Type
              </th>
              <th style={{ padding: "12px", border: "1px solid #ddd" }}>
                District
              </th>
              <th style={{ padding: "12px", border: "1px solid #ddd" }}>
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {crimeData.map((crime) => (
              <tr key={crime.caseId}>
                <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                  {crime.caseId}
                </td>
                <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                  {crime.crimeType}
                </td>
                <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                  {crime.district}
                </td>
                <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                  {crime.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "60px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          Crime Hotspots Map
        </h2>

        <CrimeMap />
      </div>

      <div style={{ marginTop: "60px", marginBottom: "80px" }}>
        <h2 style={{ textAlign: "center" }}>AI Alerts</h2>

        <div
          style={{
            background: "#fff3cd",
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "10px",
          }}
        >
          ⚠️ Theft incidents increased by 18% in Bangalore Urban.
        </div>

        <div
          style={{
            background: "#f8d7da",
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "10px",
          }}
        >
          🚨 Cyber Crime activity rising in Hubli district.
        </div>

        <div
          style={{
            background: "#d1ecf1",
            padding: "15px",
            borderRadius: "8px",
          }}
        >
          📊 Mysore predicted as medium-risk zone for next 7 days.
        </div>
      </div>

      <div style={{ marginTop: 60 }}>
        <CrimePrediction />
      </div>
    </div>
  );
}

export default App;