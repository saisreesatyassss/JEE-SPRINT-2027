import { buildExpandedChemistryPartB1 } from './expandedChemistryB1.ts';
import { buildExpandedChemistryPartB2 } from './expandedChemistryB2.ts';
import type { CandidateQuestionInput } from './validationEngine.ts';

export function buildExpandedChemistryPartB(): CandidateQuestionInput[] {
  return [...buildExpandedChemistryPartB1(), ...buildExpandedChemistryPartB2()];
}
