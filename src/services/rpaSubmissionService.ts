import { db } from "./db";
import { rpaJobs } from "./db/schema";
import { eq } from "drizzle-orm";

export class RPASubmissionService {
  protected jobId: string;

  constructor(jobId: string) {
    this.jobId = jobId;
  }

  // Simulate Playwright initialization with human-like delays
  protected async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected async simulateHumanInteraction(min = 1000, max = 3000) {
    const delayTime = Math.floor(Math.random() * (max - min + 1)) + min;
    await this.delay(delayTime);
  }

  public async initializeBrowser() {
    console.log(`[RPA Job ${this.jobId}] Initializing headless browser...`);
    await this.simulateHumanInteraction(1500, 3000);
    console.log(`[RPA Job ${this.jobId}] Browser initialized.`);
  }

  public async pauseJob(currentStep: string, stateData: any = {}) {
    console.log(`[RPA Job ${this.jobId}] Pausing job at step: ${currentStep}`);
    await db.update(rpaJobs)
      .set({
        status: "paused",
        currentStep: currentStep,
        stateData: stateData,
        updatedAt: new Date(),
      })
      .where(eq(rpaJobs.id, this.jobId));
  }

  public async resumeJob() {
    console.log(`[RPA Job ${this.jobId}] Resuming job...`);
    const [job] = await db.select().from(rpaJobs).where(eq(rpaJobs.id, this.jobId));
    
    if (!job) {
      throw new Error(`Job ${this.jobId} not found`);
    }

    await db.update(rpaJobs)
      .set({
        status: "running",
        updatedAt: new Date(),
      })
      .where(eq(rpaJobs.id, this.jobId));

    return job;
  }
  
  public async completeJob() {
     console.log(`[RPA Job ${this.jobId}] Completing job...`);
     await db.update(rpaJobs)
      .set({
        status: "completed",
        updatedAt: new Date(),
      })
      .where(eq(rpaJobs.id, this.jobId));
  }

  public async failJob(errorLog: string) {
    console.error(`[RPA Job ${this.jobId}] Job failed: ${errorLog}`);
    await db.update(rpaJobs)
      .set({
        status: "error",
        errorLog: errorLog,
        updatedAt: new Date(),
      })
      .where(eq(rpaJobs.id, this.jobId));
  }
}
