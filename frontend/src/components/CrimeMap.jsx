import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function CrimeMap() {
  const hotspots = [
    {
      name: "Bangalore Urban",
      position: [12.9716, 77.5946],
      crimes: 450,
    },
    {
      name: "Mysore",
      position: [12.2958, 76.6394],
      crimes: 210,
    },
    {
      name: "Hubli",
      position: [15.3647, 75.124],
      crimes: 170,
    },
    {
      name: "Mangalore",
      position: [12.9141, 74.856],
      crimes: 120,
    },
  ];

  return (
    <MapContainer
      center={[13.5, 76.0]}
      zoom={6}
      style={{
        height: "500px",
        width: "100%",
        borderRadius: "10px",
      }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {hotspots.map((spot, index) => (
        <Marker key={index} position={spot.position}>
          <Popup>
            <b>{spot.name}</b>
            <br />
            Crime Cases: {spot.crimes}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default CrimeMap;