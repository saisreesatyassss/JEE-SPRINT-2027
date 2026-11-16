export type SubjectName = 'Physics' | 'Chemistry' | 'Mathematics';
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';
export type QuestionType =
  | 'MCQ'
  | 'Numerical'
  | 'AssertionReason'
  | 'MultiConcept'
  | 'Diagram';
export type SourceType = 'Original' | 'OfficialPYQ' | 'NCERTExemplar';
export type VerificationStatus =
  | 'Draft'
  | 'Generated'
  | 'Validated'
  | 'ExpertReviewed'
  | 'Published'
  | 'Rejected';

export interface SyllabusChapter {
  subject: SubjectName;
  unitNumber: number;
  name: string;
  ncertClass: '11' | '12' | '11 & 12';
  topics: string[];
}

export const JEE_2027_EXAM_PATTERN = {
  patternStatus: 'Provisional (Verified against latest NTA Paper 1 norms)',
  disclaimer:
    'Follows latest published NTA JEE Main Paper 1 norms (75 compulsory questions, 300 marks, 180 minutes). Verify against the final JEE Main 2027 Information Bulletin before exam day.',
  durationMinutes: 180,
  totalQuestions: 75,
  totalMarks: 300,
  subjects: ['Physics', 'Chemistry', 'Mathematics'] as SubjectName[],
  perSubject: {
    sectionA: { label: 'Section A (MCQs)', count: 20, type: 'MCQ' },
    sectionB: { label: 'Section B (Numerical Value — All Compulsory)', count: 5, type: 'Numerical' },
    total: 25,
    maxMarks: 100,
  },
  markingScheme: {
    correct: 4,
    incorrect: -1,
    unattempted: 0,
    numericalNegativeMarking: true,
    sectionARules: '+4 for correct option, -1 for incorrect option, 0 if unattempted.',
    sectionBRules: '+4 for correct numerical value, -1 for incorrect entry, 0 if unattempted.',
  },
} as const;

export const DELETED_LEGACY_TOPICS = [
  'communication systems',
  'transistor as amplifier',
  'doppler effect in light',
  'metallurgy',
  'general principles and processes of isolation of elements',
  's-block elements',
  'hydrogen economy',
  'dihydrogen as fuel',
  'preparation of dihydrogen',
  'water-gas shift',
  'environmental chemistry',
  'surface chemistry',
  'solid state',
  'polymers',
  'chemistry in everyday life',
  'mathematical reasoning',
  'mathematical induction',
];

export const JEE_2027_SYLLABUS: Record<SubjectName, SyllabusChapter[]> = {
  Physics: [
    {
      subject: 'Physics',
      unitNumber: 1,
      name: 'Physics and Measurement',
      ncertClass: '11',
      topics: ['SI Units & Dimensions', 'Dimensional Analysis', 'Significant Figures & Error Propagation', 'Vernier Callipers & Screw Gauge'],
    },
    {
      subject: 'Physics',
      unitNumber: 2,
      name: 'Kinematics',
      ncertClass: '11',
      topics: ['Uniform Acceleration & Graphs', 'Projectile Motion', 'Relative Velocity in 2D', 'Circular Motion Kinematics'],
    },
    {
      subject: 'Physics',
      unitNumber: 3,
      name: 'Laws of Motion',
      ncertClass: '11',
      topics: ['Newton Laws & Pulley Systems', 'Static & Kinetic Friction', 'Dynamics of Circular Motion', 'Pseudo Forces'],
    },
    {
      subject: 'Physics',
      unitNumber: 4,
      name: 'Work, Energy and Power',
      ncertClass: '11',
      topics: ['Work-Energy Theorem', 'Conservative Forces & Potential Energy', 'Vertical Circular Motion', 'Elastic & Inelastic Collisions'],
    },
    {
      subject: 'Physics',
      unitNumber: 5,
      name: 'Rotational Motion',
      ncertClass: '11',
      topics: ['Moment of Inertia & Parallel/Perpendicular Axes', 'Torque & Angular Momentum Conservation', 'Rolling Motion without Slipping', 'Centre of Mass'],
    },
    {
      subject: 'Physics',
      unitNumber: 6,
      name: 'Gravitation',
      ncertClass: '11',
      topics: ['Universal Law & Variation of g', 'Gravitational Potential & Energy', 'Escape & Orbital Velocity', 'Kepler Laws'],
    },
    {
      subject: 'Physics',
      unitNumber: 7,
      name: 'Properties of Solids and Liquids',
      ncertClass: '11',
      topics: ['Elasticity & Young Modulus', 'Hydrostatic Pressure & Buoyancy', 'Bernoulli Theorem & Viscosity', 'Surface Tension & Capillarity'],
    },
    {
      subject: 'Physics',
      unitNumber: 8,
      name: 'Thermodynamics',
      ncertClass: '11',
      topics: ['First Law & Thermodynamic Processes', 'Work & Heat in PV Cycles', 'Carnot Engine & Efficiency', 'Calorimetry & Thermal Expansion'],
    },
    {
      subject: 'Physics',
      unitNumber: 9,
      name: 'Kinetic Theory of Gases',
      ncertClass: '11',
      topics: ['Ideal Gas Equation & Pressure', 'RMS, Average & Most Probable Speed', 'Degrees of Freedom & Equipartition', 'Mean Free Path'],
    },
    {
      subject: 'Physics',
      unitNumber: 10,
      name: 'Oscillations and Waves',
      ncertClass: '11',
      topics: ['SHM Equations & Energy', 'Simple & Compound Pendulum', 'Standing Waves on Strings & Organ Pipes', 'Beats & Doppler Effect in Sound'],
    },
    {
      subject: 'Physics',
      unitNumber: 11,
      name: 'Electrostatics',
      ncertClass: '12',
      topics: ['Coulomb Law & Electric Field', 'Gauss Law & Flux', 'Electric Potential & Dipole', 'Parallel Plate Capacitors & Dielectrics'],
    },
    {
      subject: 'Physics',
      unitNumber: 12,
      name: 'Current Electricity',
      ncertClass: '12',
      topics: ['Drift Velocity & Ohm Law', 'Kirchhoff Rules & Equivalent Resistance', 'Wheatstone Bridge & Meter Bridge', 'RC Circuits & Electrical Power'],
    },
    {
      subject: 'Physics',
      unitNumber: 13,
      name: 'Magnetic Effects of Current and Magnetism',
      ncertClass: '12',
      topics: ['Biot-Savart Law & Ampere Circuital Law', 'Lorentz Force & Cyclotron Motion', 'Force on Current Loop & Torque', 'Moving Coil Galvanometer & Magnetic Materials'],
    },
    {
      subject: 'Physics',
      unitNumber: 14,
      name: 'Electromagnetic Induction',
      ncertClass: '12',
      topics: ['Faraday Law & Lenz Law', 'Motional EMF', 'Self & Mutual Inductance', 'LR Growth & Decay'],
    },
    {
      subject: 'Physics',
      unitNumber: 15,
      name: 'Alternating Current',
      ncertClass: '12',
      topics: ['RMS & Peak Values', 'Series LCR Resonance', 'Power Factor & Wattless Current', 'Transformers'],
    },
    {
      subject: 'Physics',
      unitNumber: 16,
      name: 'Electromagnetic Waves',
      ncertClass: '12',
      topics: ['Displacement Current', 'EM Wave Spectrum & Properties', 'E and B Field Relations & Poynting Vector', 'Radiation Pressure'],
    },
    {
      subject: 'Physics',
      unitNumber: 17,
      name: 'Optics',
      ncertClass: '12',
      topics: ['Reflection, Refraction & Total Internal Reflection', 'Thin Lenses, Mirrors & Prism Deviation', 'Young Double Slit Interference', 'Diffraction & Polarisation'],
    },
    {
      subject: 'Physics',
      unitNumber: 18,
      name: 'Dual Nature of Matter and Radiation',
      ncertClass: '12',
      topics: ['Einstein Photoelectric Equation', 'Stopping Potential & Saturation Current', 'de Broglie Wavelength', 'Davisson-Germer & Photon Momentum'],
    },
    {
      subject: 'Physics',
      unitNumber: 19,
      name: 'Atoms and Nuclei',
      ncertClass: '12',
      topics: ['Bohr Model & Hydrogen Spectrum', 'X-Ray Wavelength & Moseley Law', 'Binding Energy & Mass Defect', 'Radioactive Decay Law & Half-Life'],
    },
    {
      subject: 'Physics',
      unitNumber: 20,
      name: 'Electronic Devices',
      ncertClass: '12',
      topics: ['Intrinsic & Extrinsic Semiconductors', 'p-n Junction Diode & Rectifiers', 'Zener Diode Voltage Regulator', 'Logic Gates (AND, OR, NOT, NAND, NOR)'],
    },
  ],
  Chemistry: [
    {
      subject: 'Chemistry',
      unitNumber: 1,
      name: 'Some Basic Concepts in Chemistry',
      ncertClass: '11',
      topics: ['Mole Concept & Molarity/Molality', 'Stoichiometry & Limiting Reagent', 'Empirical & Molecular Formula', 'Equivalent Weight'],
    },
    {
      subject: 'Chemistry',
      unitNumber: 2,
      name: 'Atomic Structure',
      ncertClass: '11',
      topics: ['Bohr Radius & Energy Levels', 'Quantum Numbers & Orbital Nodes', 'de Broglie & Heisenberg Principle', 'Electronic Configuration & Hund Rule'],
    },
    {
      subject: 'Chemistry',
      unitNumber: 3,
      name: 'Chemical Bonding',
      ncertClass: '11',
      topics: ['VSEPR Theory & Hybridisation', 'Molecular Orbital Theory & Bond Order', 'Dipole Moment & Fajan Rules', 'Hydrogen Bonding'],
    },
    {
      subject: 'Chemistry',
      unitNumber: 4,
      name: 'Chemical Thermodynamics',
      ncertClass: '11',
      topics: ['Enthalpy, Internal Energy & Hess Law', 'Entropy & Spontaneity', 'Gibbs Free Energy & Equilibrium Constant', 'Bond Enthalpies'],
    },
    {
      subject: 'Chemistry',
      unitNumber: 5,
      name: 'Solutions',
      ncertClass: '12',
      topics: ['Raoult Law & Ideal/Non-Ideal Solutions', 'Elevation in Boiling Point & Depression in Freezing Point', 'Osmotic Pressure', 'van t Hoff Factor'],
    },
    {
      subject: 'Chemistry',
      unitNumber: 6,
      name: 'Equilibrium',
      ncertClass: '11',
      topics: ['Kp, Kc & Le Chatelier Principle', 'pH of Weak Acids, Bases & Buffers', 'Salt Hydrolysis', 'Solubility Product (Ksp)'],
    },
    {
      subject: 'Chemistry',
      unitNumber: 7,
      name: 'Redox Reactions and Electrochemistry',
      ncertClass: '11 & 12',
      topics: ['Oxidation Number & Balancing Redox', 'Nernst Equation & Cell Potential', 'Faraday Laws of Electrolysis', 'Kohlrausch Law & Molar Conductivity'],
    },
    {
      subject: 'Chemistry',
      unitNumber: 8,
      name: 'Chemical Kinetics',
      ncertClass: '12',
      topics: ['Rate Law & Order of Reaction', 'First Order Integrated Rate & Half-Life', 'Arrhenius Equation & Activation Energy', 'Collision Theory'],
    },
    {
      subject: 'Chemistry',
      unitNumber: 9,
      name: 'Classification of Elements',
      ncertClass: '11',
      topics: ['Periodic Trends in Atomic & Ionic Radii', 'Ionisation Enthalpy Exceptions', 'Electron Gain Enthalpy', 'Electronegativity & Nature of Oxides'],
    },
    {
      subject: 'Chemistry',
      unitNumber: 10,
      name: 'p-Block Elements',
      ncertClass: '11 & 12',
      topics: ['Group 13 & 14 Trends and Inert Pair Effect', 'Group 15 & 16 Oxoacids and Hydrides', 'Group 17 Halogens & Interhalogens', 'Group 18 Xenon Fluorides'],
    },
    {
      subject: 'Chemistry',
      unitNumber: 11,
      name: 'd- and f-Block Elements',
      ncertClass: '12',
      topics: ['3d Series Electronic Configuration & Oxidation States', 'Magnetic Moment (Spin-Only)', 'KMnO4 & K2Cr2O7 Oxidising Reactions', 'Lanthanoid Contraction'],
    },
    {
      subject: 'Chemistry',
      unitNumber: 12,
      name: 'Coordination Compounds',
      ncertClass: '12',
      topics: ['IUPAC Nomenclature & Werner Theory', 'Isomerism in Coordination Complexes', 'Crystal Field Splitting & CFSE', 'Valence Bond Theory & Magnetic Behaviour'],
    },
    {
      subject: 'Chemistry',
      unitNumber: 13,
      name: 'Purification and Characterisation of Organic Compounds',
      ncertClass: '11',
      topics: ['Distillation, Crystallisation & Chromatography', 'Lassaigne Test for N, S, Halogens', 'Dumas & Kjeldahl Quantitative Estimation', 'Carius Method'],
    },
    {
      subject: 'Chemistry',
      unitNumber: 14,
      name: 'Basic Principles of Organic Chemistry',
      ncertClass: '11',
      topics: ['IUPAC Naming & Structural Isomerism', 'Inductive, Resonance & Hyperconjugation Effects', 'Carbocation, Carbanion & Radical Stability', 'Acidic & Basic Strength Comparison'],
    },
    {
      subject: 'Chemistry',
      unitNumber: 15,
      name: 'Hydrocarbons',
      ncertClass: '11',
      topics: ['Alkanes Free Radical Halogenation', 'Alkenes Markovnikov, Anti-Markovnikov & Ozonolysis', 'Alkynes Acidity & Addition Reactions', 'Benzene Electrophilic Aromatic Substitution'],
    },
    {
      subject: 'Chemistry',
      unitNumber: 16,
      name: 'Organic Compounds Containing Halogens',
      ncertClass: '12',
      topics: ['SN1 vs SN2 Mechanism & Stereochemistry', 'E1 vs E2 Elimination', 'Aryl Halide Reactivity & Nucleophilic Substitution', 'Grignard Reagent Reactions'],
    },
    {
      subject: 'Chemistry',
      unitNumber: 17,
      name: 'Organic Compounds Containing Oxygen',
      ncertClass: '12',
      topics: ['Alcohols, Phenols & Ethers (Reimer-Tiemann, Williamson)', 'Aldol & Cannizzaro Reactions', 'Nucleophilic Addition to Carbonyls', 'Carboxylic Acids & Derivatives'],
    },
    {
      subject: 'Chemistry',
      unitNumber: 18,
      name: 'Organic Compounds Containing Nitrogen',
      ncertClass: '12',
      topics: ['Basicity of Amines in Aqueous & Gas Phase', 'Gabriel Phthalimide & Hoffmann Bromamide', 'Diazonium Salts & Coupling Reactions', 'Hinsberg & Carbylamine Tests'],
    },
    {
      subject: 'Chemistry',
      unitNumber: 19,
      name: 'Biomolecules',
      ncertClass: '12',
      topics: ['Glucose & Fructose Cyclic Structure', 'Reducing vs Non-Reducing Sugars', 'Amino Acids, Zwitterion & Peptide Bond', 'Nucleic Acids & Vitamins'],
    },
    {
      subject: 'Chemistry',
      unitNumber: 20,
      name: 'Practical Chemistry',
      ncertClass: '11 & 12',
      topics: ['Cation & Anion Qualitative Salt Analysis', 'Volumetric Redox Titration (KMnO4 / Oxalic Acid)', 'Functional Group Detection Tests', 'Enthalpy of Neutralisation & Lyophilic Sols'],
    },
  ],
  Mathematics: [
    {
      subject: 'Mathematics',
      unitNumber: 1,
      name: 'Sets, Relations and Functions',
      ncertClass: '11 & 12',
      topics: ['Set Operations & Cardinality', 'Equivalence Relations', 'Domain, Range & Inverse Functions', 'One-One, Onto & Composite Functions'],
    },
    {
      subject: 'Mathematics',
      unitNumber: 2,
      name: 'Complex Numbers',
      ncertClass: '11',
      topics: ['Modulus, Argument & Euler Form', 'Cube Roots of Unity', 'Argand Plane Geometry & Loci', 'Triangle Inequality'],
    },
    {
      subject: 'Mathematics',
      unitNumber: 3,
      name: 'Quadratic Equations',
      ncertClass: '11',
      topics: ['Nature of Roots & Vieta Relations', 'Common Roots Condition', 'Location of Roots', 'Range of Quadratic & Rational Expressions'],
    },
    {
      subject: 'Mathematics',
      unitNumber: 4,
      name: 'Matrices and Determinants',
      ncertClass: '12',
      topics: ['Properties of Determinants', 'Adjoint & Inverse Matrix Identities', 'System of Linear Equations (Consistency)', 'Cayley-Hamilton & Matrix Powers'],
    },
    {
      subject: 'Mathematics',
      unitNumber: 5,
      name: 'Permutations and Combinations',
      ncertClass: '11',
      topics: ['Circular Permutations & Arrangements with Repetition', 'Multinomial / Stars and Bars Distribution', 'Derangements & Inclusion-Exclusion', 'Geometrical Counting'],
    },
    {
      subject: 'Mathematics',
      unitNumber: 6,
      name: 'Binomial Theorem',
      ncertClass: '11',
      topics: ['General & Middle Term', 'Binomial Coefficient Identities', 'Remainder & Divisibility Problems', 'Multinomial Expansion'],
    },
    {
      subject: 'Mathematics',
      unitNumber: 7,
      name: 'Sequences and Series',
      ncertClass: '11',
      topics: ['AP, GP & AGP Sums', 'AM-GM-HM Inequality', 'Method of Differences (Telescoping Series)', 'Special Infinite Series'],
    },
    {
      subject: 'Mathematics',
      unitNumber: 8,
      name: 'Limits, Continuity and Differentiability',
      ncertClass: '11 & 12',
      topics: ['Standard Limits & L Hopital / Expansion', 'Continuity & Differentiability at Boundary Points', 'Chain Rule, Implicit & Parametric Differentiation', 'Maxima, Minima, Tangents & Monotonicity'],
    },
    {
      subject: 'Mathematics',
      unitNumber: 9,
      name: 'Integral Calculus',
      ncertClass: '12',
      topics: ['Substitution & Integration by Parts', 'King Property & Definite Integral Properties', 'Leibniz Rule (Differentiation Under Integral)', 'Area Bounded by Curves'],
    },
    {
      subject: 'Mathematics',
      unitNumber: 10,
      name: 'Differential Equations',
      ncertClass: '12',
      topics: ['Order, Degree & Variable Separable', 'Homogeneous Differential Equations', 'Linear Differential Equations (Integrating Factor)', 'Bernoulli & Exact Forms'],
    },
    {
      subject: 'Mathematics',
      unitNumber: 11,
      name: 'Coordinate Geometry',
      ncertClass: '11',
      topics: ['Straight Lines, Angle Bisectors & Family of Lines', 'Circles, Radical Axis & Tangents', 'Parabola & Focal Chords', 'Ellipse & Hyperbola Eccentricity and Tangents'],
    },
    {
      subject: 'Mathematics',
      unitNumber: 12,
      name: 'Three-Dimensional Geometry',
      ncertClass: '12',
      topics: ['Direction Cosines & Skew Lines Shortest Distance', 'Equation of Line & Foot of Perpendicular', 'Image of a Point & Angle Between Lines', 'Coplanarity Conditions'],
    },
    {
      subject: 'Mathematics',
      unitNumber: 13,
      name: 'Vector Algebra',
      ncertClass: '12',
      topics: ['Dot & Cross Product Applications', 'Scalar Triple Product & Coplanarity', 'Vector Triple Product', 'Projection & Geometry Using Vectors'],
    },
    {
      subject: 'Mathematics',
      unitNumber: 14,
      name: 'Statistics and Probability',
      ncertClass: '11 & 12',
      topics: ['Mean, Variance & Standard Deviation', 'Conditional Probability & Bayes Theorem', 'Independent Events & Total Probability', 'Binomial Probability Distribution'],
    },
    {
      subject: 'Mathematics',
      unitNumber: 15,
      name: 'Trigonometry',
      ncertClass: '11 & 12',
      topics: ['Trigonometric Identities & Compound Angles', 'Trigonometric Equations & General Solutions', 'Inverse Trigonometric Functions & Principal Values', 'Heights, Distances & Range of Trig Functions'],
    },
  ],
};

export function isChapterInSyllabus(subject: string, chapter: string): boolean {
  const chaptersList = JEE_2027_SYLLABUS[subject as SubjectName];
  if (!chaptersList) return false;
  return chaptersList.some((c) => c.name.toLowerCase() === chapter.trim().toLowerCase());
}

export function getSyllabusChapter(subject: string, chapter: string): SyllabusChapter | undefined {
  const chaptersList = JEE_2027_SYLLABUS[subject as SubjectName];
  if (!chaptersList) return undefined;
  return chaptersList.find((c) => c.name.toLowerCase() === chapter.trim().toLowerCase());
}

export interface QuestionDTO {
  id: number;
  externalId: string;
  subject: SubjectName;
  chapter: string;
  topic: string;
  difficulty: DifficultyLevel;
  questionType: QuestionType;
  questionText: string;
  diagramSvg?: string | null;
  options: string[];
  optionExplanations?: string[];
  correctAnswer?: string;
  numericalTolerance?: number;
  solution?: string;
  conceptTested?: string;
  formulaUsed?: string;
  estimatedTimeSeconds: number;
  sourceType: SourceType;
  sourceReference?: string | null;
  verificationStatus?: VerificationStatus;
  reviewVersion?: number;
  position?: number;
}

export interface DailyChallengeResponse {
  challengeDate: string; // YYYY-MM-DD (Asia/Kolkata)
  timezone: 'Asia/Kolkata';
  isLimitedSet: boolean;
  bankStats: {
    totalPublished: number;
    targetReleaseSize: number;
    bySubject: Record<SubjectName, number>;
  };
  questions: QuestionDTO[];
}
