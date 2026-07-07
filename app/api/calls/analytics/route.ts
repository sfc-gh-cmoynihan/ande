import { querySnowflake } from "@/lib/snowflake"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const [summary, byAgent, sentimentByAgent, byMonth, byType, churnRisk] = await Promise.all([
      querySnowflake(`
        SELECT COUNT(*) AS TOTAL_CALLS,
               ROUND(AVG(DURATION_SECONDS)) AS AVG_DURATION,
               ROUND(SUM(DURATION_SECONDS) / 60.0) AS TOTAL_MINUTES,
               COUNT(DISTINCT AGENT_NAME) AS TOTAL_AGENTS,
               COUNT(DISTINCT MASTER_CUSTOMER_ID) AS UNIQUE_CUSTOMERS
        FROM ANDE_DB.PUBLIC.CUSTOMER_CALLS
      `),
      querySnowflake(`
        SELECT AGENT_NAME, COUNT(*) AS CALL_COUNT, ROUND(AVG(DURATION_SECONDS)) AS AVG_DURATION,
               SUM(CASE WHEN SENTIMENT = 'Positive' THEN 1 ELSE 0 END) AS POSITIVE,
               SUM(CASE WHEN SENTIMENT = 'Neutral' THEN 1 ELSE 0 END) AS NEUTRAL,
               SUM(CASE WHEN SENTIMENT = 'Negative' THEN 1 ELSE 0 END) AS NEGATIVE
        FROM ANDE_DB.PUBLIC.CUSTOMER_CALLS
        GROUP BY AGENT_NAME
        ORDER BY CALL_COUNT DESC
      `),
      querySnowflake(`
        SELECT AGENT_NAME, SENTIMENT, COUNT(*) AS CNT
        FROM ANDE_DB.PUBLIC.CUSTOMER_CALLS
        GROUP BY AGENT_NAME, SENTIMENT
        ORDER BY AGENT_NAME, SENTIMENT
      `),
      querySnowflake(`
        SELECT TO_CHAR(CALL_DATE, 'YYYY-MM') AS MONTH, COUNT(*) AS CALL_COUNT,
               ROUND(AVG(DURATION_SECONDS)) AS AVG_DURATION,
               SUM(CASE WHEN SENTIMENT = 'Negative' THEN 1 ELSE 0 END) AS NEGATIVE_COUNT
        FROM ANDE_DB.PUBLIC.CUSTOMER_CALLS
        GROUP BY TO_CHAR(CALL_DATE, 'YYYY-MM')
        ORDER BY MONTH
      `),
      querySnowflake(`
        SELECT CALL_TYPE, COUNT(*) AS CNT, ROUND(AVG(DURATION_SECONDS)) AS AVG_DURATION
        FROM ANDE_DB.PUBLIC.CUSTOMER_CALLS
        GROUP BY CALL_TYPE
        ORDER BY CNT DESC
      `),
      querySnowflake(`
        SELECT c.MASTER_CUSTOMER_ID, g.FULL_NAME, COUNT(*) AS TOTAL_CALLS,
               SUM(CASE WHEN c.SENTIMENT = 'Negative' THEN 1 ELSE 0 END) AS NEGATIVE_CALLS,
               ROUND(SUM(CASE WHEN c.SENTIMENT = 'Negative' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) AS NEGATIVE_PCT,
               MAX(c.CALL_DATE) AS LAST_CALL
        FROM ANDE_DB.PUBLIC.CUSTOMER_CALLS c
        JOIN ANDE_DB.PUBLIC.CUSTOMER_MASTER_GOLDEN_TABLE g ON c.MASTER_CUSTOMER_ID = g.MASTER_CUSTOMER_ID
        GROUP BY c.MASTER_CUSTOMER_ID, g.FULL_NAME
        HAVING SUM(CASE WHEN c.SENTIMENT = 'Negative' THEN 1 ELSE 0 END) > 0
        ORDER BY NEGATIVE_PCT DESC
      `),
    ])

    return Response.json({
      summary: summary?.[0] || {},
      byAgent: byAgent || [],
      sentimentByAgent: sentimentByAgent || [],
      byMonth: byMonth || [],
      byType: byType || [],
      churnRisk: churnRisk || [],
    })
  } catch (e) {
    console.error("[calls/analytics]", e)
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
