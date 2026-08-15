
/**
 * Service to manage reference data (Master Data)
 * Fetches data from the server, avoiding hardcoding in the frontend.
 */
export const ReferenceDataService = {
  async getStages(): Promise<any[]> {
    const res = await fetch('/api/settings/stages');
    if (!res.ok) return []; // Fallback empty if API not ready
    return res.json();
  },
  async getGrades(): Promise<any[]> {
    const res = await fetch('/api/settings/grades');
    if (!res.ok) return [];
    return res.json();
  },
  async getNationalities(): Promise<any[]> {
    const res = await fetch('/api/settings/nationalities');
    if (!res.ok) return [];
    return res.json();
  },
  // Add other methods as needed
};
