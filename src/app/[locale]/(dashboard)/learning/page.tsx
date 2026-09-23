import { db } from "@/services/db";
import { aiSystemFeedback, users, journals } from "@/services/db/schema";
import { eq, desc } from "drizzle-orm";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Brain, User, Book, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { checkIsAdmin } from "@/services/auth-utils";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function AILearningPage({ params }: { params: { locale: string } }) {
  const isAdmin = await checkIsAdmin();
  const locale = params.locale;
  if (!isAdmin) {
    redirect(`/${locale}`);
  }
  
  const isHe = locale === "he";

  // Fetch all learning rules (Ideally with joins for user email and journal name)
  const allFeedback = await db.select({
    feedback: aiSystemFeedback,
    user: users,
    journal: journals
  })
  .from(aiSystemFeedback)
  .leftJoin(users, eq(aiSystemFeedback.userId, users.id))
  .leftJoin(journals, eq(aiSystemFeedback.journalId, journals.id))
  .orderBy(desc(aiSystemFeedback.createdAt));

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
            <Brain className="w-8 h-8 text-indigo-500" />
            {isHe ? "למידת המערכת (AI Learning)" : "AI Learning & Telemetry"}
          </h1>
        </div>

        <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-3xl">
          {isHe 
            ? "עמוד זה מציג את הכללים והתובנות שהמערכת למדה מתוך הבקשות שלכם ומהערות סוקרים של כתבי עת. כללים המוגדרים כ-Actionable מוזרקים אוטומטית למודלי השפה בעת יצירת טקסט חדש כדי למנוע טעויות דומות בעתיד."
            : "This page displays the rules and insights the system has learned from user rewrite requests and journal reviewer comments. Rules marked as Actionable are automatically injected into the LLM during text generation to prevent similar errors in the future."
          }
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="text-sm text-slate-500 font-medium mb-1">{isHe ? "סך הכל כללים" : "Total Learnings"}</div>
            <div className="text-3xl font-bold text-indigo-600">{allFeedback.length}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="text-sm text-slate-500 font-medium mb-1">{isHe ? "כללים פעילים" : "Actionable Rules"}</div>
            <div className="text-3xl font-bold text-green-600">{allFeedback.filter(f => f.feedback.isActionable).length}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="text-sm text-slate-500 font-medium mb-1">{isHe ? "תובנות ממשתמשים" : "User Insights"}</div>
            <div className="text-3xl font-bold text-blue-600">{allFeedback.filter(f => f.feedback.sourceType === 'user_rewrite').length}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="text-sm text-slate-500 font-medium mb-1">{isHe ? "תובנות מסוקרים" : "Reviewer Insights"}</div>
            <div className="text-3xl font-bold text-purple-600">{allFeedback.filter(f => f.feedback.sourceType === 'reviewer_feedback').length}</div>
          </div>
        </div>

        <div className="space-y-6">
          {allFeedback.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
              <Brain className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 dark:text-slate-400">
                {isHe ? "אין עדיין תובנות במערכת" : "No learning data available yet"}
              </h3>
            </div>
          ) : (
            allFeedback.map(({ feedback, user, journal }) => (
              <div key={feedback.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col md:flex-row gap-6">
                
                {/* Meta sidebar */}
                <div className="md:w-64 shrink-0 flex flex-col gap-3 border-b md:border-b-0 md:border-r md:ltr:border-r md:rtl:border-l border-slate-200 dark:border-slate-800 pb-4 md:pb-0 md:pr-6 md:rtl:pl-6">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      feedback.sourceType === 'user_rewrite' 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                    }`}>
                      {feedback.sourceType === 'user_rewrite' 
                        ? (isHe ? 'הערת משתמש' : 'User Request') 
                        : (isHe ? 'הערת סוקר' : 'Reviewer Feedback')
                      }
                    </span>
                  </div>
                  
                  {user && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <User className="w-4 h-4" />
                      <span className="truncate">{user.name || user.email}</span>
                    </div>
                  )}
                  
                  {journal && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Book className="w-4 h-4" />
                      <span className="truncate">{journal.name}</span>
                    </div>
                  )}
                  
                  <div className="text-xs text-slate-500 mt-auto pt-2">
                    {new Date(feedback.createdAt).toLocaleDateString(isHe ? 'he-IL' : 'en-US')}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      {isHe ? "קטגוריית הבעיה" : "Issue Category"}
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium">
                      <AlertCircle className="w-4 h-4" />
                      {feedback.category?.replace(/_/g, ' ') || 'Uncategorized'}
                    </div>
                  </div>

                  {feedback.productInsight && (
                    <div>
                      <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        {isHe ? "תובנת מוצר (טלמטריה)" : "Product Insight"}
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800/80">
                        {feedback.productInsight}
                      </p>
                    </div>
                  )}

                  {feedback.ruleText && (
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        {isHe ? "כלל אופרטיבי (Prompt Injection)" : "Actionable Rule"}
                        {feedback.isActionable ? (
                          <span className="text-green-600 flex items-center gap-1 text-xs lowercase ml-2">
                            <CheckCircle2 className="w-3.5 h-3.5" /> active
                          </span>
                        ) : (
                          <span className="text-slate-400 flex items-center gap-1 text-xs lowercase ml-2">
                            <XCircle className="w-3.5 h-3.5" /> inactive
                          </span>
                        )}
                      </div>
                      <div className={`p-4 rounded-lg border ${
                        feedback.isActionable 
                          ? 'bg-indigo-50 border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-800/30 text-indigo-900 dark:text-indigo-200' 
                          : 'bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        <span className="font-mono text-sm leading-relaxed">
                          "{feedback.ruleText}"
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
