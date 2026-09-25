import { processIncomingReviewEmail, db, pdfParser } from '../../services/emailService';

jest.mock('../../services/emailService', () => {
  const actualModule = jest.requireActual('../../services/emailService');
  return {
    ...actualModule,
    db: {
      findSubmissionId: jest.fn(),
    },
    pdfParser: {
      extractComments: jest.fn(),
    }
  };
});

describe('emailService - processIncomingReviewEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should extract journal and article info and cross-reference', async () => {
    (db.findSubmissionId as jest.Mock).mockResolvedValue('sub-123');

    const emailData = {
      sender: 'editor@nature.com',
      subject: 'Re: My Awesome Paper',
      body: 'Here are the reviews.',
    };

    const result = await processIncomingReviewEmail(emailData);

    expect(db.findSubmissionId).toHaveBeenCalledWith('nature', 'My Awesome Paper');
    expect(result.submissionId).toBe('sub-123');
    expect(result.comments).toEqual([]);
  });

  it('should parse PDF attachments to extract comments', async () => {
    (db.findSubmissionId as jest.Mock).mockResolvedValue('sub-456');
    (pdfParser.extractComments as jest.Mock).mockResolvedValue(['Fix typo on page 2', 'Expand section 3']);

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

    expect(db.findSubmissionId).toHaveBeenCalledWith('science', 'Quantum Gravity');
    expect(pdfParser.extractComments).toHaveBeenCalledTimes(1);
    expect(pdfParser.extractComments).toHaveBeenCalledWith(emailData.attachments[0]);
    expect(result.comments).toEqual(['Fix typo on page 2', 'Expand section 3']);
  });
});
