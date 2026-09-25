with open("src/app/[locale]/flowchart/FlowchartClient.tsx", "r") as f:
    content = f.read()

content = content.replace("Settings, Mail, User, Bot, Scissors, ListChecks, GitMerge, RefreshCw, AlertTriangle, CheckCircle2 }", "Settings, Mail, User, Bot, Scissors, ListChecks, GitMerge, RefreshCw, AlertTriangle, CheckCircle2, ArrowRight }")

with open("src/app/[locale]/flowchart/FlowchartClient.tsx", "w") as f:
    f.write(content)
