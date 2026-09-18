import { POST } from "./src/app/api/ai/generate/route";

async function run() {
  const req = new Request("http://localhost:3000/api/ai/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: "Please change 'apple' to 'orange' and delete 'banana'.",
      systemPrompt: "You are a helpful assistant.",
      model: "gpt-4o-mini", // Use mini for faster/cheaper testing
    }),
  });

  const res = await POST(req);
  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));
}

run();
