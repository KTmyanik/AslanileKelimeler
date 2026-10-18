/** Words the child will put back in order. A trailing period is not its own tile. */
export function sentenceTokens(en: string): string[] {
  return en
    .trim()
    .replace(/[.!?…]+$/u, '')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
}

export function sameOrder(placed: readonly string[], answer: readonly string[]): boolean {
  if (placed.length !== answer.length) return false
  return placed.every((token, i) => token.toLocaleLowerCase('en-US') === answer[i].toLocaleLowerCase('en-US'))
}
