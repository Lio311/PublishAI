with open("src/app/[locale]/flowchart/FlowchartClient.tsx", "r") as f:
    content = f.read()

content = content.replace("<DashboardLayout isAdmin={isAdmin} showSidebar={isAdmin}>", "<DashboardLayout isAdmin={isAdmin} showSidebar={true}>")

with open("src/app/[locale]/flowchart/FlowchartClient.tsx", "w") as f:
    f.write(content)

with open("src/app/[locale]/architecture/ArchitectureClient.tsx", "r") as f:
    content = f.read()

content = content.replace("<DashboardLayout isAdmin={isAdmin} showSidebar={isAdmin}>", "<DashboardLayout isAdmin={isAdmin} showSidebar={true}>")

with open("src/app/[locale]/architecture/ArchitectureClient.tsx", "w") as f:
    f.write(content)
