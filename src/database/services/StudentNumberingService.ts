import { FinancialConfigurationRepository } from '../repositories/FinancialConfigurationRepository';
import { FinancialConfiguration, NumberingSequenceConfig } from '../../types';

export class StudentNumberingService {
  public static async generateStudentIdentifier(
    schoolId: string, 
    type: 'studentCode' | 'academicId' | 'fileNumber' | 'registrationNumber'
  ): Promise<string> {
    const config = await FinancialConfigurationRepository.getBySchoolId(schoolId);
    
    const seqConfig = config.studentNumbering[type];
    
    // Increment the sequence
    const newSequence = seqConfig.lastSequenceNumber + 1;
    
    // Update the configuration
    await FinancialConfigurationRepository.updateConfiguration(
      schoolId,
      {
        studentNumbering: {
          ...config.studentNumbering,
          [type]: {
            ...seqConfig,
            lastSequenceNumber: newSequence
          }
        }
      },
      'system',
      'System Generator',
      `Generate new ${type}`
    );
    
    // Format the number
    const { prefix, suffix, paddedLength } = seqConfig;
    const sequenceStr = newSequence.toString().padStart(paddedLength, '0');
    
    return `${prefix}${sequenceStr}${suffix}`;
  }
}
