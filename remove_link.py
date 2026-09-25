with open("src/app/[locale]/flowchart/FlowchartClient.tsx", "r") as f:
    content = f.read()

link_code = """<Link href="/architecture" className="text-sm text-blue-600 hover:text-blue-800 underline underline-offset-2 mt-1 inline-block">
                  {isHe ? '← חזרה לעמוד ארכיטקטורה' : '← Back to Architecture Page'}
                </Link>"""

if link_code in content:
    content = content.replace(link_code, "")
    with open("src/app/[locale]/flowchart/FlowchartClient.tsx", "w") as f:
        f.write(content)
    print("Link removed successfully.")
else:
    print("Link code not found. Please verify exact text.")
