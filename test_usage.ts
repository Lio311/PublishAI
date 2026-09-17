import { generateText } from "ai";
async function test() {
  const res = await generateText({} as any);
  console.log(res.usage);
}
