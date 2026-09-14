import { FileText, Home, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-l border-slate-200 flex flex-col justify-between">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <Image 
              src="/logo.png" 
              alt="PublishAI Logo" 
              width={40} 
              height={40} 
              className="rounded-lg object-contain"
            />
            <h1 className="text-2xl font-bold text-slate-800">PublishAI</h1>
          </div>
          
          <nav className="space-y-2">
            <Link href="/" className="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg font-medium transition-colors">
              <Home className="w-5 h-5" />
              ראשי
            </Link>
            <Link href="/papers" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors">
              <FileText className="w-5 h-5" />
              המאמרים שלי
            </Link>
            <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors">
              <Settings className="w-5 h-5" />
              הגדרות
            </Link>
          </nav>
        </div>
        
        <div className="p-6 border-t border-slate-100">
          <button className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-red-50 hover:text-red-600 w-full rounded-lg font-medium transition-colors">
            <LogOut className="w-5 h-5" />
            התנתק
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
