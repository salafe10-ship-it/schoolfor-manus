export const ASSESSMENT_QUESTION_TYPES = [
  'single',
  'multiple',
  'true_false',
  'text',
  'numeric',
  'matching',
  'ordering',
  'essay',
  'file',
  'media',
  'equation'
] as const;

export type AssessmentQuestionType = typeof ASSESSMENT_QUESTION_TYPES[number];
export type QuestionBankItemStatus = 'draft' | 'active' | 'archived';
export type BloomLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
export type DokLevel = 1 | 2 | 3 | 4;
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export interface QuestionClassification {
  subjectId: string;
  gradeId: string;
  standardId: string;
  bloomLevel: BloomLevel;
  dokLevel: DokLevel;
  difficulty: QuestionDifficulty;
  /** BCP-47 language tag, for example `ar`, `en`, or `en-US`. */
  language: string;
}

export interface QuestionOption {
  id: string;
  label: string;
}

export interface MatchingPair {
  left: string;
  right: string;
}

export interface OrderingItem {
  id: string;
  label: string;
}

interface QuestionBankItemBase<TType extends AssessmentQuestionType, TConfiguration> {
  id: string;
  bankId: string;
  version: number;
  ownerId: string;
  status: QuestionBankItemStatus;
  type: TType;
  prompt: string;
  points: number;
  classification: QuestionClassification;
  configuration: TConfiguration;
}

export type AssessmentQuestionBankItem =
  | QuestionBankItemBase<'single', { options: QuestionOption[]; correctOptionIds: string[] }>
  | QuestionBankItemBase<'multiple', { options: QuestionOption[]; correctOptionIds: string[] }>
  | QuestionBankItemBase<'true_false', { correctAnswer: boolean }>
  | QuestionBankItemBase<'text', { acceptedAnswers: string[]; caseSensitive?: boolean }>
  | QuestionBankItemBase<'numeric', { correctAnswer: number; tolerance?: number }>
  | QuestionBankItemBase<'matching', { pairs: MatchingPair[] }>
  | QuestionBankItemBase<'ordering', { items: OrderingItem[]; correctOrder: string[] }>
  | QuestionBankItemBase<'essay', { rubric: string; minimumWords?: number }>
  | QuestionBankItemBase<'file', { allowedMimeTypes: string[]; maxSizeBytes: number }>
  | QuestionBankItemBase<'media', { sourceUrl: string; altText: string; acceptedAnswers: string[] }>
  | QuestionBankItemBase<'equation', { expression: string; acceptedAnswers: string[]; equivalenceMode?: 'exact' | 'algebraic' }>;

export interface AssessmentDomainValidationIssue {
  code: string;
  path: string;
  message: string;
}

export class AssessmentDomainValidationError extends Error {
  readonly issues: readonly AssessmentDomainValidationIssue[];

  constructor(context: string, issues: AssessmentDomainValidationIssue[]) {
    super(`${context}: ${issues.map(issue => issue.message).join('; ')}`);
    this.name = 'AssessmentDomainValidationError';
    this.issues = issues;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

const BLOOM_LEVELS = new Set<BloomLevel>(['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create']);
const DOK_LEVELS = new Set<DokLevel>([1, 2, 3, 4]);
const DIFFICULTIES = new Set<QuestionDifficulty>(['easy', 'medium', 'hard']);
const QUESTION_STATUSES = new Set<QuestionBankItemStatus>(['draft', 'active', 'archived']);
const QUESTION_TYPES = new Set<string>(ASSESSMENT_QUESTION_TYPES);
const LANGUAGE_TAG_PATTERN = /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;
const MAX_QUESTION_POINTS = 1_000_000;
const SCORE_EPSILON = 1e-9;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const uniqueStrings = (values: string[]): boolean => new Set(values).size === values.length;

const addIssue = (
  issues: AssessmentDomainValidationIssue[],
  code: string,
  path: string,
  message: string
): void => {
  issues.push({ code, path, message });
};

const validateOptions = (
  configuration: Record<string, unknown>,
  path: string,
  issues: AssessmentDomainValidationIssue[]
): string[] => {
  const options = configuration.options;
  if (!Array.isArray(options) || options.length < 2) {
    addIssue(issues, 'QUESTION_OPTIONS_INVALID', `${path}.options`, 'At least two options are required.');
    return [];
  }
  const ids: string[] = [];
  options.forEach((option, index) => {
    if (!isRecord(option) || !isNonEmptyString(option.id) || !isNonEmptyString(option.label)) {
      addIssue(issues, 'QUESTION_OPTIONS_INVALID', `${path}.options[${index}]`, 'Every option requires a non-empty id and label.');
      return;
    }
    ids.push(option.id.trim());
  });
  if (!uniqueStrings(ids)) {
    addIssue(issues, 'QUESTION_OPTIONS_DUPLICATE', `${path}.options`, 'Option ids must be unique.');
  }
  return ids;
};

const validateStringList = (
  value: unknown,
  path: string,
  code: string,
  issues: AssessmentDomainValidationIssue[],
  minimumLength = 1
): string[] => {
  if (!Array.isArray(value) || value.length < minimumLength || value.some(item => !isNonEmptyString(item))) {
    addIssue(issues, code, path, `At least ${minimumLength} non-empty value(s) are required.`);
    return [];
  }
  const values = value.map(item => String(item).trim());
  if (!uniqueStrings(values)) addIssue(issues, code, path, 'Values must be unique.');
  return values;
};

const validateQuestionConfiguration = (
  type: AssessmentQuestionType,
  configuration: unknown,
  issues: AssessmentDomainValidationIssue[]
): void => {
  const path = 'configuration';
  if (!isRecord(configuration)) {
    addIssue(issues, 'QUESTION_CONFIGURATION_INVALID', path, 'Question configuration must be an object.');
    return;
  }

  if (type === 'single' || type === 'multiple') {
    const optionIds = validateOptions(configuration, path, issues);
    const correctOptionIds = validateStringList(
      configuration.correctOptionIds,
      `${path}.correctOptionIds`,
      'QUESTION_CORRECT_OPTIONS_INVALID',
      issues
    );
    if (type === 'single' && correctOptionIds.length !== 1) {
      addIssue(issues, 'QUESTION_CORRECT_OPTIONS_INVALID', `${path}.correctOptionIds`, 'A single-choice question requires exactly one correct option.');
    }
    if (correctOptionIds.some(id => !optionIds.includes(id))) {
      addIssue(issues, 'QUESTION_CORRECT_OPTIONS_INVALID', `${path}.correctOptionIds`, 'Every correct option must reference a declared option.');
    }
    return;
  }

  if (type === 'true_false') {
    if (typeof configuration.correctAnswer !== 'boolean') {
      addIssue(issues, 'QUESTION_TRUE_FALSE_ANSWER_INVALID', `${path}.correctAnswer`, 'A true/false answer must be boolean.');
    }
    return;
  }

  if (type === 'text') {
    validateStringList(configuration.acceptedAnswers, `${path}.acceptedAnswers`, 'QUESTION_TEXT_ANSWERS_INVALID', issues);
    if (configuration.caseSensitive !== undefined && typeof configuration.caseSensitive !== 'boolean') {
      addIssue(issues, 'QUESTION_TEXT_CASE_SENSITIVITY_INVALID', `${path}.caseSensitive`, 'caseSensitive must be boolean when supplied.');
    }
    return;
  }

  if (type === 'numeric') {
    if (typeof configuration.correctAnswer !== 'number' || !Number.isFinite(configuration.correctAnswer)) {
      addIssue(issues, 'QUESTION_NUMERIC_ANSWER_INVALID', `${path}.correctAnswer`, 'A numeric question requires a finite numeric answer.');
    }
    if (
      configuration.tolerance !== undefined &&
      (typeof configuration.tolerance !== 'number' || !Number.isFinite(configuration.tolerance) || configuration.tolerance < 0)
    ) {
      addIssue(issues, 'QUESTION_NUMERIC_TOLERANCE_INVALID', `${path}.tolerance`, 'Numeric tolerance must be finite and non-negative.');
    }
    return;
  }

  if (type === 'matching') {
    if (!Array.isArray(configuration.pairs) || configuration.pairs.length < 2) {
      addIssue(issues, 'QUESTION_MATCHING_PAIRS_INVALID', `${path}.pairs`, 'At least two matching pairs are required.');
      return;
    }
    const leftValues: string[] = [];
    const rightValues: string[] = [];
    configuration.pairs.forEach((pair, index) => {
      if (!isRecord(pair) || !isNonEmptyString(pair.left) || !isNonEmptyString(pair.right)) {
        addIssue(issues, 'QUESTION_MATCHING_PAIRS_INVALID', `${path}.pairs[${index}]`, 'Each matching pair requires non-empty left and right values.');
        return;
      }
      leftValues.push(pair.left.trim());
      rightValues.push(pair.right.trim());
    });
    if (!uniqueStrings(leftValues) || !uniqueStrings(rightValues)) {
      addIssue(issues, 'QUESTION_MATCHING_PAIRS_DUPLICATE', `${path}.pairs`, 'Matching pair values must be unique on each side.');
    }
    return;
  }

  if (type === 'ordering') {
    const items = configuration.items;
    if (!Array.isArray(items) || items.length < 2) {
      addIssue(issues, 'QUESTION_ORDERING_ITEMS_INVALID', `${path}.items`, 'At least two ordering items are required.');
      return;
    }
    const itemIds: string[] = [];
    items.forEach((item, index) => {
      if (!isRecord(item) || !isNonEmptyString(item.id) || !isNonEmptyString(item.label)) {
        addIssue(issues, 'QUESTION_ORDERING_ITEMS_INVALID', `${path}.items[${index}]`, 'Every ordering item requires a non-empty id and label.');
        return;
      }
      itemIds.push(item.id.trim());
    });
    if (!uniqueStrings(itemIds)) addIssue(issues, 'QUESTION_ORDERING_ITEMS_DUPLICATE', `${path}.items`, 'Ordering item ids must be unique.');
    const correctOrder = validateStringList(
      configuration.correctOrder,
      `${path}.correctOrder`,
      'QUESTION_ORDERING_SEQUENCE_INVALID',
      issues,
      2
    );
    if (
      correctOrder.length !== itemIds.length ||
      correctOrder.some(id => !itemIds.includes(id)) ||
      itemIds.some(id => !correctOrder.includes(id))
    ) {
      addIssue(issues, 'QUESTION_ORDERING_SEQUENCE_INVALID', `${path}.correctOrder`, 'The correct order must contain every item id exactly once.');
    }
    return;
  }

  if (type === 'essay') {
    if (!isNonEmptyString(configuration.rubric)) {
      addIssue(issues, 'QUESTION_ESSAY_RUBRIC_REQUIRED', `${path}.rubric`, 'An essay question requires a grading rubric.');
    }
    if (
      configuration.minimumWords !== undefined &&
      (!Number.isSafeInteger(configuration.minimumWords) || Number(configuration.minimumWords) < 0)
    ) {
      addIssue(issues, 'QUESTION_ESSAY_MINIMUM_WORDS_INVALID', `${path}.minimumWords`, 'minimumWords must be a non-negative integer.');
    }
    return;
  }

  if (type === 'file') {
    const mimeTypes = validateStringList(
      configuration.allowedMimeTypes,
      `${path}.allowedMimeTypes`,
      'QUESTION_FILE_MIME_TYPES_INVALID',
      issues
    );
    if (mimeTypes.some(mimeType => !/^[\w.+-]+\/[\w.+-]+$/.test(mimeType))) {
      addIssue(issues, 'QUESTION_FILE_MIME_TYPES_INVALID', `${path}.allowedMimeTypes`, 'Every allowed MIME type must use a valid type/subtype form.');
    }
    if (!Number.isSafeInteger(configuration.maxSizeBytes) || Number(configuration.maxSizeBytes) <= 0) {
      addIssue(issues, 'QUESTION_FILE_SIZE_INVALID', `${path}.maxSizeBytes`, 'File size limit must be a positive integer.');
    }
    return;
  }

  if (type === 'media') {
    if (!isNonEmptyString(configuration.sourceUrl)) {
      addIssue(issues, 'QUESTION_MEDIA_URL_INVALID', `${path}.sourceUrl`, 'A media source URL is required.');
    } else {
      try {
        const parsed = new URL(configuration.sourceUrl);
        if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Unsupported protocol');
      } catch {
        addIssue(issues, 'QUESTION_MEDIA_URL_INVALID', `${path}.sourceUrl`, 'Media URL must be an absolute HTTP(S) URL.');
      }
    }
    if (!isNonEmptyString(configuration.altText)) {
      addIssue(issues, 'QUESTION_MEDIA_ALT_TEXT_REQUIRED', `${path}.altText`, 'Accessible alternative text is required for media.');
    }
    validateStringList(configuration.acceptedAnswers, `${path}.acceptedAnswers`, 'QUESTION_MEDIA_ANSWERS_INVALID', issues);
    return;
  }

  if (type === 'equation') {
    if (!isNonEmptyString(configuration.expression)) {
      addIssue(issues, 'QUESTION_EQUATION_EXPRESSION_REQUIRED', `${path}.expression`, 'An equation expression is required.');
    }
    validateStringList(configuration.acceptedAnswers, `${path}.acceptedAnswers`, 'QUESTION_EQUATION_ANSWERS_INVALID', issues);
    if (
      configuration.equivalenceMode !== undefined &&
      !['exact', 'algebraic'].includes(String(configuration.equivalenceMode))
    ) {
      addIssue(issues, 'QUESTION_EQUATION_MODE_INVALID', `${path}.equivalenceMode`, 'Equation equivalence mode must be exact or algebraic.');
    }
  }
};

export function validateQuestionBankItem(value: unknown): AssessmentQuestionBankItem {
  const issues: AssessmentDomainValidationIssue[] = [];
  if (!isRecord(value)) {
    throw new AssessmentDomainValidationError('Invalid question bank item', [{
      code: 'QUESTION_NOT_OBJECT',
      path: 'question',
      message: 'Question bank item must be an object.'
    }]);
  }

  if (!isNonEmptyString(value.id)) addIssue(issues, 'QUESTION_ID_REQUIRED', 'id', 'Question id is required.');
  if (!isNonEmptyString(value.bankId)) addIssue(issues, 'QUESTION_BANK_ID_REQUIRED', 'bankId', 'Question bank id is required.');
  if (!Number.isSafeInteger(value.version) || Number(value.version) < 1) {
    addIssue(issues, 'QUESTION_VERSION_INVALID', 'version', 'Question version must be a positive integer.');
  }
  if (!isNonEmptyString(value.ownerId)) addIssue(issues, 'QUESTION_OWNER_REQUIRED', 'ownerId', 'Question owner is required.');
  if (!QUESTION_STATUSES.has(value.status as QuestionBankItemStatus)) {
    addIssue(issues, 'QUESTION_STATUS_INVALID', 'status', 'Question status must be draft, active, or archived.');
  }
  if (!QUESTION_TYPES.has(String(value.type))) {
    addIssue(issues, 'QUESTION_TYPE_UNSUPPORTED', 'type', 'Question type is not supported.');
  }
  if (!isNonEmptyString(value.prompt)) addIssue(issues, 'QUESTION_PROMPT_REQUIRED', 'prompt', 'Question prompt is required.');
  if (
    typeof value.points !== 'number' ||
    !Number.isFinite(value.points) ||
    value.points <= 0 ||
    value.points > MAX_QUESTION_POINTS
  ) {
    addIssue(issues, 'QUESTION_POINTS_INVALID', 'points', 'Question points must be finite, positive, and within the supported limit.');
  }

  if (!isRecord(value.classification)) {
    addIssue(issues, 'QUESTION_CLASSIFICATION_REQUIRED', 'classification', 'A complete question classification is required.');
  } else {
    for (const field of ['subjectId', 'gradeId', 'standardId'] as const) {
      if (!isNonEmptyString(value.classification[field])) {
        addIssue(issues, 'QUESTION_CLASSIFICATION_FIELD_REQUIRED', `classification.${field}`, `${field} is required.`);
      }
    }
    if (!BLOOM_LEVELS.has(value.classification.bloomLevel as BloomLevel)) {
      addIssue(issues, 'QUESTION_BLOOM_LEVEL_INVALID', 'classification.bloomLevel', 'Bloom level is invalid.');
    }
    if (!DOK_LEVELS.has(value.classification.dokLevel as DokLevel)) {
      addIssue(issues, 'QUESTION_DOK_LEVEL_INVALID', 'classification.dokLevel', 'DOK level must be 1, 2, 3, or 4.');
    }
    if (!DIFFICULTIES.has(value.classification.difficulty as QuestionDifficulty)) {
      addIssue(issues, 'QUESTION_DIFFICULTY_INVALID', 'classification.difficulty', 'Question difficulty is invalid.');
    }
    if (!isNonEmptyString(value.classification.language) || !LANGUAGE_TAG_PATTERN.test(value.classification.language.trim())) {
      addIssue(issues, 'QUESTION_LANGUAGE_INVALID', 'classification.language', 'Question language must be a valid BCP-47 language tag.');
    }
  }

  if (QUESTION_TYPES.has(String(value.type))) {
    validateQuestionConfiguration(value.type as AssessmentQuestionType, value.configuration, issues);
  }
  if (issues.length > 0) throw new AssessmentDomainValidationError('Invalid question bank item', issues);
  return value as unknown as AssessmentQuestionBankItem;
}

export function validateQuestionBank(values: readonly unknown[]): AssessmentQuestionBankItem[] {
  if (!Array.isArray(values)) {
    throw new AssessmentDomainValidationError('Invalid question bank', [{
      code: 'QUESTION_BANK_INVALID',
      path: 'questions',
      message: 'Question bank must be an array.'
    }]);
  }
  const questions = values.map(validateQuestionBankItem);
  const issues: AssessmentDomainValidationIssue[] = [];
  const versionKeys = new Set<string>();
  const activeQuestionIds = new Set<string>();
  questions.forEach((question, index) => {
    const key = `${question.id}@${question.version}`;
    if (versionKeys.has(key)) {
      addIssue(issues, 'QUESTION_VERSION_DUPLICATE', `questions[${index}]`, `Question version ${key} is duplicated.`);
    }
    versionKeys.add(key);
    if (question.status === 'active') {
      if (activeQuestionIds.has(question.id)) {
        addIssue(issues, 'QUESTION_ACTIVE_VERSION_DUPLICATE', `questions[${index}]`, `Question ${question.id} has more than one active version.`);
      }
      activeQuestionIds.add(question.id);
    }
  });
  if (issues.length > 0) throw new AssessmentDomainValidationError('Invalid question bank', issues);
  return questions;
}

export type BlueprintDimension =
  | 'subjectId'
  | 'gradeId'
  | 'standardId'
  | 'bloomLevel'
  | 'dokLevel'
  | 'difficulty'
  | 'language'
  | 'questionType';

export interface AssessmentBlueprintQuestionRef {
  questionId: string;
  version: number;
}

export interface AssessmentBlueprintDistributionTarget {
  dimension: BlueprintDimension;
  value: string | number;
  points: number;
  questionCount: number;
}

export interface AssessmentBlueprint {
  id: string;
  assessmentId: string;
  totalPoints: number;
  questionRefs: AssessmentBlueprintQuestionRef[];
  distribution: AssessmentBlueprintDistributionTarget[];
}

export interface ValidatedAssessmentBlueprint {
  blueprintId: string;
  assessmentId: string;
  totalPoints: number;
  questionCount: number;
  resolvedQuestions: AssessmentQuestionBankItem[];
}

const BLUEPRINT_DIMENSIONS = new Set<BlueprintDimension>([
  'subjectId',
  'gradeId',
  'standardId',
  'bloomLevel',
  'dokLevel',
  'difficulty',
  'language',
  'questionType'
]);

const questionDimensionValue = (question: AssessmentQuestionBankItem, dimension: BlueprintDimension): string => {
  if (dimension === 'questionType') return question.type;
  return String(question.classification[dimension]);
};

const numbersMatch = (left: number, right: number): boolean => Math.abs(left - right) <= SCORE_EPSILON;

export function validateAssessmentBlueprint(
  blueprint: AssessmentBlueprint,
  questionBank: readonly unknown[]
): ValidatedAssessmentBlueprint {
  const issues: AssessmentDomainValidationIssue[] = [];
  if (!isRecord(blueprint)) {
    throw new AssessmentDomainValidationError('Invalid assessment blueprint', [{
      code: 'BLUEPRINT_NOT_OBJECT',
      path: 'blueprint',
      message: 'Assessment blueprint must be an object.'
    }]);
  }
  if (!isNonEmptyString(blueprint.id)) addIssue(issues, 'BLUEPRINT_ID_REQUIRED', 'id', 'Blueprint id is required.');
  if (!isNonEmptyString(blueprint.assessmentId)) addIssue(issues, 'BLUEPRINT_ASSESSMENT_ID_REQUIRED', 'assessmentId', 'Assessment id is required.');
  if (typeof blueprint.totalPoints !== 'number' || !Number.isFinite(blueprint.totalPoints) || blueprint.totalPoints <= 0) {
    addIssue(issues, 'BLUEPRINT_TOTAL_INVALID', 'totalPoints', 'Blueprint total points must be finite and positive.');
  }
  if (!Array.isArray(blueprint.questionRefs) || blueprint.questionRefs.length === 0) {
    addIssue(issues, 'BLUEPRINT_QUESTIONS_REQUIRED', 'questionRefs', 'Blueprint must reference at least one question.');
  }
  if (!Array.isArray(blueprint.distribution) || blueprint.distribution.length === 0) {
    addIssue(issues, 'BLUEPRINT_DISTRIBUTION_REQUIRED', 'distribution', 'Blueprint must declare at least one complete distribution dimension.');
  }
  if (issues.length > 0) throw new AssessmentDomainValidationError('Invalid assessment blueprint', issues);

  const questions = validateQuestionBank(questionBank);
  const byVersion = new Map(questions.map(question => [`${question.id}@${question.version}`, question]));
  const versionsByQuestion = new Map<string, Set<number>>();
  questions.forEach(question => {
    const versions = versionsByQuestion.get(question.id) || new Set<number>();
    versions.add(question.version);
    versionsByQuestion.set(question.id, versions);
  });

  const selected: AssessmentQuestionBankItem[] = [];
  const selectedIds = new Set<string>();
  blueprint.questionRefs.forEach((reference, index) => {
    const path = `questionRefs[${index}]`;
    if (!isRecord(reference) || !isNonEmptyString(reference.questionId) || !Number.isSafeInteger(reference.version) || reference.version < 1) {
      addIssue(issues, 'BLUEPRINT_QUESTION_REFERENCE_INVALID', path, 'Every question reference requires an id and positive version.');
      return;
    }
    if (selectedIds.has(reference.questionId)) {
      addIssue(issues, 'BLUEPRINT_QUESTION_DUPLICATE', path, `Question ${reference.questionId} is referenced more than once.`);
      return;
    }
    selectedIds.add(reference.questionId);
    const question = byVersion.get(`${reference.questionId}@${reference.version}`);
    if (!question) {
      const code = versionsByQuestion.has(reference.questionId) ? 'BLUEPRINT_QUESTION_VERSION_MISMATCH' : 'BLUEPRINT_QUESTION_NOT_FOUND';
      addIssue(issues, code, path, `Question ${reference.questionId} version ${reference.version} is unavailable.`);
      return;
    }
    // An archived version remains resolvable when an existing blueprint
    // points to it. Archiving freezes that version for the old assessment;
    // new assessments still select active questions only at the application
    // boundary. This is what makes versioning safe for already-published
    // exams without allowing archived questions into new blueprints.
    if (question.status !== 'active' && question.status !== 'archived') {
      addIssue(issues, 'BLUEPRINT_INACTIVE_QUESTION', path, `Question ${reference.questionId} must be active before use.`);
      return;
    }
    selected.push(question);
  });

  const actualTotal = selected.reduce((sum, question) => sum + question.points, 0);
  if (!numbersMatch(actualTotal, blueprint.totalPoints)) {
    addIssue(
      issues,
      'BLUEPRINT_TOTAL_MISMATCH',
      'totalPoints',
      `Blueprint total ${blueprint.totalPoints} does not equal selected question total ${actualTotal}.`
    );
  }

  const declaredByDimension = new Map<BlueprintDimension, Map<string, AssessmentBlueprintDistributionTarget>>();
  blueprint.distribution.forEach((target, index) => {
    const path = `distribution[${index}]`;
    if (!isRecord(target) || !BLUEPRINT_DIMENSIONS.has(target.dimension as BlueprintDimension)) {
      addIssue(issues, 'BLUEPRINT_DISTRIBUTION_DIMENSION_INVALID', `${path}.dimension`, 'Distribution dimension is invalid.');
      return;
    }
    const dimension = target.dimension as BlueprintDimension;
    const value = String(target.value ?? '').trim();
    if (!value) addIssue(issues, 'BLUEPRINT_DISTRIBUTION_VALUE_REQUIRED', `${path}.value`, 'Distribution value is required.');
    if (typeof target.points !== 'number' || !Number.isFinite(target.points) || target.points <= 0) {
      addIssue(issues, 'BLUEPRINT_DISTRIBUTION_POINTS_INVALID', `${path}.points`, 'Distribution points must be finite and positive.');
    }
    if (!Number.isSafeInteger(target.questionCount) || target.questionCount <= 0) {
      addIssue(issues, 'BLUEPRINT_DISTRIBUTION_COUNT_INVALID', `${path}.questionCount`, 'Distribution question count must be a positive integer.');
    }
    const dimensionTargets = declaredByDimension.get(dimension) || new Map<string, AssessmentBlueprintDistributionTarget>();
    if (dimensionTargets.has(value)) {
      addIssue(issues, 'BLUEPRINT_DISTRIBUTION_DUPLICATE', path, `Distribution target ${dimension}:${value} is duplicated.`);
    }
    dimensionTargets.set(value, target);
    declaredByDimension.set(dimension, dimensionTargets);
  });

  for (const [dimension, declaredTargets] of declaredByDimension) {
    const declaredPointTotal = [...declaredTargets.values()].reduce((sum, target) => sum + Number(target.points || 0), 0);
    const declaredQuestionTotal = [...declaredTargets.values()].reduce((sum, target) => sum + Number(target.questionCount || 0), 0);
    if (!numbersMatch(declaredPointTotal, blueprint.totalPoints)) {
      addIssue(issues, 'BLUEPRINT_DISTRIBUTION_TOTAL_MISMATCH', `distribution.${dimension}`, `Declared ${dimension} points do not equal the blueprint total.`);
    }
    if (declaredQuestionTotal !== selected.length) {
      addIssue(issues, 'BLUEPRINT_DISTRIBUTION_COUNT_MISMATCH', `distribution.${dimension}`, `Declared ${dimension} question count does not equal selected questions.`);
    }

    const actualTargets = new Map<string, { points: number; questionCount: number }>();
    selected.forEach(question => {
      const value = questionDimensionValue(question, dimension);
      const current = actualTargets.get(value) || { points: 0, questionCount: 0 };
      current.points += question.points;
      current.questionCount += 1;
      actualTargets.set(value, current);
    });
    const allValues = new Set([...declaredTargets.keys(), ...actualTargets.keys()]);
    for (const value of allValues) {
      const declared = declaredTargets.get(value);
      const actual = actualTargets.get(value);
      if (!declared || !actual || !numbersMatch(Number(declared.points), actual.points) || declared.questionCount !== actual.questionCount) {
        addIssue(
          issues,
          'BLUEPRINT_DISTRIBUTION_MISMATCH',
          `distribution.${dimension}.${value}`,
          `Declared ${dimension} distribution for ${value} does not match selected questions.`
        );
      }
    }
  }

  if (issues.length > 0) throw new AssessmentDomainValidationError('Invalid assessment blueprint', issues);
  return {
    blueprintId: blueprint.id,
    assessmentId: blueprint.assessmentId,
    totalPoints: actualTotal,
    questionCount: selected.length,
    resolvedQuestions: selected
  };
}

export const ASSESSMENT_LIFECYCLE_STATES = [
  'draft',
  'review',
  'approved',
  'scheduled',
  'open',
  'closed',
  'marking',
  'results_approved',
  'published',
  'archived'
] as const;

export type AssessmentLifecycleState = typeof ASSESSMENT_LIFECYCLE_STATES[number];

export const ASSESSMENT_LIFECYCLE_TRANSITIONS: Readonly<Record<AssessmentLifecycleState, AssessmentLifecycleState | null>> = {
  draft: 'review',
  review: 'approved',
  approved: 'scheduled',
  scheduled: 'open',
  open: 'closed',
  closed: 'marking',
  marking: 'results_approved',
  results_approved: 'published',
  published: 'archived',
  archived: null
};

export interface AssessmentLifecycleEvent {
  from: AssessmentLifecycleState;
  to: AssessmentLifecycleState;
  actorId: string;
  reason: string;
  occurredAt: string;
  version: number;
}

export interface AssessmentLifecycle {
  assessmentId: string;
  state: AssessmentLifecycleState;
  version: number;
  createdBy: string;
  createdAt: string;
  history: AssessmentLifecycleEvent[];
}

export interface AssessmentLifecycleTransitionCommand {
  to: AssessmentLifecycleState;
  actorId: string;
  reason: string;
  occurredAt: string;
  expectedVersion: number;
}

const validIsoTimestamp = (value: unknown): value is string =>
  isNonEmptyString(value) && Number.isFinite(Date.parse(value));

export function createAssessmentLifecycle(
  assessmentId: string,
  createdBy: string,
  createdAt = new Date().toISOString()
): AssessmentLifecycle {
  const issues: AssessmentDomainValidationIssue[] = [];
  if (!isNonEmptyString(assessmentId)) addIssue(issues, 'LIFECYCLE_ASSESSMENT_ID_REQUIRED', 'assessmentId', 'Assessment id is required.');
  if (!isNonEmptyString(createdBy)) addIssue(issues, 'LIFECYCLE_ACTOR_REQUIRED', 'createdBy', 'Lifecycle creator is required.');
  if (!validIsoTimestamp(createdAt)) addIssue(issues, 'LIFECYCLE_TIMESTAMP_INVALID', 'createdAt', 'Lifecycle creation time must be a valid timestamp.');
  if (issues.length > 0) throw new AssessmentDomainValidationError('Invalid assessment lifecycle', issues);
  return {
    assessmentId: assessmentId.trim(),
    state: 'draft',
    version: 0,
    createdBy: createdBy.trim(),
    createdAt: new Date(createdAt).toISOString(),
    history: []
  };
}

export function validateAssessmentLifecycle(lifecycle: AssessmentLifecycle): AssessmentLifecycle {
  const issues: AssessmentDomainValidationIssue[] = [];
  if (!isRecord(lifecycle)) {
    throw new AssessmentDomainValidationError('Invalid assessment lifecycle', [{
      code: 'LIFECYCLE_NOT_OBJECT',
      path: 'lifecycle',
      message: 'Assessment lifecycle must be an object.'
    }]);
  }
  if (!isNonEmptyString(lifecycle.assessmentId)) addIssue(issues, 'LIFECYCLE_ASSESSMENT_ID_REQUIRED', 'assessmentId', 'Assessment id is required.');
  if (!isNonEmptyString(lifecycle.createdBy)) addIssue(issues, 'LIFECYCLE_ACTOR_REQUIRED', 'createdBy', 'Lifecycle creator is required.');
  if (!validIsoTimestamp(lifecycle.createdAt)) addIssue(issues, 'LIFECYCLE_TIMESTAMP_INVALID', 'createdAt', 'Lifecycle creation time is invalid.');
  if (!ASSESSMENT_LIFECYCLE_STATES.includes(lifecycle.state as AssessmentLifecycleState)) {
    addIssue(issues, 'LIFECYCLE_STATE_INVALID', 'state', 'Lifecycle state is invalid.');
  }
  if (!Number.isSafeInteger(lifecycle.version) || lifecycle.version < 0) {
    addIssue(issues, 'LIFECYCLE_VERSION_INVALID', 'version', 'Lifecycle version must be a non-negative integer.');
  }
  if (!Array.isArray(lifecycle.history)) {
    addIssue(issues, 'LIFECYCLE_HISTORY_INVALID', 'history', 'Lifecycle history must be an array.');
  } else {
    let expectedState: AssessmentLifecycleState = 'draft';
    let priorTimestamp = Date.parse(lifecycle.createdAt);
    lifecycle.history.forEach((event, index) => {
      const path = `history[${index}]`;
      const expectedNext = ASSESSMENT_LIFECYCLE_TRANSITIONS[expectedState];
      if (!isRecord(event) || event.from !== expectedState || event.to !== expectedNext || event.version !== index + 1) {
        addIssue(issues, 'LIFECYCLE_HISTORY_SEQUENCE_INVALID', path, 'Lifecycle history does not follow the canonical sequence.');
      }
      if (!isRecord(event) || !isNonEmptyString(event.actorId) || !isNonEmptyString(event.reason)) {
        addIssue(issues, 'LIFECYCLE_HISTORY_AUDIT_INVALID', path, 'Lifecycle event requires an actor and reason.');
      }
      if (!isRecord(event) || !validIsoTimestamp(event.occurredAt) || Date.parse(event.occurredAt) < priorTimestamp) {
        addIssue(issues, 'LIFECYCLE_HISTORY_TIMESTAMP_INVALID', `${path}.occurredAt`, 'Lifecycle event timestamps must be valid and monotonic.');
      } else {
        priorTimestamp = Date.parse(event.occurredAt);
      }
      if (expectedNext) expectedState = expectedNext;
    });
    if (lifecycle.version !== lifecycle.history.length) {
      addIssue(issues, 'LIFECYCLE_VERSION_HISTORY_MISMATCH', 'version', 'Lifecycle version must equal its history length.');
    }
    if (lifecycle.state !== expectedState) {
      addIssue(issues, 'LIFECYCLE_STATE_HISTORY_MISMATCH', 'state', 'Lifecycle state must equal the final history state.');
    }
  }
  if (issues.length > 0) throw new AssessmentDomainValidationError('Invalid assessment lifecycle', issues);
  return lifecycle;
}

export function canTransitionAssessmentLifecycle(
  from: AssessmentLifecycleState,
  to: AssessmentLifecycleState
): boolean {
  return ASSESSMENT_LIFECYCLE_TRANSITIONS[from] === to;
}

export function transitionAssessmentLifecycle(
  lifecycle: AssessmentLifecycle,
  command: AssessmentLifecycleTransitionCommand
): AssessmentLifecycle {
  validateAssessmentLifecycle(lifecycle);
  const issues: AssessmentDomainValidationIssue[] = [];
  if (command.expectedVersion !== lifecycle.version) {
    addIssue(issues, 'LIFECYCLE_VERSION_CONFLICT', 'expectedVersion', 'Lifecycle version changed before this transition.');
  }
  if (!ASSESSMENT_LIFECYCLE_STATES.includes(command.to)) {
    addIssue(issues, 'LIFECYCLE_STATE_INVALID', 'to', 'Target lifecycle state is invalid.');
  } else if (!canTransitionAssessmentLifecycle(lifecycle.state, command.to)) {
    addIssue(issues, 'LIFECYCLE_TRANSITION_INVALID', 'to', `Cannot transition from ${lifecycle.state} to ${command.to}.`);
  }
  if (!isNonEmptyString(command.actorId)) addIssue(issues, 'LIFECYCLE_ACTOR_REQUIRED', 'actorId', 'Transition actor is required.');
  if (!isNonEmptyString(command.reason)) addIssue(issues, 'LIFECYCLE_REASON_REQUIRED', 'reason', 'Transition reason is required.');
  if (!validIsoTimestamp(command.occurredAt)) {
    addIssue(issues, 'LIFECYCLE_TIMESTAMP_INVALID', 'occurredAt', 'Transition time must be a valid timestamp.');
  } else {
    const previousTimestamp = lifecycle.history.at(-1)?.occurredAt || lifecycle.createdAt;
    if (Date.parse(command.occurredAt) < Date.parse(previousTimestamp)) {
      addIssue(issues, 'LIFECYCLE_TIMESTAMP_OUT_OF_ORDER', 'occurredAt', 'Transition time cannot precede lifecycle history.');
    }
  }
  if (issues.length > 0) throw new AssessmentDomainValidationError('Invalid assessment lifecycle transition', issues);

  const nextVersion = lifecycle.version + 1;
  const event: AssessmentLifecycleEvent = {
    from: lifecycle.state,
    to: command.to,
    actorId: command.actorId.trim(),
    reason: command.reason.trim(),
    occurredAt: new Date(command.occurredAt).toISOString(),
    version: nextVersion
  };
  return {
    ...lifecycle,
    state: command.to,
    version: nextVersion,
    history: [...lifecycle.history, event]
  };
}

export const ASSESSMENT_ATTEMPT_STATUSES = ['in_progress', 'submitted', 'marking', 'marked', 'voided'] as const;
export type AssessmentAttemptStatus = typeof ASSESSMENT_ATTEMPT_STATUSES[number];

export interface AssessmentResponseMark {
  questionId: string;
  questionVersion: number;
  /** The candidate answer is retained for autosave/resume and auditability. */
  answer?: unknown;
  savedAt?: string;
  awardedPoints?: number | null;
  markingStatus?: 'pending' | 'marked' | 'not_required' | null;
}

export interface AssessmentAttemptRecord {
  id: string;
  assessmentId?: string;
  candidateId: string;
  status?: AssessmentAttemptStatus | null;
  responses: AssessmentResponseMark[];
  recordedTotal: number;
  maximumTotal: number;
}

export interface AssessmentObjectionRecord {
  id: string;
  attemptId: string;
  status: 'open' | 'under_review' | 'resolved' | 'rejected' | 'withdrawn';
}

export interface AssessmentReportGenerationRecord {
  id: string;
  kind: string;
  status: 'pending' | 'succeeded' | 'failed';
  required?: boolean;
}

export type PublicationReadinessBlockerCode =
  | 'LIFECYCLE_NOT_READY_FOR_PUBLICATION'
  | 'BLUEPRINT_INVALID'
  | 'ATTEMPT_STATUS_MISSING'
  | 'ATTEMPT_STATUS_NOT_FINAL'
  | 'RESPONSE_MISSING'
  | 'RESPONSE_SCORE_INVALID'
  | 'ESSAY_QUESTION_UNMARKED'
  | 'ATTEMPT_TOTAL_MISMATCH'
  | 'ATTEMPT_MAXIMUM_TOTAL_MISMATCH'
  | 'OPEN_OBJECTION'
  | 'REPORT_GENERATION_FAILED'
  | 'REPORT_NOT_READY';

export interface PublicationReadinessBlocker {
  code: PublicationReadinessBlockerCode;
  entityId?: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PublicationReadinessInput {
  lifecycleState: AssessmentLifecycleState;
  blueprint: AssessmentBlueprint;
  questionBank: readonly unknown[];
  attempts: AssessmentAttemptRecord[];
  objections: AssessmentObjectionRecord[];
  reports: AssessmentReportGenerationRecord[];
}

export interface PublicationReadinessResult {
  ready: boolean;
  blockers: PublicationReadinessBlocker[];
  checkedAttemptCount: number;
  expectedTotalPoints: number | null;
}

const responseKey = (questionId: string, version: number): string => `${questionId}@${version}`;

export function evaluateAssessmentPublicationReadiness(
  input: PublicationReadinessInput
): PublicationReadinessResult {
  const blockers: PublicationReadinessBlocker[] = [];
  if (input.lifecycleState !== 'results_approved') {
    blockers.push({
      code: 'LIFECYCLE_NOT_READY_FOR_PUBLICATION',
      message: 'Assessment results must be approved before publication.',
      details: { lifecycleState: input.lifecycleState }
    });
  }

  let validatedBlueprint: ValidatedAssessmentBlueprint | null = null;
  try {
    validatedBlueprint = validateAssessmentBlueprint(input.blueprint, input.questionBank);
  } catch (error) {
    blockers.push({
      code: 'BLUEPRINT_INVALID',
      entityId: input.blueprint?.id,
      message: error instanceof Error ? error.message : 'Assessment blueprint is invalid.',
      details: error instanceof AssessmentDomainValidationError
        ? { issueCodes: error.issues.map(issue => issue.code) }
        : undefined
    });
  }

  const selectedQuestions = validatedBlueprint?.resolvedQuestions || [];
  const expectedTotal = validatedBlueprint?.totalPoints ?? null;
  const supportedAttemptStatuses = new Set<string>(ASSESSMENT_ATTEMPT_STATUSES);

  for (const attempt of Array.isArray(input.attempts) ? input.attempts : []) {
    const status = typeof attempt.status === 'string' && supportedAttemptStatuses.has(attempt.status)
      ? attempt.status as AssessmentAttemptStatus
      : null;
    if (!status) {
      blockers.push({
        code: 'ATTEMPT_STATUS_MISSING',
        entityId: attempt.id,
        message: 'Every attempt requires a valid status before publication.'
      });
    } else if (!['marked', 'voided'].includes(status)) {
      blockers.push({
        code: 'ATTEMPT_STATUS_NOT_FINAL',
        entityId: attempt.id,
        message: `Attempt status ${status} is not final.`
      });
    }
    if (status === 'voided') continue;

    const responseMap = new Map<string, AssessmentResponseMark>();
    for (const response of Array.isArray(attempt.responses) ? attempt.responses : []) {
      const key = responseKey(String(response.questionId || ''), Number(response.questionVersion));
      if (!responseMap.has(key)) responseMap.set(key, response);
    }

    let computedTotal = 0;
    let allScoresValid = true;
    for (const question of selectedQuestions) {
      const response = responseMap.get(responseKey(question.id, question.version));
      if (!response) {
        blockers.push({
          code: question.type === 'essay' ? 'ESSAY_QUESTION_UNMARKED' : 'RESPONSE_MISSING',
          entityId: attempt.id,
          message: `Attempt is missing a final response for question ${question.id}.`,
          details: { questionId: question.id, questionVersion: question.version }
        });
        allScoresValid = false;
        continue;
      }
      const score = response.awardedPoints;
      const scoreIsValid = typeof score === 'number' && Number.isFinite(score) && score >= 0 && score <= question.points;
      if (question.type === 'essay' && (response.markingStatus !== 'marked' || !scoreIsValid)) {
        blockers.push({
          code: 'ESSAY_QUESTION_UNMARKED',
          entityId: attempt.id,
          message: `Essay question ${question.id} has not been marked.`,
          details: { questionId: question.id, questionVersion: question.version }
        });
      } else if (!scoreIsValid) {
        blockers.push({
          code: 'RESPONSE_SCORE_INVALID',
          entityId: attempt.id,
          message: `Question ${question.id} has an invalid awarded score.`,
          details: { questionId: question.id, questionVersion: question.version }
        });
      }
      if (scoreIsValid) computedTotal += score;
      else allScoresValid = false;
    }

    if (
      expectedTotal !== null &&
      (typeof attempt.maximumTotal !== 'number' || !Number.isFinite(attempt.maximumTotal) || !numbersMatch(attempt.maximumTotal, expectedTotal))
    ) {
      blockers.push({
        code: 'ATTEMPT_MAXIMUM_TOTAL_MISMATCH',
        entityId: attempt.id,
        message: 'Attempt maximum total does not match the validated blueprint.',
        details: { recordedMaximum: attempt.maximumTotal, expectedMaximum: expectedTotal }
      });
    }
    if (
      !allScoresValid ||
      typeof attempt.recordedTotal !== 'number' ||
      !Number.isFinite(attempt.recordedTotal) ||
      !numbersMatch(attempt.recordedTotal, computedTotal)
    ) {
      blockers.push({
        code: 'ATTEMPT_TOTAL_MISMATCH',
        entityId: attempt.id,
        message: 'Attempt recorded total does not match the sum of awarded question points.',
        details: { recordedTotal: attempt.recordedTotal, computedTotal }
      });
    }
  }

  for (const objection of Array.isArray(input.objections) ? input.objections : []) {
    if (objection.status === 'open' || objection.status === 'under_review') {
      blockers.push({
        code: 'OPEN_OBJECTION',
        entityId: objection.id,
        message: 'Open or under-review objections must be resolved before publication.',
        details: { attemptId: objection.attemptId, status: objection.status }
      });
    }
  }

  for (const report of Array.isArray(input.reports) ? input.reports : []) {
    if (report.status === 'failed') {
      blockers.push({
        code: 'REPORT_GENERATION_FAILED',
        entityId: report.id,
        message: `Report generation failed for ${report.kind}.`
      });
    } else if (report.required === true && report.status !== 'succeeded') {
      blockers.push({
        code: 'REPORT_NOT_READY',
        entityId: report.id,
        message: `Required report ${report.kind} is not ready.`
      });
    }
  }

  return {
    ready: blockers.length === 0,
    blockers,
    checkedAttemptCount: Array.isArray(input.attempts) ? input.attempts.length : 0,
    expectedTotalPoints: expectedTotal
  };
}
