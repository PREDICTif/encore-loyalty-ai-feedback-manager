import { 
  type FactConfiguration, 
  type InsertFactConfiguration,
  type FeedbackResponse,
  type InsertFeedbackResponse 
} from "@shared/schema";
import fs from "fs/promises";
import path from "path";

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

export class FileStorage implements IStorage {
  private dataDir: string;
  private configFile: string;
  private responsesFile: string;

  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
    this.configFile = path.join(this.dataDir, 'configurations.json');
    this.responsesFile = path.join(this.dataDir, 'responses.json');
    this.ensureDataDirectory();
  }

  private async ensureDataDirectory() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      
      // Initialize with default configuration if files don't exist
      try {
        await fs.access(this.configFile);
      } catch {
        const defaultConfig = {
          configs: [{
            id: 1,
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
          }],
          nextId: 2
        };
        await fs.writeFile(this.configFile, JSON.stringify(defaultConfig, null, 2));
      }

      try {
        await fs.access(this.responsesFile);
      } catch {
        const defaultResponses = {
          responses: [],
          nextId: 1
        };
        await fs.writeFile(this.responsesFile, JSON.stringify(defaultResponses, null, 2));
      }
    } catch (error) {
      console.error('Error ensuring data directory:', error);
    }
  }

  private async readConfigurations(): Promise<{ configs: FactConfiguration[], nextId: number }> {
    try {
      const data = await fs.readFile(this.configFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading configurations:', error);
      return { configs: [], nextId: 1 };
    }
  }

  private async writeConfigurations(data: { configs: FactConfiguration[], nextId: number }): Promise<void> {
    try {
      await fs.writeFile(this.configFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error writing configurations:', error);
    }
  }

  private async readResponses(): Promise<{ responses: FeedbackResponse[], nextId: number }> {
    try {
      const data = await fs.readFile(this.responsesFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading responses:', error);
      return { responses: [], nextId: 1 };
    }
  }

  private async writeResponses(data: { responses: FeedbackResponse[], nextId: number }): Promise<void> {
    try {
      await fs.writeFile(this.responsesFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error writing responses:', error);
    }
  }

  async getFactConfiguration(id: number): Promise<FactConfiguration | undefined> {
    const data = await this.readConfigurations();
    return data.configs.find(config => config.id === id);
  }

  async getLatestFactConfiguration(): Promise<FactConfiguration | undefined> {
    const data = await this.readConfigurations();
    if (data.configs.length === 0) return undefined;
    return data.configs[data.configs.length - 1];
  }

  async createFactConfiguration(config: InsertFactConfiguration): Promise<FactConfiguration> {
    const data = await this.readConfigurations();
    const id = data.nextId;
    const factConfig: FactConfiguration = { 
      id,
      restaurantFacts: config.restaurantFacts,
      customerFacts: config.customerFacts,
      systemFacts: config.systemFacts
    };
    
    data.configs.push(factConfig);
    data.nextId++;
    
    await this.writeConfigurations(data);
    return factConfig;
  }

  async updateFactConfiguration(id: number, config: Partial<InsertFactConfiguration>): Promise<FactConfiguration | undefined> {
    const data = await this.readConfigurations();
    const index = data.configs.findIndex(c => c.id === id);
    
    if (index === -1) return undefined;
    
    const updated: FactConfiguration = { 
      id,
      restaurantFacts: config.restaurantFacts || data.configs[index].restaurantFacts,
      customerFacts: config.customerFacts || data.configs[index].customerFacts,
      systemFacts: config.systemFacts || data.configs[index].systemFacts
    };
    
    data.configs[index] = updated;
    await this.writeConfigurations(data);
    return updated;
  }

  async getFeedbackResponse(id: number): Promise<FeedbackResponse | undefined> {
    const data = await this.readResponses();
    return data.responses.find(response => response.id === id);
  }

  async createFeedbackResponse(response: InsertFeedbackResponse): Promise<FeedbackResponse> {
    const data = await this.readResponses();
    const id = data.nextId;
    const feedbackResponse: FeedbackResponse = { 
      ...response, 
      id,
      configurationId: response.configurationId || 1
    };
    
    data.responses.push(feedbackResponse);
    data.nextId++;
    
    await this.writeResponses(data);
    return feedbackResponse;
  }

  async getAllFeedbackResponses(): Promise<FeedbackResponse[]> {
    const data = await this.readResponses();
    return data.responses;
  }
}

export const storage = new FileStorage();