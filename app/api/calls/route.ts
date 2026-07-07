import { querySnowflake } from "@/lib/snowflake"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const agent = searchParams.get("agent")
  const name = searchParams.get("name")

  try {
    const conditions: string[] = []
    if (agent) {
      const safe = agent.replace(/'/g, "''").toUpperCase()
      conditions.push(`UPPER(c.AGENT_NAME) LIKE '%${safe}%'`)
    }
    if (name) {
      const words = name.replace(/'/g, "''").toUpperCase().split(/\s+/)
      const nameConds = words.map((w) => `UPPER(FULL_NAME) LIKE '%${w}%'`).join(" AND ")
      conditions.push(`c.MASTER_CUSTOMER_ID IN (SELECT MASTER_CUSTOMER_ID FROM ANDE_DB.PUBLIC.CUSTOMER_MASTER_GOLDEN_TABLE WHERE ${nameConds} LIMIT 5)`)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    const sql = `
      SELECT c.CALL_ID, c.CALL_DATE, c.DURATION_SECONDS, c.AGENT_NAME,
             c.CALL_TYPE, c.SENTIMENT, c.SUMMARY, c.TRANSCRIPTION, c.MP4_FILE_PATH,
             c.MASTER_CUSTOMER_ID
      FROM ANDE_DB.PUBLIC.CUSTOMER_CALLS c
      ${where}
      ORDER BY c.CALL_DATE DESC
      LIMIT 50
    `
    const rows = await querySnowflake(sql)
    return Response.json(rows)
  } catch (e) {
    console.error(new Date().toISOString(), "[calls]", e)
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to load calls" },
      { status: 500 }
    )
  }
}
