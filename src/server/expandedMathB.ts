import { buildExpandedMathPartB1 } from './expandedMathB1.ts';
import { buildExpandedMathPartB2 } from './expandedMathB2.ts';
import type { CandidateQuestionInput } from './validationEngine.ts';

export function buildExpandedMathPartB(): CandidateQuestionInput[] {
  return [...buildExpandedMathPartB1(), ...buildExpandedMathPartB2()];
}
