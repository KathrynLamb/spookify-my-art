import LovifyDesignPage from "./LovifyDesignClient"

// server file (no "use client" here)
export const dynamic = 'force-dynamic'
export const revalidate = 0



export default function Page() {
  return <LovifyDesignPage />
}
