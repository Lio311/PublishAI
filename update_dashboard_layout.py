import re

with open("src/components/layout/DashboardLayout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace props
content = content.replace(
    '''export default function DashboardLayout({ 
  children,
  isAdmin = false 
}: { 
  children: React.ReactNode;
  isAdmin?: boolean;
}) {''',
    '''export default function DashboardLayout({ 
  children,
  isAdmin = false,
  showSidebar = true
}: { 
  children: React.ReactNode;
  isAdmin?: boolean;
  showSidebar?: boolean;
}) {'''
)

# Replace conditional renders
content = content.replace(
    '''{/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white/70 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-sm">''',
    '''{/* Mobile Header */}
      {showSidebar && (
        <div className="md:hidden flex items-center justify-between p-4 bg-white/70 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-sm">
          <Image src="/logo.png" alt="PublishAI Logo" width={120} height={40} className="object-contain" priority />
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      )}'''
)

# Remove the old inner content of mobile header since we just replaced the wrapper and included the inner content in the replacement
content = re.sub(
    r'\{\/\* Mobile Header \*\/\}\n\s*\{showSidebar && \(\n\s*<div className="md:hidden flex items-center justify-between p-4 bg-white/70 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-sm">\n\s*<Image src="/logo.png" alt="PublishAI Logo" width=\{120\} height=\{40\} className="object-contain" priority \/>\n\s*<button \n\s*onClick=\{\(\) => setIsMobileMenuOpen\(!isMobileMenuOpen\)\}\n\s*className="p-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"\n\s*>\n\s*\{isMobileMenuOpen \? <X size=\{20\} \/> : <Menu size=\{20\} \/>\}\n\s*<\/button>\n\s*<\/div>\n\s*\)\}\n\s*<Image src="/logo.png" alt="PublishAI Logo" width=\{120\} height=\{40\} className="object-contain" priority \/>\n\s*<button \n\s*onClick=\{\(\) => setIsMobileMenuOpen\(!isMobileMenuOpen\)\}\n\s*className="p-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"\n\s*>\n\s*\{isMobileMenuOpen \? <X size=\{20\} \/> : <Menu size=\{20\} \/>\}\n\s*<\/button>\n\s*<\/div>',
    '''{/* Mobile Header */}
      {showSidebar && (
        <div className="md:hidden flex items-center justify-between p-4 bg-white/70 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-sm">
          <Image src="/logo.png" alt="PublishAI Logo" width={120} height={40} className="object-contain" priority />
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      )}''',
    content
)

content = content.replace(
    '''{/* Sidebar Overlay for Mobile */}
      {isMobileMenuOpen && (''',
    '''{/* Sidebar Overlay for Mobile */}
      {showSidebar && isMobileMenuOpen && ('''
)

content = content.replace(
    '''{/* Sidebar Container */}
      <div className={`
        fixed md:relative top-0 md:flex z-50 h-screen md:h-auto py-0 md:py-0
        transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : (locale === 'he' ? 'translate-x-full md:translate-x-0' : '-translate-x-full md:translate-x-0')}
        ${locale === 'he' ? 'right-0' : 'left-0'}
      `}>
        <AnimatedSidebar isAdmin={isAdmin} />
      </div>''',
    '''{/* Sidebar Container */}
      {showSidebar && (
        <div className={`
          fixed md:relative top-0 md:flex z-50 h-screen md:h-auto py-0 md:py-0
          transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : (locale === 'he' ? 'translate-x-full md:translate-x-0' : '-translate-x-full md:translate-x-0')}
          ${locale === 'he' ? 'right-0' : 'left-0'}
        `}>
          <AnimatedSidebar isAdmin={isAdmin} />
        </div>
      )}'''
)

with open("src/components/layout/DashboardLayout.tsx", "w", encoding="utf-8") as f:
    f.write(content)

