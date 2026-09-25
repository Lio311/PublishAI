import re

with open("src/app/[locale]/flowchart/FlowchartClient.tsx", "r") as f:
    content = f.read()

# Add Layers to lucide-react import
content = re.sub(r'Box, HelpCircle, Workflow, BarChart2,', 'Box, HelpCircle, Workflow, BarChart2, Layers,', content)

# Remove everything after the first `        </div>\n      </div>\n    </DashboardLayout>\n  );\n}`
first_end = content.find("    </DashboardLayout>\n  );\n}")
content_before_end = content[:first_end]

# Extract the appended stuff
appended_stuff = content[first_end + len("    </DashboardLayout>\n  );\n}"):]

# Insert the appended stuff BEFORE the closing tags
new_content = content_before_end + appended_stuff + "\n    </DashboardLayout>\n  );\n}\n"

with open("src/app/[locale]/flowchart/FlowchartClient.tsx", "w") as f:
    f.write(new_content)
