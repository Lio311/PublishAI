import { db } from "@/services/db";
import { journals, journalCitationRules, journalArticleTypes, journalAbstractRules, journalCoverLetterRules } from "@/services/db/schema";
import { eq } from "drizzle-orm";
import { Book, ExternalLink, FileText, Quote, List, Mail, CheckCircle, XCircle, Shield, Sparkles } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { checkIsAdmin } from "@/services/auth-utils";
import AddJournalButton from "@/components/journals/AddJournalButton";
import { getTranslations, setRequestLocale } from "next-intl/server";

type JournalWithRelations = {
  journal: typeof journals.$inferSelect;
  citationRules: (typeof journalCitationRules.$inferSelect) | null;
  articleTypes: (typeof journalArticleTypes.$inferSelect)[];
  abstractRules: (typeof journalAbstractRules.$inferSelect) | null;
  coverLetterRules: (typeof journalCoverLetterRules.$inferSelect) | null;
};

async function getJournalsWithRelations(): Promise<JournalWithRelations[]> {
  const allJournals = await db.select().from(journals);
  
  const enriched: JournalWithRelations[] = await Promise.all(
    allJournals.map(async (journal) => {
      const [citationRule] = await db.select().from(journalCitationRules).where(eq(journalCitationRules.journalId, journal.id));
      const articleTypesList = await db.select().from(journalArticleTypes).where(eq(journalArticleTypes.journalId, journal.id));
      const [abstractRule] = await db.select().from(journalAbstractRules).where(eq(journalAbstractRules.journalId, journal.id));
      const [coverLetterRule] = await db.select().from(journalCoverLetterRules).where(eq(journalCoverLetterRules.journalId, journal.id));
      
      return {
        journal,
        citationRules: citationRule || null,
        articleTypes: articleTypesList,
        abstractRules: abstractRule || null,
        coverLetterRules: coverLetterRule || null,
      };
    })
  );
  
  return enriched;
}

function DataSourceBadge({ source, verifiedLabel, aiLabel }: { source: string | null; verifiedLabel: string; aiLabel: string }) {
  if (source === "official-website") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
        <Shield className="w-3 h-3" />
        {verifiedLabel}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
      <Sparkles className="w-3 h-3" />
      {aiLabel}
    </span>
  );
}

function CoverLetterStatus({ rules, requiredLabel, optionalLabel, unknownLabel }: { rules: JournalWithRelations['coverLetterRules']; requiredLabel: string; optionalLabel: string; unknownLabel: string }) {
  if (!rules) {
    return <span className="text-slate-400">{unknownLabel}</span>;
  }
  if (rules.required) {
    return (
      <span className="inline-flex items-center gap-1 text-red-600 font-medium">
        <CheckCircle className="w-3.5 h-3.5" />
        {requiredLabel}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-slate-500">
      <XCircle className="w-3.5 h-3.5" />
      {optionalLabel}
    </span>
  );
}

const IN_TEXT_FORMAT_LABELS: Record<string, { en: string; he: string }> = {
  "superscript": { en: "Superscript¹", he: "superscript¹" },
  "brackets": { en: "Brackets [1]", he: "סוגריים [1]" },
  "parentheses": { en: "Parentheses (1)", he: "סוגריים (1)" },
  "italic-parentheses": { en: "Italic (1)", he: "סוגריים נטויים (1)" },
};

export default async function JournalsPage({ params }: { params: Promise<{ locale: string }> | { locale: string } }) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale;
  setRequestLocale(locale);
  const allJournals = await getJournalsWithRelations();
  const isAdmin = await checkIsAdmin();
  const t = await getTranslations("Journals");
  const isHe = locale === 'he';

  return (
    <DashboardLayout isAdmin={isAdmin}>
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t("title")}</h1>
          <p className="text-slate-500 mt-1">{t("subtitle")}</p>
        </div>
        <AddJournalButton />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {allJournals.map(({ journal, citationRules, articleTypes, abstractRules, coverLetterRules }) => (
          <div key={journal.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 pb-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-sky-50 rounded-lg flex items-center justify-center text-sky-500">
                    <Book className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{journal.name}</h3>
                    <p className="text-sm text-slate-500">{journal.field}</p>
                  </div>
                </div>
                <DataSourceBadge source={journal.dataSource} verifiedLabel={t("verified")} aiLabel={t("aiGenerated")} />
              </div>
            </div>

            {/* Main Data Grid */}
            <div className="px-6 pb-4 space-y-4">
              {/* Citation & Abstract Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Citation Style */}
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Quote className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {t("citation")}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-800">
                    {citationRules?.styleName || journal.citationStyle || t("default")}
                  </p>
                  {citationRules && (
                    <p className="text-xs text-slate-500 mt-1">
                      {IN_TEXT_FORMAT_LABELS[citationRules.inTextFormat]?.[isHe ? 'he' : 'en'] || citationRules.inTextFormat}
                      {citationRules.etAlThreshold && ` · et al. >${citationRules.etAlThreshold}`}
                    </p>
                  )}
                </div>

                {/* Abstract */}
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {t("abstract")}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-800">
                    {abstractRules?.defaultWordLimit || journal.abstractLimit || '—'} {t("words")}
                  </p>
                  {abstractRules && (
                    <p className="text-xs text-slate-500 mt-1">
                      {abstractRules.abstractType === 'structured' 
                        ? t("structured")
                        : t("unstructured")}
                      {abstractRules.label !== 'Abstract' && ` · "${abstractRules.label}"`}
                    </p>
                  )}
                </div>
              </div>

              {/* Article Types */}
              {articleTypes.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <List className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {t("articleTypes")}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {articleTypes.slice(0, 4).map((at) => (
                      <div key={at.id} className="flex items-center justify-between text-sm">
                        <span className={`${at.isPrimary ? 'font-medium text-slate-800' : 'text-slate-600'}`}>
                          {at.isPrimary && '★ '}{at.typeName}
                        </span>
                        <span className="text-xs text-slate-500 tabular-nums">
                          {at.wordLimit ? `${at.wordLimit.toLocaleString()} ${isHe ? 'מ' : 'w'}` : t("noLimit")}
                          {at.displayItemsLimit && ` · ${at.displayItemsLimit} ${t("figs")}`}
                          {at.referencesLimit && ` · ${at.referencesLimit} ${t("refs")}`}
                        </span>
                      </div>
                    ))}
                    {articleTypes.length > 4 && (
                      <p className="text-xs text-slate-400">+{articleTypes.length - 4} {t("more")}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Cover Letter */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {t("coverLetter")}
                  </span>
                </div>
                <CoverLetterStatus rules={coverLetterRules} requiredLabel={t("required")} optionalLabel={t("optional")} unknownLabel={t("unknown")} />
              </div>

              {/* Fallback: basic data if no enrichment */}
              {articleTypes.length === 0 && (
                <div className="space-y-2 text-sm text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t("wordLimit")}</span>
                    <span className="font-medium">{journal.wordLimit || t("none")}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {journal.instructionsUrl && (
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 mt-auto">
                <a 
                  href={journal.instructionsUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-sky-500 hover:text-sky-600 text-sm font-medium flex items-center gap-1"
                >
                  {t("instructionsForAuthors")}
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
    </DashboardLayout>
  );
}
