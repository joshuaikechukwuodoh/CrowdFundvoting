import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(), // Database ID
  onChainId: integer("on_chain_id").notNull().unique(), // ID from the smart contract
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  category: text("category"),
  creator: text("creator").notNull(),
  goal: text("goal").notNull(), // stored as string (ETH)
  amountRaised: text("amount_raised").default("0"),
  deadline: integer("deadline").notNull(),
  claimed: boolean("claimed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});