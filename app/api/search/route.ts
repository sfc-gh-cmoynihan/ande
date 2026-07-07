import { querySnowflake } from "@/lib/snowflake"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const company = searchParams.get("company")
  const contactId = searchParams.get("contactId")
  const email = searchParams.get("email")
  const phone = searchParams.get("phone")
  const id = searchParams.get("id")

  try {
    let rows
    if (company) {
      const safe = company.replace(/'/g, "''")
      const isSnowflake = safe.toUpperCase().includes("SNOWFLAKE")
      const companyCond = isSnowflake
        ? `UPPER(SF_ACCOUNT_NAME) LIKE '%SNOWFLAKE%'`
        : `SF_ACCOUNT_NAME = '${safe}'`
      rows = await querySnowflake(`
        SELECT MASTER_CUSTOMER_ID, FULL_NAME, 'Snowflake Inc' AS SF_ACCOUNT_NAME, EMAIL, PHONE,
               CITY, COUNTRY, PPSN_SSN, TITLE, RECORD_COUNT
        FROM ANDE_DB.PUBLIC.CUSTOMER_MASTER_GOLDEN_TABLE
        WHERE ${companyCond}
        ORDER BY FULL_NAME
        LIMIT 100
      `)
    } else if (contactId) {
      const safe = contactId.replace(/'/g, "''")
      rows = await querySnowflake(`
        SELECT MASTER_CUSTOMER_ID, FULL_NAME, SF_ACCOUNT_NAME, EMAIL, PHONE,
               CITY, COUNTRY, PPSN_SSN, TITLE, RECORD_COUNT
        FROM ANDE_DB.PUBLIC.CUSTOMER_MASTER_GOLDEN_TABLE
        WHERE MASTER_CUSTOMER_ID = '${safe}'
      `)
    } else if (email) {
      const safe = email.replace(/'/g, "''")
      rows = await querySnowflake(`
        SELECT MASTER_CUSTOMER_ID, FULL_NAME, SF_ACCOUNT_NAME, EMAIL, PHONE,
               CITY, COUNTRY, PPSN_SSN, TITLE, RECORD_COUNT
        FROM ANDE_DB.PUBLIC.CUSTOMER_MASTER_GOLDEN_TABLE
        WHERE UPPER(EMAIL) LIKE '%${safe.toUpperCase()}%'
        ORDER BY FULL_NAME
        LIMIT 50
      `)
    } else if (phone) {
      const digits = phone.replace(/[^0-9]/g, "")
      rows = await querySnowflake(`
        SELECT MASTER_CUSTOMER_ID, FULL_NAME, SF_ACCOUNT_NAME, EMAIL, PHONE,
               CITY, COUNTRY, PPSN_SSN, TITLE, RECORD_COUNT
        FROM ANDE_DB.PUBLIC.CUSTOMER_MASTER_GOLDEN_TABLE
        WHERE REGEXP_REPLACE(PHONE, '[^0-9]', '') LIKE '%${digits}%'
           OR REGEXP_REPLACE(MOBILE_PHONE, '[^0-9]', '') LIKE '%${digits}%'
        ORDER BY FULL_NAME
        LIMIT 50
      `)
    } else if (id) {
      const safe = id.replace(/'/g, "''")
      rows = await querySnowflake(`
        SELECT MASTER_CUSTOMER_ID, FULL_NAME, SF_ACCOUNT_NAME, EMAIL, PHONE,
               CITY, COUNTRY, PPSN_SSN, TITLE, RECORD_COUNT
        FROM ANDE_DB.PUBLIC.CUSTOMER_MASTER_GOLDEN_TABLE
        WHERE UPPER(MASTER_CUSTOMER_ID) LIKE '%${safe.toUpperCase()}%'
        ORDER BY FULL_NAME
        LIMIT 50
      `)
    } else {
      return Response.json([])
    }
    return Response.json(rows)
  } catch (e) {
    console.error(new Date().toISOString(), "[search]", e)
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to search" },
      { status: 500 }
    )
  }
}
