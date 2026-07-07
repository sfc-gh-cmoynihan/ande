import { querySnowflake } from "@/lib/snowflake"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const claimId = searchParams.get("claimId")
  const name = searchParams.get("name")
  const email = searchParams.get("email")
  const dateFrom = searchParams.get("dateFrom")
  const dateTo = searchParams.get("dateTo")

  try {
    const conditions: string[] = []

    if (claimId) {
      const safe = claimId.replace(/'/g, "''").toUpperCase()
      conditions.push(`UPPER(c.CLAIM_ID) LIKE '%${safe}%'`)
    }
    if (name) {
      const words = name.replace(/'/g, "''").toUpperCase().split(/\s+/)
      const nameConds = words.map((w) => `UPPER(c.CUSTOMER_NAME) LIKE '%${w}%'`).join(" AND ")
      conditions.push(`(${nameConds})`)
    }
    if (email) {
      const safe = email.replace(/'/g, "''").toUpperCase()
      conditions.push(`UPPER(g.EMAIL) LIKE '%${safe}%'`)
    }
    if (dateFrom) {
      const safe = dateFrom.replace(/'/g, "''")
      conditions.push(`c.CLAIM_DATE >= '${safe}'`)
    }
    if (dateTo) {
      const safe = dateTo.replace(/'/g, "''")
      conditions.push(`c.CLAIM_DATE <= '${safe}'`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    const sql = `
      SELECT c.CLAIM_ID, c.MASTER_CUSTOMER_ID, c.CUSTOMER_NAME, c.CLAIM_TYPE, c.CLAIM_DATE,
             c.CLAIM_AMOUNT, c.STATUS, c.DESCRIPTION, c.RESOLUTION_DATE, c.COUNTRY,
             g.EMAIL AS CUSTOMER_EMAIL
      FROM ANDE_DB.PUBLIC.CUSTOMER_CLAIMS c
      LEFT JOIN ANDE_DB.PUBLIC.CUSTOMER_MASTER_GOLDEN_TABLE g
        ON c.MASTER_CUSTOMER_ID = g.MASTER_CUSTOMER_ID
      ${whereClause}
      ORDER BY c.CLAIM_DATE DESC
      LIMIT 30
    `

    const rows = await querySnowflake(sql)
    return Response.json(rows)
  } catch (e) {
    console.error(new Date().toISOString(), "[claims-search]", e)
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to search claims" },
      { status: 500 }
    )
  }
}
