/**
 * Admin Dashboard Charts Component
 * @module Admin
 * @group Admin Components
 * 
 * This client component renders data visualizations for the admin dashboard,
 * displaying sales data in a bar chart format.
 */

'use client';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

/**
 * Charts Component
 * 
 * Renders a responsive bar chart that visualizes sales data by month.
 * Features:
 * - Monthly sales displayed as vertical bars
 * - Dollar-formatted Y-axis values
 * - Month names on X-axis
 * - Responsive container that adapts to parent width
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.data - Data for the charts
 * @param {Array<{month: string, totalSales: number}>} props.data.salesData - Monthly sales data
 * @returns {JSX.Element} Responsive bar chart visualization
 */
const Charts = ({
  data: { salesData },
}: {
  data: { salesData: { month: string; totalSales: number }[] };
}) => {
  return (
    <ResponsiveContainer width='100%' height={350}>
      <BarChart data={salesData}>
        <XAxis
          dataKey='month'
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Bar
          dataKey='totalSales'
          fill='currentColor'
          radius={[4, 4, 0, 0]}
          className='fill-primary'
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default Charts;
