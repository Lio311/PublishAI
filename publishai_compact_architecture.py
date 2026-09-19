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
        ui.attr(label='Frontend', style='filled', color='#e3f2fd', fontname='Helvetica-Bold')
        ui.node('UI', 'Next.js UI', shape='box', fillcolor='#bbdefb', color='#1976d2')
        ui.node('API', 'API Routes', shape='box', fillcolor='#90caf9', color='#1565c0')
        ui.edge('UI', 'API')

    # ==========================================
    # 2. INFRASTRUCTURE & DB
    # ==========================================
    with dot.subgraph(name='cluster_infra') as infra:
        infra.attr(label='Infra & Data', style='filled', color='#f1f8e9')
        infra.node('DB', 'Neon Postgres', shape='cylinder', fillcolor='#c5e1a5', color='#558b2f')
        infra.node('VDB', 'pgvector', shape='cylinder', fillcolor='#c5e1a5', color='#558b2f')
        infra.node('Q', 'Inngest Engine', shape='box', fillcolor='#c5cae9', color='#3f51b5')
        infra.edge('Q', 'DB', style='dashed')
        infra.edge('Q', 'VDB', style='dashed')

    # ==========================================
    # 3. THE PIPELINE (Compact)
    # ==========================================
    with dot.subgraph(name='cluster_pipeline') as pipe:
        pipe.attr(label='11-Step Algorithm', style='filled', color='#ffffff', penwidth='2')
        pipe.node('S1', '1. Upload', fillcolor='#e0f7fa')
        pipe.node('S2', '2. Clarify', fillcolor='#e8f5e9')
        pipe.node('S3', '3. Plan', fillcolor='#e8f5e9')
        pipe.node('S4', '4. Knowledge', fillcolor='#e8f5e9')
        pipe.node('S5', '5. Visual Verify', fillcolor='#fff3e0')
        
        with pipe.subgraph(name='cluster_debate') as debate:
            debate.attr(label='6. Debate', style='dashed', color='#1565c0')
            debate.node('R_H', 'Harsh Rev', fillcolor='#e3f2fd')
            debate.node('R_N', 'Novel Rev', fillcolor='#e3f2fd')
            debate.node('R_O', 'Optimist Rev', fillcolor='#e3f2fd')
            
        pipe.node('S7', '7. Area Chair', fillcolor='#e8eaf6')
        pipe.node('S8', '8. Write', fillcolor='#f3e5f5')
        pipe.node('S9', '9. Execute', fillcolor='#f3e5f5')
        pipe.node('S10', '10. QA', fillcolor='#f3e5f5')
        pipe.node('S11', '11. Export', fillcolor='#e0f7fa')

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
    # 4. EXTERNAL AI
    # ==========================================
    with dot.subgraph(name='cluster_ai') as ai:
        ai.attr(label='AI Providers', style='filled', color='#f3e5f5')
        ai.node('Claude', 'Claude 3.5', shape='cloud', fillcolor='#e1bee7')
        ai.node('OAI', 'OpenAI o1', shape='cloud', fillcolor='#e1bee7')
        ai.node('Gem', 'Gemini 1.5', shape='cloud', fillcolor='#e1bee7')
        ai.node('E2B', 'E2B Sandbox', shape='box', fillcolor='#ffcdd2')

    # CONNECTIONS
    dot.edge('API', 'S1', style='dashed')
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
        
    print("Compact diagram saved.")

if __name__ == "__main__":
    generate_compact_architecture()
