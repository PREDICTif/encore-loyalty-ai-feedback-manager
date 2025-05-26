import { 
  factConfigurations, 
  feedbackResponses, 
  type FactConfiguration, 
  type InsertFactConfiguration,
  type FeedbackResponse,
  type InsertFeedbackResponse 
} from "@shared/schema";

export interface IStorage {
  // Fact Configuration methods
  getFactConfiguration(id: number): Promise<FactConfiguration | undefined>;
  getLatestFactConfiguration(): Promise<FactConfiguration | undefined>;
  createFactConfiguration(config: InsertFactConfiguration): Promise<FactConfiguration>;
  updateFactConfiguration(id: number, config: Partial<InsertFactConfiguration>): Promise<FactConfiguration | undefined>;
  
  // Feedback Response methods
  getFeedbackResponse(id: number): Promise<FeedbackResponse | undefined>;
  createFeedbackResponse(response: InsertFeedbackResponse): Promise<FeedbackResponse>;
  getAllFeedbackResponses(): Promise<FeedbackResponse[]>;
}

export class MemStorage implements IStorage {
  private factConfigs: Map<number, FactConfiguration>;
  private feedbackResp: Map<number, FeedbackResponse>;
  private currentConfigId: number;
  private currentResponseId: number;

  constructor() {
    this.factConfigs = new Map();
    this.feedbackResp = new Map();
    this.currentConfigId = 1;
    this.currentResponseId = 1;

    // Initialize with default configuration
    this.createFactConfiguration({
      restaurantFacts: {
        name: "Sample Bistro",
        address: "123 Main Street, Anytown",
        url: "https://samplebistro.com",
        type: "Casual",
        brandTone: "Friendly",
        todoFacts: ["Currently running Summer Specials", "Famous for seafood dishes"]
      },
      customerFacts: {
        name: "John Doe",
        gender: "M",
        history: "Long-time",
        meal: "Dinner",
        todoFacts: ["Prefers window seating", "Usually orders vegetarian dishes"]
      },
      systemFacts: {
        promptTemplate: `You are a customer relationship manager for a restaurant named "{Restaurant Name}", located at "{Address}". The restaurant type is "{Restaurant Type}" and communicates with a "{Brand tone}" tone.

A customer named "{Customer Name}" ({Gender}), a "{Customer History}" customer, recently had "{Meal type}" and left feedback: "{Customer Feedback Text}".

Consider the following additional restaurant facts: {Restaurant Todo List Facts}
Consider the following additional customer facts: {Customer Todo List Facts}

Generate a thoughtful, concise response addressing the customer's feedback appropriately. If feedback is negative, consider a polite apology. If positive, consider a friendly marketing message inviting them back.`,
        responseLength: "medium",
        includeApology: true,
        includeMarketing: true,
        multipleResponses: false
      }
    });
  }

  async getFactConfiguration(id: number): Promise<FactConfiguration | undefined> {
    return this.factConfigs.get(id);
  }

  async getLatestFactConfiguration(): Promise<FactConfiguration | undefined> {
    if (this.factConfigs.size === 0) return undefined;
    const latestId = Math.max(...Array.from(this.factConfigs.keys()));
    return this.factConfigs.get(latestId);
  }

  async createFactConfiguration(config: InsertFactConfiguration): Promise<FactConfiguration> {
    const id = this.currentConfigId++;
    const factConfig: FactConfiguration = { ...config, id };
    this.factConfigs.set(id, factConfig);
    return factConfig;
  }

  async updateFactConfiguration(id: number, config: Partial<InsertFactConfiguration>): Promise<FactConfiguration | undefined> {
    const existing = this.factConfigs.get(id);
    if (!existing) return undefined;
    
    const updated: FactConfiguration = { 
      ...existing, 
      ...config,
      id 
    };
    this.factConfigs.set(id, updated);
    return updated;
  }

  async getFeedbackResponse(id: number): Promise<FeedbackResponse | undefined> {
    return this.feedbackResp.get(id);
  }

  async createFeedbackResponse(response: InsertFeedbackResponse): Promise<FeedbackResponse> {
    const id = this.currentResponseId++;
    const feedbackResponse: FeedbackResponse = { ...response, id };
    this.feedbackResp.set(id, feedbackResponse);
    return feedbackResponse;
  }

  async getAllFeedbackResponses(): Promise<FeedbackResponse[]> {
    return Array.from(this.feedbackResp.values());
  }
}

export const storage = new MemStorage();
