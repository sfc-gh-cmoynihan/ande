import { querySnowflake } from "@/lib/snowflake"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const [flaggedCalls, wordStats, summary] = await Promise.all([
      querySnowflake(`
        SELECT f.FLAG_ID, f.CALL_ID, f.WORD_MATCHED, f.CATEGORY, f.CONTEXT,
               f.STATUS, f.REVIEWED_BY, f.REVIEWED_AT, f.REVIEW_NOTES, f.FLAGGED_AT,
               c.CALL_DATE, c.AGENT_NAME, c.DURATION_SECONDS, c.SENTIMENT,
               g.FULL_NAME, c.MASTER_CUSTOMER_ID, c.TRANSCRIPTION
        FROM ANDE_DB.PUBLIC.CALL_GOVERNANCE_FLAGS f
        JOIN ANDE_DB.PUBLIC.CUSTOMER_CALLS c ON f.CALL_ID = c.CALL_ID
        JOIN ANDE_DB.PUBLIC.CUSTOMER_MASTER_GOLDEN_TABLE g ON c.MASTER_CUSTOMER_ID = g.MASTER_CUSTOMER_ID
        ORDER BY f.FLAGGED_AT DESC
      `),
      querySnowflake(`
        SELECT CATEGORY, COUNT(*) as WORD_COUNT
        FROM ANDE_DB.PUBLIC.CALL_GOVERNANCE_WORDS
        GROUP BY CATEGORY
        ORDER BY WORD_COUNT DESC
      `),
      querySnowflake(`
        SELECT 
          COUNT(DISTINCT CALL_ID) as TOTAL_FLAGGED_CALLS,
          COUNT(*) as TOTAL_FLAGS,
          COUNT(CASE WHEN STATUS = 'PENDING' THEN 1 END) as PENDING_COUNT,
          COUNT(CASE WHEN STATUS = 'REVIEWED' THEN 1 END) as REVIEWED_COUNT,
          COUNT(CASE WHEN STATUS = 'ESCALATED' THEN 1 END) as ESCALATED_COUNT,
          COUNT(DISTINCT CASE WHEN STATUS = 'PENDING' THEN CALL_ID END) as PENDING_CALLS
        FROM ANDE_DB.PUBLIC.CALL_GOVERNANCE_FLAGS
      `)
    ])
    return Response.json({ flaggedCalls, wordStats, summary: summary?.[0] || {} })
  } catch (e) {
    console.error("[calls/governance]", e)
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { flagId, action, reviewNotes, reviewedBy } = await req.json()
    if (!flagId || !action) {
      return Response.json({ error: "Missing flagId or action" }, { status: 400 })
    }
    const status = action === "approve" ? "REVIEWED" : action === "escalate" ? "ESCALATED" : "PENDING"
    await querySnowflake(`
      UPDATE ANDE_DB.PUBLIC.CALL_GOVERNANCE_FLAGS
      SET STATUS = '${status}',
          REVIEWED_BY = '${reviewedBy || "Colm Moynihan"}',
          REVIEWED_AT = CURRENT_TIMESTAMP(),
          REVIEW_NOTES = '${(reviewNotes || "").replace(/'/g, "''")}'
      WHERE FLAG_ID = ${flagId}
    `)
    return Response.json({ success: true, status })
  } catch (e) {
    console.error("[calls/governance POST]", e)
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
