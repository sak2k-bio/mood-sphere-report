
import React, { useState, useEffect } from 'react';
import { MoodEntry } from '@/app/types';
import { Calendar, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import MoodGraph from './MoodGraph';

interface ReportGeneratorProps {
  entries: MoodEntry[];
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ entries }) => {
  const [report, setReport] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  // Group triggers by frequency
  const getTriggerAnalysis = () => {
    const triggerCounts: Record<string, number> = {};
    
    entries.forEach(entry => {
      if (entry.triggers && entry.triggers.length > 0) {
        entry.triggers.forEach(trigger => {
          triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
        });
      }
    });
    
    // Sort triggers by frequency
    const sortedTriggers = Object.entries(triggerCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([trigger, count]) => ({
        trigger,
        count,
        percentage: Math.round((count / entries.length) * 100)
      }));
    
    return sortedTriggers;
  };

  useEffect(() => {
    generateReport();
  }, [entries]); // Re-generate when entries change

  const generateReport = () => {
    setIsGenerating(true);
    
    // Calculate average mood score
    const totalScore = entries.reduce((sum, entry) => sum + entry.overallScore, 0);
    const averageScore = (totalScore / entries.length).toFixed(1);
    
    // Find highest and lowest mood entries
    const highestEntry = [...entries].sort((a, b) => b.overallScore - a.overallScore)[0];
    const lowestEntry = [...entries].sort((a, b) => a.overallScore - b.overallScore)[0];
    
    // Format dates for better readability
    const formatDate = (dateString: string): string => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    };
    
    // Create trend analysis
    let trend = "stable";
    if (entries.length >= 3) {
      const recent = entries.slice(-3);
      const recentAvg = recent.reduce((sum, entry) => sum + entry.overallScore, 0) / recent.length;
      const olderAvg = entries.slice(0, -3).reduce((sum, entry) => sum + entry.overallScore, 0) / 
                      Math.max(1, entries.slice(0, -3).length);
      
      const difference = recentAvg - olderAvg;
      
      if (difference > 0.5) trend = "improving";
      else if (difference < -0.5) trend = "declining";
    }
    
    // Analyze triggers
    const triggerAnalysis = getTriggerAnalysis();
    let triggerSection = "";
    
    if (triggerAnalysis.length > 0) {
      triggerSection = "\n\n## TRIGGER ANALYSIS\n\n";
      triggerSection += "Common triggers affecting your mood:\n\n";
      
      triggerAnalysis.slice(0, 5).forEach(({trigger, count, percentage}) => {
        triggerSection += `- ${trigger}: present in ${count} entries (${percentage}% of the time)\n`;
      });
      
      // Add recommendations based on most common triggers
      if (triggerAnalysis.length > 0) {
        const topTrigger = triggerAnalysis[0].trigger;
        triggerSection += `\nYour most frequent trigger is "${topTrigger}". `;
        
        // Simple trigger-based recommendations
        if (topTrigger.includes("stress") || topTrigger.includes("anxiety")) {
          triggerSection += "Consider incorporating stress-reduction techniques like deep breathing, meditation, or regular physical activity.";
        } else if (topTrigger.includes("sleep")) {
          triggerSection += "Improving sleep hygiene may help. Consider establishing a regular sleep schedule and creating a restful environment.";
        } else if (topTrigger.includes("relationship") || topTrigger.includes("social") || topTrigger.includes("conflict")) {
          triggerSection += "Developing communication skills and setting healthy boundaries might be beneficial.";
        } else {
          triggerSection += "Working with your therapist to develop coping strategies for this trigger could be beneficial.";
        }
      }
    } else {
      triggerSection = "\n\nNo triggers have been recorded yet. Adding triggers to your mood entries can help identify patterns affecting your emotional health.";
    }
    
    // Compose the full report
    const reportText = `# MOOD HEALTH REPORT
Generated on ${new Date().toLocaleDateString('en-US', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric',
  hour: '2-digit', 
  minute: '2-digit'
})}

## SUMMARY

Based on ${entries.length} mood entries, your average mood score is ${averageScore}/10.
Your mood trend appears to be ${trend} over the recorded period.

Highest mood: ${highestEntry.overallScore}/10 on ${formatDate(highestEntry.date)}
Lowest mood: ${lowestEntry.overallScore}/10 on ${formatDate(lowestEntry.date)}
${triggerSection}

## RECOMMENDATIONS

1. Continue tracking your mood regularly to identify patterns
2. Share this report with your therapist to discuss insights
3. Pay attention to activities and situations that correlate with higher mood scores
4. Practice self-care during times when you notice your typical triggers

This automated report is meant to supplement, not replace, professional mental health advice.`;

    setReport(reportText);
    setIsGenerating(false);
  };

  const downloadReport = () => {
    const element = document.createElement("a");
    const file = new Blob([report], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `mood-report-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Mood Health Report</h2>
        <div className="flex items-center gap-2">
          <Button 
            onClick={generateReport} 
            variant="outline" 
            size="sm" 
            disabled={isGenerating}
          >
            <FileText className="mr-2 h-4 w-4" />
            {isGenerating ? 'Generating...' : 'Refresh Report'}
          </Button>
          <Button 
            onClick={downloadReport}
            variant="outline"
            size="sm"
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
          <div className="text-center">
            <h3 className="text-sm text-gray-500 dark:text-gray-400">Entries</h3>
            <p className="text-3xl font-bold text-primary">{entries.length}</p>
          </div>
        </Card>
        <Card className="p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
          <div className="text-center">
            <h3 className="text-sm text-gray-500 dark:text-gray-400">Avg Score</h3>
            <p className="text-3xl font-bold text-primary">
              {(entries.reduce((sum, entry) => sum + entry.overallScore, 0) / entries.length).toFixed(1)}
            </p>
          </div>
        </Card>
        <Card className="p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
          <div className="text-center">
            <h3 className="text-sm text-gray-500 dark:text-gray-400">Latest Entry</h3>
            <p className="text-3xl font-bold text-primary">
              <Calendar className="h-6 w-6 inline-block" /> {' '}
              {new Date(entries[entries.length-1].date).toLocaleDateString()}
            </p>
          </div>
        </Card>
      </div>
      
      {/* Graph of mood over time */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Mood Trend</h3>
        <div className="p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg">
          <MoodGraph data={entries} height={200} />
        </div>
      </div>
      
      {/* Trigger frequency visualization */}
      {getTriggerAnalysis().length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Common Triggers</h3>
          <div className="p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg">
            <div className="space-y-3">
              {getTriggerAnalysis().slice(0, 5).map(({trigger, percentage}) => (
                <div key={trigger} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{trigger}</span>
                    <span className="font-medium">{percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{width: `${percentage}%`}}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* The report text */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 shadow-sm">
        <h3 className="text-lg font-medium mb-2">Full Report</h3>
        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-md">
          <pre className="whitespace-pre-wrap text-sm font-mono text-gray-700 dark:text-gray-300">
            {report}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;
