'use client'

import clsx from 'clsx'

export default function Skeleton({ className }: { className?: string }) {
  return (
    <div className={clsx('animate-pulse rounded bg-white/10', className)} />
  )
}
