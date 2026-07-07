import { querySnowflake } from "@/lib/snowflake"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const format = searchParams.get("format")

  try {
    const words = await querySnowflake(`
      SELECT WORD, CATEGORY
      FROM ANDE_DB.PUBLIC.CALL_GOVERNANCE_WORDS
      ORDER BY WORD ASC
    `)

    if (format === "pdf") {
      const pdf = generatePDF(words as { WORD: string; CATEGORY: string }[])
      return new Response(pdf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": "attachment; filename=Red_Flag_Word_List.pdf",
        },
      })
    }

    return Response.json(words)
  } catch (e) {
    console.error("[calls/governance/words]", e)
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}

function generatePDF(words: { WORD: string; CATEGORY: string }[]) {
  const lines: string[] = []
  const pageWidth = 595
  const pageHeight = 842
  const margin = 50
  const lineHeight = 16
  const headerHeight = 60
  const maxY = pageHeight - margin

  let objects: string[] = []
  let offsets: number[] = []
  let pageRefs: number[] = []
  let contentStreams: string[] = []
  let currentY = pageHeight - margin - headerHeight

  function startPage() {
    currentY = pageHeight - margin - headerHeight
    let stream = ""
    // Header
    stream += "BT\n/F1 16 Tf\n"
    stream += `${margin} ${pageHeight - margin - 20} Td\n`
    stream += `(Red Flag Word List) Tj\n`
    stream += "ET\n"
    stream += "BT\n/F1 10 Tf\n"
    stream += `${margin} ${pageHeight - margin - 38} Td\n`
    stream += `(Generated: ${new Date().toISOString().split("T")[0]}) Tj\n`
    stream += "ET\n"
    // Column headers
    stream += "BT\n/F2 10 Tf\n"
    stream += `${margin} ${currentY} Td\n`
    stream += `(Word) Tj\n`
    stream += "ET\n"
    stream += "BT\n/F2 10 Tf\n"
    stream += `${margin + 300} ${currentY} Td\n`
    stream += `(Category) Tj\n`
    stream += "ET\n"
    // Line under header
    stream += `${margin} ${currentY - 4} m ${pageWidth - margin} ${currentY - 4} l S\n`
    currentY -= lineHeight + 4
    return stream
  }

  let currentStream = startPage()

  for (const w of words) {
    if (currentY < margin + lineHeight) {
      contentStreams.push(currentStream)
      currentStream = startPage()
    }
    const word = escapePdf(w.WORD)
    const category = escapePdf(w.CATEGORY)
    currentStream += "BT\n/F1 9 Tf\n"
    currentStream += `${margin} ${currentY} Td\n`
    currentStream += `(${word}) Tj\n`
    currentStream += "ET\n"
    currentStream += "BT\n/F1 9 Tf\n"
    currentStream += `${margin + 300} ${currentY} Td\n`
    currentStream += `(${category}) Tj\n`
    currentStream += "ET\n"
    currentY -= lineHeight
  }
  contentStreams.push(currentStream)

  // Build PDF
  let pdf = "%PDF-1.4\n"
  let objNum = 1

  function addObj(content: string) {
    offsets.push(pdf.length)
    pdf += `${objNum} 0 obj\n${content}\nendobj\n`
    objNum++
  }

  // 1: Catalog
  addObj("<< /Type /Catalog /Pages 2 0 R >>")
  // 2: Pages (placeholder)
  const pagesObjNum = objNum
  addObj("PLACEHOLDER")
  // 3: Font Helvetica
  addObj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
  // 4: Font Helvetica-Bold
  addObj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")

  // Page objects
  const pageObjNums: number[] = []
  const streamObjNums: number[] = []

  for (const stream of contentStreams) {
    const streamObjNum = objNum
    const streamBytes = Buffer.from(stream, "latin1")
    addObj(`<< /Length ${streamBytes.length} >>\nstream\n${stream}\nendstream`)
    streamObjNums.push(streamObjNum)

    const pageObjNum = objNum
    addObj(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents ${streamObjNum} 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> >>`)
    pageObjNums.push(pageObjNum)
  }

  // Fix Pages object
  const kidsStr = pageObjNums.map(n => `${n} 0 R`).join(" ")
  const pagesContent = `<< /Type /Pages /Kids [${kidsStr}] /Count ${pageObjNums.length} >>`
  const pagesOffset = offsets[1]
  const oldPagesObj = `${pagesObjNum} 0 obj\nPLACEHOLDER\nendobj\n`
  const newPagesObj = `${pagesObjNum} 0 obj\n${pagesContent}\nendobj\n`
  pdf = pdf.replace(oldPagesObj, newPagesObj)

  // Recalculate offsets after replacement
  const finalPdf = buildFinalPdf(contentStreams, pageWidth, pageHeight)
  return Buffer.from(finalPdf, "latin1")
}

function buildFinalPdf(contentStreams: string[], pageWidth: number, pageHeight: number): string {
  let pdf = "%PDF-1.4\n"
  const offsets: number[] = []
  let objNum = 1

  function addObj(content: string): number {
    offsets.push(pdf.length)
    pdf += `${objNum} 0 obj\n${content}\nendobj\n`
    return objNum++
  }

  addObj("<< /Type /Catalog /Pages 2 0 R >>")

  // Pages placeholder — we'll write it after we know page refs
  const pagesOffset = pdf.length
  const pagesNum = objNum
  // Reserve space
  addObj("<< >>") // placeholder

  const fontNum = addObj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
  const fontBoldNum = addObj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")

  const pageNums: number[] = []
  for (const stream of contentStreams) {
    const streamBytes = Buffer.from(stream, "latin1")
    const streamNum = addObj(`<< /Length ${streamBytes.length} >>\nstream\n${stream}\nendstream`)
    const pageNum = addObj(`<< /Type /Page /Parent ${pagesNum} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents ${streamNum} 0 R /Resources << /Font << /F1 ${fontNum} 0 R /F2 ${fontBoldNum} 0 R >> >> >>`)
    pageNums.push(pageNum)
  }

  // Now rebuild with correct pages object
  const kidsStr = pageNums.map(n => `${n} 0 R`).join(" ")
  const pagesContent = `<< /Type /Pages /Kids [${kidsStr}] /Count ${pageNums.length} >>`

  // Rebuild from scratch with correct pages
  pdf = "%PDF-1.4\n"
  offsets.length = 0
  objNum = 1

  addObj("<< /Type /Catalog /Pages 2 0 R >>")
  addObj(pagesContent)
  const f1 = addObj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
  const f2 = addObj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")

  for (const stream of contentStreams) {
    const streamBytes = Buffer.from(stream, "latin1")
    const sn = addObj(`<< /Length ${streamBytes.length} >>\nstream\n${stream}\nendstream`)
    addObj(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents ${sn} 0 R /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> >>`)
  }

  const xrefOffset = pdf.length
  pdf += "xref\n"
  pdf += `0 ${objNum}\n`
  pdf += "0000000000 65535 f \n"
  for (const off of offsets) {
    pdf += `${String(off).padStart(10, "0")} 00000 n \n`
  }
  pdf += "trailer\n"
  pdf += `<< /Size ${objNum} /Root 1 0 R >>\n`
  pdf += "startxref\n"
  pdf += `${xrefOffset}\n`
  pdf += "%%EOF\n"

  return pdf
}

function escapePdf(str: string): string {
  return (str || "").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")
}
