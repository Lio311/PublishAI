const fs = require('fs');

const uiFile = 'src/components/papers/PaperProcessingUI.tsx';
let uiContent = fs.readFileSync(uiFile, 'utf8');

const newFlowSteps = fs.readFileSync('temp_flow_steps.txt', 'utf8');

// Replace the FLOW_STEPS array
uiContent = uiContent.replace(/const FLOW_STEPS: FlowStep\[\] = \[\s*\{[\s\S]*?\}\s*\];/, newFlowSteps);

// Update imports
const newImports = `import { 
  Upload, MessageSquareText, ClipboardList, BookOpen, Microscope, 
  PenTool, Play, ShieldCheck, FileCheck, Package, Download, Loader2, CheckCircle
} from "lucide-react";`;

uiContent = uiContent.replace(/import \{[\s\S]*?\} from "lucide-react";/, newImports);

// Update FlowStep type to include model
uiContent = uiContent.replace(/glowColor: string;\n\};/, 'glowColor: string;\n  model: string;\n};');

fs.writeFileSync(uiFile, uiContent);
console.log("Updated PaperProcessingUI.tsx");
