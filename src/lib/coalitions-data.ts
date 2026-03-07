// d/acc taxonomy data for the Coalitional Funding Cartography tool
// Based on wtfisdacc.com framework

export interface Domain {
  id: string;
  name: string;
  description: string;
  quadrant: "atoms-survive" | "atoms-thrive" | "bits-survive" | "bits-thrive";
  parentDomain?: string;
  examples: string[];
  relatedMechanisms: string[];
}

export interface DaccScore {
  defensive: number;
  decentralized: number;
  democratic: number;
  differential: number;
  total: number;
}

export interface InterestSignal {
  domainId: string;
  count: number;
  trend: "up" | "down" | "stable";
  recentQueries: number; // last 30 days
}

// The Four D's diagnostic checklist
export const diagnosticChecklist = [
  {
    id: "defensive",
    label: "Defensive",
    question:
      "Does this make it easier to defend against harm than to cause harm?",
    icon: "Shield",
  },
  {
    id: "decentralized",
    label: "Decentralized",
    question:
      "Can this operate without requiring trust that centralized actors will remain benevolent?",
    icon: "Network",
  },
  {
    id: "democratic",
    label: "Democratic",
    question:
      "Does this enable more people to participate meaningfully in governance and coordination?",
    icon: "Users",
  },
  {
    id: "differential",
    label: "Differential",
    question:
      "Does this make defense grow faster than offense over time?",
    icon: "TrendingUp",
  },
] as const;

// Two axes of the d/acc framework
export const axes = {
  x: {
    id: "survive-thrive",
    label: "Survive vs. Thrive",
    description:
      "From baseline defensive capacity to long-term positive-sum coordination",
    left: { label: "Survive", description: "Protecting against threats, building resilience" },
    right: { label: "Thrive", description: "Enabling cooperation, creating abundance" },
  },
  y: {
    id: "atoms-bits",
    label: "Atoms vs. Bits",
    description:
      "From physical-world systems to digital systems",
    top: { label: "Bits", description: "Digital: cryptography, protocols, software" },
    bottom: { label: "Atoms", description: "Physical: biosecurity, energy, hardware" },
  },
} as const;

// Domain taxonomy organized by quadrant
// Sourced from the Gitcoin d/acc Market Map
export const domains: Domain[] = [
  // ── ATOMS + SURVIVE (Physical Defense) ──────────────────────────────
  {
    id: "biodefense-health",
    name: "Biodefense & Health Systems",
    description: "Pandemic preparedness, pathogen monitoring, biodefense infrastructure, and public health resilience",
    quadrant: "atoms-survive",
    examples: ["Balvi", "Kanro", "PathCheck", "Varro Biosensors", "OpenWater", "Opentrons"],
    relatedMechanisms: [],
  },
  {
    id: "resilient-manufacturing",
    name: "Resilient Manufacturing",
    description: "Distributed, redundant manufacturing capacity that reduces single points of failure",
    quadrant: "atoms-survive",
    examples: ["Formlabs", "Hadrian", "Relativity Space", "Firehawk Aerospace"],
    relatedMechanisms: [],
  },
  {
    id: "open-hardware-silicon",
    name: "Open Source Hardware & Silicon",
    description: "Open source chip designs and hardware that reduce dependency on centralized vendors",
    quadrant: "atoms-survive",
    examples: ["RISC-V", "SiFive", "Raspberry Pi", "Seeed Studio", "Framework"],
    relatedMechanisms: [],
  },

  // ── ATOMS + THRIVE (Physical Coordination) ─────────────────────────
  {
    id: "property-rights",
    name: "Property Rights & Registration",
    description: "Transparent, tamper-proof property registries and land rights systems",
    quadrant: "atoms-thrive",
    examples: ["Medici Land Governance", "India Property Platform", "Georgia Land Registry", "RealIT"],
    relatedMechanisms: [],
  },
  {
    id: "decentralized-energy",
    name: "Decentralized Energy",
    description: "Community-scale energy networks, microgrids, and renewable infrastructure",
    quadrant: "atoms-thrive",
    examples: ["Energy Web Foundation", "Power Ledger", "Community Solar", "LO3 Energy"],
    relatedMechanisms: [],
  },
  {
    id: "civic-tech",
    name: "Civic Tech",
    description: "Technology for civic participation, public goods, and community coordination",
    quadrant: "atoms-thrive",
    examples: ["Decide Madrid", "Consul", "Polis", "vTaiwan"],
    relatedMechanisms: [],
  },
  {
    id: "green-chain-infrastructure",
    name: "Green Chain Infrastructure",
    description: "Blockchain-based environmental monitoring, carbon markets, and sustainability systems",
    quadrant: "atoms-thrive",
    examples: ["Toucan Protocol", "KlimaDAO", "Regen Network", "Nori"],
    relatedMechanisms: [],
  },
  {
    id: "data-availability-storage",
    name: "Data Availability & Storage",
    description: "Decentralized data persistence and availability layers for resilient information systems",
    quadrant: "atoms-thrive",
    examples: ["Filecoin", "Arweave", "Ceramic", "IPFS"],
    relatedMechanisms: [],
  },

  // ── BITS + SURVIVE (Digital Defense) ────────────────────────────────
  {
    id: "communication-messaging",
    name: "Communication & Messaging",
    description: "End-to-end encrypted messaging and private communication infrastructure",
    quadrant: "bits-survive",
    examples: ["Signal", "Session", "SimpleX", "CryptPad", "Briar", "Element"],
    relatedMechanisms: [],
  },
  {
    id: "decentralized-identity",
    name: "Decentralized Identity & Attestation",
    description: "Self-sovereign identity, attestation systems, and sybil resistance",
    quadrant: "bits-survive",
    examples: ["Gitcoin Passport", "ENS", "Worldcoin", "BrightID", "Spruce", "Holonym", "Anima"],
    relatedMechanisms: [],
  },
  {
    id: "proof-verification-security",
    name: "Proof Verification & Security",
    description: "Smart contract auditing, formal verification, and security infrastructure",
    quadrant: "bits-survive",
    examples: ["Trail of Bits", "OpenZeppelin", "Certora", "Immunefi", "Quantstamp"],
    relatedMechanisms: [],
  },
  {
    id: "zero-knowledge-systems",
    name: "Zero-Knowledge Systems",
    description: "Cryptographic systems enabling verification without revealing underlying data",
    quadrant: "bits-survive",
    examples: ["Aztec Network", "Aleo", "StarkNet", "Polygon zkEVM", "zkSync", "Mina"],
    relatedMechanisms: [],
  },
  {
    id: "privacy-preserving-computation",
    name: "Privacy Preserving Computation",
    description: "Fully homomorphic encryption, multi-party computation, and private compute",
    quadrant: "bits-survive",
    examples: ["Zama", "Fhenix", "Sunscreen", "Inco Network", "Partisia"],
    relatedMechanisms: [],
  },

  // ── BITS + THRIVE (Digital Coordination) ────────────────────────────
  {
    id: "assessment-tooling",
    name: "Assessment Tooling",
    description: "Tools for evaluating impact, measuring outcomes, and scoring coordination systems",
    quadrant: "bits-thrive",
    examples: ["DeepDAO", "Karma", "RegenScore", "OpenQ"],
    relatedMechanisms: [],
  },
  {
    id: "systems-infrastructure",
    name: "Systems Infrastructure",
    description: "Core protocol infrastructure, indexing, and cross-chain interoperability",
    quadrant: "bits-thrive",
    examples: ["The Graph", "LayerZero", "Wormhole", "Connext", "Hyperlane"],
    relatedMechanisms: [],
  },
  {
    id: "democratic-funding-systems",
    name: "Democratic Funding Systems",
    description: "Capital allocation mechanisms for public goods using democratic inputs",
    quadrant: "bits-thrive",
    examples: ["Gitcoin Grants", "Optimism RPGF", "Giveth", "CLR.fund", "Allo Protocol", "Endaoment"],
    relatedMechanisms: [],
  },
  {
    id: "governance-treasury",
    name: "Governance & Treasury",
    description: "DAO governance frameworks, voting systems, and treasury management",
    quadrant: "bits-thrive",
    examples: ["Snapshot", "Tally", "Aragon", "Safe", "Governor", "Jokerace"],
    relatedMechanisms: [],
  },
  {
    id: "decentralized-monetary-policy",
    name: "Decentralized Monetary Policy",
    description: "Algorithmic and community-governed monetary systems and stablecoins",
    quadrant: "bits-thrive",
    examples: ["MakerDAO", "Reflexer", "Liquity", "Ampleforth", "Ethena"],
    relatedMechanisms: [],
  },
  {
    id: "oracle-networks",
    name: "Oracle Networks",
    description: "Decentralized data feeds connecting onchain systems to real-world information",
    quadrant: "bits-thrive",
    examples: ["Chainlink", "UMA", "Pyth", "RedStone", "API3"],
    relatedMechanisms: [],
  },
  {
    id: "prediction-markets",
    name: "Prediction Markets",
    description: "Decentralized information markets for epistemic defense and collective intelligence",
    quadrant: "bits-thrive",
    examples: ["Polymarket", "Augur", "Gnosis", "Metaculus"],
    relatedMechanisms: [],
  },
  {
    id: "ecosystem-services",
    name: "Ecosystem Services",
    description: "Coordination platforms, grants management, and ecosystem support tooling",
    quadrant: "bits-thrive",
    examples: ["Passage", "Questbook", "Hats Protocol", "Coordinape", "Gitcoin"],
    relatedMechanisms: [],
  },
];

// Quadrant metadata
export const quadrants = [
  {
    id: "atoms-survive" as const,
    label: "Physical Defense",
    axis: { x: "Survive", y: "Atoms" },
    description: "Protecting bodies, infrastructure, and material systems",
    color: "text-orange-400",
    bgColor: "bg-orange-400/10",
    borderColor: "border-orange-400/30",
  },
  {
    id: "atoms-thrive" as const,
    label: "Physical Coordination",
    axis: { x: "Thrive", y: "Atoms" },
    description: "Enabling cooperation in the physical world",
    color: "text-green-400",
    bgColor: "bg-green-400/10",
    borderColor: "border-green-400/30",
  },
  {
    id: "bits-survive" as const,
    label: "Digital Defense",
    axis: { x: "Survive", y: "Bits" },
    description: "Preserving agency in the digital sphere",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    borderColor: "border-blue-400/30",
  },
  {
    id: "bits-thrive" as const,
    label: "Digital Coordination",
    axis: { x: "Thrive", y: "Bits" },
    description: "Enabling cooperation through digital systems",
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
    borderColor: "border-purple-400/30",
  },
] as const;

// Simulated interest data (in production, this would come from a database)
// Seeded with realistic initial values to make the tool feel alive
export const initialInterestData: Record<string, InterestSignal> = Object.fromEntries(
  domains.map((d) => [
    d.id,
    {
      domainId: d.id,
      count: Math.floor(Math.random() * 40) + 5,
      trend: (["up", "down", "stable"] as const)[Math.floor(Math.random() * 3)],
      recentQueries: Math.floor(Math.random() * 20) + 1,
    },
  ])
);
