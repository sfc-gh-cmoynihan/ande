import { querySnowflake } from "@/lib/snowflake"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const [customers, countries, revenue, claims, claimTypes, claimsByMonth] = await Promise.all([
      querySnowflake(`SELECT COUNT(*) AS TOTAL FROM CUSTOMER_360.PUBLIC.CUSTOMER_MASTER_GOLDEN_TABLE`),
      querySnowflake(`SELECT COUNTRY, COUNT(*) AS CNT FROM CUSTOMER_360.PUBLIC.CUSTOMER_MASTER_GOLDEN_TABLE WHERE COUNTRY IS NOT NULL GROUP BY COUNTRY ORDER BY CNT DESC LIMIT 12`),
      querySnowflake(`SELECT STATUS, COUNT(*) AS CONTRACT_COUNT, SUM(CONTRACT_VALUE) AS TOTAL_VALUE FROM CUSTOMER_360.PUBLIC.CUSTOMER_CONTRACTS GROUP BY STATUS ORDER BY TOTAL_VALUE DESC`),
      querySnowflake(`SELECT STATUS, COUNT(*) AS CLAIM_COUNT, SUM(CLAIM_AMOUNT) AS TOTAL_AMOUNT FROM CUSTOMER_360.PUBLIC.CUSTOMER_CLAIMS GROUP BY STATUS`),
      querySnowflake(`SELECT CLAIM_TYPE, COUNT(*) AS CNT, SUM(CLAIM_AMOUNT) AS TOTAL_AMOUNT FROM CUSTOMER_360.PUBLIC.CUSTOMER_CLAIMS GROUP BY CLAIM_TYPE ORDER BY TOTAL_AMOUNT DESC`),
      querySnowflake(`SELECT TO_CHAR(CLAIM_DATE, 'YYYY-MM') AS MONTH, COUNT(*) AS CNT, SUM(CLAIM_AMOUNT) AS TOTAL_AMOUNT FROM CUSTOMER_360.PUBLIC.CUSTOMER_CLAIMS GROUP BY TO_CHAR(CLAIM_DATE, 'YYYY-MM') ORDER BY MONTH`),
    ])

    return Response.json({
      totalCustomers: customers?.[0]?.TOTAL || 0,
      customersByCountry: countries || [],
      revenue: revenue || [],
      claims: claims || [],
      claimTypes: claimTypes || [],
      claimsByMonth: claimsByMonth || [],
    })
  } catch (e) {
    console.error("[dashboard]", e)
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
