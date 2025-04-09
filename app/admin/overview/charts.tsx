/**
 * Admin Dashboard Charts Component
 * @module Admin
 * @group Admin Components
 * 
 * This client component renders data visualizations for the admin dashboard,
 * displaying sales and task statistics in chart format.
 */

'use client';

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

interface ChartData {
  salesData: { month: string; totalSales: number }[];
  taskData: { week: string; totalTasks: number }[];
}

/**
 * Charts Component
 * 
 * Renders responsive charts that visualize:
 * - Monthly sales data
 * - Weekly task creation data
 * 
 * Features:
 * - Sales displayed as blue bars
 * - Task counts displayed as green bars
 * - Formatted axis values
 * - Responsive container
 * 
 * @component
 * @param {Object} props - Component props
 * @param {ChartData} props.data - Data for the charts
 * @returns {JSX.Element} Responsive chart visualizations
 */
const Charts = ({
  data: { salesData, taskData },
}: {
  data: ChartData;
}) => {
  return (
    <div className="space-y-8">
      {/* Sales Chart */}
      <div>
        <h3 className="text-sm font-medium mb-2">Monthly Sales</h3>
        <ResponsiveContainer width='100%' height={200}>
          <BarChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" />
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
              fill='#2563eb'
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tasks Chart */}
      <div>
        <h3 className="text-sm font-medium mb-2">Weekly New Tasks</h3>
        <ResponsiveContainer width='100%' height={200}>
          <BarChart data={taskData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey='week'
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
            />
            <Bar
              dataKey='totalTasks'
              fill='#22c55e'
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Charts;
