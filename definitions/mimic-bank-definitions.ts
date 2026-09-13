export type MimicBankOutcomeId = 'return-10' | 'return-50' | 'return-100' | 'return-200';
export type MimicBankGemCost = 10 | 20 | 30;

export type MimicBankOutcomeDefinition = Readonly<{
  id: MimicBankOutcomeId;
  displayName: string;
  multiplier: number;
}>;

export type MimicBankOdds = Readonly<Record<MimicBankOutcomeId, number>>;

export const mimicBankOutcomes: readonly MimicBankOutcomeDefinition[] = [
  { id: 'return-10', displayName: '10%だけ返却', multiplier: 0.1 },
  { id: 'return-50', displayName: '半分', multiplier: 0.5 },
  { id: 'return-100', displayName: '全額', multiplier: 1 },
  { id: 'return-200', displayName: '2倍', multiplier: 2 },
];

export const mimicBankGemCosts: readonly MimicBankGemCost[] = [10, 20, 30];

/**
 * Hero60の公開ガイドは「Gemを多く払うほど好結果が増える」までしか公開していない。
 * したがって以下の確率だけはMinute Vanguard独自balance。公開参照値として扱わない。
 */
export const mimicBankProductOwnedOdds: Readonly<Record<MimicBankGemCost, MimicBankOdds>> = {
  10: { 'return-10': 0.30, 'return-50': 0.35, 'return-100': 0.25, 'return-200': 0.10 },
  20: { 'return-10': 0.22, 'return-50': 0.30, 'return-100': 0.30, 'return-200': 0.18 },
  30: { 'return-10': 0.15, 'return-50': 0.25, 'return-100': 0.32, 'return-200': 0.28 },
};

export function mimicBankOutcomeForRoll(cost: MimicBankGemCost, roll: number): MimicBankOutcomeDefinition {
  const odds = mimicBankProductOwnedOdds[cost];
  let cursor = 0;
  for (const outcome of mimicBankOutcomes) {
    cursor += odds[outcome.id];
    if (roll < cursor) return outcome;
  }
  return mimicBankOutcomes[mimicBankOutcomes.length - 1]!;
}
