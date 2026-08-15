# Result Calculation Documentation

The system uses a deterministic, audit-traceable engine for result calculation.

## Process
1. **Weighted Averaging**: Marks are categorized by assessment type (e.g., continuous, midterm, final). Each type is assigned a weight.
2. **Standardization**: Marks are normalized to a 0-1 range (score / maxScore) before applying weights.
3. **Grading & GPA**: The final percentage is mapped against a defined `GradingScale` to determine the letter grade and GPA point.
4. **Pass/Fail Decision**: Based on the `passPercentage` threshold.

## Traceability
Every result record contains a `calculationLog` detailing each step of the calculation, including the formula used, the intermediate value, and the timestamp.
