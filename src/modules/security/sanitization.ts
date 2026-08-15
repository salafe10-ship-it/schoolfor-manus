import DOMPurify from 'dompurify'; // Assuming DOMPurify is available or needs to be added

export class SecuritySanitizer {
  static sanitizeInput(input: string): string {
    // Basic sanitization, in a real system use a robust library
    return input.replace(/[<>]/g, '');
  }

  static sanitizeFile(file: File): boolean {
    const allowedExtensions = ['.pdf', '.jpg', '.png'];
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB

    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    
    return allowedExtensions.includes(extension) && file.size <= MAX_SIZE;
  }
}
