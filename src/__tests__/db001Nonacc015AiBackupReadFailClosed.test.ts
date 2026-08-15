import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AIRepository } from '../database/repositories/AIRepository';
import { BackupRepository } from '../database/repositories/BackupRepository';

const mocks = vi.hoisted(() => ({
  getSupabaseClient: vi.fn(),
  performRead: vi.fn(),
  getAiModels: vi.fn(),
  getPromptTemplates: vi.fn(),
  getBackupDefinitions: vi.fn()
}));

vi.mock('../database/client', () => ({ getSupabaseClient: mocks.getSupabaseClient }));
vi.mock('../database/repositories/FallbackStorage', () => ({
  FallbackStorage: {
    performRead: mocks.performRead,
    getAiModels: mocks.getAiModels,
    getPromptTemplates: mocks.getPromptTemplates,
    getBackupDefinitions: mocks.getBackupDefinitions
  }
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getAiModels.mockReturnValue([{ id: 'stale-model' }]);
  mocks.getPromptTemplates.mockReturnValue([{ id: 'stale-prompt' }]);
  mocks.getBackupDefinitions.mockReturnValue([{ id: 'stale-backup' }]);
});

describe('DB-001-NONACC-015 AI/Backup read fail-closed hardening', () => {
  it('does not return stale AI, prompt, or backup data after canonical failure', async () => {
    mocks.performRead.mockRejectedValue(new Error('PERSISTENCE_UNKNOWN'));

    await expect(new AIRepository().getModel('stale-model')).rejects.toThrow('PERSISTENCE_UNKNOWN');
    await expect(new AIRepository().getPrompt('stale-prompt')).rejects.toThrow('PERSISTENCE_UNKNOWN');
    await expect(new BackupRepository().getDefinition('stale-backup')).rejects.toThrow('PERSISTENCE_UNKNOWN');
    expect(mocks.getAiModels).not.toHaveBeenCalled();
    expect(mocks.getPromptTemplates).not.toHaveBeenCalled();
    expect(mocks.getBackupDefinitions).not.toHaveBeenCalled();
  });

  it('preserves canonical empty semantics without consulting local fallback', async () => {
    mocks.performRead.mockImplementation(async (_scope, _table, canonicalRead) => canonicalRead());
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      maybeSingle: vi.fn(async () => ({ data: null, error: null }))
    };
    mocks.getSupabaseClient.mockReturnValue({ from: vi.fn(() => query) });

    await expect(new AIRepository().getModel('missing-model')).resolves.toBeUndefined();
    await expect(new BackupRepository().getDefinition('missing-backup')).resolves.toBeUndefined();
    expect(mocks.getAiModels).not.toHaveBeenCalled();
    expect(mocks.getBackupDefinitions).not.toHaveBeenCalled();
  });

  it('returns canonical AI and backup records and preserves scope metadata', async () => {
    mocks.performRead.mockImplementation(async (_scope, _table, canonicalRead) => canonicalRead());
    const aiQuery = {
      select: vi.fn(() => aiQuery),
      eq: vi.fn(() => aiQuery),
      maybeSingle: vi.fn(async () => ({ data: { id: 'canonical-model' }, error: null }))
    };
    const backupQuery = {
      select: vi.fn(() => backupQuery),
      eq: vi.fn(() => backupQuery),
      maybeSingle: vi.fn(async () => ({ data: { id: 'canonical-backup' }, error: null }))
    };
    mocks.getSupabaseClient.mockReturnValue({ from: vi.fn((table: string) => table === 'ai_models' ? aiQuery : backupQuery) });

    await expect(new AIRepository().getModel('canonical-model')).resolves.toMatchObject({ id: 'canonical-model' });
    await expect(new BackupRepository().getDefinition('canonical-backup')).resolves.toMatchObject({ id: 'canonical-backup' });

    expect(mocks.performRead).toHaveBeenNthCalledWith(1, 'system', 'ai_models.getModel', expect.any(Function), expect.any(Function));
    expect(mocks.performRead).toHaveBeenNthCalledWith(2, 'system', 'backup_definitions.getDefinition', expect.any(Function), expect.any(Function));
  });

  it('does not invent a canonical prompt source and fails closed in canonical mode', async () => {
    mocks.performRead.mockImplementation(async (_scope, _table, canonicalRead) => canonicalRead());

    await expect(new AIRepository().getPrompt('prompt-1')).rejects.toThrow('Canonical AI prompt persistence is not configured');
    expect(mocks.getPromptTemplates).not.toHaveBeenCalled();
    expect(mocks.performRead).toHaveBeenCalledWith('system', 'ai_prompts.getPrompt', expect.any(Function), expect.any(Function));
  });
});
