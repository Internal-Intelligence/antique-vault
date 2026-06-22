import axios from "axios";

/// ═══════════════════════════════════════════════════════════════════════════
/// IMAGE API — Sovereign Decentralized Visual Provenance for E-Waste RWAs
/// 
/// uploadImageToPinata + uploadMetadataToPinata + buildNftMetadata
/// 
/// Flow:
///   1. Admin uploads device photos (multiple)
///   2. Pinata pins to IPFS (permanent, content-addressed)
///   3. Metadata JSON references images + AI valuation attrs
///   4. NFT minted with URI → customer fetchNftImage pulls canonical cover
/// 
/// Quantum note: the visual "state" is immutable once minted. Future CV models
/// can re-analyze the exact same images to improve predictive models.
/// 
/// AGENT 11 DOCUMENTED
/// ═══════════════════════════════════════════════════════════════════════════

const PINATA_API = "https://api.pinata.cloud";

function getJwt() {
  const jwt = process.env.NEXT_PUBLIC_PINATA_JWT;
  if (!jwt) throw new Error("NEXT_PUBLIC_PINATA_JWT not set in .env.local");
  return jwt;
}

export async function uploadImageToPinata(file: File): Promise<string> {
  const jwt = getJwt();
  const formData = new FormData();
  formData.append("file", file);
  formData.append(
    "pinataMetadata",
    JSON.stringify({ name: `antique-vault-${file.name}` })
  );
  formData.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

  const res = await axios.post(`${PINATA_API}/pinning/pinFileToIPFS`, formData, {
    headers: { Authorization: `Bearer ${jwt}` },
  });

  const gateway =
    process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud";
  return `${gateway}/ipfs/${res.data.IpfsHash}`;
}

export async function uploadMetadataToPinata(metadata: object): Promise<string> {
  const jwt = getJwt();

  const res = await axios.post(`${PINATA_API}/pinning/pinJSONToIPFS`, metadata, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    },
  });

  const gateway =
    process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud";
  return `${gateway}/ipfs/${res.data.IpfsHash}`;
}

// Build metadata consumed by Metaplex + displayed in wallets/explorers.
// Captures AI valuation, condition, category (for working/non-working) and image set.
export function buildNftMetadata({
  name,
  description,
  category,
  condition,
  appraisedValueUsd,
  itemId,
  imageUri,
  additionalImageUris,
}: {
  name: string;
  description: string;
  category: string;
  condition: string;
  appraisedValueUsd: string;
  itemId: string;
  imageUri: string;
  additionalImageUris: string[];
}) {
  return {
    name,
    description,
    image: imageUri,
    attributes: [
      { trait_type: "Category", value: category },
      { trait_type: "Condition", value: condition },
      { trait_type: "Functional", value: description.includes("Non-working") || description.includes("parts") ? "Non-Working" : "Working" },
      { trait_type: "Appraised Value", value: `$${appraisedValueUsd}` },
      { trait_type: "Item ID", value: itemId },
      { trait_type: "Custodian", value: "E-Waste Vault" },
      { trait_type: "Status", value: "In Vault" },
      { trait_type: "Weight Class", value: "< 15 lbs" },
    ],
    properties: {
      files: [
        { uri: imageUri, type: "image/jpeg" },
        ...additionalImageUris.map((uri) => ({ uri, type: "image/jpeg" })),
      ],
      category: "image",
    },
  };
}
