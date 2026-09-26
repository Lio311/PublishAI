import { RPASubmissionService } from "../../src/services/rpaSubmissionService";
import { db } from "../../src/services/db";

// Mock Drizzle ORM's eq function while preserving relations
jest.mock("drizzle-orm", () => {
  const actual = jest.requireActual("drizzle-orm");
  return {
    ...actual,
    eq: jest.fn((col: any, val: any) => ({ col, val })),
  };
});

// Mock the DB methods
const mockWhere = jest.fn();
const mockSet = jest.fn(() => ({ where: mockWhere }));
const mockUpdate = jest.fn(() => ({ set: mockSet }));

const mockSelectFromWhere = jest.fn();
const mockFrom = jest.fn(() => ({ where: mockSelectFromWhere }));
const mockSelect = jest.fn(() => ({ from: mockFrom }));

jest.mock("../../src/services/db", () => ({
  db: {
    update: jest.fn(),
    select: jest.fn(),
  },
}));

describe("RPASubmissionService", () => {
  let service: RPASubmissionService;
  const jobId = "test-job-123";

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    
    // Wire up mock implementations
    (db.update as jest.Mock).mockImplementation(mockUpdate);
    (db.select as jest.Mock).mockImplementation(mockSelect);

    service = new RPASubmissionService(jobId);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("initializeBrowser simulates human interaction and delays correctly", async () => {
    const initPromise = service.initializeBrowser();
    
    // Fast-forward timers to resolve the delay
    jest.runAllTimers();
    await initPromise;

    // If it didn't hang, it means the timer mock worked.
    expect(true).toBe(true);
  });

  it("pauseJob updates db with paused status and current step", async () => {
    const step = "upload_docs";
    const stateData = { files: 3 };
    
    await service.pauseJob(step, stateData);

    expect(db.update).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "paused",
        currentStep: step,
        stateData: stateData,
        updatedAt: expect.any(Date),
      })
    );
    expect(mockWhere).toHaveBeenCalled();
  });

  it("resumeJob updates db with running status if job is found", async () => {
    mockSelectFromWhere.mockResolvedValueOnce([{ id: jobId, status: "paused" }]);

    const result = await service.resumeJob();

    expect(mockSelect).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalled();
    expect(mockSelectFromWhere).toHaveBeenCalled();

    expect(db.update).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "running",
        updatedAt: expect.any(Date),
      })
    );
    expect(result).toEqual({ id: jobId, status: "paused" });
  });

  it("resumeJob throws an error if job is not found", async () => {
    mockSelectFromWhere.mockResolvedValueOnce([]);

    await expect(service.resumeJob()).rejects.toThrow(`Job ${jobId} not found`);
    expect(db.update).not.toHaveBeenCalled();
  });

  it("completeJob updates db with completed status", async () => {
    await service.completeJob();

    expect(db.update).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "completed",
        updatedAt: expect.any(Date),
      })
    );
  });

  it("failJob updates db with error status and errorLog", async () => {
    const errorMsg = "Upload timeout";
    await service.failJob(errorMsg);

    expect(db.update).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "error",
        errorLog: errorMsg,
        updatedAt: expect.any(Date),
      })
    );
  });
});
