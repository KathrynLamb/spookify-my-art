'use client'

import React from 'react'
import clsx from 'clsx'

type ChipProps = {
  children: React.ReactNode
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
  className?: string
}

export function Chip({ children, selected, disabled, onClick, className }: ChipProps) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      aria-pressed={selected}
      disabled={disabled}
      className={clsx(
        'px-3 py-1.5 rounded-full text-sm border transition',
        selected
          ? 'bg-white text-black border-white'
          : 'bg-white/5 text-white border-white/10 hover:border-white/30',
        disabled && 'opacity-40 cursor-not-allowed',
        className
      )}
    >
      {children}
    </button>
  )
}

type ChipGroupProps<T extends string> = {
  options: readonly T[]
  value: T | undefined
  onChange: (v: T) => void
  isDisabled?: (v: T) => boolean
  className?: string
}

export function ChipGroup<T extends string>({
  options, value, onChange, isDisabled, className,
}: ChipGroupProps<T>) {
  return (
    <div className={clsx('flex flex-wrap gap-2', className)}>
      {options.map(opt => (
        <Chip
          key={opt}
          selected={opt === value}
          disabled={isDisabled?.(opt) ?? false}
          onClick={() => onChange(opt)}
        >
          {opt}
        </Chip>
      ))}
    </div>
  )
}
