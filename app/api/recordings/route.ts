import { querySnowflake } from "@/lib/snowflake"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  const name = searchParams.get("name")

  try {
    let sql = ""
    if (id) {
      const safe = id.replace(/'/g, "''")
      sql = `
        SELECT c.CALL_ID, c.SENTIMENT,
               c.MP4_FILE_PATH, c.TRANSCRIPTION,
               COALESCE(c.SUMMARY, 'No summary available') AS SUMMARY,
               BUILD_SCOPED_FILE_URL(@ANDE_DB.PUBLIC.CALL_RECORDINGS_STAGE,
                 REPLACE(c.MP4_FILE_PATH, '@ANDE_DB.PUBLIC.CALL_RECORDINGS_STAGE/', '')) AS PRESIGNED_URL,
               g.FULL_NAME
        FROM ANDE_DB.PUBLIC.CUSTOMER_CALLS c
        JOIN ANDE_DB.PUBLIC.CUSTOMER_MASTER_GOLDEN_TABLE g ON c.MASTER_CUSTOMER_ID = g.MASTER_CUSTOMER_ID
        WHERE c.MASTER_CUSTOMER_ID = '${safe}'
        ORDER BY c.CALL_DATE DESC
      `
    } else if (name) {
      const words = name.replace(/'/g, "''").toUpperCase().split(/\s+/)
      const conds = words.map((w) => `UPPER(g.FULL_NAME) LIKE '%${w}%'`).join(" AND ")
      sql = `
        SELECT c.CALL_ID, c.SENTIMENT,
               c.MP4_FILE_PATH, c.TRANSCRIPTION,
               COALESCE(c.SUMMARY, 'No summary available') AS SUMMARY,
               BUILD_SCOPED_FILE_URL(@ANDE_DB.PUBLIC.CALL_RECORDINGS_STAGE,
                 REPLACE(c.MP4_FILE_PATH, '@ANDE_DB.PUBLIC.CALL_RECORDINGS_STAGE/', '')) AS PRESIGNED_URL,
               g.FULL_NAME
        FROM ANDE_DB.PUBLIC.CUSTOMER_CALLS c
        JOIN ANDE_DB.PUBLIC.CUSTOMER_MASTER_GOLDEN_TABLE g ON c.MASTER_CUSTOMER_ID = g.MASTER_CUSTOMER_ID
        WHERE ${conds}
        ORDER BY c.CALL_DATE DESC
      `
    } else {
      return Response.json([])
    }
    const rows = await querySnowflake(sql)
    return Response.json(rows)
  } catch (e) {
    console.error(new Date().toISOString(), "[recordings]", e)
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to load recordings" },
      { status: 500 }
    )
  }
}
