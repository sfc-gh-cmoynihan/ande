import { querySnowflake } from "@/lib/snowflake"
export const dynamic = "force-dynamic"

const TABLE_SCHEMAS: Record<string, string> = {
  contracts: `Table: ANDE_DB.PUBLIC.CUSTOMER_CONTRACTS
Columns: CONTRACT_ID (TEXT), MASTER_CUSTOMER_ID (TEXT), CUSTOMER_NAME (TEXT), CONTRACT_TITLE (TEXT), CONTRACT_DATE (DATE), EXPIRY_DATE (DATE), CONTRACT_VALUE (NUMBER in euros), STATUS (TEXT: Active/Expired/Pending), SIGNED_BY_CUSTOMER (TEXT), SIGNED_BY_PROVIDER (TEXT), SIGNATURE_DATE (DATE)
Note: Do NOT select PDF_STAGE_PATH or CONTRACT_TEXT columns`,
  calls: `Table: ANDE_DB.PUBLIC.CUSTOMER_CALLS
Columns: CALL_ID (TEXT), MASTER_CUSTOMER_ID (TEXT), CALL_DATE (TIMESTAMP), DURATION_SECONDS (NUMBER), AGENT_NAME (TEXT), CALL_TYPE (TEXT: Inbound/Outbound/Support), SENTIMENT (TEXT: Positive/Negative/Neutral), SUMMARY (TEXT)`,
  customers: `Table: ANDE_DB.PUBLIC.CUSTOMER_MASTER_GOLDEN_TABLE
Columns: MASTER_CUSTOMER_ID (TEXT), SOURCE_SYSTEM (TEXT: SALESFORCE/SAP/WEB), FULL_NAME (TEXT), FIRST_NAME (TEXT), LAST_NAME (TEXT), EMAIL (TEXT), PHONE (TEXT), MOBILE_PHONE (TEXT), CITY (TEXT), COUNTRY (TEXT), POSTAL_CODE (TEXT), STREET (TEXT), SF_ACCOUNT_NAME (TEXT), TITLE (TEXT), DEPARTMENT (TEXT), MATCH_CONFIDENCE (FLOAT), RECORD_COUNT (NUMBER), DATE_OF_BIRTH (DATE)`,
  web: `Table: ANDE_DB.PUBLIC.WEB_ACTIVITY
Columns: ACTIVITY_ID (TEXT), MASTER_CUSTOMER_ID (TEXT), ACTIVITY_TYPE (TEXT), PAGE_URL (TEXT), SESSION_DURATION_SECONDS (NUMBER), PAGES_VIEWED (NUMBER), CHANNEL (TEXT: organic/paid/social/email/direct), DEVICE_TYPE (TEXT: desktop/mobile/tablet), BROWSER (TEXT), ACTIVITY_DATE (TIMESTAMP), FORM_SUBMITTED (BOOLEAN), FORM_NAME (TEXT), CAMPAIGN_SOURCE (TEXT), CAMPAIGN_MEDIUM (TEXT)`,
  dependents: `Table: ANDE_DB.PUBLIC.CUSTOMER_DEPENDENTS
Columns: DEPENDENT_ID (TEXT), MASTER_CUSTOMER_ID (TEXT), FULL_NAME (TEXT), DATE_OF_BIRTH (DATE), GENDER (TEXT), RELATIONSHIP (TEXT: Spouse/Child/Parent), DRIVER_STATUS (TEXT), LICENSE_TYPE (TEXT)`,
}

const VERIFIED_QUERIES: Record<string, string> = {
  "what is the total value of all active contracts?": `SELECT SUM(CONTRACT_VALUE) AS TOTAL_ACTIVE_CONTRACT_VALUE FROM ANDE_DB.PUBLIC.CUSTOMER_CONTRACTS WHERE STATUS = 'Active'`,
  "show me contracts expiring in the next 30 days": `SELECT CONTRACT_ID, CUSTOMER_NAME, CONTRACT_TITLE, TO_CHAR(EXPIRY_DATE, 'DD Mon YYYY') AS EXPIRY_DATE, CONTRACT_VALUE, STATUS FROM ANDE_DB.PUBLIC.CUSTOMER_CONTRACTS WHERE EXPIRY_DATE BETWEEN CURRENT_DATE AND DATEADD(day, 30, CURRENT_DATE) ORDER BY EXPIRY_DATE LIMIT 20`,
  "which contracts have the highest value?": `SELECT CONTRACT_ID, CUSTOMER_NAME, CONTRACT_TITLE, CONTRACT_VALUE, STATUS, TO_CHAR(CONTRACT_DATE, 'DD Mon YYYY') AS CONTRACT_DATE FROM ANDE_DB.PUBLIC.CUSTOMER_CONTRACTS ORDER BY CONTRACT_VALUE DESC LIMIT 20`,
  "what is the sentiment breakdown across all calls?": `SELECT SENTIMENT, COUNT(*) AS CALL_COUNT FROM ANDE_DB.PUBLIC.CUSTOMER_CALLS GROUP BY SENTIMENT ORDER BY CALL_COUNT DESC`,
  "how many calls had negative sentiment?": `SELECT COUNT(*) AS NEGATIVE_CALL_COUNT FROM ANDE_DB.PUBLIC.CUSTOMER_CALLS WHERE SENTIMENT = 'Negative'`,
  "show me top 10 customers by contract value": `SELECT c.CUSTOMER_NAME, SUM(c.CONTRACT_VALUE) AS TOTAL_CONTRACT_VALUE, COUNT(*) AS CONTRACT_COUNT FROM ANDE_DB.PUBLIC.CUSTOMER_CONTRACTS c GROUP BY c.CUSTOMER_NAME ORDER BY TOTAL_CONTRACT_VALUE DESC LIMIT 10`,
  "which customers have the most source records?": `SELECT MASTER_CUSTOMER_ID, FULL_NAME, RECORD_COUNT, EMAIL, CITY FROM ANDE_DB.PUBLIC.CUSTOMER_MASTER_GOLDEN_TABLE ORDER BY RECORD_COUNT DESC LIMIT 20`,
  "which customers have negative call sentiment?": `SELECT DISTINCT g.FULL_NAME, g.EMAIL, c.CALL_DATE, c.SUMMARY FROM ANDE_DB.PUBLIC.CUSTOMER_CALLS c JOIN ANDE_DB.PUBLIC.CUSTOMER_MASTER_GOLDEN_TABLE g ON c.MASTER_CUSTOMER_ID = g.MASTER_CUSTOMER_ID WHERE c.SENTIMENT = 'Negative' ORDER BY c.CALL_DATE DESC LIMIT 20`,
  "which customers have expired contracts?": `SELECT DISTINCT c.CUSTOMER_NAME, c.CONTRACT_TITLE, TO_CHAR(c.EXPIRY_DATE, 'DD Mon YYYY') AS EXPIRY_DATE, c.CONTRACT_VALUE FROM ANDE_DB.PUBLIC.CUSTOMER_CONTRACTS c WHERE c.STATUS = 'Expired' ORDER BY c.EXPIRY_DATE DESC LIMIT 20`,
  "find all contracts signed by colm moynihan": `SELECT CONTRACT_ID, CONTRACT_TITLE, TO_CHAR(CONTRACT_DATE, 'DD Mon YYYY') AS CONTRACT_DATE, TO_CHAR(EXPIRY_DATE, 'DD Mon YYYY') AS EXPIRY_DATE, CONTRACT_VALUE, STATUS FROM ANDE_DB.PUBLIC.CUSTOMER_CONTRACTS WHERE UPPER(SIGNED_BY_CUSTOMER) LIKE '%MOYNIHAN%' OR UPPER(CUSTOMER_NAME) LIKE '%MOYNIHAN%' ORDER BY CONTRACT_DATE DESC LIMIT 20`,
}

function routeQuestion(question: string): string[] {
  const q = question.toLowerCase()
  const routes: string[] = []
  if (q.match(/contract|expir|active|pending|signed|revenue|average|total value|highest value|value/)) routes.push("contracts")
  if (q.match(/call|sentiment|agent_name|duration|negative|positive|neutral|churn/)) routes.push("calls")
  if (q.match(/customer|record count|source system|top 10|top ten|name|email|city|country|department|source record/)) routes.push("customers")
  if (q.match(/web|session|channel|device|browser|page|campaign|form/)) routes.push("web")
  if (q.match(/dependent|family|spouse|child|relationship|license/)) routes.push("dependents")
  if (routes.length === 0) {
    routes.push("customers")
    routes.push("contracts")
    routes.push("calls")
  }
  return routes
}

async function runSQL(sql: string): Promise<string | null> {
  try {
    const dataRows = await querySnowflake(sql)
    if (!dataRows || dataRows.length === 0) return "No results found for that query."

    if (dataRows.length === 1 && Object.keys(dataRows[0]).length <= 3) {
      return Object.entries(dataRows[0]).map(([k, v]) => `**${k.replace(/_/g, " ")}**: ${v}`).join(" | ")
    }

    const cols = Object.keys(dataRows[0])
    let table = "| " + cols.join(" | ") + " |\n"
    table += "| " + cols.map(() => "---").join(" | ") + " |\n"
    for (const row of dataRows.slice(0, 20)) {
      table += "| " + cols.map(c => row[c] ?? "").join(" | ") + " |\n"
    }
    return table
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return `*Query error: ${msg.slice(0, 300)}*`
  }
}

async function generateAndRunSQL(question: string, schemas: string[], model: string): Promise<string | null> {
  const schemaText = schemas.map(s => TABLE_SCHEMAS[s]).join("\n\n")
  const escapedQ = question.replace(/'/g, "''")

  const prompt = `You are a Snowflake SQL generator. Output ONLY the SQL query with no other text, no explanation, no markdown fences, no comments. Just raw SQL.
Rules:
- Use fully qualified table names (ANDE_DB.PUBLIC.TABLE_NAME)
- Only use columns from the schema below
- NEVER use SELECT * - always list specific columns
- For DATE columns, use TO_CHAR(col, 'DD Mon YYYY') to format dates
- LIMIT 20
- Output ONLY the SQL, nothing else

${schemaText}

Question: ${escapedQ}
SQL:`

  const escapedPrompt = prompt.replace(/'/g, "''")

  try {
    const rows = await querySnowflake(`
      SELECT SNOWFLAKE.CORTEX.COMPLETE('${model}', '${escapedPrompt}') AS SQL_QUERY
    `)

    if (!rows || rows.length === 0) return null

    let sql = (rows[0].SQL_QUERY || "").trim()
    sql = sql.replace(/<think>[\s\S]*?<\/think>/gi, "").trim()
    sql = sql.replace(/^```sql\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/g, "").trim()
    sql = sql.replace(/```/g, "").trim()
    sql = sql.replace(/^\s*sql\s*\n/i, "").trim()
    const sqlMatch = sql.match(/((?:SELECT|WITH)\b[\s\S]*?)(?:;|\s*$)/i)
    if (sqlMatch) sql = sqlMatch[1].trim()
    sql = sql.replace(/;$/, "").trim()
    if (sql.toUpperCase().startsWith("SELECT") || sql.toUpperCase().startsWith("WITH")) {
      if (!sql.toUpperCase().includes("LIMIT")) sql += " LIMIT 20"
      return await runSQL(sql)
    }
    return null
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes("SQL compilation") || msg.includes("does not exist")) {
      return `*Query error: ${msg.slice(0, 300)}*`
    }
    return null
  }
}

export async function POST(req: Request) {
  try {
    const { messages, model } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "messages array required" }, { status: 400 })
    }

    const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === "user")
    const question = lastUserMsg?.content?.[0]?.text || lastUserMsg?.content || ""

    if (!question) {
      return Response.json({ error: "No question found" }, { status: 400 })
    }

    const llmModel = model || "claude-opus-4-8"

    const now = new Date()
    const bstTime = now.toLocaleString("en-GB", { timeZone: "Europe/London", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
    const prefix = `**Model:** ${llmModel} | **Time:** ${bstTime} BST\n\n`

    const verifiedSQL = VERIFIED_QUERIES[question.toLowerCase().trim()]
    if (verifiedSQL) {
      const result = await runSQL(verifiedSQL)
      if (result) {
        return Response.json({ answer: prefix + result })
      }
    }

    const schemas = routeQuestion(question)
    const answer = await generateAndRunSQL(question, schemas, llmModel)

    if (answer) {
      return Response.json({ answer: prefix + answer })
    }

    const fallbackSchemas = Object.keys(TABLE_SCHEMAS)
    const fallbackAnswer = await generateAndRunSQL(question, fallbackSchemas, llmModel)
    if (fallbackAnswer) {
      return Response.json({ answer: prefix + fallbackAnswer })
    }

    return Response.json({ answer: prefix + "I couldn't generate a valid query for that question. Try rephrasing or ask about customers, contracts, calls, web activity, or dependents." })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[agent] error:", message)
    return Response.json({ error: message }, { status: 500 })
  }
}
