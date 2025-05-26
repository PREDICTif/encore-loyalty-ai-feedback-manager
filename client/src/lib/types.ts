export interface RestaurantFacts {
  name: string;
  address: string;
  url: string;
  type: string;
  brandTone: string;
  todoFacts: string[];
}

export interface CustomerFacts {
  name: string;
  gender: string;
  history: string;
  meal: string;
  todoFacts: string[];
}

export interface SystemFacts {
  promptTemplate: string;
  responseLength: string;
  includeApology: boolean;
  includeMarketing: boolean;
  multipleResponses: boolean;
}

export interface FactConfiguration {
  id: number;
  restaurantFacts: RestaurantFacts;
  customerFacts: CustomerFacts;
  systemFacts: SystemFacts;
}

export interface ResponseAnalytics {
  wordCount: number;
  sentiment: string;
}

export interface GeneratedResponse {
  id: number;
  feedbackText: string;
  aiResponse: string;
  configurationId: number;
  analytics: ResponseAnalytics;
}
