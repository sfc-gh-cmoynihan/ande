import { querySnowflake } from "@/lib/snowflake"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const rows = await querySnowflake(`
      SELECT c.CALL_ID, c.CALL_DATE, c.DURATION_SECONDS, c.AGENT_NAME,
             c.CALL_TYPE, c.SENTIMENT, c.MP4_FILE_PATH, c.TRANSCRIPTION,
             c.MASTER_CUSTOMER_ID, g.FULL_NAME
      FROM ANDE_DB.PUBLIC.CUSTOMER_CALLS c
      JOIN ANDE_DB.PUBLIC.CUSTOMER_MASTER_GOLDEN_TABLE g ON c.MASTER_CUSTOMER_ID = g.MASTER_CUSTOMER_ID
      ORDER BY c.CALL_DATE DESC
    `)
    return Response.json(rows || [])
  } catch (e) {
    console.error("[calls/all]", e)
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
