import re

with open("src/app/[locale]/(dashboard)/admin/architecture/ArchitectureClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace Claude 3.5
content = re.sub(
    r'"Claude 3\.5": \{.*?"GPT-4o": \{',
    '"Claude 3.5": {\n    en: "Anthropic\'s language model, excelling in academic writing, nuanced editing, and maintaining a scientific yet human tone.",\n    he: "מודל השפה של Anthropic המצטיין בכתיבה אקדמית, עריכה עדינה ושמירה על טון מדעי ואנושי."\n  },\n  "GPT-4o": {',
    content,
    flags=re.DOTALL
)

# Replace GPT-4o
content = re.sub(
    r'"GPT-4o": \{.*?"OpenAI o1": \{',
    '"GPT-4o": {\n    en: "OpenAI\'s flagship fast multimodal model, serving as a dynamic and deeply analytical reviewer in the multi-agent debate.",\n    he: "מודל מהיר של OpenAI המשמש כסוקר דינמי ומעמיק בפאנל הדיבייט (עימות הסוקרים) המרובה-סוכנים."\n  },\n  "OpenAI o1": {',
    content,
    flags=re.DOTALL
)

# Replace OpenAI o1
content = re.sub(
    r'"OpenAI o1": \{.*?"Gemini 1\.5": \{',
    '"OpenAI o1": {\n    en: "OpenAI\'s advanced reasoning model, taking the role of \'Area Chair\' to synthesize complex debate and make final editorial calls.",\n    he: "מודל ההסקה הלוגית של OpenAI, מתפקד כ\'סוקר-על\' המסנתז את הדיבייט ומקבל את החלטות העריכה הסופיות."\n  },\n  "Gemini 1.5": {',
    content,
    flags=re.DOTALL
)

# Replace Gemini 1.5
content = re.sub(
    r'"Gemini 1\.5": \{.*?"Next\.js 16 UI": \{',
    '"Gemini 1.5": {\n    en: "Google\'s model with a massive context window, able to digest huge amounts of referenced literature globally.",\n    he: "המודל של גוגל בעל חלון ההקשר (Context Window) העצום, המסוגל לבלוע כמויות אדירות של ספרות מצוטטת באופן גלובלי."\n  },\n  "Next.js 16 UI": {',
    content,
    flags=re.DOTALL
)

with open("src/app/[locale]/(dashboard)/admin/architecture/ArchitectureClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)

