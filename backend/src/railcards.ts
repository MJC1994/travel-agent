export interface Railcard {
  code: string
  name: string
}

/** Supported railcards — source: railcards.txt */
export const RAILCARDS: readonly Railcard[] = [
  { code: '2TR', name: 'Two Together Railcard' },
  { code: 'DIC', name: 'Disabled Child Railcard' },
  { code: 'FAM', name: 'Family & Friends Railcard' },
  { code: 'NEW', name: 'Network Railcard' },
  { code: 'SRN', name: 'Senior Railcard' },
  { code: 'TST', name: '26-30 Railcard' },
  { code: 'TSU', name: '16-17 Saver' },
  { code: 'VET', name: 'Veterans Railcard' },
  { code: 'YNG', name: '16-25 Railcard' },
] as const

const CODE_SET = new Set(RAILCARDS.map((card) => card.code))

function normalizeAlias(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Phrase → official code. Keys are normalized via {@link normalizeAlias}. */
const RAILCARD_ALIASES: Record<string, string> = {
  // Two Together (2TR)
  '2 together': '2TR',
  '2 together railcard': '2TR',
  '2tr': '2TR',
  'two together': '2TR',
  'two together card': '2TR',
  'two together railcard': '2TR',

  // Disabled Child (DIC)
  'child disability railcard': 'DIC',
  dic: 'DIC',
  'disabled child': 'DIC',
  'disabled child railcard': 'DIC',
  'disabled childs railcard': 'DIC',

  // Family & Friends (FAM)
  fam: 'FAM',
  'family and friends': 'FAM',
  'family and friends card': 'FAM',
  'family and friends railcard': 'FAM',
  'family card': 'FAM',
  'family friends railcard': 'FAM',
  'family railcard': 'FAM',

  // Network (NEW)
  network: 'NEW',
  'network card': 'NEW',
  'network railcard': 'NEW',
  new: 'NEW',

  // Senior (SRN)
  oap: 'SRN',
  'old age pensioner': 'SRN',
  'old age pensioner railcard': 'SRN',
  pensioner: 'SRN',
  'pensioner railcard': 'SRN',
  senior: 'SRN',
  'senior card': 'SRN',
  'senior citizen': 'SRN',
  'senior citizen railcard': 'SRN',
  'senior railcard': 'SRN',
  srn: 'SRN',

  // 26-30 (TST)
  '26 30': 'TST',
  '26 30 railcard': 'TST',
  '26 to 30': 'TST',
  '26 to 30 railcard': 'TST',
  '26-30': 'TST',
  '26-30 railcard': 'TST',
  tst: 'TST',
  'twenty six to thirty': 'TST',
  'twenty six to thirty railcard': 'TST',

  // 16-17 Saver (TSU)
  '16 17': 'TSU',
  '16 17 railcard': 'TSU',
  '16 17 saver': 'TSU',
  '16 to 17': 'TSU',
  '16 to 17 railcard': 'TSU',
  '16 to 17 saver': 'TSU',
  '16-17': 'TSU',
  '16-17 railcard': 'TSU',
  '16-17 saver': 'TSU',
  'sixteen to seventeen saver': 'TSU',
  tsu: 'TSU',

  // Veterans (VET)
  vet: 'VET',
  'vet railcard': 'VET',
  veteran: 'VET',
  'veteran railcard': 'VET',
  veterans: 'VET',
  'veterans card': 'VET',
  'veterans railcard': 'VET',

  // 16-25 (YNG)
  '16 25': 'YNG',
  '16 25 railcard': 'YNG',
  '16 to 25': 'YNG',
  '16 to 25 railcard': 'YNG',
  '16-25': 'YNG',
  '16-25 railcard': 'YNG',
  'sixteen to twenty five': 'YNG',
  'sixteen to twenty five railcard': 'YNG',
  'young person railcard': 'YNG',
  'young persons railcard': 'YNG',
  yng: 'YNG',
}

for (const card of RAILCARDS) {
  RAILCARD_ALIASES[normalizeAlias(card.code)] = card.code
  RAILCARD_ALIASES[normalizeAlias(card.name)] = card.code
}

export function resolveRailcardCode(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const upper = trimmed.toUpperCase()
  if (CODE_SET.has(upper)) {
    return upper
  }

  const alias = RAILCARD_ALIASES[normalizeAlias(trimmed)]
  return alias ?? null
}

export function normalizeRailcardCode(value: string): string {
  return resolveRailcardCode(value) ?? value.trim().toUpperCase()
}

export function railcardNameForCode(code: string): string | undefined {
  return RAILCARDS.find((card) => card.code === code)?.name
}

export function formatSupportedRailcardsForPrompt(): string {
  return RAILCARDS.map((card) => `${card.name} (${card.code})`).join(', ')
}
