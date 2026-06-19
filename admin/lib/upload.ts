import axios from "axios";

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
      { trait_type: "Appraised Value", value: `$${appraisedValueUsd}` },
      { trait_type: "Item ID", value: itemId },
      { trait_type: "Custodian", value: "Antique Vault" },
      { trait_type: "Status", value: "In Vault" },
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
