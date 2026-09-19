import re

with open("src/app/[locale]/architecture/ArchitectureClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add Share2 to imports
content = content.replace("Terminal} from \"lucide-react\";", "Terminal, Share2} from \"lucide-react\";")

# 2. Add state and handleShare function
state_block = """  const [activeStep, setActiveStep] = useState<number>(1);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);"""

new_state_block = """  const [activeStep, setActiveStep] = useState<number>(1);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/${locale}/architecture`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };"""

content = content.replace(state_block, new_state_block)

# 3. Add the button to the header
old_header = """      <div className="mb-8 text-start">
        <h1 className="text-3xl font-bold text-slate-800">
          {isHe ? 'ארכיטקטורת מערכת' : 'System Architecture'}
        </h1>
        <p className="text-slate-500 mt-2">
          {isHe 
            ? 'סייר בצורה אינטראקטיבית בכל שלבי האלגוריתם והתשתית של PublishAI. לחץ על הכלים והסוכנים למידע נוסף.' 
            : 'Interactive exploration of the PublishAI Algorithm & Infrastructure. Click on tools and agents for more info.'}
        </p>
      </div>"""

new_header = """      <div className="mb-8 text-start flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            {isHe ? 'ארכיטקטורת מערכת' : 'System Architecture'}
          </h1>
          <p className="text-slate-500 mt-2">
            {isHe 
              ? 'סייר בצורה אינטראקטיבית בכל שלבי האלגוריתם והתשתית של PublishAI. לחץ על הכלים והסוכנים למידע נוסף.' 
              : 'Interactive exploration of the PublishAI Algorithm & Infrastructure. Click on tools and agents for more info.'}
          </p>
        </div>
        
        {/* Share Button */}
        <button 
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 shadow-sm rounded-xl text-slate-600 hover:text-sky-600 hover:border-sky-200 hover:bg-sky-50 transition-all duration-300 shrink-0"
        >
          <Share2 className="w-4 h-4" />
          <span className="font-medium text-sm">
            {copied ? (isHe ? 'הקישור הועתק!' : 'Link Copied!') : (isHe ? 'שתף מפה' : 'Share Map')}
          </span>
        </button>
      </div>"""

content = content.replace(old_header, new_header)

with open("src/app/[locale]/architecture/ArchitectureClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)

