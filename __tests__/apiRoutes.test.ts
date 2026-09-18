
process.env.DATABASE_URL = "postgres://mock";

jest.mock("@/services/db", () => {
  const docStore = [
    { id: 1, title: "Quantum Computing Foundations", status: "pending", userId: "test-user-id", createdAt: new Date() },
    { id: 2, title: "Another doc", status: "draft", userId: "test-user-id", createdAt: new Date() }
  ];
  let inserted = null;

  const chainable = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockImplementation(() => {
      // Simulate GET documents
      return Promise.resolve(docStore);
    }),
    insert: jest.fn().mockImplementation(() => {
       inserted = { id: 3, userId: "test-user-id", status: "pending" };
       return chainable;
    }),
    values: jest.fn().mockImplementation((vals) => {
       inserted = { ...inserted, ...vals };
       return chainable;
    }),
    returning: jest.fn().mockImplementation(() => {
       return Promise.resolve([inserted || docStore[0]]);
    }),
    update: jest.fn().mockImplementation(() => chainable),
    set: jest.fn().mockImplementation((vals) => {
       inserted = { ...docStore[0], ...vals };
       return chainable;
    }),
    delete: jest.fn().mockImplementation(() => chainable),
    then: function(resolve) {
       resolve(docStore);
    }
  };
  return { db: chainable };
});

jest.mock("@/app/auth", () => {
  return {
    auth: jest.fn().mockResolvedValue({ user: { id: "test-user-id", name: "Test User" } })
  };
});


process.env.DATABASE_URL = "postgres://mock";




/**
 * @jest-environment node
 */
import { GET as getAuthMe, PATCH as patchAuthMe } from "@/app/api/auth/me/route";
import { POST as registerUser } from "@/app/api/auth/register/route";
import { GET as getDocuments, POST as createDocument } from "@/app/api/documents/route";
import {
  GET as getDocumentById,
  PATCH as patchDocumentById,
  DELETE as deleteDocumentById,
} from "@/app/api/documents/[id]/route";
import {
  GET as getSections,
  POST as createSection,
} from "@/app/api/documents/[id]/sections/route";
import {
  GET as getVersions,
  POST as createVersion,
} from "@/app/api/documents/[id]/versions/route";
import {
  GET as getExport,
  POST as postExport,
} from "@/app/api/documents/[id]/export/route";
import { NextRequest } from "next/server";

describe("Backend API Routes - Auth & Documents Scaffold", () => {
  describe("Auth API Routes", () => {
    it("GET /api/auth/me returns scaffolded user profile", async () => {
      const res = await getAuthMe();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.user).toBeDefined();
      expect(json.user.email).toBeDefined();
      expect(json.user.name).toBeDefined();
    });

    it("PATCH /api/auth/me updates user profile", async () => {
      const req = new Request("http://localhost/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ name: "Dr. Eleanor Vance" }),
      });
      const res = await patchAuthMe(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.user.name).toBe("Dr. Eleanor Vance");
    });

    it("POST /api/auth/register creates a user account", async () => {
      const req = new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: "researcher@oxford.ac.uk",
          name: "Dr. Marcus Bell",
          institution: "University of Oxford",
          field: "Neurobiology",
        }),
      });
      const res = await registerUser(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.user.email).toBe("researcher@oxford.ac.uk");
      expect(json.user.name).toBe("Dr. Marcus Bell");
    });

    it("POST /api/auth/register returns 400 when email is missing", async () => {
      const req = new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name: "Dr. Missing Email" }),
      });
      const res = await registerUser(req);
      expect(res.status).toBe(400);
    });
  });

  describe("Documents API Routes", () => {
    it("GET /api/documents returns list of scaffolded documents", async () => {
      const req = new NextRequest("http://localhost/api/documents?page=1&limit=10");
      const res = await getDocuments(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json.documents)).toBe(true);
      expect(json.documents.length).toBeGreaterThan(0);
      expect(json.total).toBeGreaterThan(0);
      expect(json.documents[0].title).toBeDefined();
    });

    it("GET /api/documents supports status and search filters", async () => {
      const req = new NextRequest("http://localhost/api/documents?search=Quantum&status=awaiting_approval");
      const res = await getDocuments(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.documents.length).toBeGreaterThanOrEqual(1);
      expect(json.documents[0].title).toContain("Quantum");
    });

    it("POST /api/documents creates a new document", async () => {
      const req = new Request("http://localhost/api/documents", {
        method: "POST",
        body: JSON.stringify({
          title: "Topological Phase Transitions in Fractional Quantum Hall States",
          abstract: "We investigate non-Abelian anyon braiding...",
          targetJournalId: 102,
          keywords: ["Quantum Hall", "Anyons", "Condensed Matter"],
        }),
      });
      const res = await createDocument(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.document.title).toBe("Topological Phase Transitions in Fractional Quantum Hall States");
      expect(json.document.status).toBe("draft");
    });

    it("POST /api/documents returns 400 if title is missing", async () => {
      const req = new Request("http://localhost/api/documents", {
        method: "POST",
        body: JSON.stringify({ abstract: "Only abstract" }),
      });
      const res = await createDocument(req);
      expect(res.status).toBe(400);
    });

    it("GET /api/documents/[id] returns single document details", async () => {
      const req = new NextRequest("http://localhost/api/documents/1");
      const params = Promise.resolve({ id: "1" });
      const res = await getDocumentById(req, { params });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.document).toBeDefined();
      expect(json.document.id).toBe(1);
    });

    it("PATCH /api/documents/[id] updates document fields", async () => {
      const req = new NextRequest("http://localhost/api/documents/1", {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated Title for Paper 1", status: "approved" }),
      });
      const params = Promise.resolve({ id: "1" });
      const res = await patchDocumentById(req, { params });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.document.title).toBe("Updated Title for Paper 1");
    });

    it("DELETE /api/documents/[id] deletes document", async () => {
      const req = new NextRequest("http://localhost/api/documents/1", {
        method: "DELETE",
      });
      const params = Promise.resolve({ id: "1" });
      const res = await deleteDocumentById(req, { params });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(String(json.deletedId)).toBe("1");
    });

    it("GET and POST /api/documents/[id]/sections handles document sections", async () => {
      const params = Promise.resolve({ id: "1" });
      const getReq = new NextRequest("http://localhost/api/documents/1/sections");
      const getRes = await getSections(getReq, { params });
      expect(getRes.status).toBe(200);
      const getJson = await getRes.json();
      expect(Array.isArray(getJson.sections)).toBe(true);

      const postReq = new NextRequest("http://localhost/api/documents/1/sections", {
        method: "POST",
        body: JSON.stringify({
          title: "Supplementary Discussion",
          content: "Detailed mathematical proofs and derivations.",
        }),
      });
      const postRes = await createSection(postReq, { params });
      expect(postRes.status).toBe(201);
      const postJson = await postRes.json();
      expect(postJson.success).toBe(true);
      expect(postJson.section.title).toBe("Supplementary Discussion");
    });

    it("GET and POST /api/documents/[id]/versions handles version history", async () => {
      const params = Promise.resolve({ id: "1" });
      const getReq = new NextRequest("http://localhost/api/documents/1/versions");
      const getRes = await getVersions(getReq, { params });
      expect(getRes.status).toBe(200);
      const getJson = await getRes.json();
      expect(Array.isArray(getJson.versions)).toBe(true);

      const postReq = new NextRequest("http://localhost/api/documents/1/versions", {
        method: "POST",
        body: JSON.stringify({
          changesSummary: "Addressed reviewer comments regarding benchmark dataset",
          format: "latex",
        }),
      });
      const postRes = await createVersion(postReq, { params });
      expect(postRes.status).toBe(201);
      const postJson = await postRes.json();
      expect(postJson.success).toBe(true);
      expect(postJson.version.changesSummary).toContain("reviewer comments");
    });

    it("GET and POST /api/documents/[id]/export handles document export", async () => {
      const params = Promise.resolve({ id: "1" });
      const getReq = new NextRequest("http://localhost/api/documents/1/export?format=pdf");
      const getRes = await getExport(getReq, { params });
      expect(getRes.status).toBe(200);
      const getJson = await getRes.json();
      expect(getJson.success).toBe(true);
      expect(getJson.downloadUrl).toContain(".pdf");

      const postReq = new NextRequest("http://localhost/api/documents/1/export", {
        method: "POST",
        body: JSON.stringify({ format: "docx" }),
      });
      const postRes = await postExport(postReq, { params });
      expect(postRes.status).toBe(200);
      const postJson = await postRes.json();
      expect(postJson.success).toBe(true);
      expect(postJson.format).toBe("docx");
    });
  });
});
