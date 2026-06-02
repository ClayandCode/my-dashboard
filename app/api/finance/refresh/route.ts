// Manual trigger for the finance snapshot, callable from the dashboard UI.
// Auth is handled by the proxy auth gate (session cookie).
// Forwards to the snapshot route using the API_SECRET so it passes auth there.
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const origin = new URL(request.url).origin
  const res = await fetch(`${origin}/api/finance/snapshot`, {
    headers: {
      'x-api-secret': process.env.API_SECRET ?? '',
    },
  })

  const data = await res.json()
  return Response.json(data, { status: res.status })
}
