import React from 'react';
import { Pie } from 'react-chartjs-2';

export default function PieChart({ data }) {
  return <Pie data={data} />;
}
