import { useState, useCallback } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { type Filters, trackEvent } from "@/lib/analytics";

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

const FilterBar = ({ filters, onChange }: FilterBarProps) => {
  const updateFilter = useCallback(
    (key: keyof Filters, value: string) => {
      onChange({ ...filters, [key]: value });
      trackEvent(`${key}_filter`);
    },
    [filters, onChange]
  );

  return (
    <div className="flex flex-wrap gap-3 items-end">
      {/* Date Range */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider font-display">Start Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal text-sm", !filters.startDate && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-3.5 w-3.5" />
              {filters.startDate ? format(new Date(filters.startDate), "MMM d, yyyy") : "Pick date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.startDate ? new Date(filters.startDate) : undefined}
              onSelect={(d) => d && updateFilter("startDate", d.toISOString())}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider font-display">End Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal text-sm", !filters.endDate && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-3.5 w-3.5" />
              {filters.endDate ? format(new Date(filters.endDate), "MMM d, yyyy") : "Pick date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.endDate ? new Date(filters.endDate) : undefined}
              onSelect={(d) => d && updateFilter("endDate", d.toISOString())}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Age */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider font-display">Age Group</label>
        <Select value={filters.age || "all"} onValueChange={(v) => updateFilter("age", v)}>
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ages</SelectItem>
            <SelectItem value="<18">Under 18</SelectItem>
            <SelectItem value="18-40">18 – 40</SelectItem>
            <SelectItem value=">40">Over 40</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Gender */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider font-display">Gender</label>
        <Select value={filters.gender || "all"} onValueChange={(v) => updateFilter("gender", v)}>
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Male">Male</SelectItem>
            <SelectItem value="Female">Female</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default FilterBar;
