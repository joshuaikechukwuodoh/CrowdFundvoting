import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ethers } from "ethers";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { eq } from "drizzle-orm";
import type { UploadApiResponse } from "cloudinary";
import crowdFundAbi from "./crowdfund.json" with { type: "json" };
import { db } from "./db/index.js";
import { campaigns as campaignsTable } from "./db/schema.js";

dotenv.config({ quiet: true });

const app = express();
app.use(cors());
app.use(express.json());

// ======================
// CONFIG
// ======================
const PORT = Number(process.env.PORT) || 3001;
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

if (!CONTRACT_ADDRESS) {
  throw new Error("CONTRACT_ADDRESS is not set in .env");
}

function blockchainErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (
    message.includes("ECONNREFUSED") ||
    message.includes("fetch failed") ||
    message.includes("could not detect network")
  ) {
    return `Cannot reach blockchain RPC at ${RPC_URL}. Start Hardhat node and deploy CrowdFund.`;
  }
  if (message.includes("could not decode result data") || message.includes("BAD_DATA")) {
    return `No contract code at ${CONTRACT_ADDRESS}. Redeploy CrowdFund and update CONTRACT_ADDRESS.`;
  }
  return message;
}

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer (for handling file uploads)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image uploads are allowed"));
    }
  },
});

// Blockchain connection
const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, crowdFundAbi, provider);

type OnChainCampaign = {
  creator: string;
  goal: bigint;
  deadline: bigint;
  amountRaised: bigint;
  claimed: boolean;
  title: string;
};

function formatCampaign(id: number, campaign: OnChainCampaign) {
  return {
    id,
    creator: campaign.creator,
    goal: ethers.formatEther(campaign.goal),
    deadline: Number(campaign.deadline),
    amountRaised: ethers.formatEther(campaign.amountRaised),
    claimed: campaign.claimed,
    title: campaign.title,
  };
}

// ======================
// ROUTES
// ======================

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    contract: CONTRACT_ADDRESS,
    rpc: RPC_URL,
  });
});

// Get total number of campaigns
app.get("/campaigns/count", async (_req, res) => {
  try {
    const count = await contract.getFunction("campaignCount")();
    res.json({ count: Number(count) });
  } catch (error) {
    console.error("Failed to get campaign count:", error);
    res.status(500).json({
      error: "Failed to get campaign count",
      detail: blockchainErrorMessage(error),
    });
  }
});

// Get one campaign by ID (on-chain + optional off-chain metadata)
app.get("/campaigns/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 0) {
      return res.status(400).json({ error: "Invalid campaign id" });
    }

    const campaign = (await contract.getFunction("getCampaign")(
      id
    )) as OnChainCampaign;

    // Empty creator means campaign does not exist on-chain
    if (campaign.creator === ethers.ZeroAddress) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    const [meta] = await db
      .select()
      .from(campaignsTable)
      .where(eq(campaignsTable.onChainId, id))
      .limit(1);

    res.json({
      ...formatCampaign(id, campaign),
      description: meta?.description ?? null,
      imageUrl: meta?.imageUrl ?? null,
      category: meta?.category ?? null,
    });
  } catch (error) {
    console.error("Failed to get campaign:", error);
    res.status(500).json({
      error: "Failed to get campaign",
      detail: blockchainErrorMessage(error),
    });
  }
});

// Get all campaigns (on-chain + optional off-chain metadata)
app.get("/campaigns", async (_req, res) => {
  try {
    const count = Number(await contract.getFunction("campaignCount")());
    const metaRows = await db.select().from(campaignsTable);
    const metaByOnChainId = new Map(
      metaRows.map((row) => [row.onChainId, row] as const)
    );

    const campaigns = [];
    for (let i = 0; i < count; i++) {
      const campaign = (await contract.getFunction("getCampaign")(
        i
      )) as OnChainCampaign;
      const meta = metaByOnChainId.get(i);

      campaigns.push({
        ...formatCampaign(i, campaign),
        description: meta?.description ?? null,
        imageUrl: meta?.imageUrl ?? null,
        category: meta?.category ?? null,
      });
    }

    res.json(campaigns);
  } catch (error) {
    console.error("Failed to get campaigns:", error);
    res.status(500).json({
      error: "Failed to get campaigns",
      detail: blockchainErrorMessage(error),
    });
  }
});

// Save / update off-chain metadata for a campaign (description, image, category)
app.post("/campaigns/:id/metadata", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 0) {
      return res.status(400).json({ error: "Invalid campaign id" });
    }

    const { description, imageUrl, category } = req.body as {
      description?: string;
      imageUrl?: string;
      category?: string;
    };

    const campaign = (await contract.getFunction("getCampaign")(
      id
    )) as OnChainCampaign;

    if (campaign.creator === ethers.ZeroAddress) {
      return res.status(404).json({ error: "Campaign not found on-chain" });
    }

    const [existing] = await db
      .select()
      .from(campaignsTable)
      .where(eq(campaignsTable.onChainId, id))
      .limit(1);

    const values = {
      onChainId: id,
      title: campaign.title,
      description: description ?? existing?.description ?? null,
      imageUrl: imageUrl ?? existing?.imageUrl ?? null,
      category: category ?? existing?.category ?? null,
      creator: campaign.creator,
      goal: ethers.formatEther(campaign.goal),
      amountRaised: ethers.formatEther(campaign.amountRaised),
      deadline: Number(campaign.deadline),
      claimed: campaign.claimed,
    };

    let row;
    if (existing) {
      [row] = await db
        .update(campaignsTable)
        .set(values)
        .where(eq(campaignsTable.onChainId, id))
        .returning();
    } else {
      [row] = await db.insert(campaignsTable).values(values).returning();
    }

    res.json({
      message: "Metadata saved",
      campaign: {
        ...formatCampaign(id, campaign),
        description: row?.description ?? null,
        imageUrl: row?.imageUrl ?? null,
        category: row?.category ?? null,
      },
    });
  } catch (error) {
    console.error("Failed to save campaign metadata:", error);
    res.status(500).json({ error: "Failed to save campaign metadata" });
  }
});

// Get contribution amount for a user
app.get("/campaigns/:id/contributions/:address", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const address = req.params.address;

    if (!Number.isInteger(id) || id < 0) {
      return res.status(400).json({ error: "Invalid campaign id" });
    }
    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: "Invalid address" });
    }

    const amount = await contract.getFunction("getContribution")(id, address);
    res.json({
      campaignId: id,
      address,
      amount: ethers.formatEther(amount),
    });
  } catch (error) {
    console.error("Failed to get contribution:", error);
    res.status(500).json({ error: "Failed to get contribution" });
  }
});

// ======================
// UPLOAD IMAGE
// ======================
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return res.status(500).json({
        error: "Cloudinary is not configured. Set CLOUDINARY_* env vars.",
      });
    }

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "crowdfund" },
        (error, uploadResult) => {
          if (error || !uploadResult) {
            reject(error ?? new Error("Empty Cloudinary response"));
          } else {
            resolve(uploadResult);
          }
        }
      );
      stream.end(req.file!.buffer);
    });

    res.json({
      message: "Image uploaded successfully",
      imageUrl: result.secure_url,
    });
  } catch (error) {
    console.error("Failed to upload image:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

// Multer / general error handler
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof Error) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: "Unexpected server error" });
  }
);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Contract: ${CONTRACT_ADDRESS}`);
  console.log(`RPC: ${RPC_URL}`);
});
