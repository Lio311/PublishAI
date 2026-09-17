export async function generatePdf(title: string, content: string): Promise<Buffer> {
  // Strip HTML tags and basic entities
  const textContent = content
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s*\n/g, '\n\n')
    // Remove non-latin1 characters as base PDF fonts don't support them well without subsetting
    .replace(/[^\x00-\xFF]/g, '?');

  const safeTitle = title.replace(/[^\x00-\xFF]/g, '?');

  // split into words and lines of ~80 chars
  const paragraphs = textContent.split('\n');
  const lines: string[] = [];
  
  lines.push(`Title: ${safeTitle}`);
  lines.push(''); // empty line

  for (const para of paragraphs) {
    if (!para.trim()) {
      lines.push('');
      continue;
    }
    const words = para.trim().split(/\s+/);
    let currentLine = '';
    for (const word of words) {
      if ((currentLine + ' ' + word).length > 80) {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = currentLine ? currentLine + ' ' + word : word;
      }
    }
    if (currentLine) lines.push(currentLine);
  }

  const linesPerPage = 50;
  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += linesPerPage) {
    pages.push(lines.slice(i, i + linesPerPage));
  }
  if (pages.length === 0) pages.push(['']);

  const objects: string[] = [];
  // obj 1: Catalog
  // obj 2: Pages
  // obj 3: Font
  // obj 4...: Page 1, Stream 1, Page 2, Stream 2...
  
  objects[1] = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj`;
  
  const pageObjIds: number[] = [];
  let nextObjId = 4;
  
  // Font obj will be 3
  objects[3] = `3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj`;

  for (let i = 0; i < pages.length; i++) {
    const pageLines = pages[i];
    const pageId = nextObjId++;
    const streamId = nextObjId++;
    pageObjIds.push(pageId);
    
    objects[pageId] = `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${streamId} 0 R /Resources << /Font << /F1 3 0 R >> >> >>\nendobj`;
    
    let streamData = `BT\n/F1 12 Tf\n50 700 Td\n15 TL\n`;
    for (const line of pageLines) {
      // escape backslashes and parentheses in pdf string
      const escapedLine = line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
      streamData += `(${escapedLine}) Tj\nT*\n`;
    }
    streamData += `ET`;
    
    objects[streamId] = `${streamId} 0 obj\n<< /Length ${Buffer.byteLength(streamData, 'latin1')} >>\nstream\n${streamData}\nendstream\nendobj`;
  }
  
  // Pages obj
  const kidsStr = pageObjIds.map(id => `${id} 0 R`).join(' ');
  objects[2] = `2 0 obj\n<< /Type /Pages /Kids [${kidsStr}] /Count ${pages.length} >>\nendobj`;
  
  // Build PDF string
  const pdfLines: string[] = [];
  pdfLines.push('%PDF-1.4');
  
  const xref: number[] = [];
  
  let result = '%PDF-1.4\n';
  xref[0] = 0;
  
  for (let i = 1; i < nextObjId; i++) {
    xref[i] = Buffer.byteLength(result, 'latin1');
    result += objects[i] + '\n';
  }
  
  const xrefOffset = Buffer.byteLength(result, 'latin1');
  result += `xref\n0 ${nextObjId}\n`;
  result += `0000000000 65535 f \n`;
  for (let i = 1; i < nextObjId; i++) {
    result += `${xref[i].toString().padStart(10, '0')} 00000 n \n`;
  }
  
  result += `trailer\n<< /Size ${nextObjId} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  
  return Buffer.from(result, 'latin1');
}
