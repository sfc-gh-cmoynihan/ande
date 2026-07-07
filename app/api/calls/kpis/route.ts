import { querySnowflake } from "@/lib/snowflake"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const [summary, byChannel, hourly, daily, agentLeaderboard, keywords, monthlyTrends, sentimentTrend] = await Promise.all([
      querySnowflake(`
        SELECT
          COUNT(*) AS TOTAL_CALLS,
          ROUND(AVG(DURATION_SECONDS + WRAP_UP_SECONDS)) AS AHT,
          ROUND(AVG(WAIT_SECONDS)) AS AVG_WAIT,
          ROUND(AVG(DURATION_SECONDS)) AS AVG_TALK,
          ROUND(AVG(WRAP_UP_SECONDS)) AS AVG_WRAP,
          ROUND(SUM(CASE WHEN RESOLVED_FIRST_CALL THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0)) AS FCR_RATE,
          ROUND(AVG(CSAT_SCORE), 2) AS AVG_CSAT,
          ROUND(AVG(NPS_SCORE)) AS AVG_NPS,
          ROUND(SUM(CASE WHEN ABANDONED THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0)) AS ABANDON_RATE,
          ROUND(SUM(CASE WHEN WAIT_SECONDS <= 20 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0)) AS SERVICE_LEVEL,
          SUM(CASE WHEN NPS_SCORE >= 70 THEN 1 ELSE 0 END) AS PROMOTERS,
          SUM(CASE WHEN NPS_SCORE BETWEEN 30 AND 69 THEN 1 ELSE 0 END) AS PASSIVES,
          SUM(CASE WHEN NPS_SCORE < 30 THEN 1 ELSE 0 END) AS DETRACTORS
        FROM ANDE_DB.PUBLIC.CUSTOMER_CALLS
      `),
      querySnowflake(`
        SELECT CHANNEL, COUNT(*) AS CNT, ROUND(AVG(CSAT_SCORE), 2) AS AVG_CSAT,
               ROUND(AVG(DURATION_SECONDS + WRAP_UP_SECONDS)) AS AHT
        FROM ANDE_DB.PUBLIC.CUSTOMER_CALLS
        GROUP BY CHANNEL ORDER BY CNT DESC
      `),
      querySnowflake(`
        SELECT HOUR(CALL_DATE) AS HOUR_OF_DAY, COUNT(*) AS CALL_COUNT,
               ROUND(AVG(WAIT_SECONDS)) AS AVG_WAIT
        FROM ANDE_DB.PUBLIC.CUSTOMER_CALLS
        GROUP BY HOUR(CALL_DATE) ORDER BY HOUR_OF_DAY
      `),
      querySnowflake(`
        SELECT DAYNAME(CALL_DATE) AS DAY_NAME, DAYOFWEEK(CALL_DATE) AS DAY_NUM, COUNT(*) AS CALL_COUNT,
               ROUND(AVG(WAIT_SECONDS)) AS AVG_WAIT
        FROM ANDE_DB.PUBLIC.CUSTOMER_CALLS
        GROUP BY DAYNAME(CALL_DATE), DAYOFWEEK(CALL_DATE) ORDER BY DAY_NUM
      `),
      querySnowflake(`
        SELECT AGENT_NAME, COUNT(*) AS TOTAL_CALLS,
               ROUND(AVG(DURATION_SECONDS + WRAP_UP_SECONDS)) AS AHT,
               ROUND(SUM(CASE WHEN RESOLVED_FIRST_CALL THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0)) AS FCR_RATE,
               ROUND(AVG(CSAT_SCORE), 2) AS AVG_CSAT,
               ROUND(AVG(NPS_SCORE)) AS AVG_NPS,
               ROUND(AVG(WAIT_SECONDS)) AS AVG_WAIT,
               SUM(CASE WHEN SENTIMENT = 'Positive' THEN 1 ELSE 0 END) AS POSITIVE,
               SUM(CASE WHEN SENTIMENT = 'Neutral' THEN 1 ELSE 0 END) AS NEUTRAL,
               SUM(CASE WHEN SENTIMENT = 'Negative' THEN 1 ELSE 0 END) AS NEGATIVE
        FROM ANDE_DB.PUBLIC.CUSTOMER_CALLS
        GROUP BY AGENT_NAME ORDER BY AVG_CSAT DESC
      `),
      querySnowflake(`
        SELECT VALUE AS KEYWORD, COUNT(*) AS CNT
        FROM ANDE_DB.PUBLIC.CUSTOMER_CALLS,
             LATERAL SPLIT_TO_TABLE(KEYWORDS, ',')
        GROUP BY VALUE ORDER BY CNT DESC LIMIT 20
      `),
      querySnowflake(`
        SELECT TO_CHAR(CALL_DATE, 'YYYY-MM') AS MONTH,
               COUNT(*) AS CALL_COUNT,
               ROUND(AVG(DURATION_SECONDS + WRAP_UP_SECONDS)) AS AHT,
               ROUND(SUM(CASE WHEN RESOLVED_FIRST_CALL THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0)) AS FCR_RATE,
               ROUND(AVG(CSAT_SCORE), 2) AS AVG_CSAT,
               ROUND(SUM(CASE WHEN ABANDONED THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0)) AS ABANDON_RATE
        FROM ANDE_DB.PUBLIC.CUSTOMER_CALLS
        GROUP BY TO_CHAR(CALL_DATE, 'YYYY-MM') ORDER BY MONTH
      `),
      querySnowflake(`
        SELECT TO_CHAR(CALL_DATE, 'YYYY-MM') AS MONTH, SENTIMENT, COUNT(*) AS CNT
        FROM ANDE_DB.PUBLIC.CUSTOMER_CALLS
        GROUP BY TO_CHAR(CALL_DATE, 'YYYY-MM'), SENTIMENT
        ORDER BY MONTH
      `),
    ])

    return Response.json({
      summary: summary?.[0] || {},
      byChannel: byChannel || [],
      hourly: hourly || [],
      daily: daily || [],
      agentLeaderboard: agentLeaderboard || [],
      keywords: keywords || [],
      monthlyTrends: monthlyTrends || [],
      sentimentTrend: sentimentTrend || [],
    })
  } catch (e) {
    console.error("[calls/kpis]", e)
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
