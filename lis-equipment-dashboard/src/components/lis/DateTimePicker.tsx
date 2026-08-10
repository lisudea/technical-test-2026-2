import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function toLocalIsoString(date: Date, time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const combined = new Date(date);
  combined.setHours(hours || 0, minutes || 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${combined.getFullYear()}-${pad(combined.getMonth() + 1)}-${pad(combined.getDate())}T${pad(combined.getHours())}:${pad(combined.getMinutes())}`;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder,
  busyDates,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  busyDates?: Date[];
}) {
  const [date, setDate] = useState<Date | undefined>(value ? new Date(value) : undefined);
  const [time, setTime] = useState<string>(value ? value.slice(11, 16) : "09:00");
  const [open, setOpen] = useState(false);

  function handleDateSelect(nextDate: Date | undefined) {
    setDate(nextDate);
    setOpen(false);
    if (nextDate) {
      onChange(toLocalIsoString(nextDate, time));
    }
  }

  function handleTimeChange(nextTime: string) {
    setTime(nextTime);
    if (date) {
      onChange(toLocalIsoString(date, nextTime));
    }
  }

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "flex-1 justify-start rounded-xl bg-secondary/40 text-left font-normal",
              !date && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            {date ? format(date, "dd/MM/yyyy") : (placeholder ?? "Selecciona una fecha")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto rounded-2xl p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            modifiers={{ busy: busyDates ?? [] }}
            modifiersClassNames={{
              busy: "relative after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-reserved",
            }}
            initialFocus
          />
          <p className="flex items-center gap-1.5 border-t border-border/60 px-3 py-2 text-[11px] text-muted-foreground">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-reserved" />
            Días con alguna reserva activa
          </p>
        </PopoverContent>
      </Popover>

      <div className="relative w-32 shrink-0">
        <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="time"
          value={time}
          onChange={(e) => handleTimeChange(e.target.value)}
          className="rounded-xl bg-secondary/40 pl-9"
        />
      </div>
    </div>
  );
}