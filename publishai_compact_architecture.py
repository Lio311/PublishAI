import graphviz
import urllib.request
import urllib.parse
import json

def generate_compact_architecture():
    dot = graphviz.Digraph('PublishAI_Compact_Architecture', format='svg')
    
    # Compact settings: LR direction is often easier to read on wide screens
    dot.attr(rankdir='LR', nodesep='0.4', ranksep='0.6', fontname='Helvetica', splines='spline')
    dot.attr('node', fontname='Helvetica-Bold', style='filled,rounded', penwidth='2', margin='0.1')
    dot.attr('edge', fontname='Helvetica', fontsize='10', color='#777777', penwidth='1.5')

    # ==========================================
    # 1. FRONTEND & API
    # ==========================================
    with dot.subgraph(name='cluster_ui') as ui:
        ui.attr(label='Frontend & Auth', style='filled', color='#e3f2fd', fontname='Helvetica-Bold')
        ui.node('UI', 'Next.js 16 UI', shape='box', fillcolor='#bbdefb', color='#1976d2')
        ui.node('Auth', 'NextAuth.js', shape='box', fillcolor='#bbdefb', color='#1976d2')
        ui.node('API', 'API Routes', shape='box', fillcolor='#90caf9', color='#1565c0')
        ui.node('Stripe', 'Stripe Billing', shape='box', fillcolor='#90caf9', color='#1565c0')
        ui.edge('UI', 'API')
        ui.edge('UI', 'Auth')
        ui.edge('API', 'Stripe')

    # ==========================================
    # 2. INFRASTRUCTURE & DB
    # ==========================================
    with dot.subgraph(name='cluster_infra') as infra:
        infra.attr(label='Infra & Data', style='filled', color='#f1f8e9')
        infra.node('DB', 'Neon Postgres', shape='cylinder', fillcolor='#c5e1a5', color='#558b2f')
        infra.node('ORM', 'Drizzle ORM', shape='box', fillcolor='#c5e1a5', color='#558b2f')
        infra.node('VDB', 'pgvector', shape='cylinder', fillcolor='#c5e1a5', color='#558b2f')
        infra.node('Q', 'Inngest Engine', shape='box', fillcolor='#c5cae9', color='#3f51b5')
        infra.node('Redis', 'Upstash Redis', shape='cylinder', fillcolor='#ffcdd2', color='#c62828')
        infra.edge('Q', 'ORM', style='dashed')
        infra.edge('ORM', 'DB')
        infra.edge('ORM', 'VDB')

    # ==========================================
    # 3. PHASE 1: CORE REVISION
    # ==========================================
    with dot.subgraph(name='cluster_pipeline') as pipe:
        pipe.attr(label='Phase 1: Core Revision', style='filled', color='#ffffff', penwidth='2')
        pipe.node('S1', '1. Upload\n(Mammoth/Docx)', fillcolor='#e0f7fa')
        pipe.node('S2', '2. Clarify\n(Vercel AI)', fillcolor='#e8f5e9')
        pipe.node('S3', '3. Plan', fillcolor='#e8f5e9')
        pipe.node('S4', '4. Knowledge\n(LangChain/GraphRAG)', fillcolor='#e8f5e9')
        pipe.node('S5', '5. Visual Verify', fillcolor='#fff3e0')
        
        with pipe.subgraph(name='cluster_debate') as debate:
            debate.attr(label='6. Debate (Vercel AI SDK)', style='dashed', color='#1565c0')
            debate.node('R_H', 'Harsh Rev', fillcolor='#e3f2fd')
            debate.node('R_N', 'Novel Rev', fillcolor='#e3f2fd')
            debate.node('R_O', 'Optimist Rev', fillcolor='#e3f2fd')
            
        pipe.node('S7', '7. Area Chair', fillcolor='#e8eaf6')
        pipe.node('S8', '8. Write', fillcolor='#f3e5f5')
        pipe.node('S9', '9. Execute\n(Tiptap/Monaco)', fillcolor='#f3e5f5')
        pipe.node('S10', '10. QA\n(Recharts)', fillcolor='#f3e5f5')
        pipe.node('S11', '11. Export\n(Mammoth/Docx)', fillcolor='#e0f7fa')

        pipe.edge('S1', 'S2', penwidth='2', color='black')
        pipe.edge('S2', 'S3', penwidth='2', color='black')
        pipe.edge('S3', 'S4', penwidth='2', color='black')
        pipe.edge('S4', 'S5', penwidth='2', color='black')
        
        pipe.edge('S5', 'R_H', penwidth='2', color='black')
        pipe.edge('S5', 'R_N', penwidth='2', color='black')
        pipe.edge('S5', 'R_O', penwidth='2', color='black')
        
        pipe.edge('R_H', 'S7', penwidth='2', color='black')
        pipe.edge('R_N', 'S7', penwidth='2', color='black')
        pipe.edge('R_O', 'S7', penwidth='2', color='black')
        
        pipe.edge('S7', 'S8', penwidth='2', color='black')
        pipe.edge('S8', 'S9', penwidth='2', color='black')
        pipe.edge('S9', 'S10', penwidth='2', color='black')
        pipe.edge('S10', 'S11', penwidth='2', color='black')

    # ==========================================
    # 4. PHASE 2: JOURNAL CONNECTION
    # ==========================================
    with dot.subgraph(name='cluster_phase2') as p2:
        p2.attr(label='Phase 2: Journal Connection', style='filled', color='#fce4ec', penwidth='2')
        p2.node('S12', '12. Map Journal\n(Playwright)', fillcolor='#f8bbd0')
        p2.node('S13', '13. Extract Rules', fillcolor='#f8bbd0')
        p2.node('S14', '14. Format\n(Tiptap/Monaco)', fillcolor='#f8bbd0')
        p2.node('S15', '15. Validate', fillcolor='#f8bbd0')
        p2.edge('S11', 'S12', penwidth='2', color='#c2185b', style='dashed')
        p2.edge('S12', 'S13', penwidth='2', color='black')
        p2.edge('S13', 'S14', penwidth='2', color='black')
        p2.edge('S14', 'S15', penwidth='2', color='black')

    # ==========================================
    # 5. PHASE 3: PEER REVIEW ITERATION
    # ==========================================
    with dot.subgraph(name='cluster_phase3') as p3:
        p3.attr(label='Phase 3: R&R Iteration', style='filled', color='#fff8e1', penwidth='2')
        p3.node('S16', '16. Ingest Feedback\n(pdf-parse/Mammoth)', fillcolor='#ffecb3')
        p3.node('S17', '17. Breakdown', fillcolor='#ffecb3')
        p3.node('S18', '18. Strategy\n(GraphRAG)', fillcolor='#ffecb3')
        p3.node('S19', '19. Direct Revision\n(Tiptap)', fillcolor='#ffecb3')
        p3.node('S20', '20. Rebuttal Letter', fillcolor='#ffecb3')
        p3.edge('S15', 'S16', penwidth='2', color='#f57f17', style='dashed')
        p3.edge('S16', 'S17', penwidth='2', color='black')
        p3.edge('S17', 'S18', penwidth='2', color='black')
        p3.edge('S18', 'S19', penwidth='2', color='black')
        p3.edge('S19', 'S20', penwidth='2', color='black')

    # ==========================================
    # 6. EXTERNAL AI & TOOLS
    # ==========================================
    with dot.subgraph(name='cluster_ai') as ai:
        ai.attr(label='AI Providers', style='filled', color='#f3e5f5')
        ai.node('Claude', 'Claude 3.5', shape='cloud', fillcolor='#e1bee7')
        ai.node('OAI', 'OpenAI o1', shape='cloud', fillcolor='#e1bee7')
        ai.node('Gem', 'Gemini 1.5', shape='cloud', fillcolor='#e1bee7')
        ai.node('E2B', 'E2B Sandbox', shape='box', fillcolor='#ffcdd2')

    # CONNECTIONS
    dot.edge('API', 'S1', style='dashed')
    dot.edge('API', 'Redis', label='Rate Limit')
    dot.edge('API', 'Q', label='Triggers')
    dot.edge('Q', 'S1', style='dashed')
    
    dot.edge('S5', 'E2B', style='dashed', color='#e53935')
    dot.edge('S2', 'Claude', style='dashed')
    dot.edge('S7', 'OAI', style='dashed')
    dot.edge('R_O', 'Gem', style='dashed')

    # Render via QuickChart API POST
    dot_code = dot.source
    url = "https://quickchart.io/graphviz"
    
    png_data = json.dumps({"graph": dot_code, "format": "png"}).encode("utf-8")
    png_req = urllib.request.Request(url, data=png_data, headers={'Content-Type': 'application/json'})
    png_path = "publishai_compact_architecture.png"
    with urllib.request.urlopen(png_req) as response, open(png_path, 'wb') as out_file:
        out_file.write(response.read())
    
    svg_data = json.dumps({"graph": dot_code, "format": "svg"}).encode("utf-8")
    svg_req = urllib.request.Request(url, data=svg_data, headers={'Content-Type': 'application/json'})
    svg_path = "publishai_compact_architecture.svg"
    with urllib.request.urlopen(svg_req) as response, open(svg_path, 'wb') as out_file:
        out_file.write(response.read())
        
    print("Compact diagram saved with Phase 2, 3 and libraries.")

if __name__ == "__main__":
    generate_compact_architecture()
