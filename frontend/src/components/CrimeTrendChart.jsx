import { Line } from 'react-chartjs-2';

// CrimeTrendChart relies on global chartSetup registration (chartSetup.js)

function CrimeTrendChart() {
  const data = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Crime Cases",
        data: [120, 180, 150, 220, 190, 260],
      },
    ],
  };

  return <Line data={data} />;
}

export default CrimeTrendChart;