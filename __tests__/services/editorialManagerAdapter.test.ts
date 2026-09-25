import { EditorialManagerAdapter } from "../../src/services/adapters/editorialManagerAdapter";
import { db } from "../../src/services/db";

// Mock Drizzle ORM
jest.mock("drizzle-orm", () => ({
  eq: jest.fn((col, val) => ({ col, val })),
}));

// Mock DB
const mockWhere = jest.fn();
const mockSet = jest.fn(() => ({ where: mockWhere }));
const mockUpdate = jest.fn(() => ({ set: mockSet }));

jest.mock("../../src/services/db", () => ({
  db: {
    update: jest.fn(),
  },
}));

const advanceTimers = async () => {
  for (let i = 0; i < 10; i++) {
    jest.runAllTimers();
    await Promise.resolve(); // flush microtasks
  }
};

describe("EditorialManagerAdapter", () => {
  let adapter: EditorialManagerAdapter;
  const jobId = "job-456";

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    (db.update as jest.Mock).mockImplementation(mockUpdate);
    adapter = new EditorialManagerAdapter(jobId);
    
    // Silence console logs for clean test output
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("login", () => {
    it("logs in successfully and returns true", async () => {
      const loginPromise = adapter.login({ user: "test", pass: "pass" });
      await advanceTimers();
      const result = await loginPromise;
      expect(result).toBe(true);
    });
  });

  describe("uploadDocuments", () => {
    it("uploads documents successfully", async () => {
      const docs = [{ name: "doc1" }, { name: "doc2" }];
      const uploadPromise = adapter.uploadDocuments(docs);
      
      await advanceTimers();
      
      const result = await uploadPromise;
      expect(result).toBe(true);
    });
  });

  describe("fillForms", () => {
    it("fills forms successfully", async () => {
      const formPromise = adapter.fillForms({ title: "Test" });
      await advanceTimers();
      const result = await formPromise;
      expect(result).toBe(true);
    });
  });

  describe("runFullSubmission", () => {
    it("runs the full submission workflow successfully", async () => {
      jest.spyOn(adapter, "initializeBrowser").mockResolvedValue(undefined);
      jest.spyOn(adapter, "login").mockResolvedValue(true);
      jest.spyOn(adapter, "uploadDocuments").mockResolvedValue(true);
      jest.spyOn(adapter, "fillForms").mockResolvedValue(true);
      jest.spyOn(adapter, "completeJob").mockResolvedValue(undefined);
      jest.spyOn(adapter, "failJob").mockResolvedValue(undefined);

      const runPromise = adapter.runFullSubmission(
        { user: "test" },
        [{ name: "doc1" }],
        { title: "Test" }
      );

      await advanceTimers();
      await runPromise;

      expect(adapter.initializeBrowser).toHaveBeenCalled();
      expect(adapter.login).toHaveBeenCalled();
      expect(adapter.uploadDocuments).toHaveBeenCalled();
      expect(adapter.fillForms).toHaveBeenCalled();
      expect(adapter.completeJob).toHaveBeenCalled();
      expect(adapter.failJob).not.toHaveBeenCalled();
    });

    it("handles failure in one of the steps and calls failJob", async () => {
      jest.spyOn(adapter, "initializeBrowser").mockResolvedValue(undefined);
      jest.spyOn(adapter, "login").mockResolvedValue(true);
      jest.spyOn(adapter, "uploadDocuments").mockRejectedValue(new Error("Upload failed"));
      jest.spyOn(adapter, "failJob").mockResolvedValue(undefined);

      const runPromise = adapter.runFullSubmission(
        { user: "test" },
        [{ name: "doc1" }],
        { title: "Test" }
      );

      await advanceTimers();
      await runPromise;

      // Fail job should be called because of the error in uploadDocuments.
      expect(adapter.failJob).toHaveBeenCalledWith("Upload failed");
    });
  });
});
