with open("src/components/layout/DashboardLayout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# I will just split the file by the ` {/* Mobile Header */}` string and reconstruct it.
parts = content.split("      {/* Mobile Header */}")
if len(parts) == 2:
    top = parts[0]
    bottom = parts[1]
    
    # We also need to remove the old mobile header which ends at:
    # `      {/* Sidebar Overlay for Mobile */}`
    bottom_parts = bottom.split("      {/* Sidebar Overlay for Mobile */}")
    
    if len(bottom_parts) >= 2:
        old_mobile_header = bottom_parts[0]
        rest = bottom_parts[1]
        
        new_headers = '''      {/* Public Top Header (when no sidebar) */}
      {!showSidebar && (
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm w-full">
          <Link href={`/${locale}`} className="flex items-center">
             <Image src="/logo.png" alt="PublishAI Logo" width={140} height={45} className="object-contain" priority />
          </Link>
          <div className="flex items-center gap-4">
            <Link href={`/${locale}/login`} className="text-sm font-bold text-slate-700 hover:text-sky-600 bg-slate-100 hover:bg-slate-200 px-5 py-2.5 rounded-xl transition-colors">
              {locale === 'he' ? 'התחברות למערכת' : 'Login'}
            </Link>
          </div>
        </header>
      )}

      {/* Mobile Header (only when there IS a sidebar) */}
      {showSidebar && (
        <div className="md:hidden flex items-center justify-between p-4 bg-white/70 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-sm w-full">
          <Image src="/logo.png" alt="PublishAI Logo" width={120} height={40} className="object-contain" priority />
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      )}

      {/* Sidebar Overlay for Mobile */}'''
        
        content = top + new_headers + rest

with open("src/components/layout/DashboardLayout.tsx", "w", encoding="utf-8") as f:
    f.write(content)

