
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MoodEntry } from '@/app/types';
import { useTheme } from 'next-themes';

interface MoodGraphProps {
  data: MoodEntry[];
  height?: number | string;
}

const MoodGraph: React.FC<MoodGraphProps> = ({ data, height = "80%" }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // Format data for the chart
  const chartData = data.map(entry => ({
    date: new Date(entry.date).toLocaleDateString(),
    score: entry.overallScore
  }));

  return (
    <div className="w-full h-64 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-medium mb-4">Your Mood History</h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#333" : "#f0f0f0"} />
          <XAxis 
            dataKey="date" 
            stroke={isDark ? "#aaa" : "#888"} 
            fontSize={12} 
            tickLine={false} 
          />
          <YAxis 
            domain={[0, 10]} 
            stroke={isDark ? "#aaa" : "#888"} 
            fontSize={12} 
            tickLine={false} 
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: isDark ? "#333" : "#fff",
              color: isDark ? "#fff" : "#333",
              borderColor: isDark ? "#555" : "#ddd"
            }}
          />
          <Line 
            type="monotone" 
            dataKey="score" 
            stroke="#9b87f5" 
            strokeWidth={2}
            dot={{ stroke: '#7E69AB', strokeWidth: 2, r: 4, fill: isDark ? '#333' : '#fff' }}
            activeDot={{ r: 6, stroke: '#9b87f5', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MoodGraph;
