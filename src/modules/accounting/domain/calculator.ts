/** Evaluate the arithmetic syntax used by the accounting keypad without eval(). */
export function evaluateCalculatorExpression(expression: string): number {
  const source = String(expression || '').replace(/\s+/g, '');
  if (!source || !/^[0-9.+*/()\-]+$/.test(source)) throw new Error('invalid expression');

  const tokens = source.match(/(?:\d+\.?\d*|\.\d+)|[()+\-*/]/g) || [];
  if (tokens.join('') !== source) throw new Error('invalid expression');

  let index = 0;
  const parseExpression = (): number => {
    let value = parseTerm();
    while (tokens[index] === '+' || tokens[index] === '-') {
      const operator = tokens[index++];
      const right = parseTerm();
      value = operator === '+' ? value + right : value - right;
    }
    return value;
  };

  const parseTerm = (): number => {
    let value = parseFactor();
    while (tokens[index] === '*' || tokens[index] === '/') {
      const operator = tokens[index++];
      const right = parseFactor();
      value = operator === '*' ? value * right : value / right;
    }
    return value;
  };

  const parseFactor = (): number => {
    const token = tokens[index];
    if (token === '+' || token === '-') {
      index += 1;
      const value = parseFactor();
      return token === '-' ? -value : value;
    }
    if (token === '(') {
      index += 1;
      const value = parseExpression();
      if (tokens[index] !== ')') throw new Error('unclosed expression');
      index += 1;
      return value;
    }
    if (!token || !/^(?:\d+\.?\d*|\.\d+)$/.test(token)) throw new Error('expected number');
    index += 1;
    return Number(token);
  };

  const result = parseExpression();
  if (index !== tokens.length || !Number.isFinite(result)) throw new Error('invalid result');
  return result;
}
