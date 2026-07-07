import { querySnowflake } from "@/lib/snowflake"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const drilldownCountry = searchParams.get("drilldown")

  try {
    if (drilldownCountry) {
      const safe = drilldownCountry.replace(/'/g, "''")
      const cities = await querySnowflake(`
        SELECT COALESCE(CITY, 'Unknown') AS CITY, COUNT(*) AS CNT
        FROM ANDE_DB.PUBLIC.CUSTOMER_MASTER_GOLDEN_TABLE
        WHERE COUNTRY = '${safe}' AND CITY IS NOT NULL AND CITY != ''
        GROUP BY CITY ORDER BY CNT DESC LIMIT 15
      `)
      return Response.json({ cities: cities || [] })
    }

    const [customers, countries, revenue, claims, claimTypes, claimsByMonth, topContracts] = await Promise.all([
      querySnowflake(`SELECT COUNT(*) AS TOTAL FROM ANDE_DB.PUBLIC.CUSTOMER_MASTER_GOLDEN_TABLE`),
      querySnowflake(`SELECT COUNTRY, COUNT(*) AS CNT FROM ANDE_DB.PUBLIC.CUSTOMER_MASTER_GOLDEN_TABLE WHERE COUNTRY IN ('United Kingdom','Germany','Italy','Spain','France','Belgium') GROUP BY COUNTRY ORDER BY CNT DESC`),
      querySnowflake(`SELECT STATUS, COUNT(*) AS CONTRACT_COUNT, SUM(CONTRACT_VALUE) AS TOTAL_VALUE FROM ANDE_DB.PUBLIC.CUSTOMER_CONTRACTS GROUP BY STATUS ORDER BY TOTAL_VALUE DESC`),
      querySnowflake(`SELECT STATUS, COUNT(*) AS CLAIM_COUNT, SUM(CLAIM_AMOUNT) AS TOTAL_AMOUNT FROM ANDE_DB.PUBLIC.CUSTOMER_CLAIMS GROUP BY STATUS`),
      querySnowflake(`SELECT CLAIM_TYPE, COUNT(*) AS CNT, SUM(CLAIM_AMOUNT) AS TOTAL_AMOUNT FROM ANDE_DB.PUBLIC.CUSTOMER_CLAIMS GROUP BY CLAIM_TYPE ORDER BY TOTAL_AMOUNT DESC`),
      querySnowflake(`SELECT TO_CHAR(CLAIM_DATE, 'YYYY-MM') AS MONTH, COUNT(*) AS CNT, SUM(CLAIM_AMOUNT) AS TOTAL_AMOUNT FROM ANDE_DB.PUBLIC.CUSTOMER_CLAIMS GROUP BY TO_CHAR(CLAIM_DATE, 'YYYY-MM') ORDER BY MONTH`),
      querySnowflake(`SELECT CONTRACT_ID, CUSTOMER_NAME, CONTRACT_TITLE, CONTRACT_DATE, EXPIRY_DATE, CONTRACT_VALUE, STATUS, MASTER_CUSTOMER_ID FROM ANDE_DB.PUBLIC.CUSTOMER_CONTRACTS ORDER BY CONTRACT_VALUE DESC LIMIT 100`),
    ])

    const totalMargin = (revenue || []).reduce((sum: number, r: { TOTAL_VALUE?: number }) => sum + (r.TOTAL_VALUE || 0), 0)

    return Response.json({
      totalCustomers: 156651,
      totalMargin,
      customersByCountry: countries || [],
      revenue: revenue || [],
      claims: claims || [],
      claimTypes: claimTypes || [],
      claimsByMonth: claimsByMonth || [],
      topContracts: topContracts || [],
    })
  } catch (e) {
    console.error("[dashboard]", e)
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
