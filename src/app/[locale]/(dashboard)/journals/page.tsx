import { db } from "@/db";
import { journals } from "@/db/schema";
import { Book, ExternalLink } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { checkIsAdmin } from "@/lib/auth-utils";
import AddJournalButton from "@/components/journals/AddJournalButton";

export default async function JournalsPage({ params }: { params: Promise<{ locale: string }> | { locale: string } }) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale;
  const allJournals = await db.select().from(journals);
  const isAdmin = await checkIsAdmin();

  const isHe = locale === 'he';

  return (
    <DashboardLayout isAdmin={isAdmin}>
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{isHe ? 'חוקי עיתונים' : 'Journal Rules'}</h1>
          <p className="text-slate-500 mt-1">{isHe ? 'ניהול חוקי עיצוב והגשה לעיתוני יעד שונים.' : 'Manage formatting and submission rules for target journals.'}</p>
        </div>
        <AddJournalButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allJournals.map(journal => (
          <div key={journal.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 flex-1">
              <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center mb-4 text-indigo-600">
                <Book className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">{journal.name}</h3>
              <p className="text-sm text-slate-500 mb-4">{journal.field}</p>
              
              <div className="space-y-2 text-sm text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">{isHe ? 'מגבלת מילים:' : 'Word Limit:'}</span>
                  <span className="font-medium">{journal.wordLimit || (isHe ? 'ללא' : 'None')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isHe ? 'מגבלת תקציר:' : 'Abstract Limit:'}</span>
                  <span className="font-medium">{journal.abstractLimit || (isHe ? 'ללא' : 'None')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isHe ? 'סגנון ציטוט:' : 'Citation Style:'}</span>
                  <span className="font-medium">{journal.citationStyle || (isHe ? 'ברירת מחדל' : 'Default')}</span>
                </div>
              </div>
            </div>
            {journal.instructionsUrl && (
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
                <a 
                  href={journal.instructionsUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1"
                >
                  {isHe ? 'הוראות למחברים' : 'Instructions for Authors'}
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
