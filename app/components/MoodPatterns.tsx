import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoodEntry } from '@/app/types';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Calendar } from 'lucide-react';
import { useTheme } from 'next-themes';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, parseISO } from 'date-fns';

interface MoodPatternsProps {
  entries: MoodEntry[];
}

const MoodPatterns: React.FC<MoodPatternsProps> = ({ entries }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Calculate average mood by day of week
  const getDayOfWeekPattern = () => {
    const dayData: Record<string, { total: number; count: number }> = {
      'Sun': { total: 0, count: 0 },
      'Mon': { total: 0, count: 0 },
      'Tue': { total: 0, count: 0 },
      'Wed': { total: 0, count: 0 },
      'Thu': { total: 0, count: 0 },
      'Fri': { total: 0, count: 0 },
      'Sat': { total: 0, count: 0 }
    };

    entries.forEach(entry => {
      const day = format(new Date(entry.date), 'EEE');
      dayData[day].total += entry.overallScore;
      dayData[day].count += 1;
    });

    return Object.entries(dayData).map(([day, data]) => ({
      day,
      average: data.count > 0 ? parseFloat((data.total / data.count).toFixed(1)) : 0,
      count: data.count
    }));
  };

  // Calculate average mood by time of day
  const getTimeOfDayPattern = () => {
    const timeData: Record<string, { total: number; count: number }> = {
      'Morning': { total: 0, count: 0 },
      'Afternoon': { total: 0, count: 0 },
      'Evening': { total: 0, count: 0 },
      'Night': { total: 0, count: 0 }
    };

    entries.forEach(entry => {
      const hour = new Date(entry.date).getHours();
      let period = 'Night';
      if (hour >= 6 && hour < 12) period = 'Morning';
      else if (hour >= 12 && hour < 17) period = 'Afternoon';
      else if (hour >= 17 && hour < 21) period = 'Evening';
      
      timeData[period].total += entry.overallScore;
      timeData[period].count += 1;
    });

    return Object.entries(timeData).map(([time, data]) => ({
      time,
      average: data.count > 0 ? parseFloat((data.total / data.count).toFixed(1)) : 0
    }));
  };

  // Calculate mood dimensions (from individual questions)
  const getMoodDimensions = () => {
    const dimensions = [
      { name: 'Overall Mood', id: 1 },
      { name: 'Stress Level', id: 2 },
      { name: 'Social Connection', id: 3 },
      { name: 'Energy', id: 4 },
      { name: 'Satisfaction', id: 5 }
    ];

    return dimensions.map(dim => {
      const values = entries.flatMap(entry => 
        entry.answers.filter(a => a.questionId === dim.id).map(a => a.value)
      );
      const average = values.length > 0 
        ? parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1))
        : 0;
      
      return {
        dimension: dim.name,
        score: average,
        fullMark: 10
      };
    });
  };

  // Calculate mood trends (7-day moving average)
  const getMoodTrend = () => {
    if (entries.length < 7) return [];
    
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const movingAverage = [];
    for (let i = 6; i < sortedEntries.length; i++) {
      const weekEntries = sortedEntries.slice(i - 6, i + 1);
      const average = weekEntries.reduce((sum, entry) => sum + entry.overallScore, 0) / 7;
      
      movingAverage.push({
        date: format(new Date(sortedEntries[i].date), 'MMM dd'),
        average: parseFloat(average.toFixed(1)),
        actual: sortedEntries[i].overallScore
      });
    }

    return movingAverage;
  };

  // Calculate statistics
  const getStatistics = () => {
    if (entries.length === 0) return null;

    const scores = entries.map(e => e.overallScore);
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    const sorted = [...scores].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    
    // Calculate trend
    const recentEntries = entries.slice(-7);
    const olderEntries = entries.slice(-14, -7);
    const recentAvg = recentEntries.reduce((sum, e) => sum + e.overallScore, 0) / recentEntries.length;
    const olderAvg = olderEntries.length > 0 
      ? olderEntries.reduce((sum, e) => sum + e.overallScore, 0) / olderEntries.length
      : average;
    
    const trend = recentAvg - olderAvg;

    return {
      average: parseFloat(average.toFixed(1)),
      median: parseFloat(median.toFixed(1)),
      highest: Math.max(...scores),
      lowest: Math.min(...scores),
      trend: parseFloat(trend.toFixed(1)),
      trendDirection: trend > 0.5 ? 'up' : trend < -0.5 ? 'down' : 'stable'
    };
  };

  const stats = getStatistics();
  const dayPattern = getDayOfWeekPattern();
  const timePattern = getTimeOfDayPattern();
  const dimensions = getMoodDimensions();
  const trendData = getMoodTrend();

  if (!stats) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500 dark:text-gray-400">Not enough data to show patterns</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Average</p>
                <p className="text-2xl font-bold text-primary">{stats.average}</p>
              </div>
              <Activity className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Trend</p>
                <div className="flex items-center gap-1">
                  <p className="text-2xl font-bold text-primary">
                    {Math.abs(stats.trend)}
                  </p>
                  {stats.trendDirection === 'up' && <TrendingUp className="h-5 w-5 text-green-500" />}
                  {stats.trendDirection === 'down' && <TrendingDown className="h-5 w-5 text-red-500" />}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Highest</p>
                <p className="text-2xl font-bold text-green-500">{stats.highest}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Lowest</p>
                <p className="text-2xl font-bold text-red-500">{stats.lowest}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mood by Day of Week */}
      <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">Mood by Day of Week</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dayPattern}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#333" : "#f0f0f0"} />
              <XAxis dataKey="day" stroke={isDark ? "#aaa" : "#888"} fontSize={12} />
              <YAxis domain={[0, 10]} stroke={isDark ? "#aaa" : "#888"} fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? "#333" : "#fff",
                  color: isDark ? "#fff" : "#333",
                  borderColor: isDark ? "#555" : "#ddd"
                }}
              />
              <Bar dataKey="average" fill="#9b87f5" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Mood Dimensions Radar Chart */}
      <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">Mood Dimensions</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={dimensions}>
              <PolarGrid stroke={isDark ? "#555" : "#ddd"} />
              <PolarAngleAxis dataKey="dimension" stroke={isDark ? "#aaa" : "#888"} fontSize={12} />
              <PolarRadiusAxis domain={[0, 10]} stroke={isDark ? "#aaa" : "#888"} fontSize={10} />
              <Radar 
                dataKey="score" 
                stroke="#9b87f5" 
                fill="#9b87f5" 
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? "#333" : "#fff",
                  color: isDark ? "#fff" : "#333",
                  borderColor: isDark ? "#555" : "#ddd"
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Mood Trend with Moving Average */}
      {trendData.length > 0 && (
        <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Mood Trend (7-day average)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#333" : "#f0f0f0"} />
                <XAxis dataKey="date" stroke={isDark ? "#aaa" : "#888"} fontSize={12} />
                <YAxis domain={[0, 10]} stroke={isDark ? "#aaa" : "#888"} fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? "#333" : "#fff",
                    color: isDark ? "#fff" : "#333",
                    borderColor: isDark ? "#555" : "#ddd"
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#E5DEFF" 
                  strokeWidth={1}
                  dot={{ r: 3 }}
                  name="Daily Score"
                />
                <Line 
                  type="monotone" 
                  dataKey="average" 
                  stroke="#9b87f5" 
                  strokeWidth={3}
                  dot={false}
                  name="7-day Average"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Time of Day Pattern */}
      <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">Mood by Time of Day</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={timePattern}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#333" : "#f0f0f0"} />
              <XAxis dataKey="time" stroke={isDark ? "#aaa" : "#888"} fontSize={12} />
              <YAxis domain={[0, 10]} stroke={isDark ? "#aaa" : "#888"} fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? "#333" : "#fff",
                  color: isDark ? "#fff" : "#333",
                  borderColor: isDark ? "#555" : "#ddd"
                }}
              />
              <Bar dataKey="average" fill="#7E69AB" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default MoodPatterns;