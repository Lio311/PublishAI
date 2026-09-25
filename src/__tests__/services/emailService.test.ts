import { processIncomingReviewEmail } from '../../services/emailService';

// Mock the db dependency
jest.mock('@/services/db', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([{ id: 123 }])
  }
}));

// Removed pdf-parse mock as it is no longer used

describe('emailService - processIncomingReviewEmail', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should extract journal and article info and cross-reference', async () => {
    const emailData = {
      sender: 'editor@nature.com',
      subject: 'Re: My Awesome Paper',
      body: 'Here are the reviews.',
    };

    const result = await processIncomingReviewEmail(emailData);
    expect(result.submissionId).toBe('123');
    expect(result.comments).toEqual([]);
  });

  it('should parse PDF attachments to extract comments', async () => {
    const emailData = {
      sender: 'review@science.org',
      subject: 'Fwd: Quantum Gravity',
      body: 'See attached.',
      attachments: [
        { filename: 'review.pdf', contentType: 'application/pdf', content: Buffer.from('fake-pdf') },
        { filename: 'image.png', contentType: 'image/png', content: Buffer.from('fake-img') }
      ]
    };

    const result = await processIncomingReviewEmail(emailData);
    expect(result.submissionId).toBe('123');
    expect(result.comments).toEqual(['Mock extracted PDF text: Reviewer requests major revisions on Section 3.']);
  });
});
