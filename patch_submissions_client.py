import re

with open("src/app/[locale]/submissions/SubmissionsClient.tsx", "r") as f:
    content = f.read()

# Remove the hardcoded 4 badge
old_badge = """            <span>{isHe ? "מענה לביקורת עמיתים" : "Reviewer Rebuttal & Responses"}</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 font-bold">
              4
            </span>"""

new_badge = """            <span>{isHe ? "מענה לביקורת עמיתים" : "Reviewer Rebuttal & Responses"}</span>"""

content = content.replace(old_badge, new_badge)

with open("src/app/[locale]/submissions/SubmissionsClient.tsx", "w") as f:
    f.write(content)
