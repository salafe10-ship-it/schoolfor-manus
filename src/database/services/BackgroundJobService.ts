import { BackgroundJob, JobStatus } from '../../types';
import { BackgroundJobRepository } from '../repositories/BackgroundJobRepository';
import { EnterpriseAuditLogger } from '../../utils/EnterpriseAuditLogger';
import { v4 as uuidv4 } from 'uuid';
import { IoCContainer } from '../IoCContainer';

export class BackgroundJobService {
  public static $inject = ['BackgroundJobRepository'];

  constructor(private repo: BackgroundJobRepository) {}

  private static get repoInstance(): BackgroundJobRepository {
    return IoCContainer.getInstance().resolve<BackgroundJobRepository>('BackgroundJobRepository');
  }

  public static async createJob(
    job: Omit<BackgroundJob, 'id' | 'createdDate' | 'status' | 'retryCount'>
  ): Promise<BackgroundJob> {
    const newJob: BackgroundJob = {
      ...job,
      id: uuidv4(),
      createdDate: new Date().toISOString(),
      status: 'pending',
      retryCount: 0
    };

    await this.repoInstance.create(newJob);

    await EnterpriseAuditLogger.log(
        'CREATE',
        'BACKGROUND_JOB',
        newJob.id,
        newJob.createdBy,
        `تم إنشاء مهمة: ${newJob.jobName}`
    );

    return newJob;
  }

  public static async runNow(jobId: string): Promise<void> {
    // 1. Update status to 'queued' or 'running'
    // 2. Trigger worker
  }
}
