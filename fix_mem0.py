import os

file_path = "src/lib/mem0.ts"
if os.path.exists(file_path):
    with open(file_path, "r") as f:
        content = f.read()
    # If the key is empty, don't instantiate immediately, or just provide a dummy key
    # Or just don't throw an error inside mem0ai? Wait, mem0ai throws an error if apiKey is empty.
    content = content.replace('process.env.MEM0_API_KEY || ""', 'process.env.MEM0_API_KEY || "dummy_key_for_build"')
    with open(file_path, "w") as f:
        f.write(content)

file_path = "src/services/infra/memoryService.ts"
if os.path.exists(file_path):
    with open(file_path, "r") as f:
        content = f.read()
    content = content.replace('process.env.MEM0_API_KEY || ""', 'process.env.MEM0_API_KEY || "dummy_key_for_build"')
    with open(file_path, "w") as f:
        f.write(content)
