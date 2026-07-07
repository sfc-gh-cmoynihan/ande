import { querySnowflake } from "@/lib/snowflake"
export const dynamic = "force-dynamic"

const BASE_SELECT = `
  SELECT c.CONTRACT_ID, c.CONTRACT_TITLE, c.CUSTOMER_NAME, c.MASTER_CUSTOMER_ID,
         c.CONTRACT_DATE, c.EXPIRY_DATE, c.CONTRACT_VALUE, c.STATUS,
         c.SIGNED_BY_CUSTOMER, c.SIGNED_BY_PROVIDER, c.SIGNATURE_DATE,
         CASE WHEN c.PDF_STAGE_PATH IS NOT NULL AND c.PDF_STAGE_PATH != ''
           THEN GET_PRESIGNED_URL(@ANDE_DB.PUBLIC.CONTRACT_DOCUMENTS_STAGE,
             REPLACE(REPLACE(c.PDF_STAGE_PATH, '@CUSTOMER_360.PUBLIC.CONTRACT_DOCUMENTS_STAGE/', ''), '@ANDE_DB.PUBLIC.CONTRACT_DOCUMENTS_STAGE/', ''))
           ELSE NULL END AS PDF_URL
  FROM ANDE_DB.PUBLIC.CUSTOMER_CONTRACTS c
`

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  const name = searchParams.get("name")
  const policyId = searchParams.get("policyId")
  const email = searchParams.get("email")

  try {
    let sql = ""
    if (policyId) {
      const safe = policyId.replace(/'/g, "''").toUpperCase()
      sql = `${BASE_SELECT} WHERE UPPER(c.CONTRACT_ID) LIKE '%${safe}%' ORDER BY c.CONTRACT_DATE DESC LIMIT 10`
    } else if (id) {
      const safe = id.replace(/'/g, "''")
      sql = `${BASE_SELECT} WHERE c.MASTER_CUSTOMER_ID = '${safe}' ORDER BY c.CONTRACT_DATE DESC LIMIT 10`
    } else if (name) {
      const words = name.replace(/'/g, "''").toUpperCase().split(/\s+/)
      const conds = words.map((w) => `UPPER(c.CUSTOMER_NAME) LIKE '%${w}%'`).join(" AND ")
      sql = `${BASE_SELECT} WHERE ${conds} ORDER BY c.CONTRACT_DATE DESC LIMIT 10`
    } else if (email) {
      const safe = email.replace(/'/g, "''").toUpperCase()
      sql = `${BASE_SELECT} WHERE UPPER(c.CUSTOMER_NAME) IN (SELECT UPPER(FULL_NAME) FROM ANDE_DB.PUBLIC.CUSTOMER_MASTER_GOLDEN_TABLE WHERE UPPER(EMAIL) = '${safe}') ORDER BY c.CONTRACT_DATE DESC LIMIT 10`
    } else {
      sql = `${BASE_SELECT} ORDER BY c.CONTRACT_DATE DESC LIMIT 10`
    }
    const rows = await querySnowflake(sql)
    return Response.json(rows)
  } catch (e) {
    console.error(new Date().toISOString(), "[contracts]", e)
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to load contracts" },
      { status: 500 }
    )
  }
}
