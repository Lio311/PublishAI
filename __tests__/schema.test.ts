import { users, documents, papers, submissions, figures } from '../src/db/schema';
import { getTableConfig } from 'drizzle-orm/pg-core';

describe('Database Schema Constraints', () => {
  it('users table has expected columns', () => {
    const config = getTableConfig(users);
    const cols = config.columns.map(c => c.name);
    expect(cols).toContain('id');
    expect(cols).toContain('name');
    expect(cols).toContain('email');
  });

  it('documents table has expected columns', () => {
    const config = getTableConfig(documents);
    const cols = config.columns.map(c => c.name);
    expect(cols).toContain('id');
    expect(cols).toContain('title');
    expect(cols).toContain('user_id');
    expect(cols).toContain('status');
  });

  it('papers table has expected columns', () => {
    const config = getTableConfig(papers);
    const cols = config.columns.map(c => c.name);
    expect(cols).toContain('id');
    expect(cols).toContain('user_id');
    expect(cols).toContain('target_journal_id');
  });

  it('submissions table has expected columns', () => {
    const config = getTableConfig(submissions);
    const cols = config.columns.map(c => c.name);
    expect(cols).toContain('id');
    expect(cols).toContain('paper_id');
    expect(cols).toContain('connection_id');
    expect(cols).toContain('submission_status');
  });

  it('figures table has expected columns', () => {
    const config = getTableConfig(figures);
    const cols = config.columns.map(c => c.name);
    expect(cols).toContain('id');
    expect(cols).toContain('paper_id');
    expect(cols).toContain('image_url');
    expect(cols).toContain('original_legend');
  });
});
