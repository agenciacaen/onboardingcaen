import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DateRangeSelectorProps {
  date: DateRange | undefined
  setDate: (date: DateRange | undefined) => void
  className?: string
}

export function DateRangeSelector({
  date,
  setDate,
  className,
}: DateRangeSelectorProps) {

  const handlePresetChange = (value: string) => {
    const today = new Date()
    switch (value) {
      case "7days":
        setDate({ from: subDays(today, 7), to: today })
        break
      case "30days":
        setDate({ from: subDays(today, 30), to: today })
        break
      case "thisMonth":
        setDate({ from: startOfMonth(today), to: endOfMonth(today) })
        break
      case "lastMonth": {
        const lastMonth = subMonths(today, 1)
        setDate({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) })
        break
      }
      default:
        break
    }
  }

  return (
    <div className={cn("flex flex-col sm:flex-row items-center gap-2", className)}>
      <Select onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Selecionar Período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7days">Últimos 7 dias</SelectItem>
          <SelectItem value="30days">Últimos 30 dias</SelectItem>
          <SelectItem value="thisMonth">Este mês</SelectItem>
          <SelectItem value="lastMonth">Mês anterior</SelectItem>
          <SelectItem value="custom">Personalizado</SelectItem>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[260px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                  {format(date.to, "dd/MM/yyyy", { locale: ptBR })}
                </>
              ) : (
                format(date.from, "dd/MM/yyyy", { locale: ptBR })
              )
            ) : (
              <span>Selecione uma data customizada</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
