import { useCallback, useEffect, useState } from "react";
import { endOfMonth, format, startOfDay, startOfMonth, subDays } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { type Filters, trackEvent } from "@/lib/analytics";
import type { DateRange } from "react-day-picker";

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

  const [dateOpen, setDateOpen] = useState(false);
  const [tempFrom, setTempFrom] = useState<Date | undefined>(() => (filters.startDate ? new Date(filters.startDate) : undefined));
  const [tempTo, setTempTo] = useState<Date | undefined>(() => (filters.endDate ? new Date(filters.endDate) : undefined));
  const [activePreset, setActivePreset] = useState<string>("custom");

  useEffect(() => {
    if (!dateOpen) return;
    setTempFrom(filters.startDate ? new Date(filters.startDate) : undefined);
    setTempTo(filters.endDate ? new Date(filters.endDate) : undefined);
    setActivePreset("custom");
  }, [dateOpen, filters.startDate, filters.endDate]);

  const rangeText = (() => {
    if (!filters.startDate || !filters.endDate) return "Pick date range";
    const from = new Date(filters.startDate);
    const to = new Date(filters.endDate);
    return `${format(from, "yyyy-MM-dd HH:mm:ss")} - ${format(to, "yyyy-MM-dd HH:mm:ss")}`;
  })();

  const getPresetRange = (preset: string): { from?: Date; to?: Date } => {
    const now = new Date();
    const today = startOfDay(now);

    switch (preset) {
      case "today":
        return { from: today, to: today };
      case "yesterday": {
        const y = startOfDay(subDays(today, 1));
        return { from: y, to: y };
      }
      case "last7": {
        const from = startOfDay(subDays(today, 6));
        return { from, to: today };
      }
      case "thisMonth": {
        const from = startOfMonth(now);
        const to = startOfDay(endOfMonth(now));
        return { from, to };
      }
      default:
        return { from: undefined, to: undefined };
    }
  };

  const handlePresetClick = (preset: string) => {
    if (preset === "custom") {
      setActivePreset("custom");
      return;
    }
    const { from, to } = getPresetRange(preset);
    setTempFrom(from);
    setTempTo(to);
    setActivePreset(preset);
  };

  const handleCancelDates = () => {
    setTempFrom(filters.startDate ? new Date(filters.startDate) : undefined);
    setTempTo(filters.endDate ? new Date(filters.endDate) : undefined);
    setActivePreset("custom");
    setDateOpen(false);
  };

  const handleApplyDates = () => {
    const next: Filters = {
      ...filters,
      startDate: tempFrom ? tempFrom.toISOString() : "",
      endDate: tempTo ? tempTo.toISOString() : "",
    };
    onChange(next);
    trackEvent("startDate_filter");
    trackEvent("endDate_filter");
    setDateOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4 items-start justify-between">
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[420px] justify-start text-left font-normal",
                (!filters.startDate || !filters.endDate) && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span className="truncate">{rangeText}</span>
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-[640px] p-0" align="start">
            <div className="flex">
              <div className="w-[170px] border-r p-3 space-y-1.5">
                <button
                  type="button"
                  className={cn(
                    "w-full rounded-md px-2 py-1 text-left text-sm transition-colors",
                    activePreset === "today" ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-accent/50"
                  )}
                  onClick={() => handlePresetClick("today")}
                >
                  Today
                </button>
                <button
                  type="button"
                  className={cn(
                    "w-full rounded-md px-2 py-1 text-left text-sm transition-colors",
                    activePreset === "yesterday"
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent/50"
                  )}
                  onClick={() => handlePresetClick("yesterday")}
                >
                  Yesterday
                </button>
                <button
                  type="button"
                  className={cn(
                    "w-full rounded-md px-2 py-1 text-left text-sm transition-colors",
                    activePreset === "last7" ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-accent/50"
                  )}
                  onClick={() => handlePresetClick("last7")}
                >
                  Last 7 Days
                </button>
                <button
                  type="button"
                  className={cn(
                    "w-full rounded-md px-2 py-1 text-left text-sm transition-colors",
                    activePreset === "thisMonth"
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent/50"
                  )}
                  onClick={() => handlePresetClick("thisMonth")}
                >
                  This Month
                </button>
                <button
                  type="button"
                  className={cn(
                    "w-full rounded-md px-2 py-1 text-left text-sm transition-colors",
                    activePreset === "custom"
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent/50"
                  )}
                  onClick={() => handlePresetClick("custom")}
                >
                  Custom Range
                </button>
              </div>

              <div className="p-3 flex-1">
                <Calendar
                  mode="range"
                  selected={{ from: tempFrom, to: tempTo }}
                  onSelect={(range: DateRange | undefined) => {
                    setTempFrom(range?.from);
                    setTempTo(range?.to);
                    setActivePreset("custom");
                  }}
                  className="p-0 pointer-events-auto"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t p-3">
              <Button variant="ghost" size="sm" onClick={handleCancelDates}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleApplyDates}>
                Apply
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Age */}
          <Select value={filters.age || "all"} onValueChange={(v) => updateFilter("age", v)}>
            <SelectTrigger className="w-auto rounded-full h-9 px-4">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Age</SelectItem>
              <SelectItem value="<18">Under 18</SelectItem>
              <SelectItem value="18-40">18 – 40</SelectItem>
              <SelectItem value=">40">Over 40</SelectItem>
            </SelectContent>
          </Select>

          {/* Gender */}
          <Select value={filters.gender || "all"} onValueChange={(v) => updateFilter("gender", v)}>
            <SelectTrigger className="w-auto rounded-full h-9 px-4">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Gender</SelectItem>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
