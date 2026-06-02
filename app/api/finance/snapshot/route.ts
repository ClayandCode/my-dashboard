export const dynamic = 'force-dynamic'

// Vercel cron hits this at 05:00 UTC daily.
// Full pipeline: Google Drive API → XLSX → exceljs → Claude extraction → Supabase snapshot.
// Requires: GOOGLE_SHEETS_FINANCE_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_KEY
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const sheetId = process.env.GOOGLE_SHEETS_FINANCE_ID
  const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const serviceKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY

  if (!sheetId || !serviceEmail || !serviceKey) {
    return Response.json({
      ok: false,
      message: 'Google Sheets not configured — set GOOGLE_SHEETS_FINANCE_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_KEY',
    })
  }

  // TODO: implement when Google service account is set up
  // 1. Authenticate with Google using service account JWT
  // 2. Fetch XLSX via Drive API: GET /drive/v3/files/{sheetId}/export?mimeType=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
  // 3. Parse with exceljs
  // 4. Send raw sheet data to Claude for structured extraction
  // 5. Upsert snapshot into Supabase finance_snapshots table

  return Response.json({ ok: true, message: 'Google Sheets not yet configured' })
}
