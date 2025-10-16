// src/app/post-checkout/page.tsx  (SERVER component)
import PostCheckoutClient from './PostCheckoutClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function Page() {
  return <PostCheckoutClient />
}
