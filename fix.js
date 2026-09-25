const fs = require('fs');
const file = 'src/app/api/submissions/[id]/cascade/route.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'export async function POST(req: Request, { params }: { params: { id: string } }) {',
  'export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {'
);
code = code.replace(
  'const submissionId = Number(params.id);',
  'const { id } = await context.params;\n    const submissionId = Number(id);\n    const userId = session.user.id;'
);
code = code.replace(
  'eq(jc.userId, session.user.id),',
  'eq(jc.userId, userId),'
);
code = code.replace(
  'userId: session.user.id,',
  'userId: userId,'
);
code = code.replace(
  'const previousJournalId = submission.connection?.journalId;',
  'const previousJournalId = (submission.connection as any)?.journalId;'
);

fs.writeFileSync(file, code);
