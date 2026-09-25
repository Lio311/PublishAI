import { processIncomingReviewEmail, db, pdfParser } from '../../services/emailService';

describe('emailService - processIncomingReviewEmail', () => {
  let findSubmissionIdSpy: jest.SpyInstance;
  let extractCommentsSpy: jest.SpyInstance;

  beforeEach(() => {
    findSubmissionIdSpy = jest.spyOn(db, 'findSubmissionId');
    extractCommentsSpy = jest.spyOn(pdfParser, 'extractComments');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should extract journal and article info and cross-reference', async () => {
    findSubmissionIdSpy.mockResolvedValue('sub-123');

    const emailData = {
      sender: 'editor@nature.com',
      subject: 'Re: My Awesome Paper',
      body: 'Here are the reviews.',
    };

    const result = await processIncomingReviewEmail(emailData);

    expect(findSubmissionIdSpy).toHaveBeenCalledWith('nature', 'My Awesome Paper');
    expect(result.submissionId).toBe('sub-123');
    expect(result.comments).toEqual([]);
  });

  it('should parse PDF attachments to extract comments', async () => {
    findSubmissionIdSpy.mockResolvedValue('sub-456');
    extractCommentsSpy.mockResolvedValue(['Fix typo on page 2', 'Expand section 3']);

    const emailData = {
      sender: 'review@science.org',
      subject: 'Fwd: Quantum Gravity',
      body: 'See attached.',
      attachments: [
        { filename: 'review.pdf', contentType: 'application/pdf', content: 'buffer' },
        { filename: 'image.png', contentType: 'image/png', content: 'buffer' }
      ]
    };

    const result = await processIncomingReviewEmail(emailData);

    expect(findSubmissionIdSpy).toHaveBeenCalledWith('science', 'Quantum Gravity');
    expect(extractCommentsSpy).toHaveBeenCalledTimes(1);
    expect(extractCommentsSpy).toHaveBeenCalledWith(emailData.attachments[0]);
    expect(result.comments).toEqual(['Fix typo on page 2', 'Expand section 3']);
  });
});
