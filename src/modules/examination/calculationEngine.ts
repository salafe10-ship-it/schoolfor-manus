import { Mark, Result, GradingScale, AssessmentWeight, CalculationStep } from './types';

export class ResultCalculationEngine {
  
  static calculateResult(
    studentId: string,
    marks: Mark[],
    weights: AssessmentWeight[],
    gradingScale: GradingScale[],
    passPercentage: number
  ): Result {
    if (marks.length === 0) {
      throw new Error("Cannot calculate result with no marks provided.");
    }

    // Consistency Check
    const tenantId = marks[0].tenantId;
    const schoolId = marks[0].schoolId;
    const branchId = marks[0].branchId;
    const academicYearId = marks[0].academicYearId;

    if (!marks.every(m => m.tenantId === tenantId && m.schoolId === schoolId && m.branchId === branchId && m.academicYearId === academicYearId)) {
        throw new Error("Marks must belong to the same tenant, school, branch, and academic year.");
    }

    const log: CalculationStep[] = [];
    
    // 1. Calculate Weighted Score
    let totalWeightedScore = 0;
    let totalWeight = 0;

    weights.forEach(w => {
      const relevantMarks = marks.filter(m => m.assessmentType === w.assessmentType);
      if (relevantMarks.length > 0) {
        const avg = relevantMarks.reduce((sum, m) => sum + (m.marksObtained / m.maxScore), 0) / relevantMarks.length;
        totalWeightedScore += avg * w.weight;
        totalWeight += w.weight;
        log.push({ description: `Weighting ${w.assessmentType}`, formula: `Avg * ${w.weight}`, value: avg * w.weight, timestamp: new Date().toISOString() });
      }
    });

    if (totalWeight === 0) {
        throw new Error("Invalid assessment weights: total weight is zero.");
    }

    const finalPercentage = (totalWeightedScore / totalWeight) * 100;
    
    // 2. Determine Grade and GPA
    const scale = gradingScale.find(s => finalPercentage >= s.minPercentage && finalPercentage <= s.maxPercentage);
    const grade = scale ? scale.letterGrade : 'F';
    const gpa = scale ? scale.gpaPoint : 0;

    return {
      id: `res_${Date.now()}`,
      studentId,
      tenantId,
      schoolId,
      branchId,
      academicYearId,
      semesterId: marks[0].semesterId,
      classId: marks[0].classId,
      totalMarks: finalPercentage, // Represented as percentage
      percentage: finalPercentage,
      grade,
      gpa,
      status: finalPercentage >= passPercentage ? 'passed' : 'failed',
      calculationLog: log
    };
  }
}
