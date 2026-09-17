import { generateText } from "ai";
const x: Parameters<typeof generateText>[0] = {} as any;
console.log(Object.keys(x));
