import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Calendar as CalendarIcon, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface MoodFilterProps {
  onFilterChange: (filters: FilterOptions) => void;
  triggers: string[];
}

export interface FilterOptions {
  searchTerm: string;
  dateFrom?: Date;
  dateTo?: Date;
  moodRange: { min: number; max: number };
  selectedTriggers: string[];
}

const MoodFilter: React.FC<MoodFilterProps> = ({ onFilterChange, triggers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [moodMin, setMoodMin] = useState('0');
  const [moodMax, setMoodMax] = useState('10');
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const applyFilters = () => {
    onFilterChange({
      searchTerm,
      dateFrom,
      dateTo,
      moodRange: { min: parseFloat(moodMin), max: parseFloat(moodMax) },
      selectedTriggers
    });
  };

  const resetFilters = () => {
    setSearchTerm('');
    setDateFrom(undefined);
    setDateTo(undefined);
    setMoodMin('0');
    setMoodMax('10');
    setSelectedTriggers([]);
    onFilterChange({
      searchTerm: '',
      moodRange: { min: 0, max: 10 },
      selectedTriggers: []
    });
  };

  const toggleTrigger = (trigger: string) => {
    setSelectedTriggers(prev =>
      prev.includes(trigger)
        ? prev.filter(t => t !== trigger)
        : [...prev, trigger]
    );
  };

  const hasActiveFilters = searchTerm || dateFrom || dateTo || 
    moodMin !== '0' || moodMax !== '10' || selectedTriggers.length > 0;

  return (
    <div className="space-y-4 p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-primary/10">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search journal entries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            className="pl-10 pr-4"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(showAdvanced && "bg-primary/10")}
        >
          <Filter className="h-4 w-4" />
        </Button>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="icon"
            onClick={resetFilters}
            className="text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showAdvanced && (
        <div className="space-y-4 pt-2 border-t">
          {/* Date Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Date Range</label>
            <div className="flex gap-2 flex-wrap">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, 'PP') : 'From date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, 'PP') : 'To date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Mood Score Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Mood Score Range</label>
            <div className="flex gap-2 items-center">
              <Select value={moodMin} onValueChange={setMoodMin}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(11)].map((_, i) => (
                    <SelectItem key={i} value={i.toString()}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>to</span>
              <Select value={moodMax} onValueChange={setMoodMax}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(11)].map((_, i) => (
                    <SelectItem key={i} value={i.toString()}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Trigger Filter */}
          {triggers.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by Triggers</label>
              <div className="flex flex-wrap gap-2">
                {triggers.map(trigger => (
                  <Button
                    key={trigger}
                    variant={selectedTriggers.includes(trigger) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleTrigger(trigger)}
                    className="text-xs"
                  >
                    {trigger}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <Button onClick={applyFilters} className="w-full">
            Apply Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default MoodFilter;