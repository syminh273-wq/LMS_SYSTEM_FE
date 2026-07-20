"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "../../lib/utils"

export interface CalendarProps {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  className?: string
}

export function Calendar({ selected, onSelect, className }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(selected || new Date())

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const totalDays = daysInMonth(year, month)
  const firstDay = firstDayOfMonth(year, month)

  // Adjust for Monday start if needed, but standard is Sunday (0)
  // Let's use Monday start to match the image (M T W T F S S)
  const firstDayMonday = firstDay === 0 ? 6 : firstDay - 1

  const days = []
  // Previous month days
  const prevMonth = new Date(year, month, 0)
  const prevMonthDays = prevMonth.getDate()
  for (let i = firstDayMonday - 1; i >= 0; i--) {
    days.push({ day: prevMonthDays - i, month: month - 1, year, current: false })
  }

  // Current month days
  for (let i = 1; i <= totalDays; i++) {
    days.push({ day: i, month, year, current: true })
  }

  // Next month days
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, month: month + 1, year, current: false })
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const weekDays = ["M", "T", "W", "T", "F", "S", "S"]

  const isToday = (d: number, m: number, y: number) => {
    const today = new Date()
    return d === today.getDate() && m === today.getMonth() && y === today.getFullYear()
  }

  const isSelected = (d: number, m: number, y: number) => {
    return selected && d === selected.getDate() && m === selected.getMonth() && y === selected.getFullYear()
  }

  return (
    <div className={cn("p-3", className)}>
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="text-sm font-black text-slate-900 flex items-center gap-1 cursor-default">
          {monthNames[month]} {year}
          <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-slate-900 ml-1" />
        </div>
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={handlePrevMonth}
            className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-500"
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            type="button"
            onClick={handleNextMonth}
            className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-500"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
        {weekDays.map((wd, i) => (
          <div key={i} className="text-[10px] font-bold text-slate-400 py-2">
            {wd}
          </div>
        ))}
        {days.map((d, i) => {
          const active = d.current
          const today = active && isToday(d.day, d.month, d.year)
          const selectedDay = active && isSelected(d.day, d.month, d.year)
          
          return (
            <button
              key={i}
              type="button"
              onClick={() => active && onSelect?.(new Date(d.year, d.month, d.day))}
              className={cn(
                "h-8 w-8 text-xs font-bold rounded-lg flex items-center justify-center transition-all mx-auto",
                !active && "text-slate-300 pointer-events-none",
                active && !selectedDay && "text-slate-600 hover:bg-slate-100",
                selectedDay && "bg-indigo-600 text-white shadow-lg shadow-indigo-200",
                today && !selectedDay && "border border-indigo-200 text-indigo-600"
              )}
            >
              {d.day}
            </button>
          )
        })}
      </div>
      <div className="mt-4 flex items-center justify-between px-1 border-t border-slate-50 pt-3">
        <button 
          type="button"
          onClick={() => onSelect?.(undefined)}
          className="text-[11px] font-black text-indigo-600 hover:underline"
        >
          Clear
        </button>
        <button 
          type="button"
          onClick={() => onSelect?.(new Date())}
          className="text-[11px] font-black text-indigo-600 hover:underline"
        >
          Today
        </button>
      </div>
    </div>
  )
}
