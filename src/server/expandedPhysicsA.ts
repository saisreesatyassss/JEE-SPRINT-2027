import { buildMcq, buildNumerical, fmtNum } from './expandedHelpers.ts';
import type { CandidateQuestionInput } from './validationEngine.ts';

interface ScenarioSpec {
  id: string;
  chapter: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  kind: 'MCQ' | 'Numerical' | 'MultiConcept';
  stem: string;
  correct: string;
  distractors?: Array<{ option: string; explanation: string }>;
  solution: string;
  concept: string;
  formula: string;
  timeSec: number;
}

function materialize(specs: ScenarioSpec[]): CandidateQuestionInput[] {
  return specs.map((s, idx) =>
    s.kind === 'Numerical'
      ? buildNumerical({
          externalId: s.id,
          subject: 'Physics',
          chapter: s.chapter,
          topic: s.topic,
          difficulty: s.difficulty,
          questionText: s.stem,
          correctValue: s.correct,
          solution: s.solution,
          conceptTested: s.concept,
          formulaUsed: s.formula,
          estimatedTimeSeconds: s.timeSec,
        })
      : buildMcq({
          externalId: s.id,
          subject: 'Physics',
          chapter: s.chapter,
          topic: s.topic,
          difficulty: s.difficulty,
          questionType: s.kind === 'MultiConcept' ? 'MultiConcept' : 'MCQ',
          questionText: s.stem,
          correctOption: s.correct,
          correctExplanation: s.solution,
          distractors: s.distractors ?? [],
          solution: s.solution,
          conceptTested: s.concept,
          formulaUsed: s.formula,
          estimatedTimeSeconds: s.timeSec,
          rotateIndex: idx,
        })
  );
}

export function buildExpandedPhysicsPartA(): CandidateQuestionInput[] {
  const specs: ScenarioSpec[] = [];

  // Unit 1: Physics and Measurement (18)
  const u1Data = [
    { q: 'percentage error in kinetic energy when mass has 1% error and speed has 2% error', ans: 5, sol: '$\\frac{\\Delta K}{K} = \\frac{\\Delta m}{m} + 2\\frac{\\Delta v}{v} = 1\\% + 2(2\\%) = 5\\%$.', f: '$\\Delta K/K = \\Delta m/m + 2\\Delta v/v$', t: 'Significant Figures & Error Propagation', d: 'Easy' as const },
    { q: 'percentage error in density of a cube if mass error is 2% and edge length error is 1.5%', ans: 6.5, sol: '$\\rho = m/L^3 \\implies \\%\\Delta\\rho = 2\\% + 3(1.5\\%) = 6.5\\%$.', f: '$\\Delta\\rho/\\rho = \\Delta m/m + 3\\Delta L/L$', t: 'Significant Figures & Error Propagation', d: 'Easy' as const },
    { q: 'maximum fractional percentage error in $T = 2\\pi\\sqrt{l/g}$ if $l$ error is 1% and $T$ error is 2% while measuring $g$', ans: 5, sol: '$g = 4\\pi^2 l / T^2 \\implies \\%\\Delta g = \\%\\Delta l + 2(\\%\\Delta T) = 1\\% + 4\\% = 5\\%$.', f: '$\\Delta g/g = \\Delta l/l + 2\\Delta T/T$', t: 'Significant Figures & Error Propagation', d: 'Medium' as const },
    { q: 'least count (in mm) of a screw gauge having pitch 0.5 mm and 50 circular scale divisions', ans: 0.01, sol: 'Least count $= \\text{Pitch} / N = 0.5 / 50 = 0.01\\text{ mm}$.', f: '$\\text{LC} = \\text{Pitch}/N$', t: 'Vernier Callipers & Screw Gauge', d: 'Easy' as const },
    { q: 'pitch (in mm) of a micrometer screw that advances 4 mm in 8 complete rotations', ans: 0.5, sol: 'Pitch $= \\text{Distance moved} / \\text{Rotations} = 4 / 8 = 0.5\\text{ mm}$.', f: '$\\text{Pitch} = \\text{Advance}/n$', t: 'Vernier Callipers & Screw Gauge', d: 'Easy' as const },
    { q: 'measured diameter (in mm) when main scale reads 3 mm, 28th circular division aligns, LC = 0.01 mm, and zero error is +0.03 mm', ans: 3.25, sol: 'Reading $= 3 + 28(0.01) - 0.03 = 3.25\\text{ mm}$.', f: '$\\text{MSR} + (\\text{CSR}\\times\\text{LC}) - \\text{ZE}$', t: 'Vernier Callipers & Screw Gauge', d: 'Medium' as const },
    { q: 'percentage error in power $P = I^2 R$ when current error is 1.5% and resistance error is 3%', ans: 6, sol: '$\\Delta P/P = 2(\\Delta I/I) + \\Delta R/R = 2(1.5\\%) + 3\\% = 6\\%$.', f: '$\\Delta P/P = 2\\Delta I/I + \\Delta R/R$', t: 'Significant Figures & Error Propagation', d: 'Easy' as const },
    { q: 'number of significant figures in the physical quantity $0.04050\\text{ kg}$', ans: 4, sol: 'Leading zeros are non-significant; digits 4, 0, 5, and trailing zero after decimal are significant (4 sig figs).', f: 'Significant figure rules', t: 'Significant Figures & Error Propagation', d: 'Easy' as const },
    { q: 'Vernier callipers reading (in cm) if 1 MSD = 0.1 cm, 10 VSD = 9 MSD, MSR = 2.4 cm and 6th VSD coincides', ans: 2.46, sol: 'LC $= 0.1(1 - 9/10) = 0.01\\text{ cm}$. Total $= 2.4 + 6(0.01) = 2.46\\text{ cm}$.', f: '$\\text{MSR} + \\text{VSR}\\times\\text{LC}$', t: 'Vernier Callipers & Screw Gauge', d: 'Medium' as const },
  ];
  u1Data.forEach((item, i) => {
    specs.push({
      id: `PHY-EXP-U01-${String(i + 1).padStart(2, '0')}`,
      chapter: 'Physics and Measurement',
      topic: item.t,
      difficulty: item.d,
      kind: 'Numerical',
      stem: `Calculate the ${item.q}.`,
      correct: fmtNum(item.ans),
      solution: item.sol,
      concept: item.t,
      formula: item.f,
      timeSec: item.d === 'Easy' ? 45 : 70,
    });
  });
  const u1Mcq = [
    { stem: 'Which pair of physical quantities shares identical dimensional formula $[ML^2T^{-2}]$?', c: 'Torque and mechanical work', d1: 'Angular momentum and torque', d2: 'Impulse and momentum', d3: 'Surface tension and pressure', sol: 'Both torque ($\\vec{r}\\times\\vec{F}$) and work ($\\vec{F}\\cdot\\vec{d}$) have dimensions $[ML^2T^{-2}]$.', f: '$[W] = [\\tau] = [ML^2T^{-2}]$', t: 'SI Units & Dimensions', diff: 'Easy' as const },
    { stem: 'In van der Waals equation $(P + a/V^2)(V - b) = RT$, what are the dimensions of the ratio $a/b$?', c: '$[ML^2T^{-2}]$', d1: '$[ML^{-1}T^{-2}]$', d2: '$[ML^3T^{-2}]$', d3: '$[MLT^{-2}]$', sol: '$[a] = [PV^2] = [ML^5T^{-2}]$ and $[b] = [V] = [L^3]$, so $[a/b] = [ML^2T^{-2}]$ (energy).', f: '$[a/b] = [PV]$', t: 'Dimensional Analysis', diff: 'Medium' as const },
    { stem: 'The dimensional formula of magnetic permeability $\\mu_0$ in SI units is:', c: '$[MLT^{-2}A^{-2}]$', d1: '$[ML^2T^{-2}A^{-2}]$', d2: '$[M^{-1}L^{-3}T^4A^2]$', d3: '$[MLT^{-1}A^{-2}]$', sol: 'From $F/L = \\frac{\\mu_0 I^2}{2\\pi d}$, $[\\mu_0] = \\frac{[MLT^{-2}]}{[L][A^2]} = [MLT^{-2}A^{-2}]$.', f: '$F/L = \\mu_0 I_1 I_2/(2\\pi d)$', t: 'Dimensional Analysis', diff: 'Medium' as const },
    { stem: 'If force $F$, velocity $V$, and time $T$ are chosen as fundamental units, the dimensions of mass are:', c: '$[FV^{-1}T]$', d1: '$[FVT^{-1}]$', d2: '$[FV^{-1}T^{-1}]$', d3: '$[F^2V^{-1}T]$', sol: 'From $F = m a = m V / T$, solving for mass gives $[m] = [FTV^{-1}]$.', f: '$m = F T / V$', t: 'Dimensional Analysis', diff: 'Medium' as const },
    { stem: 'What is the dimensional formula of the RC time constant in an electrical circuit?', c: '$[M^0L^0T^1]$', d1: '$[M^0L^0T^{-1}]$', d2: '$[ML^2T^{-3}A^{-2}]$', d3: '$[M^0L^1T^1]$', sol: 'The product $RC$ governs exponential decay $e^{-t/RC}$, so its dimension equals time $[T]$.', f: '$[RC] = [T]$', t: 'SI Units & Dimensions', diff: 'Easy' as const },
    { stem: 'Which dimensionless combination represents the Reynolds number $Re = \\rho v d / \\eta$?', c: '$[M^0L^0T^0]$', d1: '$[M^0L^1T^{-1}]$', d2: '$[ML^{-1}T^{-1}]$', d3: '$[M^0L^0T^{-1}]$', sol: '$\\rho v d$ has $[ML^{-3}][LT^{-1}][L] = [ML^{-1}T^{-1}]$, matching viscosity $\\eta$, making $Re$ dimensionless.', f: '$Re = \\rho v d/\\eta$', t: 'Dimensional Analysis', diff: 'Medium' as const },
    { stem: 'If energy $E$, gravitational constant $G$, and Planck constant $h$ form base units, mass scales as:', c: '$E^{1} c^{-2}$ or dimensionally $E^{1/2}h^{0}G^0$ is invalid; specifically $[G^{-1/2}h^{1/2}c^{1/2}]$ — for $(E, h, G)$, $M \\propto E^0$? Wait: using $(E, G, c)$, mass scales as:', d1: '$E^1 G^{-1} c^2$', d2: '$E^0 G^{1/2} c^{-1/2}$', d3: '$E^2 G^{-1} c^0$', sol: 'Check dimensions: wait — let us verify $[G]$ and $[h]$: wait $M = \\sqrt{hc/G}$, while for $(E, c)$, $E = mc^2 \\implies M = Ec^{-2}$.', f: '$E = mc^2$', t: 'Dimensional Analysis', diff: 'Hard' as const },
    { stem: 'If energy $E$, linear momentum $p$, and time $T$ are fundamental quantities, the dimensions of Planck constant $h$ are:', c: '$[ET]$', d1: '$[Ep^{-1}T]$', d2: '$[E^{-1}T]$', d3: '$[pT^{-1}]$', sol: 'From $E = h\\nu = h/T$, Planck constant has dimensions $[h] = [E][T] = [ET]$.', f: '$E = h/T$', t: 'Dimensional Analysis', diff: 'Hard' as const },
    { stem: 'Two resistors $R_1 = (100 \\pm 3)\\,\\Omega$ and $R_2 = (200 \\pm 4)\\,\\Omega$ are connected in series. The equivalent resistance is:', c: '$(300 \\pm 7)\\,\\Omega$', d1: '$(300 \\pm 5)\\,\\Omega$', d2: '$(300 \\pm 1)\\,\\Omega$', d3: '$(100 \\pm 7)\\,\\Omega$', sol: 'In addition $R_s = R_1 + R_2$, absolute errors add: $R_s = (100+200) \\pm (3+4) = (300 \\pm 7)\\,\\Omega$.', f: '$\\Delta R_s = \\Delta R_1 + \\Delta R_2$', t: 'Significant Figures & Error Propagation', diff: 'Hard' as const },
  ];
  u1Mcq.forEach((m, i) => {
    if (i === 6) {
      // clean crisp question without self-correction
      specs.push({
        id: `PHY-EXP-U01-16`,
        chapter: 'Physics and Measurement',
        topic: 'Dimensional Analysis',
        difficulty: 'Hard',
        kind: 'MultiConcept',
        stem: 'Which expression has the dimensions of length in terms of Planck constant $h$, gravitational constant $G$, and speed of light $c$?',
        correct: '$\\sqrt{\\frac{hG}{c^3}}$',
        distractors: [
          { option: '$\\sqrt{\\frac{hc^3}{G}}$', explanation: 'Dimensional check gives wrong length exponent.' },
          { option: '$\\sqrt{\\frac{G}{hc^3}}$', explanation: 'Inverting $h$ and $G$ gives inverse length squared.' },
          { option: '$\\frac{hG}{c^2}$', explanation: 'Square root is required to obtain $L^1$.' },
        ],
        solution: 'Planck length $l_P = \\sqrt{\\frac{\\hbar G}{c^3}}$; checking $[hG/c^3] = \\frac{[ML^2T^{-1}][M^{-1}L^3T^{-2}]}{[L^3T^{-3}]} = [L^2]$, so its square root has dimension $[L]$.',
        concept: 'Planck length dimensional derivation',
        formula: '$l_P \\propto \\sqrt{hG/c^3}$',
        timeSec: 110,
      });
      return;
    }
    specs.push({
      id: `PHY-EXP-U01-${String(10 + i).padStart(2, '0')}`,
      chapter: 'Physics and Measurement',
      topic: m.t,
      difficulty: m.diff,
      kind: 'MCQ',
      stem: m.stem,
      correct: m.c,
      distractors: [
        { option: m.d1, explanation: 'Does not match dimensional homogeneity.' },
        { option: m.d2, explanation: 'Incorrect exponent on fundamental units.' },
        { option: m.d3, explanation: 'Check governing physical law carefully.' },
      ],
      solution: m.sol,
      concept: m.t,
      formula: m.f,
      timeSec: m.diff === 'Easy' ? 50 : m.diff === 'Medium' ? 75 : 100,
    });
  });

  // Unit 2: Kinematics (18)
  const u2Cases: Array<{
    v?: number;
    stem: string;
    ans: string;
    kind: 'Numerical' | 'MCQ' | 'MultiConcept';
    opts?: [string, string, string];
    sol: string;
    f: string;
    t: string;
    d: 'Easy' | 'Medium' | 'Hard';
  }> = [
    { stem: 'A train accelerating uniformly from rest reaches $30\\text{ m/s}$ in $15\\text{ s}$. Find its displacement (in meters) during this interval.', ans: '225', kind: 'Numerical', sol: '$s = \\frac{u+v}{2}t = \\frac{0+30}{2}\\times 15 = 225\\text{ m}$.', f: '$s = \\frac{u+v}{2}t$', t: 'Uniform Acceleration & Graphs', d: 'Easy' },
    { stem: 'A stone is thrown vertically upward at $40\\text{ m/s}$. Taking $g = 10\\text{ m/s}^2$, find the maximum height (in meters) attained.', ans: '80', kind: 'Numerical', sol: '$H = \\frac{u^2}{2g} = \\frac{1600}{20} = 80\\text{ m}$.', f: '$H = u^2/(2g)$', t: 'Uniform Acceleration & Graphs', d: 'Easy' },
    { stem: 'A car travels first half of a straight journey at $40\\text{ km/h}$ and second half at $60\\text{ km/h}$. What is its average speed (in km/h)?', ans: '48', kind: 'Numerical', sol: '$v_{\\text{avg}} = \\frac{2v_1 v_2}{v_1 + v_2} = \\frac{2(40)(60)}{100} = 48\\text{ km/h}$.', f: '$v_{\\text{avg}} = \\frac{2v_1 v_2}{v_1+v_2}$', t: 'Uniform Acceleration & Graphs', d: 'Easy' },
    { stem: 'A projectile is launched at $30^\\circ$ above horizontal with speed $40\\text{ m/s}$ ($g = 10\\text{ m/s}^2$). What is its total time of flight (in seconds)?', ans: '4', kind: 'Numerical', sol: '$T = \\frac{2u\\sin\\theta}{g} = \\frac{2(40)(0.5)}{10} = 4\\text{ s}$.', f: '$T = 2u\\sin\\theta/g$', t: 'Projectile Motion', d: 'Easy' },
    { stem: 'Position of a particle varies as $x(t) = 3t^2 - 12t + 5$ (SI units). At what time $t$ (in seconds) does the particle momentarily come to rest?', ans: '2', kind: 'Numerical', sol: '$v(t) = \\frac{dx}{dt} = 6t - 12 = 0 \\implies t = 2\\text{ s}$.', f: '$v = dx/dt$', t: 'Uniform Acceleration & Graphs', d: 'Easy' },
    { stem: 'Two scooters move along parallel tracks in opposite directions at $18\\text{ m/s}$ and $12\\text{ m/s}$. What is their relative speed (in m/s)?', ans: '30', kind: 'Numerical', sol: 'Moving in opposite directions, relative speed $= 18 + 12 = 30\\text{ m/s}$.', f: '$v_{AB} = v_A + v_B$', t: 'Relative Velocity in 2D', d: 'Easy' },
    { stem: 'A ball is dropped from a tower of height $125\\text{ m}$ ($g = 10\\text{ m/s}^2$). How far (in meters) does it fall in the last second before hitting the ground?', ans: '45', kind: 'Numerical', sol: 'Total time $t = \\sqrt{2h/g} = \\sqrt{25} = 5\\text{ s}$. Distance in 5th second: $s_5 = \\frac{g}{2}(2n-1) = 5(9) = 45\\text{ m}$.', f: '$s_n = u + \\frac{a}{2}(2n-1)$', t: 'Uniform Acceleration & Graphs', d: 'Medium' },
    { stem: 'A swimmer whose speed in still water is $5\\text{ m/s}$ crosses a $200\\text{ m}$ wide river flowing at $3\\text{ m/s}$ along the shortest path perpendicular to banks. Find the crossing time (in seconds).', ans: '50', kind: 'Numerical', sol: 'Net perpendicular speed $= \\sqrt{5^2 - 3^2} = 4\\text{ m/s}$. Time $= 200/4 = 50\\text{ s}$.', f: '$t = d/\\sqrt{v_m^2 - v_r^2}$', t: 'Relative Velocity in 2D', d: 'Medium' },
    { stem: 'A cyclist rides on a circular track of radius $50\\text{ m}$ at a constant speed of $10\\text{ m/s}$. Calculate the magnitude of centripetal acceleration (in $\\text{m/s}^2$).', ans: '2', kind: 'Numerical', sol: '$a_c = v^2/R = 100/50 = 2\\text{ m/s}^2$.', f: '$a_c = v^2/R$', t: 'Circular Motion Kinematics', d: 'Medium' },
    { stem: 'A cannon fires a shell horizontally from a $45\\text{ m}$ tall cliff at $30\\text{ m/s}$ ($g = 10\\text{ m/s}^2$). Find its horizontal range (in meters) on the ground.', ans: '90', kind: 'Numerical', sol: 'Fall time $t = \\sqrt{2h/g} = \\sqrt{9} = 3\\text{ s}$. Range $= ut = 30\\times 3 = 90\\text{ m}$.', f: '$R = u\\sqrt{2h/g}$', t: 'Projectile Motion', d: 'Medium' },
    { stem: 'A motorist travelling at $20\\text{ m/s}$ applies brakes producing uniform retardation of $4\\text{ m/s}^2$. Find the stopping distance (in meters).', ans: '50', kind: 'Numerical', sol: '$s = u^2/(2a) = 400/8 = 50\\text{ m}$.', f: '$v^2 = u^2 - 2as$', t: 'Uniform Acceleration & Graphs', d: 'Medium' },
    { stem: 'At what launch angle (in degrees) does a projectile achieve a horizontal range equal to 4 times its maximum height?', ans: '45', kind: 'Numerical', sol: '$R = 4H \\implies \\frac{u^2\\sin 2\\theta}{g} = 4\\frac{u^2\\sin^2\\theta}{2g} \\implies \\tan\\theta = 1 \\implies \\theta = 45^\\circ$.', f: '$R/H = 4\\cot\\theta$', t: 'Projectile Motion', d: 'Medium' },
    { stem: 'A particle executes circular motion of radius $4\\text{ m}$ with tangential acceleration $3\\text{ m/s}^2$ when its speed is $4\\text{ m/s}$. Find the magnitude of net acceleration (in $\\text{m/s}^2$).', ans: '5', kind: 'Numerical', sol: '$a_c = v^2/R = 16/4 = 4\\text{ m/s}^2$. $a_{\\text{net}} = \\sqrt{a_t^2 + a_c^2} = \\sqrt{3^2 + 4^2} = 5\\text{ m/s}^2$.', f: '$a_{\\text{net}} = \\sqrt{a_t^2 + (v^2/R)^2}$', t: 'Circular Motion Kinematics', d: 'Medium' },
    { stem: 'Rain falls vertically at $12\\text{ m/s}$ while a pedestrian walks horizontally at $5\\text{ m/s}$. What is the speed of raindrops relative to the pedestrian (in m/s)?', ans: '13', kind: 'Numerical', sol: '$v_{\\text{rel}} = \\sqrt{12^2 + 5^2} = 13\\text{ m/s}$.', f: '$v_{\\text{rel}} = \\sqrt{v_r^2 + v_m^2}$', t: 'Relative Velocity in 2D', d: 'Medium' },
    { stem: 'A rocket accelerates from rest at $6\\text{ m/s}^2$ for $10\\text{ s}$, then coasts at constant velocity for $10\\text{ s}$. Find total distance covered (in meters) in $20\\text{ s}$.', ans: '900', kind: 'MultiConcept', opts: ['600', '300', '1200'], sol: 'First 10 s: $s_1 = \\frac{1}{2}(6)(100) = 300\\text{ m}$, $v = 60\\text{ m/s}$. Next 10 s: $s_2 = 60\\times 10 = 600\\text{ m}$. Total $= 900\\text{ m}$.', f: '$s = s_1 + s_2$', t: 'Uniform Acceleration & Graphs', d: 'Hard' },
    { stem: 'A projectile trajectory is given by $y = \\sqrt{3}x - 5x^2$ (with $g = 10\\text{ m/s}^2$). What is its launch speed (in m/s)?', ans: '2', kind: 'Numerical', sol: 'Compare with $y = x\\tan\\theta - \\frac{gx^2}{2u^2\\cos^2\\theta}$: $\\tan\\theta = \\sqrt{3} \\implies \\theta = 60^\\circ, \\cos\\theta = 1/2$. Coefficient of $x^2$: $\\frac{10}{2u^2(1/4)} = 5 \\implies \\frac{20}{u^2} = 5 \\implies u = 2\\text{ m/s}$.', f: '$y = x\\tan\\theta - \\frac{gx^2}{2u^2\\cos^2\\theta}$', t: 'Projectile Motion', d: 'Hard' },
    { stem: 'An object projected at $45^\\circ$ has speed $v$ at half of its maximum height. If launch speed is $20\\text{ m/s}$, find $v^2$ (in $\\text{m}^2/\\text{s}^2$).', ans: '300', kind: 'Numerical', sol: '$H = \\frac{u^2\\sin^2 45^\\circ}{2g} = \\frac{u^2}{4g}$. At $h = H/2$, $v^2 = u^2 - 2g(H/2) = u^2 - \\frac{u^2}{4} = \\frac{3}{4}(400) = 300$.', f: '$v^2 = u^2 - 2gh$', t: 'Projectile Motion', d: 'Hard' },
    { stem: 'A ball is projected up an incline of $30^\\circ$ at $30^\\circ$ relative to the incline with speed $20\\text{ m/s}$ ($g = 10\\text{ m/s}^2$). What is its time of flight (in seconds)?', ans: '$\\frac{4}{\\sqrt{3}}$', kind: 'MCQ', opts: ['$2$', '$4$', '$2\\sqrt{3}$'], sol: '$T = \\frac{2u\\sin\\alpha}{g\\cos\\beta} = \\frac{2(20)\\sin 30^\\circ}{10\\cos 30^\\circ} = \\frac{20}{5\\sqrt{3}} = \\frac{4}{\\sqrt{3}}\\text{ s}$.', f: '$T = \\frac{2u\\sin\\alpha}{g\\cos\\beta}$', t: 'Projectile Motion', d: 'Hard' },
  ];
  u2Cases.forEach((c, i) => {
    specs.push({
      id: `PHY-EXP-U02-${String(i + 1).padStart(2, '0')}`,
      chapter: 'Kinematics',
      topic: c.t,
      difficulty: c.d,
      kind: c.kind,
      stem: c.stem,
      correct: c.ans,
      distractors: c.opts?.map((o) => ({ option: o, explanation: 'Check kinematic decomposition or trigonometric projection.' })),
      solution: c.sol,
      concept: c.t,
      formula: c.f,
      timeSec: c.d === 'Easy' ? 50 : c.d === 'Medium' ? 75 : 105,
    });
  });

  // Units 3 to 10 (18 distinct scenarios per unit = 144 questions)
  const units3To10: Array<{
    unitCode: string;
    chapter: string;
    items: Array<{
      topic: string;
      d: 'Easy' | 'Medium' | 'Hard';
      kind: 'Numerical' | 'MCQ' | 'MultiConcept';
      stem: string;
      ans: string;
      opts?: [string, string, string];
      sol: string;
      f: string;
    }>;
  }> = [
    {
      unitCode: 'U03',
      chapter: 'Laws of Motion',
      items: [
        { topic: 'Newton Laws & Pulley Systems', d: 'Easy', kind: 'Numerical', stem: 'Blocks of masses $4\\text{ kg}$ and $6\\text{ kg}$ are connected by a light string over a smooth fixed pulley ($g = 10\\text{ m/s}^2$). Find the magnitude of acceleration (in $\\text{m/s}^2$).', ans: '2', sol: '$a = \\frac{m_2 - m_1}{m_1 + m_2}g = \\frac{6-4}{10}(10) = 2\\text{ m/s}^2$.', f: '$a = \\frac{m_2-m_1}{m_1+m_2}g$' },
        { topic: 'Newton Laws & Pulley Systems', d: 'Easy', kind: 'Numerical', stem: 'For masses $4\\text{ kg}$ and $6\\text{ kg}$ suspended over an ideal Atwood machine ($g = 10\\text{ m/s}^2$), determine the string tension (in Newtons).', ans: '48', sol: '$T = \\frac{2m_1 m_2}{m_1 + m_2}g = \\frac{2(4)(6)}{10}(10) = 48\\text{ N}$.', f: '$T = \\frac{2m_1 m_2}{m_1+m_2}g$' },
        { topic: 'Static & Kinetic Friction', d: 'Easy', kind: 'Numerical', stem: 'A $10\\text{ kg}$ crate rests on a horizontal floor with $\\mu_s = 0.4$ ($g = 10\\text{ m/s}^2$). What horizontal force (in Newtons) just initiates motion?', ans: '40', sol: '$f_{\\max} = \\mu_s N = 0.4 \\times 10 \\times 10 = 40\\text{ N}$.', f: '$f_{\\max} = \\mu_s mg$' },
        { topic: 'Static & Kinetic Friction', d: 'Easy', kind: 'Numerical', stem: 'A $5\\text{ kg}$ block is pulled on a rough horizontal table ($\\mu_k = 0.2$) by a $25\\text{ N}$ horizontal force ($g = 10\\text{ m/s}^2$). Find its acceleration (in $\\text{m/s}^2$).', ans: '3', sol: 'Friction $f_k = 0.2(50) = 10\\text{ N}$. Net force $= 25 - 10 = 15\\text{ N}$, so $a = 15/5 = 3\\text{ m/s}^2$.', f: '$a = (F - \\mu_k mg)/m$' },
        { topic: 'Newton Laws & Pulley Systems', d: 'Easy', kind: 'Numerical', stem: 'Three blocks $2\\text{ kg}$, $3\\text{ kg}$, and $5\\text{ kg}$ lie in contact on a frictionless surface and are pushed by $30\\text{ N}$ on the $2\\text{ kg}$ block. Find the contact force (in N) between $3\\text{ kg}$ and $5\\text{ kg}$.', ans: '15', sol: '$a = 30/(2+3+5) = 3\\text{ m/s}^2$. Force on $5\\text{ kg}$ block $= 5 \\times 3 = 15\\text{ N}$.', f: '$N = m_{\\text{front}} a$' },
        { topic: 'Pseudo Forces', d: 'Easy', kind: 'Numerical', stem: 'A $60\\text{ kg}$ passenger stands on a weighing scale inside an elevator accelerating upward at $2\\text{ m/s}^2$ ($g = 10\\text{ m/s}^2$). What reading (in Newtons) does the scale show?', ans: '720', sol: 'Apparent weight $N = m(g + a) = 60(10 + 2) = 720\\text{ N}$.', f: '$N = m(g+a)$' },
        { topic: 'Static & Kinetic Friction', d: 'Medium', kind: 'Numerical', stem: 'A $4\\text{ kg}$ block slides down a rough $30^\\circ$ incline with $\\mu_k = \\frac{1}{2\\sqrt{3}}$ ($g = 10\\text{ m/s}^2$). Find its acceleration (in $\\text{m/s}^2$) down the plane.', ans: '2.5', sol: '$a = g(\\sin 30^\\circ - \\mu_k\\cos 30^\\circ) = 10(0.5 - \\frac{1}{2\\sqrt{3}}\\cdot\\frac{\\sqrt{3}}{2}) = 10(0.25) = 2.5\\text{ m/s}^2$.', f: '$a = g(\\sin\\theta - \\mu\\cos\\theta)$' },
        { topic: 'Dynamics of Circular Motion', d: 'Medium', kind: 'Numerical', stem: 'A car negotiates an unbanked flat curve of radius $40\\text{ m}$ where $\\mu_s = 0.4$ ($g = 10\\text{ m/s}^2$). What is the maximum safe speed (in m/s)?', ans: '12.65', sol: '$v_{\\max} = \\sqrt{\\mu_s R g} = \\sqrt{0.4 \\times 40 \\times 10} = \\sqrt{160} \\approx 12.65\\text{ m/s}$.', f: '$v_{\\max} = \\sqrt{\\mu_s R g}$' },
        { topic: 'Dynamics of Circular Motion', d: 'Medium', kind: 'Numerical', stem: 'A flat circular turn of radius $90\\text{ m}$ is banked for a design speed of $30\\text{ m/s}$ without relying on friction ($g = 10\\text{ m/s}^2$). Find $\\tan\\theta$ of the banking angle.', ans: '1', sol: '$\\tan\\theta = \\frac{v^2}{Rg} = \\frac{900}{90\\times 10} = 1$ ($\\theta = 45^\\circ$).', f: '$\\tan\\theta = v^2/(Rg)$' },
        { topic: 'Newton Laws & Pulley Systems', d: 'Medium', kind: 'Numerical', stem: 'A $0.2\\text{ kg}$ hockey puck receives an average force of $40\\text{ N}$ for $0.05\\text{ s}$ from rest. Calculate its resulting speed (in m/s).', ans: '10', sol: 'Impulse $J = F\\Delta t = 40(0.05) = 2\\text{ N}\\cdot\\text{s} = mv \\implies v = 2/0.2 = 10\\text{ m/s}$.', f: '$F\\Delta t = m\\Delta v$' },
        { topic: 'Pseudo Forces', d: 'Medium', kind: 'MCQ', stem: 'A plumb bob hangs from the ceiling of a train moving horizontally with acceleration $a = g/\\sqrt{3}$. What angle does the string make with the vertical?', ans: '$30^\\circ$', opts: ['$45^\\circ$', '$60^\\circ$', '$15^\\circ$'], sol: 'In the train frame, $\\tan\\theta = a/g = 1/\\sqrt{3} \\implies \\theta = 30^\\circ$.', f: '$\\tan\\theta = a/g$' },
        { topic: 'Static & Kinetic Friction', d: 'Medium', kind: 'Numerical', stem: 'A $2\\text{ kg}$ block is pressed against a vertical wall by a horizontal force $F$. If $\\mu_s = 0.5$ and $g = 10\\text{ m/s}^2$, find the minimum force $F$ (in N) to prevent slipping.', ans: '40', sol: 'Upward friction $\\mu_s F \\ge mg \\implies 0.5 F \\ge 20 \\implies F_{\\min} = 40\\text{ N}$.', f: '$\\mu_s F = mg$' },
        { topic: 'Newton Laws & Pulley Systems', d: 'Medium', kind: 'Numerical', stem: 'A $6\\text{ kg}$ mass on a smooth table is tied via a pulley to a hanging $4\\text{ kg}$ mass ($g = 10\\text{ m/s}^2$). Find the tension (in N) in the connecting cord.', ans: '24', sol: '$a = 40/(6+4) = 4\\text{ m/s}^2$. Tension $T = m_{\\text{table}}a = 6 \\times 4 = 24\\text{ N}$.', f: '$T = \\frac{m_1 m_2}{m_1+m_2}g$' },
        { topic: 'Dynamics of Circular Motion', d: 'Medium', kind: 'Numerical', stem: 'A stone of mass $0.5\\text{ kg}$ tied to a $2\\text{ m}$ string whirls in a horizontal circle on a smooth table at $6\\text{ m/s}$. Find the tension (in N).', ans: '9', sol: '$T = mv^2/L = 0.5(36)/2 = 9\\text{ N}$.', f: '$T = mv^2/L$' },
        { topic: 'Static & Kinetic Friction', d: 'Hard', kind: 'MultiConcept', stem: 'A $2\\text{ kg}$ block rests atop a $4\\text{ kg}$ plank on a smooth floor, with $\\mu = 0.3$ between them ($g = 10\\text{ m/s}^2$). What maximum horizontal force (in N) applied to the lower plank accelerates both together without slipping?', ans: '18', opts: ['6', '12', '24'], sol: 'Max acceleration of top block $a_{\\max} = \\mu g = 3\\text{ m/s}^2$. Total force $F_{\\max} = (2+4)(3) = 18\\text{ N}$.', f: '$F_{\\max} = (m_1+m_2)\\mu g$' },
        { topic: 'Pseudo Forces', d: 'Hard', kind: 'Numerical', stem: 'What horizontal acceleration (in $\\text{m/s}^2$) must be given to a smooth $37^\\circ$ wedge ($\\tan 37^\\circ = 3/4$, $g = 10\\text{ m/s}^2$) so a block placed on it stays stationary relative to the wedge?', ans: '7.5', sol: 'Equilibrium on wedge requires $a = g\\tan\\theta = 10(3/4) = 7.5\\text{ m/s}^2$.', f: '$a = g\\tan\\theta$' },
        { topic: 'Newton Laws & Pulley Systems', d: 'Hard', kind: 'Numerical', stem: 'A variable force $F = 6t^2\\text{ N}$ acts on a $2\\text{ kg}$ body initially at rest for $2\\text{ s}$. Find its final velocity (in m/s).', ans: '8', sol: '$\\Delta p = \\int_0^2 6t^2\\,dt = [2t^3]_0^2 = 16\\text{ N}\\cdot\\text{s}$. Velocity $v = 16/2 = 8\\text{ m/s}$.', f: '$mv = \\int F\\,dt$' },
        { topic: 'Dynamics of Circular Motion', d: 'Hard', kind: 'Numerical', stem: 'A coin sits $0.2\\text{ m}$ from the centre of a rotating horizontal turntable ($\\mu_s = 0.5, g = 10\\text{ m/s}^2$). Find the maximum angular speed $\\omega$ (in rad/s) before it slips.', ans: '5', sol: '$\\omega_{\\max} = \\sqrt{\\mu_s g / r} = \\sqrt{5 / 0.2} = \\sqrt{25} = 5\\text{ rad/s}$.', f: '$\\omega_{\\max} = \\sqrt{\\mu_s g / r}$' },
      ],
    },
    {
      unitCode: 'U04',
      chapter: 'Work, Energy and Power',
      items: [
        { topic: 'Work-Energy Theorem', d: 'Easy', kind: 'Numerical', stem: 'A force $\\vec{F} = (4\\hat{i} + 3\\hat{j})\\text{ N}$ displaces a particle by $\\vec{d} = (5\\hat{i} - 2\\hat{j})\\text{ m}$. Calculate the work done (in Joules).', ans: '14', sol: '$W = \\vec{F}\\cdot\\vec{d} = 4(5) + 3(-2) = 20 - 6 = 14\\text{ J}$.', f: '$W = \\vec{F}\\cdot\\vec{d}$' },
        { topic: 'Work-Energy Theorem', d: 'Easy', kind: 'Numerical', stem: 'How much work (in Joules) is required to accelerate a $4\\text{ kg}$ block from $3\\text{ m/s}$ to $7\\text{ m/s}$ on a smooth horizontal track?', ans: '80', sol: '$W = \\frac{1}{2}m(v^2 - u^2) = 2(49 - 9) = 80\\text{ J}$.', f: '$W = \\Delta K$' },
        { topic: 'Conservative Forces & Potential Energy', d: 'Easy', kind: 'Numerical', stem: 'A spring of stiffness $k = 400\\text{ N/m}$ is compressed by $0.15\\text{ m}$. Find the elastic potential energy stored (in Joules).', ans: '4.5', sol: '$U = \\frac{1}{2}kx^2 = 0.5(400)(0.0225) = 4.5\\text{ J}$.', f: '$U = \\frac{1}{2}kx^2$' },
        { topic: 'Work-Energy Theorem', d: 'Easy', kind: 'Numerical', stem: 'A pump lifts $300\\text{ kg}$ of water per minute to a tank $12\\text{ m}$ high ($g = 10\\text{ m/s}^2$). What average power (in Watts) does it deliver?', ans: '600', sol: '$P = \\frac{mgh}{t} = \\frac{300\\times 10\\times 12}{60} = 600\\text{ W}$.', f: '$P = mgh/t$' },
        { topic: 'Elastic & Inelastic Collisions', d: 'Easy', kind: 'Numerical', stem: 'A $2\\text{ kg}$ cart moving at $6\\text{ m/s}$ collides and sticks to a stationary $4\\text{ kg}$ cart. Find their common final speed (in m/s).', ans: '2', sol: 'Momentum conservation: $2(6) = (2+4)v \\implies v = 2\\text{ m/s}$.', f: '$m_1 u_1 = (m_1+m_2)v$' },
        { topic: 'Conservative Forces & Potential Energy', d: 'Easy', kind: 'Numerical', stem: 'Potential energy of a particle is $U(x) = 3x^2 - 12x$ (in Joules). At what position $x$ (in meters) is the particle in stable equilibrium?', ans: '2', sol: '$F = -dU/dx = -(6x - 12) = 0 \\implies x = 2\\text{ m}$ (with $d^2U/dx^2 = 6 > 0$).', f: '$F = -dU/dx = 0$' },
        { topic: 'Vertical Circular Motion', d: 'Medium', kind: 'Numerical', stem: 'A bob on a $1\\text{ m}$ string swings in a vertical circle ($g = 10\\text{ m/s}^2$). What minimum speed (in m/s) at the lowest point ensures completing the loop?', ans: '7.07', sol: '$v_{\\min} = \\sqrt{5gL} = \\sqrt{50} \\approx 7.07\\text{ m/s}$.', f: '$v_{\\min} = \\sqrt{5gL}$' },
        { topic: 'Elastic & Inelastic Collisions', d: 'Medium', kind: 'Numerical', stem: 'A ball falls onto a horizontal floor from $16\\text{ m}$ with restitution coefficient $e = 0.5$. To what height (in meters) does it rebound after one bounce?', ans: '4', sol: '$h_1 = e^2 h_0 = (0.5)^2 (16) = 4\\text{ m}$.', f: '$h_n = e^{2n}h_0$' },
        { topic: 'Work-Energy Theorem', d: 'Medium', kind: 'Numerical', stem: 'A force $F(x) = (4x + 6)\\text{ N}$ acts along the $x$-axis from $x = 1\\text{ m}$ to $x = 3\\text{ m}$. Calculate the work done (in Joules).', ans: '28', sol: '$W = \\int_1^3 (4x+6)\\,dx = [2x^2 + 6x]_1^3 = (18+18) - (2+6) = 28\\text{ J}$.', f: '$W = \\int F(x)\\,dx$' },
        { topic: 'Conservative Forces & Potential Energy', d: 'Medium', kind: 'Numerical', stem: 'A $2\\text{ kg}$ block moving at $4\\text{ m/s}$ hits a horizontal ideal spring ($k = 200\\text{ N/m}$) on a smooth floor. Find the maximum compression (in cm).', ans: '40', sol: '$\\frac{1}{2}mv^2 = \\frac{1}{2}kx^2 \\implies x = v\\sqrt{m/k} = 4\\sqrt{2/200} = 0.4\\text{ m} = 40\\text{ cm}$.', f: '$x_{\\max} = v\\sqrt{m/k}$' },
        { topic: 'Work-Energy Theorem', d: 'Medium', kind: 'Numerical', stem: 'A machine delivers constant power $P = 32\\text{ W}$ to a $4\\text{ kg}$ trolley starting from rest. Find its speed (in m/s) after $9\\text{ s}$.', ans: '12', sol: '$\\frac{1}{2}mv^2 = Pt \\implies v = \\sqrt{2Pt/m} = \\sqrt{2(32)(9)/4} = 12\\text{ m/s}$.', f: '$\\frac{1}{2}mv^2 = Pt$' },
        { topic: 'Elastic & Inelastic Collisions', d: 'Medium', kind: 'Numerical', stem: 'A $3\\text{ kg}$ ball at $8\\text{ m/s}$ collides head-on with a stationary $1\\text{ kg}$ ball ($e = 0.5$). Find the speed (in m/s) of the $1\\text{ kg}$ ball after impact.', ans: '9', sol: '$v_2 = \\frac{(1+e)m_1 u_1}{m_1 + m_2} = \\frac{1.5 \\times 3 \\times 8}{4} = 9\\text{ m/s}$.', f: '$v_2 = \\frac{(1+e)m_1 u_1}{m_1+m_2}$' },
        { topic: 'Vertical Circular Motion', d: 'Medium', kind: 'Numerical', stem: 'A $1\\text{ kg}$ stone tied to a $1\\text{ m}$ string has speed $6\\text{ m/s}$ at the bottom of a vertical circle ($g = 10\\text{ m/s}^2$). Find the tension (in N) at the bottom.', ans: '46', sol: '$T = mg + \\frac{mv^2}{L} = 10 + 36 = 46\\text{ N}$.', f: '$T_{\\text{bottom}} = mg + mv^2/L$' },
        { topic: 'Work-Energy Theorem', d: 'Medium', kind: 'Numerical', stem: 'A bullet of mass $20\\text{ g}$ moving at $300\\text{ m/s}$ penetrates $9\\text{ cm}$ into a wooden plank before stopping. Find the average resistive force (in kN).', ans: '10', sol: '$F = \\frac{\\frac{1}{2}mv^2}{d} = \\frac{0.5(0.02)(90000)}{0.09} = 10000\\text{ N} = 10\\text{ kN}$.', f: '$F\\cdot d = \\frac{1}{2}mv^2$' },
        { topic: 'Elastic & Inelastic Collisions', d: 'Hard', kind: 'Numerical', stem: 'A $4\\text{ kg}$ mass at $10\\text{ m/s}$ undergoes a completely inelastic head-on collision with a stationary $6\\text{ kg}$ mass. Calculate the kinetic energy lost (in Joules).', ans: '120', sol: '$\\Delta K = \\frac{1}{2}\\frac{m_1 m_2}{m_1+m_2}u_1^2 = 0.5\\times\\frac{24}{10}\\times 100 = 120\\text{ J}$.', f: '$\\Delta K = \\frac{1}{2}\\mu u_{\\text{rel}}^2$' },
        { topic: 'Work-Energy Theorem', d: 'Hard', kind: 'MultiConcept', stem: 'A uniform chain of mass $M$ and length $L$ rests on a smooth table with $1/4$ of its length hanging over the edge. How much work is required to pull the hanging part back onto the table?', ans: '$\\frac{MgL}{32}$', opts: ['$\\frac{MgL}{16}$', '$\\frac{MgL}{8}$', '$\\frac{MgL}{64}$'], sol: 'Hanging mass is $M/4$ with CM at depth $L/8$. Work $= (M/4)g(L/8) = \\frac{MgL}{32}$.', f: '$W = \\frac{MgL}{2n^2}$' },
        { topic: 'Vertical Circular Motion', d: 'Hard', kind: 'Numerical', stem: 'A smooth small sphere starts sliding from rest from the top of a fixed smooth hemisphere of radius $R = 3\\text{ m}$. At what vertical height (in meters) above the base does it lose contact?', ans: '2', sol: 'Contact breaks at $\\cos\\theta = 2/3$, so height above base $h = R\\cos\\theta = 3(2/3) = 2\\text{ m}$.', f: '$h_{\\text{sep}} = \\frac{2}{3}R$' },
        { topic: 'Work-Energy Theorem', d: 'Hard', kind: 'Numerical', stem: 'A $2\\text{ kg}$ block slides from rest down a smooth $30^\\circ$ incline of length $5\\text{ m}$ and then travels $5\\text{ m}$ on a rough horizontal floor before stopping ($g = 10\\text{ m/s}^2$). Find $\\mu_k$ of the floor.', ans: '0.5', sol: 'Height $h = 5\\sin 30^\\circ = 2.5\\text{ m}$. Work-energy: $mgh = \\mu_k mg d \\implies \\mu_k = 2.5/5 = 0.5$.', f: '$mgh = \\mu_k mg d$' },
      ],
    },
    {
      unitCode: 'U05',
      chapter: 'Rotational Motion',
      items: [
        { topic: 'Centre of Mass', d: 'Easy', kind: 'Numerical', stem: 'Particles of mass $2\\text{ kg}$ and $6\\text{ kg}$ are located at $x = 1\\text{ m}$ and $x = 5\\text{ m}$ respectively. Find the $x$-coordinate (in m) of their centre of mass.', ans: '4', sol: '$x_{\\text{cm}} = \\frac{2(1) + 6(5)}{2+6} = \\frac{32}{8} = 4\\text{ m}$.', f: '$x_{\\text{cm}} = \\frac{\\sum m_i x_i}{\\sum m_i}$' },
        { topic: 'Moment of Inertia & Parallel/Perpendicular Axes', d: 'Easy', kind: 'Numerical', stem: 'A uniform solid sphere has mass $5\\text{ kg}$ and radius $0.5\\text{ m}$. Find its moment of inertia (in $\\text{kg}\\cdot\\text{m}^2$) about a diameter.', ans: '0.5', sol: '$I = \\frac{2}{5}MR^2 = \\frac{2}{5}(5)(0.25) = 0.5\\text{ kg}\\cdot\\text{m}^2$.', f: '$I_{\\text{sphere}} = \\frac{2}{5}MR^2$' },
        { topic: 'Moment of Inertia & Parallel/Perpendicular Axes', d: 'Easy', kind: 'MCQ', stem: 'What is the moment of inertia of a uniform thin circular disc of mass $M$ and radius $R$ about a tangent in its own plane?', ans: '$\\frac{5}{4}MR^2$', opts: ['$\\frac{3}{2}MR^2$', '$\\frac{1}{2}MR^2$', '$\\frac{3}{4}MR^2$'], sol: 'About diameter $I_d = \\frac{1}{4}MR^2$. By parallel axis theorem, $I_{\\text{tan}} = \\frac{1}{4}MR^2 + MR^2 = \\frac{5}{4}MR^2$.', f: '$I = I_{\\text{cm}} + Md^2$' },
        { topic: 'Torque & Angular Momentum Conservation', d: 'Easy', kind: 'Numerical', stem: 'A constant torque of $12\\text{ N}\\cdot\\text{m}$ accelerates a flywheel of moment of inertia $3\\text{ kg}\\cdot\\text{m}^2$ from rest. Find its angular speed (in rad/s) after $5\\text{ s}$.', ans: '20', sol: '$\\alpha = \\tau/I = 12/3 = 4\\text{ rad/s}^2$. $\\omega = \\alpha t = 20\\text{ rad/s}$.', f: '$\\tau = I\\alpha$' },
        { topic: 'Rolling Motion without Slipping', d: 'Easy', kind: 'Numerical', stem: 'A solid cylinder of mass $4\\text{ kg}$ rolls without slipping at CM speed $5\\text{ m/s}$. Calculate its total kinetic energy (in Joules).', ans: '75', sol: '$K = \\frac{1}{2}mv^2\\left(1 + \\frac{1}{2}\\right) = \\frac{3}{4}(4)(25) = 75\\text{ J}$.', f: '$K = \\frac{1}{2}mv^2(1 + I/(mR^2))$' },
        { topic: 'Torque & Angular Momentum Conservation', d: 'Easy', kind: 'Numerical', stem: 'A disc spinning at $12\\text{ rad/s}$ ($I_1 = 4\\text{ kg}\\cdot\\text{m}^2$) drops gently onto a stationary coaxial disc of $I_2 = 2\\text{ kg}\\cdot\\text{m}^2$. Find their common angular speed (in rad/s).', ans: '8', sol: 'Conservation of $L$: $I_1\\omega_1 = (I_1+I_2)\\omega \\implies 4(12) = 6\\omega \\implies \\omega = 8\\text{ rad/s}$.', f: '$I_1\\omega_1 = (I_1+I_2)\\omega$' },
        { topic: 'Moment of Inertia & Parallel/Perpendicular Axes', d: 'Medium', kind: 'MCQ', stem: 'What is the ratio of the radius of gyration of a uniform solid sphere to that of a thin spherical shell of the same radius about their diameters?', ans: '$\\sqrt{\\frac{3}{5}}$', opts: ['$\\frac{3}{5}$', '$\\sqrt{\\frac{2}{5}}$', '$\\sqrt{\\frac{5}{3}}$'], sol: '$k_{\\text{solid}} = \\sqrt{2/5}R$, $k_{\\text{shell}} = \\sqrt{2/3}R$. Ratio $= \\sqrt{(2/5)/(2/3)} = \\sqrt{3/5}$.', f: '$k = \\sqrt{I/M}$' },
        { topic: 'Rolling Motion without Slipping', d: 'Medium', kind: 'MCQ', stem: 'A solid sphere rolls without slipping down a $30^\\circ$ incline ($g = 10\\text{ m/s}^2$). What is its linear acceleration down the incline?', ans: '$\\frac{25}{7}\\text{ m/s}^2$', opts: ['$5\\text{ m/s}^2$', '$\\frac{10}{3}\\text{ m/s}^2$', '$\\frac{50}{7}\\text{ m/s}^2$'], sol: '$a = \\frac{g\\sin\\theta}{1 + I/(mR^2)} = \\frac{10(0.5)}{1 + 2/5} = \\frac{5}{7/5} = \\frac{25}{7}\\text{ m/s}^2$.', f: '$a = \\frac{g\\sin\\theta}{1 + k^2/R^2}$' },
        { topic: 'Torque & Angular Momentum Conservation', d: 'Medium', kind: 'Numerical', stem: 'Force $\\vec{F} = (2\\hat{i} + 3\\hat{j})\\text{ N}$ acts at $\\vec{r} = (4\\hat{i} - \\hat{j})\\text{ m}$. Find the $z$-component of torque $\\tau_z$ (in $\\text{N}\\cdot\\text{m}$) about the origin.', ans: '14', sol: '$\\tau_z = x F_y - y F_x = 4(3) - (-1)(2) = 12 + 2 = 14\\text{ N}\\cdot\\text{m}$.', f: '$\\vec{\\tau} = \\vec{r}\\times\\vec{F}$' },
        { topic: 'Moment of Inertia & Parallel/Perpendicular Axes', d: 'Medium', kind: 'Numerical', stem: 'A uniform rod of mass $6\\text{ kg}$ and length $2\\text{ m}$ rotates about an axis perpendicular to it at distance $0.5\\text{ m}$ from its centre. Find $I$ (in $\\text{kg}\\cdot\\text{m}^2$).', ans: '3.5', sol: '$I = \\frac{ML^2}{12} + Md^2 = \\frac{6(4)}{12} + 6(0.25) = 2 + 1.5 = 3.5\\text{ kg}\\cdot\\text{m}^2$.', f: '$I = \\frac{ML^2}{12} + Md^2$' },
        { topic: 'Rolling Motion without Slipping', d: 'Medium', kind: 'Numerical', stem: 'A solid cylinder rolls without slipping up an incline of vertical height $h$ starting with speed $6\\text{ m/s}$ ($g = 10\\text{ m/s}^2$). Find the maximum height $h$ (in meters) reached.', ans: '2.7', sol: '$\\frac{3}{4}mv^2 = mgh \\implies h = \\frac{3v^2}{4g} = \\frac{3(36)}{40} = 2.7\\text{ m}$.', f: '$\\frac{1}{2}mv^2(1+k^2/R^2) = mgh$' },
        { topic: 'Torque & Angular Momentum Conservation', d: 'Medium', kind: 'Numerical', stem: 'A $2\\text{ kg}$ particle moves along the line $y = 4\\text{ m}$ with constant velocity $5\\hat{i}\\text{ m/s}$. What is the magnitude of its angular momentum (in $\\text{kg}\\cdot\\text{m}^2/\\text{s}$) about the origin?', ans: '40', sol: '$L = mvr_\\perp = 2(5)(4) = 40\\text{ kg}\\cdot\\text{m}^2/\\text{s}$.', f: '$L = mvr_\\perp$' },
        { topic: 'Centre of Mass', d: 'Medium', kind: 'Numerical', stem: 'From a uniform circular disc of radius $4\\text{ cm}$, a smaller circular hole of radius $2\\text{ cm}$ touching the rim is cut out. Find the shift (in cm) of the CM from the original centre.', ans: '0.67', sol: 'Shift $d = \\frac{A_2 r_2}{A_1 - A_2} = \\frac{(2^2)(2)}{4^2 - 2^2} = \\frac{8}{12} = 0.67\\text{ cm}$.', f: '$x_{\\text{cm}} = -\\frac{M_{\\text{cut}}x_{\\text{cut}}}{M_{\\text{rem}}}$' },
        { topic: 'Rolling Motion without Slipping', d: 'Medium', kind: 'Numerical', stem: 'What fraction (in percent) of total kinetic energy is rotational for a thin ring rolling without slipping?', ans: '50', sol: 'For a ring $I = MR^2$, $K_{\\text{rot}} = \\frac{1}{2}I\\omega^2 = \\frac{1}{2}Mv^2 = K_{\\text{trans}}$, so rotational share is $50\\%$.', f: '$\\frac{K_{\\text{rot}}}{K_{\\text{tot}}} = \\frac{k^2/R^2}{1+k^2/R^2}$' },
        { topic: 'Moment of Inertia & Parallel/Perpendicular Axes', d: 'Hard', kind: 'MCQ', stem: 'Four point masses $m$ each sit at the vertices of a square of side $a$. Find the moment of inertia about an axis in the plane of the square passing through one diagonal.', ans: '$ma^2$', opts: ['$2ma^2$', '$\\frac{1}{2}ma^2$', '$4ma^2$'], sol: 'Two masses lie on the diagonal ($r=0$); the other two sit at perpendicular distance $a/\\sqrt{2}$. $I = 2m(a/\\sqrt{2})^2 = ma^2$.', f: '$I = \\sum m_i r_i^2$' },
        { topic: 'Torque & Angular Momentum Conservation', d: 'Hard', kind: 'MultiConcept', stem: 'A uniform rod of mass $3\\text{ kg}$ and length $2\\text{ m}$ hinged at one end is released from horizontal position ($g = 10\\text{ m/s}^2$). Find its angular speed (in rad/s) when vertical.', ans: '$\\sqrt{15}$', opts: ['$\\sqrt{10}$', '$\\sqrt{30}$', '$\\sqrt{5}$'], sol: '$Mg(L/2) = \\frac{1}{2}(\\frac{ML^2}{3})\\omega^2 \\implies \\omega = \\sqrt{\\frac{3g}{L}} = \\sqrt{\\frac{30}{2}} = \\sqrt{15}\\text{ rad/s}$.', f: '$Mg\\frac{L}{2} = \\frac{1}{6}ML^2\\omega^2$' },
        { topic: 'Rolling Motion without Slipping', d: 'Hard', kind: 'Numerical', stem: 'A solid sphere rolls without slipping down a $30^\\circ$ incline ($g = 10\\text{ m/s}^2$). What minimum static friction coefficient $\\mu_s$ prevents slipping? (Round to 2 decimals)', ans: '0.16', sol: '$\\mu_{\\min} = \\frac{\\tan\\theta}{1 + mR^2/I} = \\frac{\\tan 30^\\circ}{1 + 2.5} = \\frac{0.5774}{3.5} \\approx 0.165$ (or $0.16$).', f: '$\\mu_{\\min} = \\frac{\\tan\\theta}{1 + R^2/k^2}$' },
        { topic: 'Centre of Mass', d: 'Hard', kind: 'Numerical', stem: 'Two particles of masses $2\\text{ kg}$ and $3\\text{ kg}$ attract each other and move from rest. When the $2\\text{ kg}$ mass has moved $6\\text{ cm}$ toward the other, how far (in cm) has the $3\\text{ kg}$ mass moved?', ans: '4', sol: 'Internal forces do not move CM: $m_1\\Delta x_1 = m_2\\Delta x_2 \\implies 2(6) = 3(\\Delta x_2) \\implies \\Delta x_2 = 4\\text{ cm}$.', f: '$m_1\\Delta x_1 = m_2\\Delta x_2$' },
      ],
    },
    {
      unitCode: 'U06',
      chapter: 'Gravitation',
      items: [
        { topic: 'Universal Law & Variation of g', d: 'Easy', kind: 'Numerical', stem: 'At what altitude (in km) above Earth ($R = 6400\\text{ km}$) does acceleration due to gravity drop to $1/9$ of its surface value?', ans: '12800', sol: '$g\' = g\\left(\\frac{R}{R+h}\\right)^2 = \\frac{g}{9} \\implies R+h = 3R \\implies h = 2R = 12800\\text{ km}$.', f: '$g\' = g R^2/(R+h)^2$' },
        { topic: 'Universal Law & Variation of g', d: 'Easy', kind: 'Numerical', stem: 'At what depth (in km) below Earth surface ($R = 6400\\text{ km}$) does $g$ drop to $75\\%$ of its surface value?', ans: '1600', sol: '$g\' = g(1 - d/R) = 0.75g \\implies d = 0.25(6400) = 1600\\text{ km}$.', f: '$g\' = g(1 - d/R)$' },
        { topic: 'Escape & Orbital Velocity', d: 'Easy', kind: 'Numerical', stem: 'A planet has twice Earth mass and twice Earth radius. If Earth escape velocity is $11.2\\text{ km/s}$, find the planet escape velocity (in km/s).', ans: '11.2', sol: '$v_e = \\sqrt{2GM/R}$; doubling both $M$ and $R$ leaves $M/R$ unchanged, so $v_e = 11.2\\text{ km/s}$.', f: '$v_e = \\sqrt{2GM/R}$' },
        { topic: 'Kepler Laws', d: 'Easy', kind: 'Numerical', stem: 'A planet orbits a star at 4 times the orbital radius of an inner planet whose period is 1 year. Find the outer planet period (in years).', ans: '8', sol: '$T_2/T_1 = (r_2/r_1)^{3/2} = 4^{3/2} = 8\\text{ years}$.', f: '$T^2 \\propto r^3$' },
        { topic: 'Gravitational Potential & Energy', d: 'Easy', kind: 'MCQ', stem: 'The gravitational potential energy of a mass $m$ raised from Earth surface to height $h = R$ increases by:', ans: '$\\frac{1}{2}mgR$', opts: ['$mgR$', '$\\frac{1}{4}mgR$', '$2mgR$'], sol: '$\\Delta U = \\frac{mgh}{1 + h/R} = \\frac{mgR}{2}$.', f: '$\\Delta U = \\frac{mgh}{1+h/R}$' },
        { topic: 'Escape & Orbital Velocity', d: 'Easy', kind: 'MCQ', stem: 'What is the ratio of escape velocity from Earth surface to orbital velocity of a satellite skimming just above the surface?', ans: '$\\sqrt{2}:1$', opts: ['$2:1$', '$1:\\sqrt{2}$', '$1:2$'], sol: '$v_e = \\sqrt{2GM/R}$ and $v_o = \\sqrt{GM/R}$, giving ratio $\\sqrt{2}:1$.', f: '$v_e = \\sqrt{2}v_o$' },
        { topic: 'Gravitational Potential & Energy', d: 'Medium', kind: 'Numerical', stem: 'Three equal $2\\text{ kg}$ masses are placed at the corners of an equilateral triangle of side $1\\text{ m}$. Express total gravitational potential energy in multiples of $-G$ (SI units).', ans: '12', sol: '$U = -3\\frac{Gm^2}{a} = -3G(4)/1 = -12G$. Magnitude in units of $G$ is $12$.', f: '$U = -\\sum Gm_i m_j/r_{ij}$' },
        { topic: 'Escape & Orbital Velocity', d: 'Medium', kind: 'Numerical', stem: 'A satellite orbits Earth in a circular path with kinetic energy $400\\text{ MJ}$. Find its binding energy (in MJ).', ans: '400', sol: 'In a circular orbit, $E = -K$, so binding energy $|E| = K = 400\\text{ MJ}$.', f: '$E_{\\text{bind}} = K = -E_{\\text{tot}}$' },
        { topic: 'Universal Law & Variation of g', d: 'Medium', kind: 'Numerical', stem: 'Planet X has mean density equal to Earth and radius $3$ times Earth radius. Find the ratio $g_X / g_{\\text{Earth}}$.', ans: '3', sol: '$g = \\frac{4}{3}\\pi G\\rho R \\implies g \\propto \\rho R$, so ratio is $3$.', f: '$g = \\frac{4}{3}\\pi G\\rho R$' },
        { topic: 'Gravitational Potential & Energy', d: 'Medium', kind: 'Numerical', stem: 'A rocket is fired vertically from Earth surface at half the escape speed ($v_e/2$). Express the maximum height reached as a fraction of $R$ ($h = kR$); find $k$ to 2 decimals.', ans: '0.33', sol: '$\\frac{1}{2}m\\left(\\frac{GM}{2R}\\right) = \\frac{GMm}{R} - \\frac{GMm}{R+h} \\implies \\frac{1}{R+h} = \\frac{3}{4R} \\implies h = R/3 \\approx 0.33R$.', f: 'Energy conservation in $1/r$ field' },
        { topic: 'Kepler Laws', d: 'Medium', kind: 'Numerical', stem: 'At perihelion $r_p = 2\\text{ AU}$, a comet moves at $30\\text{ km/s}$. Find its speed (in km/s) at aphelion $r_a = 6\\text{ AU}$.', ans: '10', sol: 'Angular momentum conservation: $v_p r_p = v_a r_a \\implies 30(2) = v_a(6) \\implies v_a = 10\\text{ km/s}$.', f: '$r_p v_p = r_a v_a$' },
        { topic: 'Gravitational Potential & Energy', d: 'Medium', kind: 'MCQ', stem: 'Inside a uniform solid sphere of mass $M$ and radius $R$, the gravitational potential at its very centre compared to its surface is:', ans: '$1.5$ times the surface potential', opts: ['Equal to the surface potential', 'Zero', '$0.5$ times the surface potential'], sol: '$V_{\\text{centre}} = -\\frac{3GM}{2R} = 1.5 V_{\\text{surface}}$.', f: '$V(0) = -\\frac{3GM}{2R}$' },
        { topic: 'Escape & Orbital Velocity', d: 'Medium', kind: 'Numerical', stem: 'An object is projected at $2v_e$ from Earth surface where $v_e = 11.2\\text{ km/s}$. Find its speed at infinity as a multiple of $11.2\\text{ km/s}$ (to 2 decimals).', ans: '1.73', sol: '$v_\\infty = \\sqrt{v_0^2 - v_e^2} = \\sqrt{4v_e^2 - v_e^2} = \\sqrt{3}v_e \\approx 1.73 v_e$.', f: '$v_\\infty = \\sqrt{v_0^2 - v_e^2}$' },
        { topic: 'Universal Law & Variation of g', d: 'Medium', kind: 'Numerical', stem: 'Two spheres of masses $9\\text{ kg}$ and $16\\text{ kg}$ have centres $14\\text{ m}$ apart. At what distance (in meters) from the $9\\text{ kg}$ sphere is the net gravitational field zero?', ans: '6', sol: '$\\frac{9}{x^2} = \\frac{16}{(14-x)^2} \\implies \\frac{3}{x} = \\frac{4}{14-x} \\implies 7x = 42 \\implies x = 6\\text{ m}$.', f: '$\\frac{M_1}{x^2} = \\frac{M_2}{(d-x)^2}$' },
        { topic: 'Escape & Orbital Velocity', d: 'Hard', kind: 'Numerical', stem: 'How much additional energy (in multiples of $GMm/(6R)$) is needed to shift a satellite of mass $m$ from a circular orbit of radius $2R$ to $3R$?', ans: '0.5', sol: '$\\Delta E = -\\frac{GMm}{6R} - \\left(-\\frac{GMm}{4R}\\right) = \\frac{GMm}{12R} = 0.5\\left(\\frac{GMm}{6R}\\right)$.', f: '$E = -GMm/(2r)$' },
        { topic: 'Kepler Laws', d: 'Hard', kind: 'Numerical', stem: 'If the Sun-Earth distance suddenly halved while the Sun mass stayed constant, how many days would a year have? (Take 1 year = 365 days, round to nearest integer)', ans: '129', sol: '$T_2 = T_1 (1/2)^{3/2} = 365 / (2\\sqrt{2}) \\approx 129\\text{ days}$.', f: '$T \\propto r^{3/2}$' },
        { topic: 'Gravitational Potential & Energy', d: 'Hard', kind: 'MultiConcept', stem: 'A particle is dropped into a smooth straight tunnel dug along a diameter of Earth ($R = 6400\\text{ km}, g = 10\\text{ m/s}^2$). What is its speed (in km/s) at the centre?', ans: '$8$', opts: ['$11.2$', '$4$', '$16$'], sol: 'Inside Earth $U(r) = \\frac{mg r^2}{2R} - \\frac{3mgR}{2}$. Energy conservation: $\\frac{1}{2}mv^2 = \\frac{1}{2}mgR \\implies v = \\sqrt{gR} = \\sqrt{10 \\times 6.4\\times 10^6} = 8000\\text{ m/s} = 8\\text{ km/s}$.', f: '$v_{\\text{centre}} = \\sqrt{gR}$' },
        { topic: 'Universal Law & Variation of g', d: 'Hard', kind: 'Numerical', stem: 'Two stars of masses $M$ and $4M$ separated by distance $d$ orbit their common CM. Find the ratio of kinetic energy of the lighter star to the heavier star.', ans: '4', sol: 'Both share the same $\\omega$ and $m_1 r_1 = m_2 r_2$. Since $K = \\frac{1}{2}m r^2\\omega^2 = \\frac{1}{2}(mr)r\\omega^2$, $K_1/K_2 = r_1/r_2 = m_2/m_1 = 4$.', f: '$K_1/K_2 = m_2/m_1$' },
      ],
    },
    {
      unitCode: 'U07',
      chapter: 'Properties of Solids and Liquids',
      items: [
        { topic: 'Elasticity & Young Modulus', d: 'Easy', kind: 'Numerical', stem: 'A steel wire ($Y = 2\\times 10^{11}\\text{ Pa}$) of length $2\\text{ m}$ and cross-section $1\\text{ mm}^2$ is stretched by $100\\text{ N}$. Find its elongation (in mm).', ans: '1', sol: '$\\Delta L = \\frac{FL}{AY} = \\frac{100\\times 2}{10^{-6}\\times 2\\times 10^{11}} = 10^{-3}\\text{ m} = 1\\text{ mm}$.', f: '$\\Delta L = FL/(AY)$' },
        { topic: 'Hydrostatic Pressure & Buoyancy', d: 'Easy', kind: 'Numerical', stem: 'A wooden block of density $700\\text{ kg/m}^3$ floats in water ($1000\\text{ kg/m}^3$). What percentage of its volume remains submerged?', ans: '70', sol: 'Fraction submerged $= \\rho_{\\text{body}}/\\rho_{\\text{water}} = 700/1000 = 70\\%$.', f: '$V_{\\text{sub}}/V = \\rho_s/\\rho_l$' },
        { topic: 'Surface Tension & Capillarity', d: 'Easy', kind: 'Numerical', stem: 'Excess pressure inside a soap bubble of radius $R$ is $40\\text{ Pa}$. What is the excess pressure (in Pa) inside another soap bubble of radius $2R$ of the same solution?', ans: '20', sol: '$\\Delta P = 4T/R \\implies \\Delta P \\propto 1/R$, so doubling $R$ halves $\\Delta P$ to $20\\text{ Pa}$.', f: '$\\Delta P_{\\text{soap}} = 4T/R$' },
        { topic: 'Surface Tension & Capillarity', d: 'Easy', kind: 'Numerical', stem: 'Water rises to $6\\text{ cm}$ in a capillary tube of radius $r$. How high (in cm) will it rise in a tube of radius $r/2$?', ans: '12', sol: '$h = \\frac{2T\\cos\\theta}{\\rho g r} \\implies h \\propto 1/r$, so halving $r$ doubles $h$ to $12\\text{ cm}$.', f: '$h = 2T\\cos\\theta/(\\rho g r)$' },
        { topic: 'Bernoulli Theorem & Viscosity', d: 'Easy', kind: 'Numerical', stem: 'Water flows through a pipe narrowing from radius $4\\text{ cm}$ (speed $1.5\\text{ m/s}$) to radius $2\\text{ cm}$. Find the flow speed (in m/s) in the narrow section.', ans: '6', sol: 'Continuity: $A_1 v_1 = A_2 v_2 \\implies v_2 = v_1(r_1/r_2)^2 = 1.5(4) = 6\\text{ m/s}$.', f: '$A_1 v_1 = A_2 v_2$' },
        { topic: 'Elasticity & Young Modulus', d: 'Easy', kind: 'Numerical', stem: 'A metal wire stretched by stress $4\\times 10^7\\text{ Pa}$ develops a strain of $2\\times 10^{-4}$. Calculate the elastic energy density (in $\\text{J/m}^3$).', ans: '4000', sol: '$u = \\frac{1}{2}(\\text{stress})(\\text{strain}) = 0.5(4\\times 10^7)(2\\times 10^{-4}) = 4000\\text{ J/m}^3$.', f: '$u = \\frac{1}{2}\\sigma\\varepsilon$' },
        { topic: 'Bernoulli Theorem & Viscosity', d: 'Medium', kind: 'Numerical', stem: 'A tiny sphere falls with terminal velocity $4\\text{ cm/s}$ in glycerine. What is the terminal velocity (in cm/s) of a sphere of the same material with twice the radius?', ans: '16', sol: '$v_T \\propto r^2 \\implies v_T\' = 4 \\times 2^2 = 16\\text{ cm/s}$.', f: '$v_T = \\frac{2r^2(\\rho-\\sigma)g}{9\\eta}$' },
        { topic: 'Bernoulli Theorem & Viscosity', d: 'Medium', kind: 'Numerical', stem: 'A tank holds water up to $5\\text{ m}$ height. A small hole is punched $3.2\\text{ m}$ below the free surface ($g = 10\\text{ m/s}^2$). Find the speed of efflux (in m/s).', ans: '8', sol: 'Torricelli law: $v = \\sqrt{2gh} = \\sqrt{2(10)(3.2)} = \\sqrt{64} = 8\\text{ m/s}$.', f: '$v = \\sqrt{2gh}$' },
        { topic: 'Surface Tension & Capillarity', d: 'Medium', kind: 'Numerical', stem: 'Eight identical spherical droplets of mercury each of radius $1\\text{ mm}$ coalesce into one large drop. Find the radius (in mm) of the big drop.', ans: '2', sol: '$R = N^{1/3}r = 8^{1/3}(1) = 2\\text{ mm}$.', f: '$R = N^{1/3}r$' },
        { topic: 'Elasticity & Young Modulus', d: 'Medium', kind: 'Numerical', stem: 'A liquid of bulk modulus $2\\times 10^9\\text{ Pa}$ is compressed by pressure $4\\times 10^6\\text{ Pa}$. Find the percentage decrease in volume.', ans: '0.2', sol: '$\\frac{\\Delta V}{V} = \\frac{P}{B} = \\frac{4\\times 10^6}{2\\times 10^9} = 2\\times 10^{-3} = 0.2\\%$.', f: '$B = -\\Delta P/(\\Delta V/V)$' },
        { topic: 'Hydrostatic Pressure & Buoyancy', d: 'Medium', kind: 'Numerical', stem: 'A U-tube contains water ($1\\text{ g/cm}^3$) and an immiscible oil column of height $20\\text{ cm}$ balancing $16\\text{ cm}$ of water above the common interface. Find oil density (in $\\text{g/cm}^3$).', ans: '0.8', sol: '$\\rho_{\\text{oil}} h_{\\text{oil}} = \\rho_w h_w \\implies \\rho_{\\text{oil}} = 16/20 = 0.8\\text{ g/cm}^3$.', f: '$\\rho_1 h_1 = \\rho_2 h_2$' },
        { topic: 'Bernoulli Theorem & Viscosity', d: 'Medium', kind: 'Numerical', stem: 'Horizontal wind blows at $40\\text{ m/s}$ over a flat roof of area $20\\text{ m}^2$ while air underneath is stagnant ($\\rho = 1.2\\text{ kg/m}^3$). Find the upward lift force (in kN).', ans: '19.2', sol: '$\\Delta P = \\frac{1}{2}\\rho v^2 = 0.5(1.2)(1600) = 960\\text{ Pa}$. Lift $= 960 \\times 20 = 19200\\text{ N} = 19.2\\text{ kN}$.', f: '$F = \\frac{1}{2}\\rho v^2 A$' },
        { topic: 'Surface Tension & Capillarity', d: 'Medium', kind: 'Numerical', stem: 'Two soap bubbles of radii $3\\text{ cm}$ and $4\\text{ cm}$ coalesce isothermally in vacuum. Find the radius (in cm) of the resulting single bubble.', ans: '5', sol: 'Surface area conservation: $R^2 = r_1^2 + r_2^2 = 3^2 + 4^2 = 25 \\implies R = 5\\text{ cm}$.', f: '$R = \\sqrt{r_1^2 + r_2^2}$' },
        { topic: 'Hydrostatic Pressure & Buoyancy', d: 'Medium', kind: 'Numerical', stem: 'A metal piece weighs $50\\text{ N}$ in air and $40\\text{ N}$ when fully immersed in water ($1000\\text{ kg/m}^3, g=10$). Find the metal density (in $\\text{g/cm}^3$).', ans: '5', sol: 'Specific gravity $= \\frac{W_{\\text{air}}}{W_{\\text{air}} - W_{\\text{water}}} = \\frac{50}{10} = 5$, so $\\rho = 5\\text{ g/cm}^3$.', f: '$\\rho/\\rho_w = W/(W - W\')$' },
        { topic: 'Elasticity & Young Modulus', d: 'Hard', kind: 'MultiConcept', stem: 'A rigid bar of weight $W$ is supported symmetrically by three vertical wires: two outer copper wires and one central steel wire ($Y_s = 2Y_c$), all of equal length and area. What fraction of load $W$ is carried by the steel wire?', ans: '$\\frac{1}{2}$', opts: ['$\\frac{1}{3}$', '$\\frac{2}{3}$', '$\\frac{1}{4}$'], sol: 'Equal extension gives $T_s/Y_s = T_c/Y_c \\implies T_s = 2T_c$. Total $T_s + 2T_c = 2T_s = W \\implies T_s = W/2$.', f: '$T \\propto Y$' },
        { topic: 'Surface Tension & Capillarity', d: 'Hard', kind: 'Numerical', stem: 'A spherical drop of water of radius $1\\text{ mm}$ breaks into $1000$ identical droplets ($T = 0.07\\text{ N/m}$). Calculate the work done (in $\\mu\\text{J}$, take $\\pi = 22/7$).', ans: '7.92', sol: '$\\Delta A = 4\\pi R^2(N^{1/3} - 1) = 4(22/7)(10^{-6})(9) \\approx 113.14\\times 10^{-6}\\text{ m}^2$. $W = T\\Delta A = 0.07 \\times 4 \\times \\frac{22}{7} \\times 9\\times 10^{-6} = 7.92\\times 10^{-6}\\text{ J}$.', f: '$W = 4\\pi R^2 T(N^{1/3}-1)$' },
        { topic: 'Bernoulli Theorem & Viscosity', d: 'Hard', kind: 'Numerical', stem: 'A rectangular tank of height $10\\text{ m}$ is full of water. Where should a small hole be drilled below the top surface (in meters) to maximize the horizontal range on the floor?', ans: '5', sol: 'Range $R = 2\\sqrt{h(H-h)}$ is maximized at $h = H/2 = 5\\text{ m}$.', f: '$R = 2\\sqrt{h(H-h)}$' },
        { topic: 'Elasticity & Young Modulus', d: 'Hard', kind: 'Numerical', stem: 'A steel rod ($\\alpha = 1.2\\times 10^{-5}\\text{ K}^{-1}, Y = 2\\times 10^{11}\\text{ Pa}$) is clamped rigidly at both ends and heated by $50\\text{ K}$. Find the thermal compressive stress developed (in MPa).', ans: '120', sol: '$\\sigma = Y\\alpha\\Delta T = 2\\times 10^{11} \\times 1.2\\times 10^{-5} \\times 50 = 1.2\\times 10^8\\text{ Pa} = 120\\text{ MPa}$.', f: '$\\sigma = Y\\alpha\\Delta T$' },
      ],
    },
    {
      unitCode: 'U08',
      chapter: 'Thermodynamics',
      items: [
        { topic: 'First Law & Thermodynamic Processes', d: 'Easy', kind: 'Numerical', stem: 'A system absorbs $500\\text{ J}$ of heat while doing $180\\text{ J}$ of external work. Find the change in its internal energy $\\Delta U$ (in J).', ans: '320', sol: '$\\Delta U = Q - W = 500 - 180 = 320\\text{ J}$.', f: '$\\Delta Q = \\Delta U + \\Delta W$' },
        { topic: 'Carnot Engine & Efficiency', d: 'Easy', kind: 'Numerical', stem: 'A Carnot engine operates between $600\\text{ K}$ and $300\\text{ K}$. What is its percentage thermal efficiency?', ans: '50', sol: '$\\eta = 1 - T_C/T_H = 1 - 300/600 = 0.50 = 50\\%$.', f: '$\\eta = 1 - T_C/T_H$' },
        { topic: 'Work & Heat in PV Cycles', d: 'Easy', kind: 'Numerical', stem: 'An ideal gas expands isobarically at $2\\times 10^5\\text{ Pa}$ from $0.02\\text{ m}^3$ to $0.05\\text{ m}^3$. Find the work done (in kJ).', ans: '6', sol: '$W = P\\Delta V = 2\\times 10^5(0.03) = 6000\\text{ J} = 6\\text{ kJ}$.', f: '$W = P\\Delta V$' },
        { topic: 'Calorimetry & Thermal Expansion', d: 'Easy', kind: 'Numerical', stem: 'How much heat (in kcal) is required to melt $500\\text{ g}$ of ice at $0^\\circ\\text{C}$ and warm the water to $20^\\circ\\text{C}$? ($L_f = 80\\text{ cal/g}, c_w = 1\\text{ cal/g}^\\circ\\text{C}$)', ans: '50', sol: '$Q = mL_f + mc\\Delta T = 500(80) + 500(1)(20) = 40000 + 10000 = 50000\\text{ cal} = 50\\text{ kcal}$.', f: '$Q = mL + mc\\Delta T$' },
        { topic: 'First Law & Thermodynamic Processes', d: 'Easy', kind: 'MCQ', stem: 'During a free expansion of an ideal gas into vacuum inside an insulated rigid vessel, which quantity remains zero throughout?', ans: 'Heat transfer, work done, and $\\Delta U$', opts: ['Only work done', 'Only heat transfer', 'Only entropy change'], sol: 'Insulated ($Q=0$), vacuum expansion ($W=0$), so $\\Delta U = 0$ and temperature stays constant.', f: '$Q=W=\\Delta U=0$' },
        { topic: 'Calorimetry & Thermal Expansion', d: 'Easy', kind: 'Numerical', stem: 'A circular hole in a brass plate has area $40\\text{ cm}^2$ at $20^\\circ\\text{C}$. If $\\alpha = 2\\times 10^{-5}\\text{ K}^{-1}$, find the area increase (in $\\text{mm}^2$) when heated to $120^\\circ\\text{C}$.', ans: '16', sol: '$\\Delta A = A(2\\alpha)\\Delta T = 4000\\text{ mm}^2 (4\\times 10^{-5})(100) = 16\\text{ mm}^2$.', f: '$\\Delta A = 2\\alpha A\\Delta T$' },
        { topic: 'Work & Heat in PV Cycles', d: 'Medium', kind: 'Numerical', stem: 'For a monatomic ideal gas ($\\gamma = 5/3$) expanding at constant pressure, what percentage of heat supplied goes into external work?', ans: '40', sol: '$\\frac{W}{Q_P} = \\frac{nR\\Delta T}{nC_P\\Delta T} = \\frac{R}{5R/2} = \\frac{2}{5} = 40\\%$.', f: '$W/Q_P = 1 - 1/\\gamma$' },
        { topic: 'Carnot Engine & Efficiency', d: 'Medium', kind: 'Numerical', stem: 'A Carnot refrigerator extracts heat at $-23^\\circ\\text{C}$ and rejects it at $27^\\circ\\text{C}$. Calculate its coefficient of performance (COP).', ans: '5', sol: '$T_C = 250\\text{ K}, T_H = 300\\text{ K}$. $\\text{COP} = \\frac{T_C}{T_H - T_C} = \\frac{250}{50} = 5$.', f: '$\\beta = T_C/(T_H - T_C)$' },
        { topic: 'First Law & Thermodynamic Processes', d: 'Medium', kind: 'Numerical', stem: 'One mole of a diatomic ideal gas ($\\gamma = 7/5$) at $300\\text{ K}$ is compressed adiabatically to $1/32$ of its initial volume. Find its final temperature (in Kelvin).', ans: '1200', sol: '$T_2 = T_1 (V_1/V_2)^{\\gamma-1} = 300 (32)^{2/5} = 300 \\times 4 = 1200\\text{ K}$.', f: '$T V^{\\gamma-1} = \\text{const}$' },
        { topic: 'Work & Heat in PV Cycles', d: 'Medium', kind: 'Numerical', stem: 'An ideal gas undergoes a rectangular clockwise cycle on a $P$-$V$ diagram with vertices $(2\\text{ atm}, 2\\text{ L})$ and $(6\\text{ atm}, 5\\text{ L})$. Find the net work done (in L$\\cdot$atm).', ans: '12', sol: 'Area of rectangle $= \\Delta P \\cdot \\Delta V = (6-2)(5-2) = 12\\text{ L}\\cdot\\text{atm}$.', f: '$W_{\\text{cycle}} = \\oint P\\,dV$' },
        { topic: 'Calorimetry & Thermal Expansion', d: 'Medium', kind: 'Numerical', stem: '$200\\text{ g}$ of water at $80^\\circ\\text{C}$ is mixed with $300\\text{ g}$ of water at $30^\\circ\\text{C}$ in an insulated calorimeter. Find the equilibrium temperature (in $^\\circ\\text{C}$).', ans: '50', sol: '$T = \\frac{200(80) + 300(30)}{500} = \\frac{25000}{500} = 50^\\circ\\text{C}$.', f: '$T_{\\text{eq}} = \\frac{m_1 T_1 + m_2 T_2}{m_1+m_2}$' },
        { topic: 'First Law & Thermodynamic Processes', d: 'Medium', kind: 'Numerical', stem: 'Two moles of helium ($C_V = 1.5R$) are heated at constant volume from $300\\text{ K}$ to $500\\text{ K}$. Express the internal energy rise in terms of $R$ (numeric coefficient).', ans: '600', sol: '$\\Delta U = n C_V \\Delta T = 2(1.5R)(200) = 600R$.', f: '$\\Delta U = n C_V \\Delta T$' },
        { topic: 'Carnot Engine & Efficiency', d: 'Medium', kind: 'Numerical', stem: 'A heat engine with $30\\%$ efficiency delivers $1.2\\text{ kJ}$ of work per cycle. How much heat (in kJ) is rejected to the cold sink per cycle?', ans: '2.8', sol: '$Q_H = W/\\eta = 1.2/0.3 = 4.0\\text{ kJ}$, so $Q_C = Q_H - W = 2.8\\text{ kJ}$.', f: '$Q_C = Q_H(1 - \\eta)$' },
        { topic: 'Calorimetry & Thermal Expansion', d: 'Medium', kind: 'Numerical', stem: 'Two rods of equal dimensions with conductivities $60$ and $40\\text{ W/(m}\\cdot\\text{K)}$ are joined in series. Find the effective thermal conductivity.', ans: '48', sol: 'In series: $K_{\\text{eff}} = \\frac{2K_1 K_2}{K_1 + K_2} = \\frac{2(60)(40)}{100} = 48\\text{ W/(m}\\cdot\\text{K)}$.', f: '$K_s = 2K_1 K_2/(K_1+K_2)$' },
        { topic: 'First Law & Thermodynamic Processes', d: 'Hard', kind: 'Numerical', stem: 'An ideal gas obeys $P V^{1/2} = \\text{constant}$. What is the molar heat capacity of a monatomic gas ($C_V = 1.5R$) in this process, in units of $R$?', ans: '3.5', sol: 'Polytropic $PV^n = \\text{const}$ with $n = 0.5$: $C = C_V + \\frac{R}{1-n} = 1.5R + \\frac{R}{0.5} = 3.5R$.', f: '$C = C_V + \\frac{R}{1-n}$' },
        { topic: 'Work & Heat in PV Cycles', d: 'Hard', kind: 'MultiConcept', stem: 'One mole of ideal gas expands isothermally at $400\\text{ K}$ from volume $V$ to $e^2 V$. What is the work done by the gas?', ans: '$800R$', opts: ['$400R$', '$200R$', '$1600R$'], sol: '$W = nRT\\ln(V_2/V_1) = 1\\cdot R(400)\\ln(e^2) = 800R$.', f: '$W = nRT\\ln(V_2/V_1)$' },
        { topic: 'Carnot Engine & Efficiency', d: 'Hard', kind: 'Numerical', stem: 'A Carnot engine has efficiency $25\\%$. Keeping source temperature fixed, reducing sink temperature by $60\\text{ K}$ raises efficiency to $40\\%$. Find the source temperature (in K).', ans: '400', sol: '$\\eta_1 = 1 - T_C/T_H = 0.25$; $\\eta_2 = 1 - (T_C - 60)/T_H = 0.40$. Subtracting gives $60/T_H = 0.15 \\implies T_H = 400\\text{ K}$.', f: '$\\Delta\\eta = -\\Delta T_C/T_H$' },
        { topic: 'Calorimetry & Thermal Expansion', d: 'Hard', kind: 'Numerical', stem: 'A body cools from $70^\\circ\\text{C}$ to $50^\\circ\\text{C}$ in $5\\text{ min}$ when ambient temperature is $30^\\circ\\text{C}$. Using Newton cooling approximation, find its temperature (in $^\\circ\\text{C}$) after the next $5\\text{ min}$.', ans: '38', sol: '$\\frac{70-50}{5} = k(60 - 30) \\implies k = 2/15$. Next 5 min: $\\frac{50-T}{5} = \\frac{2}{15}(\\frac{50+T}{2} - 30) \\implies 3(50-T) = T - 10 \\implies 4T = 160$? Wait: $(50+T)/2 - 30 = (T-10)/2$, so $3(50-T) = 5(2/15)\\cdot\\dots$ wait: $\\frac{50-T}{5} = \\frac{2}{15}(\\frac{T-10}{2}) \\implies 3(50-T) = T - 10 \\implies 4T = 160 \\implies T = 40^\\circ\\text{C}$!', f: '$\\frac{T_1-T_2}{t} = k(\\frac{T_1+T_2}{2}-T_0)$' },
      ],
    },
    {
      unitCode: 'U09',
      chapter: 'Kinetic Theory of Gases',
      items: [
        { topic: 'RMS, Average & Most Probable Speed', d: 'Easy', kind: 'Numerical', stem: 'At what Kelvin temperature is the RMS speed of oxygen molecules equal to twice their RMS speed at $27^\\circ\\text{C}$?', ans: '1200', sol: '$v_{\\text{rms}} \\propto \\sqrt{T}$; doubling speed requires $T_2 = 4T_1 = 4(300) = 1200\\text{ K}$.', f: '$v_{\\text{rms}} = \\sqrt{3RT/M}$' },
        { topic: 'Degrees of Freedom & Equipartition', d: 'Easy', kind: 'Numerical', stem: 'Find the total internal energy (in terms of $RT$, numeric coefficient) of 2 moles of a rigid diatomic gas at temperature $T$ (neglecting vibration).', ans: '5', sol: 'Rigid diatomic gas has $f=5$, so $U = \\frac{f}{2}nRT = \\frac{5}{2}(2)RT = 5RT$.', f: '$U = \\frac{f}{2}nRT$' },
        { topic: 'Ideal Gas Equation & Pressure', d: 'Easy', kind: 'Numerical', stem: 'An ideal gas at $27^\\circ\\text{C}$ and $2\\text{ atm}$ in a rigid vessel is heated to $177^\\circ\\text{C}$. Find the new pressure (in atm).', ans: '3', sol: '$P_2 = P_1(T_2/T_1) = 2(450/300) = 3\\text{ atm}$.', f: '$P \\propto T$ (constant $V$)' },
        { topic: 'RMS, Average & Most Probable Speed', d: 'Easy', kind: 'MCQ', stem: 'For an ideal gas at fixed temperature, which speed ordering holds strictly?', ans: '$v_{\\text{rms}} > v_{\\text{avg}} > v_{\\text{mp}}$', opts: ['$v_{\\text{mp}} > v_{\\text{avg}} > v_{\\text{rms}}$', '$v_{\\text{avg}} > v_{\\text{rms}} > v_{\\text{mp}}$', '$v_{\\text{rms}} > v_{\\text{mp}} > v_{\\text{avg}}$'], sol: 'Speeds scale as $\\sqrt{3} : \\sqrt{8/\\pi} : \\sqrt{2} \\approx 1.732 : 1.596 : 1.414$.', f: '$v_{\\text{rms}} : v_{\\text{avg}} : v_{\\text{mp}} = \\sqrt{3}:\\sqrt{8/\\pi}:\\sqrt{2}$' },
        { topic: 'Degrees of Freedom & Equipartition', d: 'Easy', kind: 'Numerical', stem: 'What is the adiabatic exponent $\\gamma = C_P/C_V$ for a rigid non-linear polyatomic ideal gas ($f = 6$)? (to 2 decimals)', ans: '1.33', sol: '$\\gamma = 1 + 2/f = 1 + 2/6 = 4/3 \\approx 1.33$.', f: '$\\gamma = 1 + 2/f$' },
        { topic: 'Ideal Gas Equation & Pressure', d: 'Easy', kind: 'Numerical', stem: 'Calculate the translational kinetic energy (in J) of an ideal gas inside a $0.04\\text{ m}^3$ container at pressure $1.5\\times 10^5\\text{ Pa}$.', ans: '9000', sol: '$K_{\\text{trans}} = \\frac{3}{2}PV = 1.5(1.5\\times 10^5)(0.04) = 9000\\text{ J}$.', f: '$K_{\\text{trans}} = \\frac{3}{2}PV$' },
        { topic: 'RMS, Average & Most Probable Speed', d: 'Medium', kind: 'Numerical', stem: 'At what temperature (in K) will the RMS speed of $\\text{H}_2$ ($M = 2$) equal the RMS speed of $\\text{O}_2$ ($M = 32$) at $480\\text{ K}$?', ans: '30', sol: '$T_1/M_1 = T_2/M_2 \\implies T_{\\text{H}_2} = 480 \\times (2/32) = 30\\text{ K}$.', f: '$v_{\\text{rms}} = \\sqrt{3RT/M}$' },
        { topic: 'Degrees of Freedom & Equipartition', d: 'Medium', kind: 'Numerical', stem: 'One mole of monatomic gas ($\\gamma = 5/3$) is mixed with one mole of diatomic gas ($\\gamma = 7/5$). Find $C_V$ of the mixture in units of $R$.', ans: '2', sol: '$C_{V,\\text{mix}} = \\frac{1(1.5R) + 1(2.5R)}{2} = 2R$.', f: '$C_{V,\\text{mix}} = \\frac{n_1 C_{V1} + n_2 C_{V2}}{n_1+n_2}$' },
        { topic: 'Mean Free Path', d: 'Medium', kind: 'MCQ', stem: 'When an ideal gas is compressed isothermally to half its initial volume, its mean free path $\\lambda$:', ans: 'Halves', opts: ['Doubles', 'Remains unchanged', 'Becomes one-fourth'], sol: '$\\lambda = \\frac{1}{\\sqrt{2}\\pi d^2 n}$ where $n = N/V$. Halving $V$ doubles $n$ and halves $\\lambda$.', f: '$\\lambda = 1/(\\sqrt{2}\\pi d^2 n)$' },
        { topic: 'Ideal Gas Equation & Pressure', d: 'Medium', kind: 'Numerical', stem: 'Two vessels of equal volume containing ideal gas at $(200\\text{ K}, 2\\text{ atm})$ and $(400\\text{ K}, 4\\text{ atm})$ are connected and held at $300\\text{ K}$. Find the common equilibrium pressure (in atm).', ans: '3', sol: '$\\frac{P_f (2V)}{300} = \\frac{2V}{200} + \\frac{4V}{400} = 0.02V \\implies P_f = 3\\text{ atm}$.', f: '$\\sum P_i V_i / T_i = \\text{const}$' },
        { topic: 'RMS, Average & Most Probable Speed', d: 'Medium', kind: 'Numerical', stem: 'Find the RMS speed (in m/s) of a sample of three gas molecules moving with speeds $1\\text{ m/s}$, $5\\text{ m/s}$, and $7\\text{ m/s}$.', ans: '5', sol: '$v_{\\text{rms}} = \\sqrt{\\frac{1^2 + 5^2 + 7^2}{3}} = \\sqrt{\\frac{75}{3}} = 5\\text{ m/s}$.', f: '$v_{\\text{rms}} = \\sqrt{\\langle v^2 \\rangle}$' },
        { topic: 'Mean Free Path', d: 'Medium', kind: 'Numerical', stem: 'At constant pressure, an ideal gas is heated from $300\\text{ K}$ to $900\\text{ K}$. By what factor does its mean free path increase?', ans: '3', sol: 'At constant pressure, $\\lambda = \\frac{k_B T}{\\sqrt{2}\\pi d^2 P} \\propto T$, so $\\lambda$ increases by factor $3$.', f: '$\\lambda \\propto T/P$' },
        { topic: 'Degrees of Freedom & Equipartition', d: 'Medium', kind: 'Numerical', stem: 'Determine the value of $\\gamma_{\\text{mix}}$ (to 2 decimals) for a mixture of 1 mole He ($C_V = 1.5R$) and 1 mole $\\text{N}_2$ ($C_V = 2.5R$).', ans: '1.5', sol: '$C_{V,\\text{mix}} = 2R, C_{P,\\text{mix}} = 3R \\implies \\gamma_{\\text{mix}} = 3/2 = 1.5$.', f: '$\\gamma_{\\text{mix}} = 1 + R/C_{V,\\text{mix}}$' },
        { topic: 'Ideal Gas Equation & Pressure', d: 'Medium', kind: 'Numerical', stem: 'An air bubble of volume $1.2\\text{ cm}^3$ rises from the bottom of a $40\\text{ m}$ deep lake ($P_{\\text{atm}} = 10\\text{ m}$ water) at constant temperature. Find its volume (in $\\text{cm}^3$) at the surface.', ans: '6', sol: '$P_1 V_1 = P_2 V_2 \\implies (10+40)(1.2) = 10 V_2 \\implies V_2 = 6\\text{ cm}^3$.', f: '$P_1 V_1 = P_2 V_2$' },
        { topic: 'RMS, Average & Most Probable Speed', d: 'Hard', kind: 'Numerical', stem: 'If the speed of sound in a diatomic gas ($\\gamma = 1.4$) is $350\\text{ m/s}$, find the ratio $v_{\\text{rms}} / v_{\\text{sound}}$ (to 2 decimals).', ans: '1.46', sol: '$\\frac{v_{\\text{rms}}}{v_{\\text{sound}}} = \\sqrt{\\frac{3}{\\gamma}} = \\sqrt{\\frac{3}{1.4}} = \\sqrt{2.1428} \\approx 1.46$.', f: '$v_{\\text{rms}}/v_s = \\sqrt{3/\\gamma}$' },
        { topic: 'Degrees of Freedom & Equipartition', d: 'Hard', kind: 'MultiConcept', stem: 'A rigid insulated box partitioned equally holds a monatomic gas at $300\\text{ K}$ on one side and $600\\text{ K}$ on the other at equal pressures. When the partition is removed, find the equilibrium temperature (in K).', ans: '$400$', opts: ['$450$', '$420$', '$360$'], sol: 'Mole numbers $n_1 = 2n_2$ since $P, V$ match and $T_1 = T_2/2$. Energy conservation: $T_f = \\frac{2(300) + 1(600)}{3} = 400\\text{ K}$.', f: '$n_1 T_1 + n_2 T_2 = (n_1+n_2)T_f$' },
        { topic: 'Ideal Gas Equation & Pressure', d: 'Hard', kind: 'Numerical', stem: 'Two bulbs of volumes $2\\text{ L}$ and $4\\text{ L}$ are connected by a narrow tube at $300\\text{ K}$ and $3\\text{ atm}$. If the $2\\text{ L}$ bulb is heated to $600\\text{ K}$ while the $4\\text{ L}$ bulb stays at $300\\text{ K}$, find the new pressure (in atm).', ans: '3.6', sol: 'Total moles conserved: $\\frac{3(6)}{300} = P\\left(\\frac{2}{600} + \\frac{4}{300}\\right) = P\\frac{10}{600} \\implies P = 3.6\\text{ atm}$.', f: '$\\sum n_i = \\text{const}$' },
        { topic: 'Mean Free Path', d: 'Hard', kind: 'Numerical', stem: 'Collision frequency of gas molecules in a rigid cylinder is $f_0$ at $300\\text{ K}$. Find the ratio $f/f_0$ when the rigid cylinder is heated to $1200\\text{ K}$.', ans: '2', sol: 'At constant volume, number density $n$ and $\\lambda$ are constant while $v_{\\text{avg}} \\propto \\sqrt{T}$. Thus $f = v_{\\text{avg}}/\\lambda \\propto \\sqrt{T}$, giving $\\sqrt{1200/300} = 2$.', f: '$f = v_{\\text{avg}}/\\lambda$' },
      ],
    },
    {
      unitCode: 'U10',
      chapter: 'Oscillations and Waves',
      items: [
        { topic: 'SHM Equations & Energy', d: 'Easy', kind: 'Numerical', stem: 'A particle executes SHM with amplitude $5\\text{ cm}$ and angular frequency $4\\text{ rad/s}$. Find its maximum speed (in cm/s).', ans: '20', sol: '$v_{\\max} = A\\omega = 5 \\times 4 = 20\\text{ cm/s}$.', f: '$v_{\\max} = A\\omega$' },
        { topic: 'Simple & Compound Pendulum', d: 'Easy', kind: 'Numerical', stem: 'A simple pendulum has period $2\\text{ s}$ on Earth. What is its period (in seconds) on a planet where $g\' = g/4$?', ans: '4', sol: '$T \\propto 1/\\sqrt{g} \\implies T\' = 2\\sqrt{4} = 4\\text{ s}$.', f: '$T = 2\\pi\\sqrt{L/g}$' },
        { topic: 'Standing Waves on Strings & Organ Pipes', d: 'Easy', kind: 'Numerical', stem: 'A $1\\text{ m}$ string under tension $100\\text{ N}$ has linear mass density $0.01\\text{ kg/m}$. Find its fundamental frequency (in Hz).', ans: '50', sol: '$v = \\sqrt{T/\\mu} = \\sqrt{100/0.01} = 100\\text{ m/s}$. $f_1 = v/(2L) = 100/2 = 50\\text{ Hz}$.', f: '$f_1 = \\frac{1}{2L}\\sqrt{T/\\mu}$' },
        { topic: 'Beats & Doppler Effect in Sound', d: 'Easy', kind: 'Numerical', stem: 'Two tuning forks of frequencies $256\\text{ Hz}$ and $260\\text{ Hz}$ sound together. How many beats are heard in $5$ seconds?', ans: '20', sol: 'Beat frequency $= |260 - 256| = 4\\text{ Hz}$. Total beats in $5\\text{ s} = 4 \\times 5 = 20$.', f: '$f_{\\text{beat}} = |f_1 - f_2|$' },
        { topic: 'SHM Equations & Energy', d: 'Easy', kind: 'Numerical', stem: 'A $2\\text{ kg}$ block attached to a spring ($k = 200\\text{ N/m}$) oscillates with amplitude $0.1\\text{ m}$. Find its total mechanical energy (in Joules).', ans: '1', sol: '$E = \\frac{1}{2}kA^2 = 0.5(200)(0.01) = 1\\text{ J}$.', f: '$E = \\frac{1}{2}kA^2$' },
        { topic: 'Standing Waves on Strings & Organ Pipes', d: 'Easy', kind: 'Numerical', stem: 'An open organ pipe has fundamental frequency $320\\text{ Hz}$. What is the fundamental frequency (in Hz) if one end is closed?', ans: '160', sol: 'Closed pipe fundamental $f_c = v/(4L) = f_{\\text{open}}/2 = 160\\text{ Hz}$.', f: '$f_{\\text{closed}} = v/(4L)$' },
        { topic: 'SHM Equations & Energy', d: 'Medium', kind: 'MCQ', stem: 'In SHM of amplitude $A$, at what displacement $x$ from the mean position is kinetic energy equal to three times potential energy?', ans: '$\\pm\\frac{A}{2}$', opts: ['$\\pm\\frac{A}{\\sqrt{2}}$', '$\\pm\\frac{\\sqrt{3}A}{2}$', '$\\pm\\frac{A}{4}$'], sol: '$U = E/4 \\implies \\frac{1}{2}kx^2 = \\frac{1}{4}(\\frac{1}{2}kA^2) \\implies x = \\pm A/2$.', f: '$K/U = (A^2-x^2)/x^2$' },
        { topic: 'Beats & Doppler Effect in Sound', d: 'Medium', kind: 'Numerical', stem: 'A train blows a $500\\text{ Hz}$ horn while approaching a stationary listener at $30\\text{ m/s}$ ($v_{\\text{sound}} = 330\\text{ m/s}$). Find the apparent frequency (in Hz) heard.', ans: '550', sol: '$f\' = f\\frac{v}{v - v_s} = 500\\frac{330}{300} = 550\\text{ Hz}$.', f: '$f\' = f\\frac{v}{v - v_s}$' },
        { topic: 'Standing Waves on Strings & Organ Pipes', d: 'Medium', kind: 'Numerical', stem: 'A progressive wave $y = 0.02\\sin(10\\pi t - 0.5\\pi x)$ (SI units) propagates along a string. Find its wave speed (in m/s).', ans: '20', sol: '$v = \\omega/k = 10\\pi / (0.5\\pi) = 20\\text{ m/s}$.', f: '$v = \\omega/k$' },
        { topic: 'SHM Equations & Energy', d: 'Medium', kind: 'Numerical', stem: 'Two springs ($k_1 = 300\\text{ N/m}, k_2 = 600\\text{ N/m}$) are connected in series to a $2\\text{ kg}$ block. Find the angular frequency $\\omega$ (in rad/s).', ans: '10', sol: '$k_{\\text{eq}} = \\frac{300\\times 600}{900} = 200\\text{ N/m}$. $\\omega = \\sqrt{k_{\\text{eq}}/m} = \\sqrt{200/2} = 10\\text{ rad/s}$.', f: '$k_{\\text{series}} = \\frac{k_1 k_2}{k_1+k_2}$' },
        { topic: 'Simple & Compound Pendulum', d: 'Medium', kind: 'Numerical', stem: 'A simple pendulum has period $T = 2\\text{ s}$ when at rest. Find its new period (in seconds) inside a rocket accelerating upward at $3g$.', ans: '1', sol: '$g_{\\text{eff}} = g + 3g = 4g$, so $T\' = T\\sqrt{g/g_{\\text{eff}}} = 2/2 = 1\\text{ s}$.', f: '$T\' = 2\\pi\\sqrt{L/(g+a)}$' },
        { topic: 'Beats & Doppler Effect in Sound', d: 'Medium', kind: 'Numerical', stem: 'Tuning fork A produces 5 beats/s with a $300\\text{ Hz}$ fork. Loading fork A slightly with wax reduces the beat rate to 2 beats/s. Find the original frequency (in Hz) of A.', ans: '305', sol: 'Original is $305$ or $295\\text{ Hz}$. Wax lowers frequency; since beat gap shrinks to 2, original must be $305\\text{ Hz}$ (drops to $302\\text{ Hz}$).', f: 'Wax loading decreases frequency' },
        { topic: 'Standing Waves on Strings & Organ Pipes', d: 'Medium', kind: 'Numerical', stem: 'Two coherent waves of intensities $I$ and $9I$ interfere. Find the ratio of maximum to minimum intensity $I_{\\max}/I_{\\min}$.', ans: '4', sol: '$\\frac{I_{\\max}}{I_{\\min}} = \\left(\\frac{\\sqrt{9}+1}{\\sqrt{9}-1}\\right)^2 = \\left(\\frac{4}{2}\\right)^2 = 4$.', f: '$\\frac{I_{\\max}}{I_{\\min}} = \\left(\\frac{\\sqrt{I_1}+\\sqrt{I_2}}{\\sqrt{I_1}-\\sqrt{I_2}}\\right)^2$' },
        { topic: 'SHM Equations & Energy', d: 'Medium', kind: 'Numerical', stem: 'A particle in SHM takes $0.5\\text{ s}$ to travel from the mean position $x=0$ to $x = A/2$. Find its time period (in seconds).', ans: '6', sol: '$x = A\\sin(\\omega t) = A/2 \\implies \\omega t = \\pi/6 \\implies t = T/12$. Thus $T = 12(0.5) = 6\\text{ s}$.', f: '$t_{0\\to A/2} = T/12$' },
        { topic: 'Standing Waves on Strings & Organ Pipes', d: 'Hard', kind: 'MultiConcept', stem: 'A $1.2\\text{ m}$ wire vibrates in 3 loops at $180\\text{ Hz}$. If tension is increased by a factor of $4$, what frequency excites 2 loops?', ans: '$240\\text{ Hz}$', opts: ['$120\\text{ Hz}$', '$360\\text{ Hz}$', '$180\\text{ Hz}$'], sol: 'Fundamental $f_1 = 180/3 = 60\\text{ Hz}$. Quadrupling $T$ doubles $f_1$ to $120\\text{ Hz}$. 2nd harmonic $= 2(120) = 240\\text{ Hz}$.', f: '$f_p = \\frac{p}{2L}\\sqrt{T/\\mu}$' },
        { topic: 'Beats & Doppler Effect in Sound', d: 'Hard', kind: 'Numerical', stem: 'A car moving toward a vertical cliff at $20\\text{ m/s}$ sounds a $310\\text{ Hz}$ horn ($v_{\\text{sound}} = 330\\text{ m/s}$). Find the reflected frequency (in Hz) heard by the driver.', ans: '350', sol: '$f\' = f\\frac{v + v_c}{v - v_c} = 310\\frac{350}{310} = 350\\text{ Hz}$.', f: '$f\' = f\\frac{v+v_c}{v-v_c}$' },
        { topic: 'Simple & Compound Pendulum', d: 'Hard', kind: 'Numerical', stem: 'A uniform rod of length $3\\text{ m}$ swings as a physical pendulum pivoted at one end ($g = 10\\text{ m/s}^2$). What is the length (in meters) of an equivalent simple pendulum?', ans: '2', sol: '$L_{\\text{eq}} = \\frac{I}{md} = \\frac{ML^2/3}{M(L/2)} = \\frac{2}{3}L = \\frac{2}{3}(3) = 2\\text{ m}$.', f: '$L_{\\text{eq}} = I/(md)$' },
        { topic: 'Beats & Doppler Effect in Sound', d: 'Hard', kind: 'Numerical', stem: 'A sound level increases from $40\\text{ dB}$ to $60\\text{ dB}$. By what factor did the sound intensity increase?', ans: '100', sol: '$\\Delta\\beta = 10\\log_{10}(I_2/I_1) = 20\\text{ dB} \\implies I_2/I_1 = 10^2 = 100$.', f: '$\\beta = 10\\log_{10}(I/I_0)$' },
      ],
    },
  ];

  // Clean up one typo in U08 #18 ("38" vs 40): let's fix ans to '40' directly
  for (const unit of units3To10) {
    unit.items.forEach((item, i) => {
      const fixedAns = unit.unitCode === 'U08' && i === 17 ? '40' : item.ans;
      const fixedSol =
        unit.unitCode === 'U08' && i === 17
          ? '$\\frac{70-50}{5} = k(60 - 30) \\implies k = \\frac{2}{15}$. Next 5 min: $\\frac{50-T}{5} = \\frac{2}{15}\\left(\\frac{50+T}{2} - 30\\right) \\implies 3(50-T) = T - 10 \\implies 4T = 160 \\implies T = 40^\\circ\\text{C}$.'
          : item.sol;
      specs.push({
        id: `PHY-EXP-${unit.unitCode}-${String(i + 1).padStart(2, '0')}`,
        chapter: unit.chapter,
        topic: item.topic,
        difficulty: item.d,
        kind: item.kind,
        stem: item.stem,
        correct: fixedAns,
        distractors: item.opts?.map((o) => ({
          option: o,
          explanation: 'Does not satisfy the conservation or physical boundary condition.',
        })),
        solution: fixedSol,
        concept: item.topic,
        formula: item.f,
        timeSec: item.d === 'Easy' ? 50 : item.d === 'Medium' ? 75 : 105,
      });
    });
  }

  return materialize(specs);
}
