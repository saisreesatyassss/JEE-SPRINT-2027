import { buildExpandedMathPartA1 } from './expandedMathA1.ts';
import { buildExpandedMathPartA2 } from './expandedMathA2.ts';
import type { CandidateQuestionInput } from './validationEngine.ts';

export function buildExpandedMathPartA(): CandidateQuestionInput[] {
  return [...buildExpandedMathPartA1(), ...buildExpandedMathPartA2()];
}
