'use client';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Line } from 'recharts';

type ChartProps = {
  incomingData: { month: string; amount: number; }[];
  outgoingData: { month: string; amount: number; }[];
};

export default function Charts({ incomingData, outgoingData }: ChartProps) {
  const data = {
    labels: incomingData.map(item => item.month),
    datasets: [
      {
        label: 'Incoming Payments',
        data: incomingData.map(item => item.amount),
        borderColor: 'rgb(34, 197, 94)',
        tension: 0.1
      },
      {
        label: 'Outgoing Payments',
        data: outgoingData.map(item => item.amount),
        borderColor: 'rgb(239, 68, 68)',
        tension: 0.1
      }
    ]
  };

  return <Line data={data} />;
}
