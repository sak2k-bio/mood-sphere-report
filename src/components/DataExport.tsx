import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Upload, FileJson, AlertCircle } from "lucide-react";
import { MoodEntry } from '../types';
import { useToast } from "@/components/ui/use-toast";
import { format } from 'date-fns';

interface DataExportProps {
  entries: MoodEntry[];
  onImport: (entries: MoodEntry[]) => void;
}

const DataExport: React.FC<DataExportProps> = ({ entries, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const exportData = () => {
    const dataToExport = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      appName: "MoodSphere",
      entries: entries
    };

    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `moodsphere-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: `Exported ${entries.length} mood entries`,
    });
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        // Validate the imported data
        if (!data.entries || !Array.isArray(data.entries)) {
          throw new Error("Invalid file format");
        }

        // Validate each entry
        const validEntries = data.entries.filter((entry: any) => {
          return entry.date && 
                 entry.answers && 
                 Array.isArray(entry.answers) && 
                 typeof entry.overallScore === 'number';
        });

        if (validEntries.length === 0) {
          throw new Error("No valid entries found in the file");
        }

        // Ask user to confirm import
        const confirmImport = window.confirm(
          `This will import ${validEntries.length} mood entries. ` +
          `Your current ${entries.length} entries will be replaced. Continue?`
        );

        if (confirmImport) {
          onImport(validEntries);
          toast({
            title: "Import successful",
            description: `Imported ${validEntries.length} mood entries`,
          });
        }
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Please ensure you're importing a valid MoodSphere export file",
          variant: "destructive",
        });
      }
    };

    reader.readAsText(file);
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const exportToCSV = () => {
    // Create CSV header
    const headers = [
      'Date',
      'Time',
      'Overall Score',
      'Mood Rating',
      'Stress Management',
      'Social Connection',
      'Energy Level',
      'Satisfaction',
      'Triggers',
      'Journal Note'
    ];

    // Create CSV rows
    const rows = entries.map(entry => {
      const date = new Date(entry.date);
      return [
        format(date, 'yyyy-MM-dd'),
        format(date, 'HH:mm'),
        entry.overallScore,
        entry.answers.find(a => a.questionId === 1)?.value || '',
        entry.answers.find(a => a.questionId === 2)?.value || '',
        entry.answers.find(a => a.questionId === 3)?.value || '',
        entry.answers.find(a => a.questionId === 4)?.value || '',
        entry.answers.find(a => a.questionId === 5)?.value || '',
        (entry.triggers || []).join('; '),
        entry.journalNote ? `"${entry.journalNote.replace(/"/g, '""')}"` : ''
      ];
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `moodsphere-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "CSV export successful",
      description: `Exported ${entries.length} mood entries to CSV`,
    });
  };

  return (
    <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-primary/10">
      <CardHeader>
        <CardTitle>Data Management</CardTitle>
        <CardDescription>
          Export your mood data for backup or analysis, or import previously exported data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Always keep backups of your mood data to prevent loss
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Export Options</h4>
            <Button 
              onClick={exportData} 
              variant="outline" 
              className="w-full justify-start"
              disabled={entries.length === 0}
            >
              <FileJson className="mr-2 h-4 w-4" />
              Export as JSON
            </Button>
            <Button 
              onClick={exportToCSV} 
              variant="outline" 
              className="w-full justify-start"
              disabled={entries.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export as CSV
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Import Data</h4>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={importData}
              className="hidden"
            />
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              variant="outline" 
              className="w-full justify-start"
            >
              <Upload className="mr-2 h-4 w-4" />
              Import from JSON
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Only MoodSphere JSON exports are supported
            </p>
          </div>
        </div>

        <div className="pt-2 border-t">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            You currently have <span className="font-medium text-primary">{entries.length}</span> mood entries
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataExport;