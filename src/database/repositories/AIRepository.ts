import { getSupabaseClient } from '../client';
import { AIModel, PromptTemplate, KnowledgeEntry } from '../../types';
import { FallbackStorage } from './FallbackStorage';

export class AIRepository {
  public async getModel(id: string): Promise<AIModel | undefined> {
    const rows = await FallbackStorage.performRead<AIModel>(
      'system',
      'ai_models.getModel',
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client is unavailable');
        const { data, error } = await supabase.from('ai_models').select('*').eq('id', id).maybeSingle();
        if (error) throw error;
        return data ? [data as AIModel] : [];
      },
      () => FallbackStorage.getAiModels().filter(model => model.id === id)
    );
    return rows[0];
  }

  public async getPrompt(id: string): Promise<PromptTemplate | undefined> {
    const rows = await FallbackStorage.performRead<PromptTemplate>(
      'system',
      'ai_prompts.getPrompt',
      async () => {
        throw new Error('Canonical AI prompt persistence is not configured');
      },
      () => FallbackStorage.getPromptTemplates().filter(prompt => prompt.id === id)
    );
    return rows[0];
  }
}
