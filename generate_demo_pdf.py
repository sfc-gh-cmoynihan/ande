from fpdf import FPDF
import re

with open('/Users/cmoynihan/Documents/code/c360/customer360-app/DEMO_SCRIPT_20MIN.md', 'r') as f:
    lines = f.readlines()

def clean_unicode(text):
    text = text.replace('\u2014', '-')
    text = text.replace('\u2013', '-')
    text = text.replace('\u2018', "'")
    text = text.replace('\u2019', "'")
    text = text.replace('\u201c', '"')
    text = text.replace('\u201d', '"')
    text = text.replace('\u2026', '...')
    text = text.replace('\u2022', '-')
    text = text.replace('\u2265', '>=')
    text = text.replace('\u2264', '<=')
    text = text.replace('\u20ac', 'EUR')
    return text.encode('latin-1', 'replace').decode('latin-1')

pdf = FPDF()
pdf.set_auto_page_break(auto=True, margin=20)
pdf.set_left_margin(15)
pdf.set_right_margin(15)
pdf.add_page()
pdf.set_font('Helvetica', 'B', 18)
pdf.cell(0, 12, 'AND.e Insurance Customer 360', new_x='LMARGIN', new_y='NEXT')
pdf.set_font('Helvetica', '', 12)
pdf.cell(0, 8, '20-Minute Demo Script', new_x='LMARGIN', new_y='NEXT')
pdf.ln(5)

in_code_block = False

for line in lines[2:]:
    line = clean_unicode(line.rstrip())

    if line.startswith('```'):
        in_code_block = not in_code_block
        if in_code_block:
            pdf.set_font('Courier', '', 8)
        else:
            pdf.set_font('Helvetica', '', 10)
        continue

    if in_code_block:
        pdf.cell(0, 4, line[:110], new_x='LMARGIN', new_y='NEXT')
        continue

    if line.startswith('---'):
        pdf.ln(2)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        pdf.ln(3)
        continue

    if line.startswith('### '):
        pdf.ln(4)
        pdf.set_font('Helvetica', 'B', 12)
        text = re.sub(r'\*\*(.*?)\*\*', r'\1', line[4:].strip())
        pdf.cell(0, 7, text, new_x='LMARGIN', new_y='NEXT')
        pdf.set_font('Helvetica', '', 10)
        continue

    if line.startswith('## '):
        pdf.ln(5)
        pdf.set_font('Helvetica', 'B', 14)
        pdf.cell(0, 8, line[3:].strip(), new_x='LMARGIN', new_y='NEXT')
        pdf.set_font('Helvetica', '', 10)
        continue

    if line.startswith('# '):
        continue

    if line.startswith('| ') and '|' in line[1:]:
        pdf.set_font('Courier', '', 8)
        clean = line.strip('|').strip()
        if '---' in clean:
            continue
        pdf.cell(0, 4, clean[:130], new_x='LMARGIN', new_y='NEXT')
        pdf.set_font('Helvetica', '', 10)
        continue

    if not line.strip():
        pdf.ln(2)
        continue

    text = re.sub(r'\*\*(.*?)\*\*', r'\1', line)
    text = re.sub(r'\*(.*?)\*', r'\1', text)
    text = re.sub(r'`(.*?)`', r'\1', text)
    text = text.lstrip('> ').strip()

    if not text:
        pdf.ln(2)
        continue

    pdf.set_font('Helvetica', '', 10)
    if line.startswith('> '):
        pdf.set_font('Helvetica', 'I', 10)
    try:
        pdf.multi_cell(0, 5, text)
    except Exception:
        pdf.set_x(15)
        pdf.multi_cell(0, 5, text[:100])

pdf.output('/Users/cmoynihan/Documents/code/c360/customer360-app/DEMO_SCRIPT_20MIN.pdf')
print('PDF generated: DEMO_SCRIPT_20MIN.pdf')
