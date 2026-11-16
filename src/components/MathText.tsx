import React, { useMemo } from 'react';
import katex from 'katex';

interface MathTextProps {
  text: string;
  className?: string;
}

type Segment =
  | { type: 'text'; value: string }
  | { type: 'inline'; value: string }
  | { type: 'display'; value: string };

function parseMathSegments(input: string): Segment[] {
  const segments: Segment[] = [];
  let i = 0;
  let buffer = '';

  while (i < input.length) {
    if (input[i] === '\\' && input[i + 1] === '$') {
      buffer += '$';
      i += 2;
      continue;
    }

    if (input[i] === '$' && input[i + 1] === '$') {
      const end = input.indexOf('$$', i + 2);
      if (end !== -1) {
        if (buffer) {
          segments.push({ type: 'text', value: buffer });
          buffer = '';
        }
        segments.push({ type: 'display', value: input.slice(i + 2, end) });
        i = end + 2;
        continue;
      }
    }

    if (input[i] === '$') {
      let end = i + 1;
      while (end < input.length) {
        if (input[end] === '\\' && input[end + 1] === '$') {
          end += 2;
          continue;
        }
        if (input[end] === '$') break;
        end++;
      }
      if (end < input.length && input[end] === '$') {
        if (buffer) {
          segments.push({ type: 'text', value: buffer });
          buffer = '';
        }
        segments.push({ type: 'inline', value: input.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    buffer += input[i];
    i++;
  }

  if (buffer) {
    segments.push({ type: 'text', value: buffer });
  }
  return segments;
}

export const MathText: React.FC<MathTextProps> = ({ text, className = '' }) => {
  const rendered = useMemo(() => {
    const segments = parseMathSegments(text || '');
    return segments.map((seg, idx) => {
      if (seg.type === 'text') {
        return <React.Fragment key={idx}>{seg.value}</React.Fragment>;
      }
      const html = katex.renderToString(seg.value, {
        displayMode: seg.type === 'display',
        throwOnError: false,
        strict: false,
      });
      return (
        <span
          key={idx}
          className={seg.type === 'display' ? 'block my-2 overflow-x-auto' : 'inline-block align-baseline'}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    });
  }, [text]);

  return <span className={className}>{rendered}</span>;
};
