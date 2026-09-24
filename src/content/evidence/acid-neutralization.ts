/**
 * Evidence registry.
 *
 * Verbatim encoding of docs/scientific-evidence-register.md. Two separate,
 * immutable namespaces per release: SOURCE_KEYS (citations) and CLAIM_KEYS
 * (assertions). A calculation trace cites claim keys; a claim resolves to
 * source keys. UI renders citations from this registry and never re-hardcodes
 * metadata (register §7).
 *
 * The register is the decision source for which source backs which claim and
 * under which condition. Nothing here may be relaxed without a new release.
 */

export const EVIDENCE_REGISTER_VERSION = '1.0.0'

export const SOURCE_TYPES = [
  'authoritative-definition',
  'authoritative-technical',
  'primary-experimental',
  'laboratory-procedure',
  'safety-authority',
  'supporting-study',
] as const

export type SourceType = (typeof SOURCE_TYPES)[number]

export const EVIDENCE_STATUSES = [
  'source-checked',
  'model-derived',
  'cross-checked',
  'supporting-only',
  'excluded-from-model',
] as const

export type EvidenceStatus = (typeof EVIDENCE_STATUSES)[number]

export const CLAIM_USAGES = ['constant', 'procedure', 'limitation', 'safety', 'supporting'] as const

export type ClaimUsage = (typeof CLAIM_USAGES)[number]

/** register §7 — EvidenceSource */
export type EvidenceSource = {
  key: string
  title: string
  authorsOrOrganization: string
  year: number | null
  url: string
  sourceType: SourceType
  checkedAt: string
  locations: string[]
  conditions: string[]
  limitations: string[]
}

/** register §7 — ClaimEvidenceLink */
export type ClaimEvidenceLink = {
  claimKey: string
  sourceKeys: string[]
  usage: ClaimUsage
  transformation?: string
  status: EvidenceStatus
}

/** register §3.2 — value derived from a source by an explicit transformation. */
export type DerivedValue = {
  key: string
  claimKey: string
  transformation: string
  implementationValue: number
}

const CHECKED_AT = '2026-08-27'

/** register §3 — acid neutralization sources. */
export const ACID_SOURCES: Record<string, EvidenceSource> = {
  'IUPAC-PH': {
    key: 'IUPAC-PH',
    title: 'IUPAC Gold Book — pH',
    authorsOrOrganization: 'IUPAC',
    year: null,
    url: 'https://goldbook.iupac.org/terms/view/P04524',
    sourceType: 'authoritative-definition',
    checkedAt: CHECKED_AT,
    locations: ['Definition of pH; measurement notes'],
    conditions: ['Activity-based definition of pH'],
    limitations: ['pH is defined by H+ activity, not concentration'],
  },
  'IAPWS-KW-2024': {
    key: 'IAPWS-KW-2024',
    title: 'IAPWS R11-24 — Ionization constant of water',
    authorsOrOrganization: 'IAPWS',
    year: 2024,
    url: 'https://iapws.org/documents/release/Ionization.download',
    sourceType: 'authoritative-definition',
    checkedAt: CHECKED_AT,
    locations: ['§1', '§3', 'Table 3'],
    conditions: ['25 °C', '0.1 MPa'],
    limitations: ['Value applies to pure water at the stated condition only'],
  },
  'USGS-PHREEQC-1995': {
    key: 'USGS-PHREEQC-1995',
    title: 'PHREEQC User Guide — Attachment B, PHREEQC.DAT',
    authorsOrOrganization: 'USGS',
    year: 1995,
    url: 'https://pubs.usgs.gov/wri/1995/4227/report.pdf',
    sourceType: 'authoritative-technical',
    checkedAt: CHECKED_AT,
    locations: ['Attachment B, PHREEQC.DAT'],
    conditions: ['25 °C database convention', 'Ideal activity bundle'],
    limitations: [
      'Database convention differs between scenarios; do not compare pH digits across scenarios',
    ],
  },
  'NIST-CAOH2-1956': {
    key: 'NIST-CAOH2-1956',
    title: 'Calcium hydroxide solubility (NBS/NIST J. Res.)',
    authorsOrOrganization: 'Bates et al., National Bureau of Standards',
    year: 1956,
    url: 'https://nvlpubs.nist.gov/nistpubs/jres/56/jresv56n6p305_A1b.pdf',
    sourceType: 'primary-experimental',
    checkedAt: CHECKED_AT,
    locations: ['§5.1, pp. 307–308'],
    conditions: ['25 °C'],
    limitations: [
      'Solubility ≈ 0.0203 molal; scenario uses a filtered, standardized clear solution below it, never a slurry',
    ],
  },
  'USGS-ALK-FAQ': {
    key: 'USGS-ALK-FAQ',
    title: 'USGS Alkalinity Calculator FAQ',
    authorsOrOrganization: 'USGS',
    year: null,
    url: 'https://or.water.usgs.gov/alk/faq.html',
    sourceType: 'authoritative-technical',
    checkedAt: CHECKED_AT,
    locations: ['§3.1'],
    conditions: ['Open system with CO2 exchange'],
    limitations: ['CO2 exchange can shift pH substantially; scenario models a closed system'],
  },
  'USGS-FIELD-ALK': {
    key: 'USGS-FIELD-ALK',
    title: 'USGS National Field Manual, Ch. 6.6 — Alkalinity',
    authorsOrOrganization: 'USGS',
    year: null,
    url: 'https://pubs.usgs.gov/twri/twri9a6/twri9a66/twri9a_chapter6.6._v3.pdf',
    sourceType: 'authoritative-technical',
    checkedAt: CHECKED_AT,
    locations: ['Sample preparation and titration'],
    conditions: ['Field sampling procedure'],
    limitations: ['Reduce air exposure; procedure guidance, not a quantitative constant'],
  },
  'VALENCIA-TITRATION': {
    key: 'VALENCIA-TITRATION',
    title: 'CHM 1046 Experimental Lab Manual — Barnett, First Edition 2012',
    authorsOrOrganization: 'Valencia College',
    year: 2012,
    url: 'https://frontdoor.valenciacollege.edu/file/vprasadpermaul/CHM%201046%20Experimental%20Lab%20Manual%20-%20Barnett%20-%20First%20Edition%202012.pdf',
    sourceType: 'laboratory-procedure',
    checkedAt: CHECKED_AT,
    locations: ['p. 71, steps 19–24'],
    conditions: ['Potentiometric titration at a bench'],
    limitations: ['Supports stable-reading and small-aliquot procedure, not kinetics'],
  },
  'FSU-TITRATION': {
    key: 'FSU-TITRATION',
    title: 'Potentiometric titration procedure',
    authorsOrOrganization: 'Florida State University',
    year: null,
    url: 'https://www.chem.fsu.edu/chemlab/chm3120l/acid/procedure.html',
    sourceType: 'laboratory-procedure',
    checkedAt: CHECKED_AT,
    locations: ['Potentiometric titration procedure'],
    conditions: ['Undergraduate laboratory'],
    limitations: ['Procedure guidance only'],
  },
  'ASTM-D1067-16': {
    key: 'ASTM-D1067-16',
    title: 'ASTM D1067-16 — Standard Test Methods for Iron in Water',
    authorsOrOrganization: 'ASTM International',
    year: 2016,
    url: 'https://store.astm.org/d1067-16.html',
    sourceType: 'authoritative-technical',
    checkedAt: CHECKED_AT,
    locations: ['§§1.2–1.3', '§§4.1–4.2'],
    conditions: ['Standard test method scope'],
    limitations: [
      'Endpoint and suitability depend on matrix, buffering and target; no dose inference for unknown samples',
    ],
  },
  'EPA-AMD-NEUTRALIZATION': {
    key: 'EPA-AMD-NEUTRALIZATION',
    title: 'EPA Design Manual — Acid Mine Drainage treatment',
    authorsOrOrganization: 'US EPA',
    year: null,
    url: 'https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=20007H0I.TXT',
    sourceType: 'authoritative-technical',
    checkedAt: CHECKED_AT,
    locations: ['Chemical treatment / alkali selection'],
    conditions: ['Lime, limestone, caustic, soda ash selection'],
    limitations: [
      'Supporting-only: proves the process exists; does not supply model constants or predict field performance',
    ],
  },
  'APPLIED-WATER-NEUTRALIZATION': {
    key: 'APPLIED-WATER-NEUTRALIZATION',
    title: 'Comparison of neutralization efficiency',
    authorsOrOrganization: 'Applied Water Science',
    year: null,
    url: 'https://link.springer.com/article/10.1007/s13201-016-0391-6',
    sourceType: 'primary-experimental',
    checkedAt: CHECKED_AT,
    locations: ['Experimental comparison of neutralizing agents'],
    conditions: ['Reported experimental conditions of the study'],
    limitations: ['Supporting-only: not used to derive a model constant'],
  },
  'NIOSH-HCL': {
    key: 'NIOSH-HCL',
    title: 'NIOSH Pocket Guide — Hydrogen chloride',
    authorsOrOrganization: 'NIOSH',
    year: null,
    url: 'https://www.cdc.gov/niosh/npg/npgd0332.html',
    sourceType: 'safety-authority',
    checkedAt: CHECKED_AT,
    locations: ['Exposure routes, symptoms, PPE / first aid'],
    conditions: ['Occupational exposure'],
    limitations: ['Hazard wording only; supervised laboratory context'],
  },
  'NIOSH-NAOH': {
    key: 'NIOSH-NAOH',
    title: 'NIOSH Pocket Guide — Sodium hydroxide',
    authorsOrOrganization: 'NIOSH',
    year: null,
    url: 'https://www.cdc.gov/niosh/npg/npgd0565.html',
    sourceType: 'safety-authority',
    checkedAt: CHECKED_AT,
    locations: ['Corrosive hazard; eye and skin protection'],
    conditions: ['Occupational exposure'],
    limitations: ['Hazard wording only; supervised laboratory context'],
  },
  'NIOSH-CAOH2': {
    key: 'NIOSH-CAOH2',
    title: 'NIOSH — Calcium hydroxide',
    authorsOrOrganization: 'NIOSH',
    year: null,
    url: 'https://www.cdc.gov/niosh/chemicals/pel88/pell-pages/1305-62.html',
    sourceType: 'safety-authority',
    checkedAt: CHECKED_AT,
    locations: ['Hazard wording'],
    conditions: ['Occupational exposure'],
    limitations: ['Hazard wording only; supervised laboratory context'],
  },
  'PUBCHEM-NA2CO3': {
    key: 'PUBCHEM-NA2CO3',
    title: 'PubChem — Sodium carbonate',
    authorsOrOrganization: 'PubChem / NIH',
    year: null,
    url: 'https://pubchem.ncbi.nlm.nih.gov/compound/Sodium-carbonate',
    sourceType: 'safety-authority',
    checkedAt: CHECKED_AT,
    locations: ['Hazard and irritation information; source aggregation'],
    conditions: ['Aggregated SDS content'],
    limitations: ['Hazard wording only; supervised laboratory context'],
  },
}

/** register §3.1 — acid neutralization claim mapping. */
export const ACID_CLAIMS: Record<string, ClaimEvidenceLink> = {
  'AN-PH-DEFINITION': {
    claimKey: 'AN-PH-DEFINITION',
    sourceKeys: ['IUPAC-PH'],
    usage: 'constant',
    status: 'source-checked',
  },
  'AN-KW-25C': {
    claimKey: 'AN-KW-25C',
    sourceKeys: ['IAPWS-KW-2024'],
    usage: 'constant',
    status: 'source-checked',
  },
  'AN-CARBONATE-CONSTANTS': {
    claimKey: 'AN-CARBONATE-CONSTANTS',
    sourceKeys: ['USGS-PHREEQC-1995'],
    usage: 'constant',
    status: 'source-checked',
  },
  'AN-CAOH-COMPLEX': {
    claimKey: 'AN-CAOH-COMPLEX',
    sourceKeys: ['USGS-PHREEQC-1995'],
    usage: 'constant',
    status: 'source-checked',
  },
  'AN-CAOH2-CONCENTRATION': {
    claimKey: 'AN-CAOH2-CONCENTRATION',
    sourceKeys: ['NIST-CAOH2-1956'],
    usage: 'limitation',
    status: 'source-checked',
  },
  'AN-CLOSED-CARBON': {
    claimKey: 'AN-CLOSED-CARBON',
    sourceKeys: ['USGS-PHREEQC-1995', 'USGS-ALK-FAQ'],
    usage: 'limitation',
    status: 'model-derived',
  },
  'AN-ALIQUOT-PROCEDURE': {
    claimKey: 'AN-ALIQUOT-PROCEDURE',
    sourceKeys: ['VALENCIA-TITRATION', 'FSU-TITRATION'],
    usage: 'procedure',
    status: 'source-checked',
  },
  'AN-MATRIX-LIMIT': {
    claimKey: 'AN-MATRIX-LIMIT',
    sourceKeys: ['ASTM-D1067-16', 'EPA-AMD-NEUTRALIZATION'],
    usage: 'limitation',
    status: 'source-checked',
  },
  'AN-SAFETY-WORDING': {
    claimKey: 'AN-SAFETY-WORDING',
    sourceKeys: ['NIOSH-HCL', 'NIOSH-NAOH', 'NIOSH-CAOH2', 'PUBCHEM-NA2CO3'],
    usage: 'safety',
    status: 'source-checked',
  },
  'AN-G01-G08': {
    claimKey: 'AN-G01-G08',
    sourceKeys: ['IAPWS-KW-2024', 'USGS-PHREEQC-1995'],
    usage: 'constant',
    status: 'cross-checked',
  },
}

/** register §3.2 — derived implementation values. */
export const ACID_DERIVED_VALUES: Record<string, DerivedValue> = {
  'AN-KW': {
    key: 'AN-KW',
    claimKey: 'AN-KW-25C',
    transformation: '10^-13.990',
    implementationValue: 1.023292992e-14,
  },
  'AN-KA1': {
    key: 'AN-KA1',
    claimKey: 'AN-CARBONATE-CONSTANTS',
    transformation: '10^-6.352',
    implementationValue: 4.446312675e-7,
  },
  'AN-KA2': {
    key: 'AN-KA2',
    claimKey: 'AN-CARBONATE-CONSTANTS',
    transformation: '10^-10.329',
    implementationValue: 4.688133821e-11,
  },
  'AN-KH-CA': {
    key: 'AN-KH-CA',
    claimKey: 'AN-CAOH-COMPLEX',
    transformation: '10^-12.780',
    implementationValue: 1.659586907e-13,
  },
}

/** Golden-case provenance envelope required by register §8. */
export type GoldenCaseProvenance = {
  caseId: string
  scenarioVersion: string
  constantBundle: string
  sourceKeys: string[]
  derivation: string
  independentCheck: boolean
  tolerances: Record<string, number>
}

export const ACID_GOLDEN_PROVENANCE: GoldenCaseProvenance = {
  caseId: 'AN-G01-G08',
  scenarioVersion: '1.0.0',
  constantBundle: 'acid-neutralization-1.0.0',
  sourceKeys: ['IAPWS-KW-2024', 'USGS-PHREEQC-1995'],
  derivation: 'locked charge-balance solver (bisection on pH in [-2, 16])',
  independentCheck: true,
  tolerances: { pH: 0.002 },
}

export const ACID_SOURCE_KEYS = Object.keys(ACID_SOURCES)
export const ACID_CLAIM_KEYS = Object.keys(ACID_CLAIMS)
