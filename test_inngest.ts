import { Inngest } from "inngest";
const inngest = new Inngest({ id: "my-app" });
export const ingestDocument = inngest.createFunction(
  { id: "ingest-document", triggers: [{ event: "document.uploaded" }] },
  async ({ event, step }) => {
    return event.data;
  }
);
