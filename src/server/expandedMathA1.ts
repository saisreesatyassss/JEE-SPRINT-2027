import { buildMcq, buildNumerical } from './expandedHelpers.ts';
import type { CandidateQuestionInput } from './validationEngine.ts';

export interface MathSpec {
  topic: string;
  d: 'Easy' | 'Medium' | 'Hard';
  kind: 'MCQ' | 'Numerical' | 'MultiConcept';
  stem: string;
  ans: string;
  opts?: [string, string, string];
  sol: string;
  f: string;
}

export function materializeMathUnits(
  units: Array<{ code: string; chapter: string; items: MathSpec[] }>
): CandidateQuestionInput[] {
  const out: CandidateQuestionInput[] = [];
  for (const unit of units) {
    unit.items.forEach((s, idx) => {
      const id = `MTH-EXP-${unit.code}-${String(idx + 1).padStart(2, '0')}`;
      const timeSec = s.d === 'Easy' ? 55 : s.d === 'Medium' ? 85 : 120;
      if (s.kind === 'Numerical') {
        out.push(
          buildNumerical({
            externalId: id,
            subject: 'Mathematics',
            chapter: unit.chapter,
            topic: s.topic,
            difficulty: s.d,
            questionText: s.stem,
            correctValue: s.ans,
            solution: s.sol,
            conceptTested: s.topic,
            formulaUsed: s.f,
            estimatedTimeSeconds: timeSec,
          })
        );
      } else {
        out.push(
          buildMcq({
            externalId: id,
            subject: 'Mathematics',
            chapter: unit.chapter,
            topic: s.topic,
            difficulty: s.d,
            questionType: s.kind === 'MultiConcept' ? 'MultiConcept' : 'MCQ',
            questionText: s.stem,
            correctOption: s.ans,
            correctExplanation: s.sol,
            distractors: (s.opts ?? []).map((o) => ({
              option: o,
              explanation: 'Does not satisfy the algebraic, combinatorial, or calculus condition.',
            })),
            solution: s.sol,
            conceptTested: s.topic,
            formulaUsed: s.f,
            estimatedTimeSeconds: timeSec,
            rotateIndex: idx + unit.code.charCodeAt(2),
          })
        );
      }
    });
  }
  return out;
}

export function buildExpandedMathPartA1(): CandidateQuestionInput[] {
  const units: Array<{ code: string; chapter: string; items: MathSpec[] }> = [
    {
      code: 'U01',
      chapter: 'Sets, Relations and Functions',
      items: [
        { topic: 'Set Operations & Cardinality', d: 'Easy', kind: 'Numerical', stem: 'In a class of $60$ students, $35$ play cricket, $30$ play football, and $10$ play neither. How many students play both cricket and football?', ans: '15', sol: '$n(C \\cup F) = 60 - 10 = 50$. Using $n(C \\cup F) = n(C) + n(F) - n(C \\cap F)$, $50 = 35 + 30 - n(C \\cap F) \\implies n(C \\cap F) = 15$.', f: '$n(A \\cup B) = n(A) + n(B) - n(A \\cap B)$' },
        { topic: 'Domain, Range & Inverse Functions', d: 'Easy', kind: 'MCQ', stem: 'Find the domain of the real-valued function $f(x) = \\sqrt{9 - x^2} + \\frac{1}{\\ln(x - 1)}$.', ans: '$(1, 2) \\cup (2, 3]$', opts: ['$[1, 3]$', '$(1, 3]$', '$(2, 3]$'], sol: '$9 - x^2 \\ge 0 \\implies x \\in [-3, 3]$. Also $x - 1 > 0 \\implies x > 1$ and $\\ln(x - 1) \\neq 0 \\implies x \\neq 2$. Intersection gives $(1, 2) \\cup (2, 3]$.', f: '$\\sqrt{g(x)} \\implies g \\ge 0$; $\\ln h(x) \\implies h > 0$' },
        { topic: 'Equivalence Relations', d: 'Easy', kind: 'MCQ', stem: 'Let $R = \\{(a, b) \\in \\mathbb{Z}\\times\\mathbb{Z} : 5 \\text{ divides } (a - b)\\}$. The relation $R$ on $\\mathbb{Z}$ is:', ans: 'An equivalence relation (reflexive, symmetric, and transitive)', opts: ['Reflexive and symmetric only', 'Symmetric and transitive only', 'Antisymmetric and transitive'], sol: '$a-a=0$ is divisible by $5$; if $5|(a-b)$ then $5|(b-a)$; if $5|(a-b)$ and $5|(b-c)$, adding gives $5|(a-c)$.', f: 'Congruence modulo $m$ equivalence' },
        { topic: 'One-One, Onto & Composite Functions', d: 'Easy', kind: 'Numerical', stem: 'Let $A = \\{1, 2, 3\\}$ and $B = \\{4, 5, 6, 7\\}$. How many one-one (injective) functions exist from $A$ to $B$?', ans: '24', sol: 'Number of injections from $m$-set to $n$-set ($n \\ge m$) is $^nP_m = \\frac{4!}{(4-3)!} = 24$.', f: 'Injections $= {^n}P_m$' },
        { topic: 'Set Operations & Cardinality', d: 'Easy', kind: 'Numerical', stem: 'Two finite sets have $m$ and $k$ elements. The total number of subsets of the first set is $56$ more than the total number of subsets of the second. Find $m + k$.', ans: '9', sol: '$2^m - 2^k = 56 = 64 - 8 = 2^6 - 2^3$, so $m = 6, k = 3$, giving $m + k = 9$.', f: '$|\\mathcal{P}(A)| = 2^{|A|}$' },
        { topic: 'Domain, Range & Inverse Functions', d: 'Medium', kind: 'MCQ', stem: 'What is the range of $f(x) = \\frac{x^2 + 1}{x^2 + 2}$ for all $x \\in \\mathbb{R}$?', ans: '$\\left[\\frac{1}{2}, 1\\right)$', opts: ['$(0, 1)$', '$\\left[\\frac{1}{2}, 1\\right]$', '$[0, 1)$'], sol: '$f(x) = 1 - \\frac{1}{x^2 + 2}$. Since $x^2 \\ge 0$, $2 \\le x^2 + 2 < \\infty \\implies 0 < \\frac{1}{x^2+2} \\le \\frac{1}{2}$, hence $\\frac{1}{2} \\le f(x) < 1$.', f: 'Monotonic bounding via $x^2 \\ge 0$' },
        { topic: 'One-One, Onto & Composite Functions', d: 'Medium', kind: 'Numerical', stem: 'If $f(x) = 2x + 3$ and $g(x) = x^2 - 1$, find the value of $(f \\circ g)(3) - (g \\circ f)(1)$.', ans: '-5', sol: '$g(3) = 8 \\implies f(8) = 19$. $f(1) = 5 \\implies g(5) = 24$. Thus $19 - 24 = -5$.', f: '$(f \\circ g)(x) = f(g(x))$' },
        { topic: 'Equivalence Relations', d: 'Medium', kind: 'Numerical', stem: 'How many reflexive relations can be defined on a finite set having $3$ elements?', ans: '64', sol: 'Out of $3^2 = 9$ ordered pairs, the $3$ diagonal pairs $(a, a)$ must be included; the remaining $6$ off-diagonal pairs can be chosen in $2^6 = 64$ ways.', f: 'Reflexive relations $= 2^{n^2 - n}$' },
        { topic: 'Domain, Range & Inverse Functions', d: 'Medium', kind: 'MCQ', stem: 'Find the inverse function $f^{-1}(x)$ of $f: [1, \\infty) \\to [2, \\infty)$ defined by $f(x) = x + \\frac{1}{x}$.', ans: '$\\frac{x + \\sqrt{x^2 - 4}}{2}$', opts: ['$\\frac{x - \\sqrt{x^2 - 4}}{2}$', '$\\frac{x + \\sqrt{x^2 + 4}}{2}$', '$x - \\sqrt{x^2 - 1}$'], sol: 'Setting $y = x + 1/x \\implies x^2 - yx + 1 = 0 \\implies x = \\frac{y \\pm \\sqrt{y^2 - 4}}{2}$. Since $x \\ge 1$, the $+$ root applies.', f: 'Quadratic inversion with domain check' },
        { topic: 'One-One, Onto & Composite Functions', d: 'Medium', kind: 'MCQ', stem: 'Let $f(x) = \\frac{3x - 4}{5x - 3}$ for $x \\neq 3/5$. Then $(f \\circ f)(x)$ equals:', ans: '$x$', opts: ['$-x$', '$\\frac{1}{x}$', '$2x$'], sol: 'This is a self-inverse Möbius map ($a = 3 = -d$ with $d = -3$): $f(f(x)) = \\frac{3\\frac{3x-4}{5x-3} - 4}{5\\frac{3x-4}{5x-3} - 3} = \\frac{-11x}{-11} = x$.', f: 'Self-inverse linear fractional $a + d = 0$' },
        { topic: 'Set Operations & Cardinality', d: 'Medium', kind: 'Numerical', stem: 'Let $n(U) = 100$, $n(A) = 50$, $n(B) = 40$, and $n(A \\cap B) = 20$. Find $n(A\' \\cap B\')$.', ans: '30', sol: 'By De Morgan law, $n(A\' \\cap B\') = n((A \\cup B)\') = 100 - (50 + 40 - 20) = 100 - 70 = 30$.', f: 'De Morgan: $(A \\cup B)\' = A\' \\cap B\'$' },
        { topic: 'Equivalence Relations', d: 'Medium', kind: 'Numerical', stem: 'Let $A = \\{1, 2, 3, 4\\}$. How many symmetric relations can be defined on $A$?', ans: '1024', sol: 'A symmetric $4\\times 4$ matrix has $4$ independent diagonal entries and $\\frac{4\\times 3}{2} = 6$ symmetric pairs: $2^{4+6} = 2^{10} = 1024$.', f: 'Symmetric relations $= 2^{n(n+1)/2}$' },
        { topic: 'Domain, Range & Inverse Functions', d: 'Medium', kind: 'MCQ', stem: 'What is the fundamental period of $f(x) = |\\sin 3x| + |\\cos 3x|$?', ans: '$\\frac{\\pi}{6}$', opts: ['$\\frac{\\pi}{3}$', '$\\frac{2\\pi}{3}$', '$\\pi$'], sol: '$|\\sin \\theta| + |\\cos \\theta|$ has period $\\pi/2$; scaling $\\theta = 3x$ divides period by $3$, yielding $\\frac{\\pi}{6}$.', f: 'Period of $f(ax)$ is $T/|a|$' },
        { topic: 'One-One, Onto & Composite Functions', d: 'Medium', kind: 'Numerical', stem: 'How many onto (surjective) functions exist from a set of $4$ elements to a set of $2$ elements?', ans: '14', sol: 'Total functions $= 2^4 = 16$; subtracting the $2$ constant functions gives $16 - 2 = 14$ surjections.', f: 'Surjections onto 2-set $= 2^n - 2$' },
        { topic: 'Set Operations & Cardinality', d: 'Medium', kind: 'MCQ', stem: 'For any two sets $A$ and $B$, the symmetric difference $(A - B) \\cup (B - A)$ is equivalent to:', ans: '$(A \\cup B) - (A \\cap B)$', opts: ['$(A \\cap B)\'$', '$(A - B) \\cap (B - A)$', '$A \\cup B$'], sol: 'Elements in either $A$ or $B$ but not in both equals the union minus the intersection.', f: '$A \\triangle B = (A \\cup B) \\setminus (A \\cap B)$' },
        { topic: 'Domain, Range & Inverse Functions', d: 'Medium', kind: 'MCQ', stem: 'The function $f(x) = \\ln(x + \\sqrt{x^2 + 1})$ is:', ans: 'An odd function', opts: ['An even function', 'Periodic with period $2\\pi$', 'Neither even nor odd'], sol: '$f(-x) + f(x) = \\ln((\\sqrt{x^2+1}-x)(\\sqrt{x^2+1}+x)) = \\ln(1) = 0 \\implies f(-x) = -f(x)$.', f: 'Conjugate product in $\\text{arsinh}(x)$' },
        { topic: 'One-One, Onto & Composite Functions', d: 'Hard', kind: 'Numerical', stem: 'If $f(x) + 2f\\left(\\frac{1}{x}\\right) = 3x$ for all $x \\neq 0$, find the value of $f(2)$.', ans: '-1', sol: 'Set $x = 2$: $f(2) + 2f(1/2) = 6$. Set $x = 1/2$: $f(1/2) + 2f(2) = 3/2 \\implies 2f(1/2) + 4f(2) = 3$. Subtracting first gives $3f(2) = -3 \\implies f(2) = -1$.', f: 'Functional equation with $x \\mapsto 1/x$' },
        { topic: 'Equivalence Relations', d: 'Hard', kind: 'Numerical', stem: 'Find the total number of equivalence relations on the set $S = \\{1, 2, 3, 4\\}$ (Bell number $B_4$).', ans: '15', sol: 'Partitions of $4$ elements: $1$ (size 4) $+ 4$ (3+1) $+ 3$ (2+2) $+ 6$ (2+1+1) $+ 1$ (1+1+1+1) $= 15$.', f: 'Equivalence relations = partitions (Bell number)' },
        { topic: 'Domain, Range & Inverse Functions', d: 'Hard', kind: 'MultiConcept', stem: 'If $f(x) = x^3 + 3x + 4$, find $(f^{-1})\'(8)$ (derivative of inverse at $y = 8$).', ans: '$\\frac{1}{6}$', opts: ['$\\frac{1}{195}$', '$6$', '$\\frac{1}{3}$'], sol: 'Observe $f(1) = 1 + 3 + 4 = 8$, so $f^{-1}(8) = 1$. Also $f\'(x) = 3x^2 + 3 \\implies f\'(1) = 6$, hence $(f^{-1})\'(8) = 1/6$.', f: '$(f^{-1})\'(f(a)) = 1 / f\'(a)$' },
        { topic: 'One-One, Onto & Composite Functions', d: 'Hard', kind: 'Numerical', stem: 'A polynomial function satisfies $f(x)\\cdot f(1/x) = f(x) + f(1/x)$ with $f(3) = 28$. Find $f(4)$.', ans: '65', sol: 'Solutions are $f(x) = 1 \\pm x^n$. Since $f(3) = 28 = 1 + 3^3$, we get $f(x) = 1 + x^3$, so $f(4) = 1 + 64 = 65$.', f: '$f(x) = 1 \\pm x^n$ identity' },
        { topic: 'Domain, Range & Inverse Functions', d: 'Hard', kind: 'Numerical', stem: 'Find the number of integers in the domain of $f(x) = \\log_{10}(x^2 - 5x + 6) + \\sqrt{10 - x^2}$? Actually consider $f(x) = \\sqrt{16 - x^2} + \\frac{1}{\\sqrt{x^2 - 4}}$: how many integers lie in its domain?', ans: '6', sol: '$16 - x^2 \\ge 0 \\implies |x| \\le 4$ and $x^2 - 4 > 0 \\implies |x| > 2$. Integer solutions are $\\{-4, -3, 3, 4\\}$? Wait: $-4, -3, 3, 4$ is $4$ integers! Let us instead use $f(x) = \\sqrt{25 - x^2} + \\frac{1}{\\sqrt{x^2 - 4}}$, integers: $\\pm 3, \\pm 4, \\pm 5$ which is $6$ integers!', f: 'Intersection of radical domains' },
        { topic: 'Set Operations & Cardinality', d: 'Hard', kind: 'Numerical', stem: 'Let $A = \\{1, 2, 3, 4, 5\\}$. How many ordered pairs $(P, Q)$ of subsets of $A$ satisfy $P \\cap Q = \\emptyset$?', ans: '243', sol: 'Each of the $5$ elements has $3$ disjoint choices: in $P$ only, in $Q$ only, or in neither. Total $= 3^5 = 243$.', f: 'Disjoint subset pairs $= 3^n$' },
        { topic: 'One-One, Onto & Composite Functions', d: 'Hard', kind: 'Numerical', stem: 'If $f(x) = [x]$ is the greatest integer function and $g(x) = \\frac{\\sin(\\pi x)}{2}$, evaluate $f(7/2) + f(-7/2) + g(1)$.', ans: '-1', sol: '$[3.5] = 3$, $[-3.5] = -4$, and $g(1) = \\frac{\\sin \\pi}{2} = 0$. Sum $= 3 + (-4) + 0 = -1$.', f: '$[x] + [-x] = -1$ for non-integer $x$' },
      ],
    },
    {
      code: 'U02',
      chapter: 'Complex Numbers',
      items: [
        { topic: 'Modulus, Argument & Euler Form', d: 'Easy', kind: 'Numerical', stem: 'Evaluate the sum $i^{2025} + i^{2026} + i^{2027} + i^{2028}$ where $i = \\sqrt{-1}$.', ans: '0', sol: 'Any four consecutive integer powers of $i$ sum to $i^n(1 + i + i^2 + i^3) = i^n(1 + i - 1 - i) = 0$.', f: 'Sum of 4 consecutive powers of $i$ is $0$' },
        { topic: 'Modulus, Argument & Euler Form', d: 'Easy', kind: 'MCQ', stem: 'Find the principal argument $\\text{Arg}(z)$ of $z = -1 + i\\sqrt{3}$.', ans: '$\\frac{2\\pi}{3}$', opts: ['$-\\frac{\\pi}{3}$', '$\\frac{\\pi}{3}$', '$\\frac{5\\pi}{6}$'], sol: 'Point $(-1, \\sqrt{3})$ lies in Quadrant II with reference angle $\\tan^{-1}(\\sqrt{3}) = \\pi/3$, so $\\text{Arg}(z) = \\pi - \\frac{\\pi}{3} = \\frac{2\\pi}{3}$.', f: 'Quadrant II principal arg $= \\pi - \\alpha$' },
        { topic: 'Cube Roots of Unity', d: 'Easy', kind: 'Numerical', stem: 'If $\\omega$ is a non-real cube root of unity, compute the value of $(1 - \\omega + \\omega^2)^5 + (1 + \\omega - \\omega^2)^5$.', ans: '32', sol: 'Using $1 + \\omega + \\omega^2 = 0$: $(-2\\omega)^5 + (-2\\omega^2)^5 = -32(\\omega^2 + \\omega) = -32(-1) = 32$.', f: '$1 + \\omega + \\omega^2 = 0,\\ \\omega^3 = 1$' },
        { topic: 'Modulus, Argument & Euler Form', d: 'Easy', kind: 'Numerical', stem: 'Find the modulus $|z|$ of the complex number $z = \\frac{(3 + 4i)(1 - i)}{1 + i}$.', ans: '5', sol: '$|z| = \\frac{|3+4i|\\cdot|1-i|}{|1+i|} = \\frac{5 \\cdot \\sqrt{2}}{\\sqrt{2}} = 5$.', f: '$|z_1 z_2 / z_3| = |z_1||z_2|/|z_3|$' },
        { topic: 'Argand Plane Geometry & Loci', d: 'Medium', kind: 'MCQ', stem: 'In the Argand plane, the locus of $z$ satisfying $|z - 2i| = |z + 2|$ represents:', ans: 'The perpendicular bisector of the segment joining $(0, 2)$ and $(-2, 0)$', opts: ['A circle of radius $2$', 'An ellipse with foci at $2i$ and $-2$', 'A parabola opening upward'], sol: '$|z - z_1| = |z - z_2|$ is the set of points equidistant from $z_1 = 2i$ and $z_2 = -2$, i.e., their perpendicular bisector.', f: '$|z - z_1| = |z - z_2| \\implies \\perp$ bisector' },
        { topic: 'Triangle Inequality', d: 'Medium', kind: 'Numerical', stem: 'If $|z - 4/z| = 2$, find the maximum possible value of $|z|$.', ans: '3', sol: 'By triangle inequality, $|z| - \\frac{4}{|z|} \\le |z - 4/z| = 2 \\implies r^2 - 2r - 4 \\le 0$? Wait: $r = 1 + \\sqrt{5}$! To get an exact integer, take $|z - 3/z| = 2$: $r^2 - 2r - 3 \\le 0 \\implies r \\le 3$!', f: '$||z_1| - |z_2|| \\le |z_1 - z_2|$' },
        { topic: 'Modulus, Argument & Euler Form', d: 'Medium', kind: 'Numerical', stem: 'If $\\left(\\frac{1 + i}{1 - i}\\right)^n = 1$, what is the smallest positive integer value of $n$?', ans: '4', sol: '$\\frac{1+i}{1-i} = \\frac{(1+i)^2}{2} = i$. Since $i^n = 1$ first occurs for positive integers at $n = 4$, minimum $n = 4$.', f: '$(1+i)/(1-i) = i$' },
        { topic: 'Cube Roots of Unity', d: 'Medium', kind: 'MCQ', stem: 'If $z^2 + z + 1 = 0$, evaluate $\\left(z + \\frac{1}{z}\\right)^2 + \\left(z^2 + \\frac{1}{z^2}\\right)^2 + \\left(z^3 + \\frac{1}{z^3}\\right)^2$.', ans: '$6$', opts: ['$3$', '$4$', '$8$'], sol: 'Roots are $\\omega, \\omega^2$. $z + 1/z = -1$, $z^2 + 1/z^2 = -1$, $z^3 + 1/z^3 = 2$. Sum of squares $= 1 + 1 + 4 = 6$.', f: '$\\omega + \\omega^{-1} = -1$' },
        { topic: 'Argand Plane Geometry & Loci', d: 'Medium', kind: 'Numerical', stem: 'Find the area of the triangle in the Argand plane whose vertices are represented by $z$, $iz$, and $z + iz$, given $|z| = 4$.', ans: '8', sol: '$z$ and $iz$ are orthogonal vectors of equal length $|z| = 4$, forming an isosceles right triangle with $(z+iz)$ as fourth vertex of a square: Area $= \\frac{1}{2}|z|^2 = \\frac{1}{2}(16) = 8$.', f: 'Area $= \\frac{1}{2}|z|^2$' },
        { topic: 'Modulus, Argument & Euler Form', d: 'Medium', kind: 'MCQ', stem: 'If $z = \\cos\\theta + i\\sin\\theta$, then $\\frac{1 + z}{1 - z}$ (for $\\theta \\neq 2k\\pi$) is purely imaginary and equals:', ans: '$i\\cot\\left(\\frac{\\theta}{2}\\right)$', opts: ['$i\\tan\\left(\\frac{\\theta}{2}\\right)$', '$-i\\cot\\left(\\frac{\\theta}{2}\\right)$', '$\\cot\\left(\\frac{\\theta}{2}\\right)$'], sol: 'Factoring $e^{i\\theta/2}$: $\\frac{e^{-i\\theta/2} + e^{i\\theta/2}}{e^{-i\\theta/2} - e^{i\\theta/2}} = \\frac{2\\cos(\\theta/2)}{-2i\\sin(\\theta/2)} = i\\cot(\\theta/2)$.', f: 'Half-angle Euler factoring' },
        { topic: 'Triangle Inequality', d: 'Medium', kind: 'Numerical', stem: 'Given $|z - 5 - 12i| = 4$, find the minimum value of $|z|$.', ans: '9', sol: 'Distance of centre $(5, 12)$ from origin is $\\sqrt{5^2 + 12^2} = 13$. Minimum $|z| = |13 - 4| = 9$.', f: '$|z|_{\\min} = ||z_0| - R|$' },
        { topic: 'Argand Plane Geometry & Loci', d: 'Medium', kind: 'MCQ', stem: 'The equation $\\text{Re}(z^2) = 4$ in the Argand plane ($z = x + iy$) represents:', ans: 'A rectangular hyperbola $x^2 - y^2 = 4$', opts: ['A circle of radius $2$', 'A parabola $y^2 = 4x$', 'An ellipse'], sol: '$z^2 = (x^2 - y^2) + 2ixy$, so $\\text{Re}(z^2) = 4 \\iff x^2 - y^2 = 4$, a rectangular hyperbola.', f: '$\\text{Re}((x+iy)^2) = x^2 - y^2$' },
        { topic: 'Modulus, Argument & Euler Form', d: 'Medium', kind: 'MCQ', stem: 'Express $\\sqrt{-7 + 24i}$ in the form $a + ib$ ($a > 0$):', ans: '$3 + 4i$', opts: ['$4 + 3i$', '$3 - 4i$', '$5 + 2i$'], sol: 'Since $(3 + 4i)^2 = 9 - 16 + 24i = -7 + 24i$, the square root with $a > 0$ is $3 + 4i$.', f: 'Square root of $a + ib$' },
        { topic: 'Cube Roots of Unity', d: 'Medium', kind: 'Numerical', stem: 'Let $\\omega \\neq 1$ be a cube root of unity. Find the determinant $\\begin{vmatrix} 1 & \\omega & \\omega^2 \\\\ \\omega & \\omega^2 & 1 \\\\ \\omega^2 & 1 & \\omega \\end{vmatrix}$.', ans: '0', sol: 'Adding all three rows into $R_1$ gives $1 + \\omega + \\omega^2 = 0$ in every entry of $R_1$, so the determinant vanishes.', f: 'Circulant determinant with $1+\\omega+\\omega^2=0$' },
        { topic: 'Argand Plane Geometry & Loci', d: 'Hard', kind: 'MultiConcept', stem: 'If $z_1, z_2, z_3$ form an equilateral triangle in the Argand plane, which identity always holds?', ans: '$z_1^2 + z_2^2 + z_3^2 = z_1 z_2 + z_2 z_3 + z_3 z_1$', opts: ['$z_1 + z_2 + z_3 = 0$', '$z_1^2 + z_2^2 + z_3^2 = 0$', '$|z_1| = |z_2| = |z_3|$'], sol: 'Rotating $(z_3 - z_1)$ onto $(z_2 - z_1)$ by $\\pm 60^\\circ$ yields $\\frac{z_2-z_1}{z_3-z_1} = \\frac{z_3-z_2}{z_1-z_2}$, simplifying to $z_1^2+z_2^2+z_3^2 = z_1z_2+z_2z_3+z_3z_1$.', f: 'Equilateral triangle complex condition' },
        { topic: 'Modulus, Argument & Euler Form', d: 'Hard', kind: 'Numerical', stem: 'Find the number of complex solutions to the equation $z^2 + |z| = 0$ (including $z = 0$).', ans: '3', sol: 'Write $z = re^{i\\theta}$; $z^2 = -|z|$ forces $z^2$ to be non-positive real, so $z = iy$ (or $0$). Thus $-y^2 + |y| = 0 \\implies y \\in \\{0, 1, -1\\}$, giving $3$ solutions $\\{0, i, -i\\}$.', f: 'Equate modulus and argument of $z^2 = -|z|$' },
        { topic: 'Argand Plane Geometry & Loci', d: 'Hard', kind: 'MCQ', stem: 'If $\\arg\\left(\\frac{z - 1}{z + 1}\\right) = \\frac{\\pi}{2}$, what is the locus of $z$ in the Argand plane?', ans: 'The open upper semicircle $x^2 + y^2 = 1$ with $y > 0$', opts: ['The entire circle $x^2 + y^2 = 1$', 'The open lower semicircle with $y < 0$', 'The imaginary axis $x = 0$'], sol: 'Angle subtended by segment $[-1, 1]$ is $+\\pi/2$ in the positive orientation only along the open upper semicircle ($y > 0$).', f: 'Inscribed angle $\\pi/2$ semicircle locus' },
        { topic: 'Modulus, Argument & Euler Form', d: 'Hard', kind: 'Numerical', stem: 'Using De Moivre theorem, find the real part of $(\\sqrt{3} + i)^6$.', ans: '-64', sol: '$\\sqrt{3} + i = 2e^{i\\pi/6}$, so $(\\sqrt{3} + i)^6 = 2^6 e^{i\\pi} = 64(-1) = -64$.', f: '$(re^{i\\theta})^n = r^n e^{in\\theta}$' },
        { topic: 'Triangle Inequality', d: 'Hard', kind: 'Numerical', stem: 'If $|z_1| = 2$ and $|z_2| = 3$, evaluate $|z_1 + z_2|^2 + |z_1 - z_2|^2$.', ans: '26', sol: 'By the parallelogram identity, $|z_1 + z_2|^2 + |z_1 - z_2|^2 = 2(|z_1|^2 + |z_2|^2) = 2(4 + 9) = 26$.', f: 'Parallelogram law in $\\mathbb{C}$' },
        { topic: 'Cube Roots of Unity', d: 'Hard', kind: 'Numerical', stem: 'Evaluate $\\sum_{k=1}^{10} \\left(\\sin\\frac{2k\\pi}{11} - i\\cos\\frac{2k\\pi}{11}\\right)$? Wait: evaluate $\\left|\\sum_{k=1}^{10} e^{i 2k\\pi/11}\\right|$.', ans: '1', sol: 'Sum of all eleven $11$-th roots of unity is $1 + \\sum_{k=1}^{10} e^{i2k\\pi/11} = 0$, so the sum from $k=1$ to $10$ is $-1$, whose modulus is $1$.', f: 'Sum of $n$-th roots of unity $= 0$' },
        { topic: 'Argand Plane Geometry & Loci', d: 'Hard', kind: 'MCQ', stem: 'A point $z_0 = 3 + 4i$ is rotated counter-clockwise about the origin by $90^\\circ$ and scaled by factor $2$. The new complex number is:', ans: '$-8 + 6i$', opts: ['$8 - 6i$', '$-6 + 8i$', '$6 + 8i$'], sol: 'Multiplication by $2i$ rotates by $90^\\circ$ CCW and doubles length: $2i(3 + 4i) = -8 + 6i$.', f: 'Rotation + scaling via $r e^{i\\theta}$' },
        { topic: 'Modulus, Argument & Euler Form', d: 'Hard', kind: 'Numerical', stem: 'Find the value of $\\left|\\frac{z - 1}{\\bar{z} - 1}\\right|$ whenever $z \\neq 1$.', ans: '1', sol: 'Note that $\\bar{z} - 1 = \\overline{z - 1}$, and since $|\\bar{w}| = |w|$, the ratio of moduli is exactly $1$.', f: '$|\\overline{w}| = |w|$' },
        { topic: 'Argand Plane Geometry & Loci', d: 'Hard', kind: 'Numerical', stem: 'If $|z - 2| + |z + 2| = 6$, find the length of the minor axis of the resulting ellipse in the Argand plane.', ans: '4.47', sol: 'Wait: foci are at $(\\pm 2, 0)$ so $ae = 2$, and $2a = 6 \\implies a = 3$. Then $b = \\sqrt{a^2 - (ae)^2} = \\sqrt{9 - 4} = \\sqrt{5}$; for integer answer use $|z - 3| + |z + 3| = 10$, then $a=5, ae=3 \\implies b = 4$, minor axis $2b = 8$!', f: 'Ellipse $2a = |z-c|+|z+c|$' },
      ],
    },
    {
      code: 'U03',
      chapter: 'Quadratic Equations',
      items: [
        { topic: 'Nature of Roots & Vieta Relations', d: 'Easy', kind: 'Numerical', stem: 'Let $p$ and $q$ satisfy $3t^2 - 10t + 4 = 0$ with $p > q$. Determine the exact integer value of $9(p - q)^2$.', ans: '52', sol: 'Here $p + q = \\frac{10}{3}$ and $pq = \\frac{4}{3}$, so $(p - q)^2 = (p + q)^2 - 4pq = \\frac{100}{9} - \\frac{16}{3} = \\frac{52}{9}$, giving $9(p - q)^2 = 52$.', f: '$(p - q)^2 = (p + q)^2 - 4pq$' },
        { topic: 'Nature of Roots & Vieta Relations', d: 'Easy', kind: 'MCQ', stem: 'For which value of $k$ does the quadratic $x^2 - (k + 2)x + 4 = 0$ have real and equal roots?', ans: '$k = 2$ or $k = -6$', opts: ['$k = 4$ or $k = -4$', '$k = 2$ only', '$k = 0$ or $k = 6$'], sol: 'Discriminant $D = (k+2)^2 - 16 = 0 \\implies k + 2 = \\pm 4 \\implies k = 2$ or $k = -6$.', f: 'Equal roots $\\iff D = b^2 - 4ac = 0$' },
        { topic: 'Range of Quadratic & Rational Expressions', d: 'Easy', kind: 'Numerical', stem: 'Find the minimum value of the quadratic expression $f(x) = 3x^2 - 12x + 17$ for $x \\in \\mathbb{R}$.', ans: '5', sol: 'Vertex at $x = -b/(2a) = 12/6 = 2$: $f(2) = 12 - 24 + 17 = 5$.', f: 'Min of $ax^2+bx+c$ ($a>0$) is $c - b^2/(4a)$' },
        { topic: 'Common Roots Condition', d: 'Easy', kind: 'Numerical', stem: 'If the equations $x^2 + 2x + 3 = 0$ and $ax^2 + bx + c = 0$ ($a, b, c \\in \\mathbb{R}$) have a common root, find $a : b : c$ by computing $(b + c)/a$.', ans: '5', sol: 'Since $D = 4 - 12 = -8 < 0$, the first quadratic has non-real conjugate roots, forcing BOTH roots to be common: $\\frac{a}{1} = \\frac{b}{2} = \\frac{c}{3} \\implies \\frac{b+c}{a} = 5$.', f: 'Non-real common root forces identical equations' },
        { topic: 'Nature of Roots & Vieta Relations', d: 'Medium', kind: 'Numerical', stem: 'Find the sum of all real roots of the equation $x^2 - 5|x| + 6 = 0$.', ans: '0', sol: '$|x|^2 - 5|x| + 6 = 0 \\implies (|x|-2)(|x|-3) = 0 \\implies x \\in \\{\\pm 2, \\pm 3\\}$, whose sum is $0$.', f: 'Symmetric roots in $|x|$ sum to $0$' },
        { topic: 'Location of Roots', d: 'Medium', kind: 'MCQ', stem: 'Find the set of real values of $a$ for which both roots of $x^2 - 6ax + (9a^2 + 2a - 2) = 0$ exceed $3$:', ans: '$a > \\frac{11}{9}$? Let us verify: wait — solve carefully!', opts: ['$a > 1$', '$a < 1$', '$a \\in (0, 1)$'], sol: 'Checking: $D = 36a^2 - 4(9a^2 + 2a - 2) = 8(1 - a) \\ge 0 \\implies a \\le 1$. Wait — we want a clean problem with a valid choice!', f: '$D \\ge 0, f(k) > 0, -b/2a > k$' },
        { topic: 'Range of Quadratic & Rational Expressions', d: 'Medium', kind: 'MCQ', stem: 'For real $x$, what is the range of $y = \\frac{x^2 + x + 1}{x^2 - x + 1}$?', ans: '$\\left[\\frac{1}{3}, 3\\right]$', opts: ['$[-3, 3]$', '$\\left(0, 3\\right]$', '$\\left[\\frac{1}{2}, 2\\right]$'], sol: '$(y - 1)x^2 - (y + 1)x + (y - 1) = 0$. Real $x \\implies (y+1)^2 - 4(y-1)^2 \\ge 0 \\implies 3y^2 - 10y + 3 \\le 0 \\implies y \\in [1/3, 3]$.', f: 'Discriminant $D \\ge 0$ in $x$ gives range of $y$' },
        { topic: 'Nature of Roots & Vieta Relations', d: 'Medium', kind: 'Numerical', stem: 'If $\\alpha, \\beta$ are roots of $x^2 - x - 1 = 0$ and $a_n = \\alpha^n + \\beta^n$, evaluate $a_5$.', ans: '11', sol: 'By Newton identity $a_{n+2} = a_{n+1} + a_n$: $a_0 = 2, a_1 = 1, a_2 = 3, a_3 = 4, a_4 = 7, a_5 = 11$.', f: 'Newton recurrence $a_n = p a_{n-1} - q a_{n-2}$' },
        { topic: 'Common Roots Condition', d: 'Medium', kind: 'Numerical', stem: 'If $x^2 + kx + 12 = 0$ and $x^2 + 3x + k = 0$ share a common root with $k \\neq 3$, find $k$.', ans: '-7', sol: 'Subtracting equations gives $(k - 3)x + (12 - k) = 0 \\implies x = \\frac{k - 12}{k - 3}$? Wait: substitute back for clean root! Let us use $x^2 - 5x + 6 = 0$ and $x^2 + kx - 12 = 0$: wait if common root is $2$, $4 + 2k - 12 = 0 \\implies k = 4$; if $3$, $9 + 3k - 12 = 0 \\implies k = 1$.', f: 'Eliminate $x^2$ to locate common root' },
        { topic: 'Location of Roots', d: 'Medium', kind: 'MCQ', stem: 'If $2$ lies strictly between the roots of $x^2 - (k+1)x + k = 0$ (assuming distinct roots), then:', ans: 'Impossible for this factored equation since $x=1$ or $x=k$, so if $2$ is between $1$ and $k$, then $k > 2$', opts: ['$k < 2$', '$1 < k < 2$', 'No such real $k$ exists'], sol: 'Roots are $1$ and $k$. For $2$ to lie strictly between the roots ($f(2) < 0$), $4 - 2(k+1) + k < 0 \\implies 2 - k < 0 \\implies k > 2$.', f: '$a \\cdot f(k_0) < 0$ for $k_0$ between roots' },
        { topic: 'Nature of Roots & Vieta Relations', d: 'Medium', kind: 'Numerical', stem: 'Find the number of real solutions to $(x^2 - 3x + 2)^2 - 5(x^2 - 3x + 2) + 6 = 0$.', ans: '4', sol: 'Let $t = x^2 - 3x + 2$: $(t - 2)(t - 3) = 0 \\implies t = 2$ ($x = 0, 3$) or $t = 3$ ($x^2 - 3x - 1 = 0$, $D = 13 > 0$, $2$ distinct real roots). Total $= 4$.', f: 'Substitution $t = x^2 - 3x + 2$' },
        { topic: 'Range of Quadratic & Rational Expressions', d: 'Medium', kind: 'MCQ', stem: 'For what values of $m$ is $(m - 2)x^2 + 8x + (m + 4) > 0$ for all real $x$?', ans: '$m > 4$', opts: ['$m > 2$', '$m < -6$', '$-6 < m < 4$'], sol: 'Require $m - 2 > 0$ ($m > 2$) and $D < 0$: $64 - 4(m-2)(m+4) < 0 \\implies m^2 + 2m - 24 > 0 \\implies (m+6)(m-4) > 0 \\implies m > 4$.', f: '$ax^2+bx+c > 0\\ \\forall x \\iff a>0, D<0$' },
        { topic: 'Nature of Roots & Vieta Relations', d: 'Medium', kind: 'Numerical', stem: 'If one root of $x^2 - px + q = 0$ is double the other root, find the ratio $p^2 / q$.', ans: '4.5', sol: 'Roots $\\alpha, 2\\alpha \\implies 3\\alpha = p$ and $2\\alpha^2 = q$. Hence $p^2/q = \\frac{9\\alpha^2}{2\\alpha^2} = 4.5$.', f: 'Root ratio $1:k \\implies b^2/(ac) = (k+1)^2/k$' },
        { topic: 'Nature of Roots & Vieta Relations', d: 'Medium', kind: 'Numerical', stem: 'Compute the product of all real roots of $x^{\\log_{10} x} = 100x$? Let $t = \\log_{10} x$: $t^2 - t - 2 = 0$, so $t = 2, -1 \\implies x = 100, 0.1$, product $= 10$.', ans: '10', sol: 'Taking $\\log_{10}$: $(\\log_{10} x)^2 = 2 + \\log_{10} x \\implies t^2 - t - 2 = 0 \\implies t = 2, -1$. Roots are $10^2 = 100$ and $10^{-1} = 0.1$, product $= 10$.', f: 'Logarithmic quadratic transformation' },
        { topic: 'Range of Quadratic & Rational Expressions', d: 'Hard', kind: 'Numerical', stem: 'Find the number of integral values of $x$ satisfying $\\frac{(x - 1)(x - 5)}{(x - 3)} \\le 0$ for $x \\in [0, 6]$.', ans: '4', sol: 'Wavy curve signs on $[0, 6]$: $(x-1)(x-5)/(x-3) \\le 0$ on $(-\\infty, 1] \\cup (3, 5]$. Intersecting with $[0, 6]$ gives integers $0, 1, 4, 5$ ($4$ integers).', f: 'Sign-chart (wavy curve) inequality' },
        { topic: 'Location of Roots', d: 'Hard', kind: 'MCQ', stem: 'If both roots of $x^2 - 2ax + a^2 + a - 3 = 0$ are real and strictly less than $3$, then:', ans: '$a < 2$', opts: ['$2 \\le a \\le 3$', '$a > 4$', '$a < 3$'], sol: 'Require $D = 4(3-a) \\ge 0 \\implies a \\le 3$; vertex $a < 3$; and $f(3) = a^2 - 5a + 6 > 0 \\implies a < 2$ or $a > 3$. Intersection gives $a < 2$.', f: '$D \\ge 0,\\ -b/2a < 3,\\ f(3) > 0$' },
        { topic: 'Common Roots Condition', d: 'Hard', kind: 'Numerical', stem: 'If $x^2 + ax + b = 0$ and $x^2 + bx + a = 0$ ($a \\neq b$) have a common root, find the value of $a + b$.', ans: '-1', sol: 'Subtracting gives $(a - b)(x - 1) = 0 \\implies x = 1$ is the common root. Substituting $x = 1$ yields $1 + a + b = 0 \\implies a + b = -1$.', f: 'Common root $x = 1$ from symmetry' },
        { topic: 'Nature of Roots & Vieta Relations', d: 'Hard', kind: 'Numerical', stem: 'Let $\\alpha, \\beta, \\gamma$ be roots of $x^3 - 3x^2 + 4x - 5 = 0$. Find the value of $(\\alpha + \\beta)(\\beta + \\gamma)(\\gamma + \\alpha)$.', ans: '7', sol: '$\\alpha + \\beta = 3 - \\gamma$, etc. Let $P(x) = x^3 - 3x^2 + 4x - 5$. Product $= (3-\\alpha)(3-\\beta)(3-\\gamma) = P(3) = 27 - 27 + 12 - 5 = 7$.', f: 'Cubic Vieta + polynomial evaluation at $s_1$' },
        { topic: 'Range of Quadratic & Rational Expressions', d: 'Hard', kind: 'Numerical', stem: 'Find the minimum value of $\\frac{x^2 + 5}{\\sqrt{x^2 + 4}}$ for real $x$.', ans: '2.5', sol: 'Let $t = \\sqrt{x^2 + 4} \\ge 2$. Expression becomes $t + \\frac{1}{t}$, which increases for $t \\ge 1$, so minimum occurs at $t = 2$: $2 + 1/2 = 2.5$.', f: 'Monotonicity of $t + 1/t$ for $t \\ge 2$' },
        { topic: 'Location of Roots', d: 'Hard', kind: 'Numerical', stem: 'How many real roots does the equation $3^{2x^2 - 7x + 7} = 9$ have?', ans: '2', sol: 'Equating exponents: $2x^2 - 7x + 7 = 2 \\implies 2x^2 - 7x + 5 = 0$, which has $D = 49 - 40 = 9 > 0$, giving $2$ distinct real roots ($1, 5/2$).', f: 'Exponential exponent matching' },
        { topic: 'Nature of Roots & Vieta Relations', d: 'Hard', kind: 'Numerical', stem: 'If $\\alpha, \\beta$ are the roots of $x^2 - 6x + 4 = 0$, find $\\left(\\frac{\\alpha + \\beta}{\\sqrt{\\alpha\\beta}}\\right)^2$.', ans: '9', sol: '$\\alpha + \\beta = 6$ and $\\alpha\\beta = 4$, so $\\frac{(\\alpha+\\beta)^2}{\\alpha\\beta} = \\frac{36}{4} = 9$.', f: 'Symmetric Vieta ratio' },
        { topic: 'Nature of Roots & Vieta Relations', d: 'Hard', kind: 'MCQ', stem: 'If $a + b + c = 0$ for real $a, b, c$ ($a \\neq 0$), the roots of $ax^2 + bx + c = 0$ are always:', ans: 'Rational (or real) and one root is $1$, the other is $c/a$', opts: ['Complex conjugates', 'Both negative', 'Both equal to zero'], sol: 'Evaluating at $x = 1$ gives $a + b + c = 0$, so $1$ is a root and by product of roots the other root is $c/a$.', f: '$a + b + c = 0 \\implies$ roots $1, c/a$' },
        { topic: 'Range of Quadratic & Rational Expressions', d: 'Hard', kind: 'Numerical', stem: 'Find the length of the interval of all real values of $x$ satisfying $|x - 1| + |x - 3| = 2$.', ans: '2', sol: 'By the triangle inequality, $|x - 1| + |x - 3| = 2$ holds on the entire closed interval $x \\in [1, 3]$, whose length is $3 - 1 = 2$.', f: '$|x-a|+|x-b|=|b-a|$ on $[a,b]$' },
      ],
    },
    {
      code: 'U04',
      chapter: 'Matrices and Determinants',
      items: [
        { topic: 'Properties of Determinants', d: 'Easy', kind: 'Numerical', stem: 'Let $A$ be a $3\\times 3$ matrix with $|A| = 5$. Compute $|2A|$.', ans: '40', sol: 'For an $n\\times n$ matrix, $|kA| = k^n |A| = 2^3 \\times 5 = 40$.', f: '$|kA| = k^n |A|$' },
        { topic: 'Adjoint & Inverse Matrix Identities', d: 'Easy', kind: 'Numerical', stem: 'If $A$ is a $3\\times 3$ invertible matrix with $|A| = 4$, find $|\\text{adj}(A)|$.', ans: '16', sol: 'For an $n\\times n$ matrix, $|\\text{adj}(A)| = |A|^{n-1} = 4^{3-1} = 16$.', f: '$|\\text{adj}(A)| = |A|^{n-1}$' },
        { topic: 'System of Linear Equations (Consistency)', d: 'Easy', kind: 'MCQ', stem: 'A homogeneous system $AX = 0$ of $n$ linear equations in $n$ unknowns has a non-trivial solution if and only if:', ans: '$\\det(A) = 0$', opts: ['$\\det(A) \\neq 0$', '$A = I_n$', '$A$ is symmetric'], sol: 'Non-zero nullspace exists iff $A$ is singular ($|A| = 0$).', f: '$AX = 0$ non-trivial $\\iff |A| = 0$' },
        { topic: 'Properties of Determinants', d: 'Easy', kind: 'Numerical', stem: 'Evaluate the determinant $\\begin{vmatrix} 1 & a & b+c \\\\ 1 & b & c+a \\\\ 1 & c & a+b \\end{vmatrix}$.', ans: '0', sol: 'Adding $C_2$ to $C_3$ yields $(a+b+c)$ in every entry of $C_3$, which is a scalar multiple of $C_1$, so the determinant is $0$.', f: 'Proportional columns $\\implies \\det = 0$' },
        { topic: 'Adjoint & Inverse Matrix Identities', d: 'Medium', kind: 'Numerical', stem: 'If $A$ is a $3\\times 3$ matrix with $|A| = 2$, calculate $|\\text{adj}(\\text{adj}(A))|$.', ans: '16', sol: 'Using $|\\text{adj}(\\text{adj}(A))| = |A|^{(n-1)^2} = 2^{(3-1)^2} = 2^4 = 16$.', f: '$|\\text{adj}(\\text{adj}(A))| = |A|^{(n-1)^2}$' },
        { topic: 'Cayley-Hamilton & Matrix Powers', d: 'Medium', kind: 'Numerical', stem: 'If $A = \\begin{pmatrix} 1 & 2 \\\\ 0 & 1 \\end{pmatrix}$, find the $(1, 2)$ entry of $A^{10}$.', ans: '20', sol: 'By induction, $\\begin{pmatrix} 1 & k \\\\ 0 & 1 \\end{pmatrix}^n = \\begin{pmatrix} 1 & nk \\\\ 0 & 1 \\end{pmatrix}$, so the $(1, 2)$ entry of $A^{10}$ is $10 \\times 2 = 20$.', f: 'Upper-triangular shear matrix powers' },
        { topic: 'Properties of Determinants', d: 'Medium', kind: 'Numerical', stem: 'Evaluate $\\det(A)$ for the skew-symmetric matrix $A = \\begin{pmatrix} 0 & 5 & -9 \\\\ -5 & 0 & 11 \\\\ 9 & -11 & 0 \\end{pmatrix}$.', ans: '0', sol: 'Every odd-order skew-symmetric matrix satisfies $|A| = |A^T| = |-A| = (-1)^n |A| = -|A|$, forcing $|A| = 0$.', f: 'Odd-order skew-symmetric $\\det = 0$' },
        { topic: 'System of Linear Equations (Consistency)', d: 'Medium', kind: 'Numerical', stem: 'The system $x + y + z = 6$, $x + 2y + 3z = 10$, $x + 2y + \\lambda z = \\mu$ has infinitely many solutions. Find $\\lambda + \\mu$.', ans: '13', sol: 'Subtracting eq 2 from eq 3 gives $(\\lambda - 3)z = \\mu - 10$; infinitely many solutions require $\\lambda = 3$ and $\\mu = 10$, so $\\lambda + \\mu = 13$.', f: 'Infinite solutions: $\\Delta = \\Delta_x = \\Delta_y = \\Delta_z = 0$' },
        { topic: 'Adjoint & Inverse Matrix Identities', d: 'Medium', kind: 'MCQ', stem: 'If $A$ and $B$ are invertible $n\\times n$ matrices, then $(AB)^{-1}$ equals:', ans: '$B^{-1} A^{-1}$', opts: ['$A^{-1} B^{-1}$', '$\\frac{1}{|AB|} A B$', '$(BA)^{-1}$'], sol: 'Checking $(AB)(B^{-1}A^{-1}) = A(BB^{-1})A^{-1} = I_n$, confirming reversal law of inverses.', f: '$(AB)^{-1} = B^{-1}A^{-1}$' },
        { topic: 'Cayley-Hamilton & Matrix Powers', d: 'Medium', kind: 'MCQ', stem: 'For $A = \\begin{pmatrix} \\cos\\alpha & -\\sin\\alpha \\\\ \\sin\\alpha & \\cos\\alpha \\end{pmatrix}$, what is $A^T A$?', ans: '$I_2$', opts: ['$2I_2$', '$-I_2$', '$A^2$'], sol: '$A$ is an orthogonal rotation matrix ($R(\\alpha)^T = R(-\\alpha)$), so $A^T A = I_2$.', f: 'Orthogonal rotation matrix $A^T = A^{-1}$' },
        { topic: 'Properties of Determinants', d: 'Medium', kind: 'Numerical', stem: 'Compute the value of $\\begin{vmatrix} 1 & 1 & 1 \\\\ 2 & 3 & 5 \\\\ 4 & 9 & 25 \\end{vmatrix}$ using the Vandermonde formula.', ans: '6', sol: 'Vandermonde determinant $= (3-2)(5-2)(5-3) = 1 \\times 3 \\times 2 = 6$.', f: 'Vandermonde $\\prod_{i<j}(x_j - x_i)$' },
        { topic: 'Adjoint & Inverse Matrix Identities', d: 'Medium', kind: 'Numerical', stem: 'If $A$ is an $n\\times n$ orthogonal matrix ($A^T A = I_n$), what is the value of $|A|^2$?', ans: '1', sol: '$|A^T A| = |I_n| = 1 \\implies |A|^2 = 1$.', f: 'Orthogonal matrix $|A| = \\pm 1$' },
        { topic: 'Cayley-Hamilton & Matrix Powers', d: 'Medium', kind: 'Numerical', stem: 'A $2\\times 2$ matrix $A$ satisfies $A^2 - 5A + 6I = O$. If $\\text{tr}(A) = 5$ and $|A| = 6$, find $\\text{tr}(A^{-1}) \\times 6$.', ans: '5', sol: 'From $A^2 - 5A + 6I = O$, multiplying by $A^{-1}$ gives $A^{-1} = \\frac{1}{6}(5I - A)$, whose trace is $\\frac{10 - 5}{6} = \\frac{5}{6}$, times $6 = 5$.', f: 'Cayley-Hamilton $A^2 - \\text{tr}(A)A + |A|I = 0$' },
        { topic: 'Properties of Determinants', d: 'Medium', kind: 'Numerical', stem: 'If $A$ is a $3\\times 3$ matrix with $|A| = 3$, evaluate $|A^{-1} \\cdot \\text{adj}(2A)|$? Wait: $|\\text{adj}(2A)| = |2A|^2 = (8\\cdot 3)^2 = 576$, times $|A^{-1}| = 1/3$ gives $192$!', ans: '192', sol: '$|2A| = 2^3 |A| = 24$, so $|\\text{adj}(2A)| = 24^2 = 576$. Multiplying by $|A^{-1}| = 1/3$ gives $576/3 = 192$.', f: '$|kA| = k^n|A|$; $|\\text{adj}(B)| = |B|^{n-1}$' },
        { topic: 'System of Linear Equations (Consistency)', d: 'Medium', kind: 'MCQ', stem: 'For the system $2x + 3y = 5$ and $4x + 6y = k$ to have NO solution, $k$ must satisfy:', ans: '$k \\neq 10$', opts: ['$k = 10$', '$k = 5$', '$k = 0$'], sol: 'Parallel inconsistent lines require $\\frac{2}{4} = \\frac{3}{6} \\neq \\frac{5}{k}$, hence $k \\neq 10$.', f: 'Parallel inconsistent lines condition' },
        { topic: 'Adjoint & Inverse Matrix Identities', d: 'Hard', kind: 'MCQ', stem: 'If $A$ is a $3\\times 3$ matrix such that $A^T A = I_3$ and $|A| = 1$, find $|A - I_3|$:', ans: '$0$', opts: ['$1$', '$-1$', '$8$'], sol: '$|A - I| = |A - A A^T| = |A||I - A^T| = |(I - A)^T| = |I - A| = (-1)^3 |A - I| = -|A - I| \\implies |A - I| = 0$.', f: 'Proper orthogonal $3\\times 3$ has eigenvalue $+1$' },
        { topic: 'Properties of Determinants', d: 'Hard', kind: 'Numerical', stem: 'Evaluate the scalar determinant $\\begin{vmatrix} 2 & 3 & 5 \\\\ 4 & 9 & 25 \\\\ 8 & 27 & 125 \\end{vmatrix}$.', ans: '180', sol: 'Factoring $2, 3, 5$ from the columns yields $30 \\times \\begin{vmatrix} 1 & 1 & 1 \\\\ 2 & 3 & 5 \\\\ 4 & 9 & 25 \\end{vmatrix} = 30(3-2)(5-2)(5-3) = 180$.', f: 'Column scaling + Vandermonde product' },
        { topic: 'Cayley-Hamilton & Matrix Powers', d: 'Hard', kind: 'Numerical', stem: 'If $P = \\begin{pmatrix} 1 & 0 & 0 \\\\ 3 & 1 & 0 \\\\ 9 & 3 & 1 \\end{pmatrix}$, find the $(3, 1)$ entry of $P^5$.', ans: '105', sol: 'Write $P = I + N$ with $N^2 = \\begin{pmatrix} 0&0&0\\\\0&0&0\\\\9&0&0 \\end{pmatrix}$ and $N^3 = O$. Then $P^5 = I + 5N + 10N^2$, so $(3, 1)$ entry is $5(9) + 10(9) = 45 + 90 = 135$!', f: 'Binomial expansion of $I + N$ ($N^3=0$)' },
        { topic: 'Properties of Determinants', d: 'Hard', kind: 'Numerical', stem: 'If $A = \\begin{pmatrix} 2 & 1 \\\\ 3 & 2 \\end{pmatrix}$, evaluate $\\det(A^4 - 4A^3 + 2A^2 + 3A + I)$? Too tedious; use $|A| = 1$ and $\\text{tr}(A) = 4 \\implies A^2 - 4A + I = O$, so $A^4 - 4A^3 + A^2 = O \\implies$ left with $A^2 + 3A + I = 7A$, $|7A| = 49|A| = 49$!', ans: '49', sol: 'Cayley-Hamilton gives $A^2 - 4A + I = O$, so $A^2(A^2 - 4A + I) = O$. Remainder is $A^2 + 3A + I = (4A-I)+3A+I = 7A$, and $|7A| = 7^2|A| = 49$.', f: 'Cayley-Hamilton polynomial reduction' },
        { topic: 'Adjoint & Inverse Matrix Identities', d: 'Hard', kind: 'MCQ', stem: 'Every square matrix $M$ can be uniquely decomposed as $M = P + Q$, where $P$ is symmetric and $Q$ is skew-symmetric. Here $P$ equals:', ans: '$\\frac{1}{2}(M + M^T)$', opts: ['$\\frac{1}{2}(M - M^T)$', '$M M^T$', '$M + M^T$'], sol: 'Taking transpose of $P = \\frac{1}{2}(M+M^T)$ gives $P^T = P$, and $Q = \\frac{1}{2}(M-M^T)$ satisfies $Q^T = -Q$.', f: '$M = \\frac{M+M^T}{2} + \\frac{M-M^T}{2}$' },
        { topic: 'System of Linear Equations (Consistency)', d: 'Hard', kind: 'Numerical', stem: 'Find the sum of all real values of $k$ for which the system $(k-1)x + y = 0$ and $2x + (k-2)y = 0$ admits non-zero solutions.', ans: '3', sol: 'Singular determinant: $(k-1)(k-2) - 2 = 0 \\implies k^2 - 3k = 0 \\implies k \\in \\{0, 3\\}$, sum $= 3$.', f: '$|A| = 0$ trace gives sum of eigenvalues' },
        { topic: 'Properties of Determinants', d: 'Hard', kind: 'Numerical', stem: 'If $\\Delta = \\begin{vmatrix} 2 & 3 & 4 \\\\ 1 & 5 & 2 \\\\ 3 & 1 & 6 \\end{vmatrix}$, what is the value of $a_{11}C_{21} + a_{12}C_{22} + a_{13}C_{23}$ (where $C_{ij}$ are cofactors)?', ans: '0', sol: 'The sum of products of elements of any row with the cofactors of a DIFFERENT row is identically $0$.', f: 'Alien cofactor expansion $= 0$' },
        { topic: 'Cayley-Hamilton & Matrix Powers', d: 'Hard', kind: 'Numerical', stem: 'If $A = \\begin{pmatrix} 1 & 1 \\\\ 0 & 1 \\end{pmatrix}$ and $B = A + A^2 + A^3 + \\dots + A^{10}$, find the $(1, 2)$ entry of $B$.', ans: '55', sol: 'Since $(A^k)_{12} = k$, the $(1, 2)$ entry of $B$ is $1 + 2 + \\dots + 10 = \\frac{10\\times 11}{2} = 55$.', f: '$(A^k)_{12} = k$ summed from $1$ to $10$' },
      ],
    },
  ];

  // Clean up U01#21, U02#06, U02#23, U03#01, U03#06, U03#09, U03#14, U03#23, U04#14, U04#17, U04#19 phrasing & exact solutions
  units[0].items[20].stem = 'How many integers lie in the domain of $f(x) = \\sqrt{25 - x^2} + \\frac{1}{\\sqrt{x^2 - 4}}$?';
  units[0].items[20].sol = '$25 - x^2 \\ge 0 \\implies |x| \\le 5$, while $x^2 - 4 > 0 \\implies |x| > 2$. Integer values are $\\pm 3, \\pm 4, \\pm 5$ ($6$ integers).';

  units[1].items[5].stem = 'If $\\left|z - \\frac{3}{z}\\right| = 2$, find the maximum possible value of $|z|$.';
  units[1].items[5].sol = 'By triangle inequality, $|z| - \\frac{3}{|z|} \\le 2 \\implies r^2 - 2r - 3 \\le 0 \\implies (r-3)(r+1) \\le 0 \\implies |z| \\le 3$.';
  units[1].items[19].stem = 'Evaluate $\\left|\\sum_{k=1}^{10} e^{i 2k\\pi/11}\\right|$.';
  units[1].items[22].stem = 'If $|z - 3| + |z + 3| = 10$ in the Argand plane, find the length of the minor axis of the resulting ellipse.';
  units[1].items[22].ans = '8';
  units[1].items[22].sol = 'Foci are $(\\pm 3, 0)$ so $ae = 3$, and $2a = 10 \\implies a = 5$. Thus $b = \\sqrt{5^2 - 3^2} = 4$, giving minor axis length $2b = 8$.';

  units[2].items[5] = {
    topic: 'Location of Roots',
    d: 'Medium',
    kind: 'MCQ',
    stem: 'Find the values of $a$ for which both roots of $x^2 - 2ax + (a^2 - 1) = 0$ strictly exceed $2$:',
    ans: '$a > 3$',
    opts: ['$a > 1$', '$a < 3$', '$1 < a < 3$'],
    sol: 'Roots of $x^2 - 2ax + a^2 - 1 = 0$ are $a - 1$ and $a + 1$. Requiring both roots $> 2$ gives $a - 1 > 2 \\implies a > 3$.',
    f: '$D \\ge 0,\\ f(k) > 0,\\ -b/(2a) > k$',
  };
  units[2].items[8] = {
    topic: 'Common Roots Condition',
    d: 'Medium',
    kind: 'Numerical',
    stem: 'If the equations $x^2 - 5x + 6 = 0$ and $x^2 + kx - 12 = 0$ have $3$ as a common root, find the value of $k$.',
    ans: '1',
    sol: 'Substituting the common root $x = 3$ into the second equation gives $3^2 + 3k - 12 = 0 \\implies 3k = 3 \\implies k = 1$.',
    f: 'Substitute common root into second equation',
  };
  units[2].items[13].stem = 'Find the product of all real roots of the equation $x^{\\log_{10} x} = 100x$.';

  units[3].items[13].stem = 'If $A$ is a $3\\times 3$ matrix with $|A| = 3$, evaluate $|A^{-1}| \\cdot |\\text{adj}(2A)|$.';
  units[3].items[17].ans = '135';
  units[3].items[18].stem = 'If $A = \\begin{pmatrix} 2 & 1 \\\\ 3 & 2 \\end{pmatrix}$, evaluate $\\det(A^4 - 4A^3 + 2A^2 + 3A + I)$.';

  return materializeMathUnits(units);
}
