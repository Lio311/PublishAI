import graphviz
import urllib.request
import urllib.parse

def generate_master_architecture():
    dot = graphviz.Digraph('PublishAI_Master_Architecture', format='svg')
    
    # Global Attributes for maximum spaciousness
    dot.attr(rankdir='TB', nodesep='1.5', ranksep='1.8', fontname='Helvetica', splines='spline')
    dot.attr('node', fontname='Helvetica', style='filled,rounded', penwidth='2', margin='0.2')
    dot.attr('edge', fontname='Helvetica', fontsize='11', color='#555555', penwidth='1.5')

    def make_label(title, desc):
        title = title.replace('&', '&amp;')
        desc = desc.replace('&', '&amp;')
        return f'<<TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0"><TR><TD><B>{title}</B></TD></TR><TR><TD><FONT POINT-SIZE="10">{desc}</FONT></TD></TR></TABLE>>'

    # ==========================================
    # LEFT COLUMN: Frontend, Infra & DB
    # ==========================================
    with dot.subgraph(name='cluster_infra') as infra:
        infra.attr(label='Frontend, Infrastructure & Databases', style='filled', color='#f8f9fa', fontname='Helvetica-Bold', fontsize='14', margin='0.5')
        
        infra.node('NextUI', make_label('Next.js 16 UI (React 19)', 'Client interface & layout rendering'), shape='box', fillcolor='#e0f7fa', color='#00838f')
        infra.node('Editors', make_label('Tiptap & Monaco Editors', 'Rich text and code diff visualization'), shape='box', fillcolor='#e0f7fa', color='#00838f')
        infra.node('ForceGraph', make_label('react-force-graph-2d', 'Visualizes GraphRAG entities & nodes'), shape='box', fillcolor='#e0f7fa', color='#00838f')
        
        infra.node('APIRoutes', make_label('Next.js API Routes', 'Serverless endpoints (/api/...)'), shape='box', fillcolor='#bbdefb', color='#1976d2')
        
        infra.node('VercelBlob', make_label('Vercel Blob Storage', 'Persists raw PDF, Word, and Image files'), shape='folder', fillcolor='#cfd8dc', color='#607d8b')
        infra.node('Inngest', make_label('Inngest Event Engine', 'Orchestrates async background jobs'), shape='box', fillcolor='#c5cae9', color='#3f51b5')
        infra.node('AuthJS', make_label('Auth.js (NextAuth)', 'Handles Google OAuth & sessions'), shape='box', fillcolor='#d1c4e9', color='#512da8')
        infra.node('Upstash', make_label('Upstash Redis', 'Rate-limiting & caching layer'), shape='cylinder', fillcolor='#ffcdd2', color='#d32f2f')
        infra.node('Stripe', make_label('Stripe API', 'Manages user subscriptions & billing'), shape='box', fillcolor='#b3e5fc', color='#0288d1')
        infra.node('Nodemailer', make_label('Nodemailer', 'Dispatches SMTP email notifications'), shape='box', fillcolor='#fff9c4', color='#fbc02d')
        
        infra.node('NeonDB', make_label('Neon Postgres (Drizzle)', 'Relational data: Users, Submissions, Journals'), shape='cylinder', fillcolor='#c5e1a5', color='#558b2f')
        infra.node('VectorDB', make_label('pgvector & GraphRAG', 'Vector chunks & scientific entity relationships'), shape='cylinder', fillcolor='#c5e1a5', color='#558b2f')
        infra.node('RLHF', make_label('RLHF Logs (NeonDB)', 'Stores human feedback to tune agent logic'), shape='cylinder', fillcolor='#c5e1a5', color='#558b2f')

    # ==========================================
    # CENTER COLUMN: The 11-Step Algorithm
    # ==========================================
    with dot.subgraph(name='cluster_pipeline') as pipe:
        pipe.attr(label='PublishAI 11-Step Core Algorithm', style='filled', color='#ffffff', fontname='Helvetica-Bold', fontsize='16', pencolor='#000000', penwidth='3', margin='0.8')
        
        pipe.node('Step1', make_label('1. Document Upload', 'User uploads manuscript; triggers async ingestion'), fillcolor='#e0f7fa', color='#00838f')
        pipe.node('Step2', make_label('2. Clarification Agent', 'Interviews user & extracts target journal constraints'), fillcolor='#e8f5e9', color='#2e7d32')
        pipe.node('Step3', make_label('3. Planning Agent', 'Drafts high-level revision strategy & identifies flaws'), fillcolor='#e8f5e9', color='#2e7d32')
        pipe.node('Step4', make_label('4. Knowledge Agent', 'Retrieves external literature & cross-domain analogies'), fillcolor='#e8f5e9', color='#2e7d32')
        pipe.node('Step5', make_label('5. Visual & Data Verification', 'Extracts visual charts and verifies raw statistics'), fillcolor='#fff3e0', color='#ef6c00')
        
        with pipe.subgraph(name='cluster_debate') as debate:
            debate.attr(label='6. Scientific Review Debate (Vercel AI SDK)', style='dashed', color='#1565c0', fontname='Helvetica-Bold', margin='0.3')
            debate.node('RevHarsh', make_label('Harsh Reviewer', 'Focuses on deep methodological flaws'), fillcolor='#e3f2fd', color='#1565c0')
            debate.node('RevNovel', make_label('Novelty Reviewer', 'Assesses innovation and impact'), fillcolor='#e3f2fd', color='#1565c0')
            debate.node('RevOpt', make_label('Optimist Reviewer', 'Highlights strengths and readability'), fillcolor='#e3f2fd', color='#1565c0')
            
        pipe.node('Step7', make_label('7. Area Chair Meta-Agent', 'Synthesizes reviews and generates final Rebuttal'), fillcolor='#e8eaf6', color='#283593')
        pipe.node('Step8', make_label('8. Academic Writing Agent', 'Rewrites text in standard academic tone (removes AI style)'), fillcolor='#f3e5f5', color='#6a1b9a')
        pipe.node('Step9', make_label('9. Execution Agent', 'Applies line-by-line Diff changes to the manuscript'), fillcolor='#f3e5f5', color='#6a1b9a')
        pipe.node('Step10', make_label('10. QA Agent', 'Final checks: Plagiarism, references, & formatting rules'), fillcolor='#f3e5f5', color='#6a1b9a')
        pipe.node('Step11', make_label('11. Compilation & Export', 'Packages final Word/PDF and Cover Letter for user'), fillcolor='#e0f7fa', color='#00838f')

        # Linear Flow Edges
        edge_attrs = {'penwidth': '3', 'color': '#000000', 'headport': 'n', 'tailport': 's'}
        pipe.edge('Step1', 'Step2', **edge_attrs)
        pipe.edge('Step2', 'Step3', **edge_attrs)
        pipe.edge('Step3', 'Step4', **edge_attrs)
        pipe.edge('Step4', 'Step5', **edge_attrs)
        
        # Fan out
        pipe.edge('Step5', 'RevHarsh', penwidth='3', color='#000000', tailport='s', headport='n')
        pipe.edge('Step5', 'RevNovel', penwidth='3', color='#000000', tailport='s', headport='n')
        pipe.edge('Step5', 'RevOpt', penwidth='3', color='#000000', tailport='s', headport='n')
        
        # Fan in
        pipe.edge('RevHarsh', 'Step7', penwidth='3', color='#000000', tailport='s', headport='n')
        pipe.edge('RevNovel', 'Step7', penwidth='3', color='#000000', tailport='s', headport='n')
        pipe.edge('RevOpt', 'Step7', penwidth='3', color='#000000', tailport='s', headport='n')
        
        pipe.edge('Step7', 'Step8', **edge_attrs)
        pipe.edge('Step8', 'Step9', **edge_attrs)
        pipe.edge('Step9', 'Step10', **edge_attrs)
        pipe.edge('Step10', 'Step11', **edge_attrs)

    # ==========================================
    # RIGHT COLUMN: External AI APIs & Compute
    # ==========================================
    with dot.subgraph(name='cluster_ai') as ai:
        ai.attr(label='External AI & Compute Providers', style='filled', color='#f3e5f5', fontname='Helvetica-Bold', fontsize='14', margin='0.5')
        ai.node('VisionAI', make_label('Vision AI Service', 'Image/Chart parser'), shape='box', fillcolor='#ffe0b2', color='#f57c00')
        ai.node('Claude', make_label('Anthropic Claude 3.5', 'Primary reasoning & text generation'), shape='cloud', fillcolor='#e1bee7', color='#7b1fa2')
        ai.node('OpenAI', make_label('OpenAI o1 & Embeddings', 'Deep logical synthesis & vectorizing'), shape='cloud', fillcolor='#e1bee7', color='#7b1fa2')
        ai.node('Gemini', make_label('Google Gemini 1.5', 'Multimodal analysis (Optimist)'), shape='cloud', fillcolor='#e1bee7', color='#7b1fa2')
        ai.node('E2B', make_label('E2B Sandbox', 'Secure Python/SciPy execution'), shape='box', fillcolor='#ffcdd2', color='#e53935')
        ai.node('MCP', make_label('Model Context Protocol', 'Connects to PubMed/ArXiv APIs'), shape='box', fillcolor='#ffcdd2', color='#e53935')

    # ==========================================
    # DETAILED SATELLITE EDGES
    # ==========================================
    dot.attr('edge', style='dashed', color='#78909c', penwidth='1.5')
    
    # Left Connections (UI & Infra -> Flow)
    dot.edge('NextUI', 'Step1', label=' User drops file')
    dot.edge('Step1', 'APIRoutes', label=' Posts form data')
    dot.edge('APIRoutes', 'VercelBlob', label=' Streams file')
    dot.edge('APIRoutes', 'Inngest', label=' Triggers background task')
    dot.edge('NextUI', 'AuthJS', label=' Google Login')
    dot.edge('APIRoutes', 'Upstash', label=' Checks IP Rate Limit')
    dot.edge('APIRoutes', 'Stripe', label=' Verifies subscription')
    
    dot.edge('Step4', 'VectorDB', label=' GraphRAG semantic search')
    dot.edge('Step9', 'Editors', label=' Populates UI Diff editor')
    dot.edge('Step9', 'NeonDB', label=' Saves new version history')
    dot.edge('Step10', 'ForceGraph', label=' Generates citation map')
    dot.edge('Step11', 'Nodemailer', label=' Mails success notification')
    dot.edge('Step7', 'RLHF', label=' Saves user acceptance data')
    
    # Right Connections (Flow -> AI)
    dot.edge('Step2', 'Claude', label=' Extracts logic')
    dot.edge('Step4', 'MCP', label=' Queries external papers')
    
    dot.edge('Step5', 'VisionAI', label=' Sends PDF pages')
    dot.edge('VisionAI', 'E2B', label=' Pipes numeric arrays')
    dot.edge('E2B', 'Step5', label=' Returns calculated P-values')
    
    dot.edge('RevHarsh', 'Claude')
    dot.edge('RevNovel', 'OpenAI')
    dot.edge('RevOpt', 'Gemini')
    dot.edge('Step7', 'OpenAI', label=' Uses o1-preview for synthesis')
    
    dot.edge('Step8', 'Claude')
    dot.edge('Step10', 'Claude')

    import json
    url = "https://quickchart.io/graphviz"
    dot_code = dot.source
    
    with open('debug.dot', 'w') as f:
        f.write(dot_code)
        
    png_path = "publishai_master_architecture.png"
    svg_path = "publishai_master_architecture.svg"
    
    # Output to PNG via POST
    png_data = json.dumps({"graph": dot_code, "format": "png"}).encode("utf-8")
    png_req = urllib.request.Request(url, data=png_data, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(png_req) as response, open(png_path, 'wb') as out_file:
        out_file.write(response.read())
    
    # Output to SVG via POST
    svg_data = json.dumps({"graph": dot_code, "format": "svg"}).encode("utf-8")
    svg_req = urllib.request.Request(url, data=svg_data, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(svg_req) as response, open(svg_path, 'wb') as out_file:
        out_file.write(response.read())
    
    print(f"Master diagram successfully generated and saved to: {png_path} and {svg_path}")

if __name__ == "__main__":
    generate_master_architecture()
