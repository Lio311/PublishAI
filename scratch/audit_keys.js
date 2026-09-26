const fs = require("fs");
const path = require("path");

const en = JSON.parse(fs.readFileSync("messages/en.json", "utf8"));
const he = JSON.parse(fs.readFileSync("messages/he.json", "utf8"));

function getNested(obj, pathStr) {
  const parts = pathStr.split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur === undefined || cur === null) return undefined;
    cur = cur[p];
  }
  return cur;
}

const files = [
  "src/app/[locale]/(dashboard)/papers/[id]/page.tsx",
  "src/app/[locale]/(dashboard)/papers/page.tsx",
  "src/app/[locale]/(dashboard)/settings/page.tsx",
  "src/app/[locale]/page.tsx",
  "src/components/dashboard/SystemExplainButton.tsx",
  "src/components/dashboard/SystemFlowModal.tsx",
  "src/components/dashboard/UploadZone.tsx",
  "src/components/layout/AnimatedSidebar.tsx",
  "src/components/layout/DashboardLayout.tsx",
  "src/components/papers/PaperProcessingUI.tsx",
  "src/components/submission/ConnectionForm.tsx",
  "src/components/submission/ConnectionsManager.tsx",
  "src/components/submission/SecurityBriefing.tsx",
  "src/components/submission/SubmissionPanel.tsx",
  "src/components/submission/SubmissionProgressBar.tsx",
  "src/components/submission/TwoFactorDialog.tsx"
];

for (const f of files) {
  const content = fs.readFileSync(f, "utf8");
  console.log("\n=================================");
  console.log("FILE:", f);

  // Find namespaces
  const nsMatches = [
    ...content.matchAll(/(?:useTranslations|getTranslations)\(\s*["']([^"']*)["']\s*\)/g)
  ];
  const namespaces = nsMatches.map(m => m[1]);
  console.log("Namespaces declared:", namespaces);

  // Find t("key") or t('key')
  const tMatches = [
    ...content.matchAll(/\bt\(\s*["']([^"']+)["']\s*\)/g)
  ];

  for (const m of tMatches) {
    const key = m[1];
    for (const ns of namespaces) {
      const fullKey = ns ? `${ns}.${key}` : key;
      const inEn = getNested(en, fullKey);
      const inHe = getNested(he, fullKey);
      console.log(`Key: "${fullKey}" | EN: ${inEn !== undefined ? "OK" : "MISSING"} | HE: ${inHe !== undefined ? "OK" : "MISSING"}`);
    }
  }
}
