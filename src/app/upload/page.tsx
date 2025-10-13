
// server file (no "use client" here)
export const dynamic = 'force-dynamic'
export const revalidate = 0

import UploadWithChatPage from './UploadClient'

export default function Page() {
  return <UploadWithChatPage />
}
