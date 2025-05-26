import { pgTable, text, serial, json, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const factConfigurations = pgTable("fact_configurations", {
  id: serial("id").primaryKey(),
  restaurantFacts: json("restaurant_facts").$type<{
    name: string;
    address: string;
    url: string;
    type: string;
    brandTone: string;
    todoFacts: string[];
  }>().notNull(),
  customerFacts: json("customer_facts").$type<{
    name: string;
    gender: string;
    history: string;
    meal: string;
    todoFacts: string[];
  }>().notNull(),
  systemFacts: json("system_facts").$type<{
    promptTemplate: string;
    responseLength: string;
    includeApology: boolean;
    includeMarketing: boolean;
    multipleResponses: boolean;
  }>().notNull(),
});

export const feedbackResponses = pgTable("feedback_responses", {
  id: serial("id").primaryKey(),
  feedbackText: text("feedback_text").notNull(),
  aiResponse: text("ai_response").notNull(),
  configurationId: serial("configuration_id").references(() => factConfigurations.id),
});

export const insertFactConfigurationSchema = createInsertSchema(factConfigurations).omit({
  id: true,
});

export const insertFeedbackResponseSchema = createInsertSchema(feedbackResponses).omit({
  id: true,
});

export type InsertFactConfiguration = z.infer<typeof insertFactConfigurationSchema>;
export type FactConfiguration = typeof factConfigurations.$inferSelect;
export type InsertFeedbackResponse = z.infer<typeof insertFeedbackResponseSchema>;
export type FeedbackResponse = typeof feedbackResponses.$inferSelect;

// Client-side types for the application
export const restaurantFactsSchema = z.object({
  name: z.string(),
  address: z.string(),
  url: z.string(),
  type: z.string(),
  brandTone: z.string(),
  todoFacts: z.array(z.string()),
});

export const customerFactsSchema = z.object({
  name: z.string(),
  gender: z.string(),
  history: z.string(),
  meal: z.string(),
  todoFacts: z.array(z.string()),
});

export const systemFactsSchema = z.object({
  promptTemplate: z.string(),
  responseLength: z.string(),
  includeApology: z.boolean(),
  includeMarketing: z.boolean(),
  multipleResponses: z.boolean(),
});

export type RestaurantFacts = z.infer<typeof restaurantFactsSchema>;
export type CustomerFacts = z.infer<typeof customerFactsSchema>;
export type SystemFacts = z.infer<typeof systemFactsSchema>;
