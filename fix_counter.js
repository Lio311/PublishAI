const fs = require('fs');

const file = 'src/components/dashboard/SystemFlowModal.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('useLocale')) {
  content = content.replace(/import \{ useTranslations \} from "next-intl";/, 'import { useTranslations, useLocale } from "next-intl";');
}

content = content.replace(/const t = useTranslations\("SystemFlow"\);/, 'const t = useTranslations("SystemFlow");\n  const locale = useLocale();\n  const isRtl = locale === "he";');

const oldCounter = `<span dir="ltr">
                {currentStepIndex >= 0
                  ? \`\${Math.min(currentStepIndex + 1, FLOW_STEPS.length)} / \${FLOW_STEPS.length}\`
                  : \`0 / \${FLOW_STEPS.length}\`}
              </span>`;

const newCounter = `<span>
                {currentStepIndex >= 0
                  ? (isRtl 
                    ? \`\${FLOW_STEPS.length} מתוך \${Math.min(currentStepIndex + 1, FLOW_STEPS.length)}\` 
                    : \`\${Math.min(currentStepIndex + 1, FLOW_STEPS.length)} / \${FLOW_STEPS.length}\`)
                  : (isRtl 
                    ? \`\${FLOW_STEPS.length} מתוך 0\` 
                    : \`0 / \${FLOW_STEPS.length}\`)}
              </span>`;

content = content.replace(oldCounter, newCounter);
fs.writeFileSync(file, content);
