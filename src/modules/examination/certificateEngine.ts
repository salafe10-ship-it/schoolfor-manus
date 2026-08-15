import { Certificate, Result } from './types';

export class CertificateEngine {
  
  static generateCertificate(result: Result, issuerId: string): Certificate {
    const cert: Certificate = {
      id: `cert_${Date.now()}`,
      studentId: result.studentId,
      resultId: result.id,
      issueDate: new Date().toISOString(),
      version: 1,
      status: 'active',
      digitalSignature: `sig_${Math.random().toString(36).substring(7)}`, // Simulated
      qrCodeData: `verif_${result.id}_${Date.now()}`,
      metadata: { issuerId, createdAt: new Date().toISOString() },
      tenantId: result.tenantId,
      schoolId: result.schoolId,
      branchId: result.branchId,
      academicYearId: result.academicYearId
    };
    
    console.log('[CertificateEngine] Generated Certificate:', cert.id);
    return cert;
  }

  static revokeCertificate(certificate: Certificate, reason: string): Certificate {
    certificate.status = 'revoked';
    certificate.metadata.revocationReason = reason;
    console.log('[CertificateEngine] Revoked Certificate:', certificate.id);
    return certificate;
  }

  static verifyCertificate(certificate: Certificate): boolean {
    if (certificate.status === 'revoked') return false;
    // Real-world would check SHA-256 hash
    return certificate.digitalSignature.startsWith('sig_');
  }
}
