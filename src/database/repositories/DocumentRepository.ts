import { getSupabaseClient } from '../client';
import { DocumentMetadata, DocumentVersion } from '../../types';
import { EnterpriseLogger } from '../services/EnterpriseLogger';
import { FallbackStorage } from './FallbackStorage';
import { v4 as uuidv4 } from 'uuid';

export class DocumentRepository {
  public async getMetadata(id: string): Promise<DocumentMetadata | undefined> {
    const isHealthy = await FallbackStorage.isHealthy();
    if (isHealthy) {
        try {
            const supabase = getSupabaseClient();
            if (supabase) {
                const { data, error } = await supabase.from('dms_documents').select('*').eq('id', id).single();
                if (!error && data) return this.mapFromDatabase(data);
            }
        } catch (err: any) {
            EnterpriseLogger.error("Failed to fetch document metadata:", "DocumentRepository", { error: err });
        }
    }
    return FallbackStorage.getDmsDocuments().find(d => d.id === id);
  }

  public async saveMetadata(metadata: DocumentMetadata): Promise<void> {
    // Implement database saving (Upsert)
    await FallbackStorage.performWrite(
        metadata.tenantId,
        'dms_documents',
        metadata.id,
        'UPDATE',
        metadata,
        async () => { /* Supabase implementation */ },
        () => { /* Fallback implementation */ }
    );
  }

  private mapFromDatabase(data: any): DocumentMetadata {
    return {
      id: data.id,
      tenantId: data.tenant_id || data.tenantId || '',
      fileName: data.file_name || data.fileName || '',
      fileSize: data.file_size || data.fileSize || 0,
      uploadedBy: data.uploaded_by || data.uploadedBy || '',
      uploadedDate: data.uploaded_date || data.uploadedDate || '',
      status: data.status || 'active',
      checksum: data.checksum || ''
    };
  }
}
