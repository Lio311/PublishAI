const fs = require('fs');

const uiFile = 'src/components/papers/PaperProcessingUI.tsx';
let uiContent = fs.readFileSync(uiFile, 'utf8');

const missingImports = `import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";\n`;

if (!uiContent.includes("useState")) {
  uiContent = uiContent.replace('"use client";\n', '"use client";\n\n' + missingImports);
  fs.writeFileSync(uiFile, uiContent);
}
