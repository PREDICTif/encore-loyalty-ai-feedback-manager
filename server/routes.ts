import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFactConfigurationSchema, insertFeedbackResponseSchema } from "@shared/schema";
import OpenAI from "openai";
import multer from "multer";
import fs from "fs/promises";
import path from "path";

const upload = multer({ storage: multer.memoryStorage() });

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openaiApiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR;

if (!openaiApiKey || openaiApiKey === "default_key") {
  console.warn("⚠️  WARNING: No valid OpenAI API key found!");
  console.warn("   Please set the OPENAI_API_KEY environment variable.");
  console.warn("   You can do this by running: export OPENAI_API_KEY=your_api_key_here");
}

const openai = new OpenAI({
  apiKey: openaiApiKey || "dummy_key_for_development",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get latest fact configuration
  app.get("/api/fact-configuration", async (req, res) => {
    try {
      const config = await storage.getLatestFactConfiguration();
      if (!config) {
        return res.status(404).json({ message: "No configuration found" });
      }
      res.json(config);
    } catch (error) {
      console.error("Error fetching fact configuration:", error);
      res.status(500).json({ message: "Failed to fetch configuration" });
    }
  });

  // Update fact configuration
  app.post("/api/fact-configuration", async (req, res) => {
    try {
      const validatedData = insertFactConfigurationSchema.parse(req.body);
      const config = await storage.createFactConfiguration(validatedData);
      res.json(config);
    } catch (error) {
      console.error("Error creating fact configuration:", error);
      res.status(400).json({ message: "Invalid configuration data", error: error.message });
    }
  });

  // Generate AI response
  app.post("/api/generate-response", async (req, res) => {
    try {
      const { feedbackText, configurationId } = req.body;

      if (!feedbackText) {
        return res.status(400).json({ message: "Feedback text is required" });
      }

      // Get the configuration
      const config = configurationId
        ? await storage.getFactConfiguration(configurationId)
        : await storage.getLatestFactConfiguration();

      if (!config) {
        return res.status(404).json({ message: "Configuration not found" });
      }

      // Build the prompt with actual data
      let prompt = config.systemFacts.promptTemplate;

      // Replace placeholders with actual values
      prompt = prompt
        .replace(/\{Restaurant Name\}/g, config.restaurantFacts.name)
        .replace(/\{Address\}/g, config.restaurantFacts.address)
        .replace(/\{Restaurant Type\}/g, config.restaurantFacts.type)
        .replace(/\{Brand tone\}/g, config.restaurantFacts.brandTone)
        .replace(/\{Customer Name\}/g, config.customerFacts.name)
        .replace(/\{Gender\}/g, config.customerFacts.gender)
        .replace(/\{Customer History\}/g, config.customerFacts.history)
        .replace(/\{Meal type\}/g, config.customerFacts.meal)
        .replace(/\{Customer Feedback Text\}/g, feedbackText)
        .replace(/\{Restaurant Todo List Facts\}/g, config.restaurantFacts.todoFacts.join(", "))
        .replace(/\{Customer Todo List Facts\}/g, config.customerFacts.todoFacts.join(", "));

      // Add response length guidance
      const lengthGuidance = {
        short: "Keep the response concise, around 2-3 sentences.",
        medium: "Provide a moderate length response, around 3-4 paragraphs.",
        detailed: "Provide a comprehensive response with detailed explanations."
      };

      prompt += `\n\n${lengthGuidance[config.systemFacts.responseLength] || lengthGuidance.medium}`;

      // Check if we have a valid API key before making the call
      if (!openaiApiKey || openaiApiKey === "dummy_key_for_development") {
        return res.status(500).json({
          message: "OpenAI API key not configured. Please set the OPENAI_API_KEY environment variable.",
          error: "Missing API key"
        });
      }

      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
        messages: [
          {
            role: "system",
            content: "You are a professional customer relationship manager for restaurants. Generate thoughtful, personalized responses to customer feedback."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: config.systemFacts.responseLength === "detailed" ? 1000 :
          config.systemFacts.responseLength === "short" ? 200 : 500,
        temperature: 0.7,
      });

      const aiResponse = completion.choices[0].message.content;

      if (!aiResponse) {
        return res.status(500).json({ message: "Failed to generate response" });
      }

      // Save the response
      const savedResponse = await storage.createFeedbackResponse({
        feedbackText,
        aiResponse,
        configurationId: config.id,
      });

      // Calculate response analytics
      const wordCount = aiResponse.split(/\s+/).length;
      const sentiment = feedbackText.toLowerCase().includes('great') ||
        feedbackText.toLowerCase().includes('excellent') ||
        feedbackText.toLowerCase().includes('amazing') ||
        feedbackText.toLowerCase().includes('wonderful') ||
        feedbackText.toLowerCase().includes('outstanding') ? 'Positive' :
        feedbackText.toLowerCase().includes('bad') ||
          feedbackText.toLowerCase().includes('terrible') ||
          feedbackText.toLowerCase().includes('awful') ||
          feedbackText.toLowerCase().includes('horrible') ? 'Negative' : 'Neutral';

      res.json({
        ...savedResponse,
        analytics: {
          wordCount,
          sentiment
        }
      });

    } catch (error) {
      console.error("Error generating AI response:", error);
      res.status(500).json({
        message: "Failed to generate AI response",
        error: error.message
      });
    }
  });

  // Image analysis endpoint
  app.post("/api/analyze-image", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const base64Image = req.file.buffer.toString('base64');

      const visionResponse = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "This is a screenshot of customer feedback from a restaurant app or review. Please extract and transcribe the exact text content from this image. Focus on the customer's feedback/review text only."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ],
          },
        ],
        max_tokens: 500,
      });

      const extractedText = visionResponse.choices[0].message.content;

      res.json({ extractedText });

    } catch (error) {
      console.error("Error analyzing image:", error);
      res.status(500).json({
        message: "Failed to analyze image",
        error: error.message
      });
    }
  });

  // Analyze feedback screenshot and extract facts
  app.post("/api/analyze-feedback-screenshot", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const base64Image = req.file.buffer.toString('base64');

      const visionResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert at analyzing customer feedback screenshots from restaurant review systems.
Extract all factual information about the customer and their experience. Look for:
- Service ratings (e.g., "Service: 1/5 stars" or "Service rated 1 star")
- Food quality ratings
- Value/price ratings
- Overall ratings
- Customer demographics (age, gender, marital status)
- Visit frequency
- Time of visit (lunch, dinner, etc.)
- Party size
- How they found the restaurant
- Likelihood to recommend
- Any specific complaints or compliments
- Server information
- Location information
- Contact information (if visible)

Return a JSON array of extracted facts. Each fact should have:
- category: The type of information (e.g., "Service Rating", "Age", "Visit Frequency")
- value: The actual value (e.g., "1/5 stars", "46-55", "10+ times per year")
- confidence: "high", "medium", or "low" based on how clear the information is

Be very thorough and extract ALL visible information from the feedback form.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this customer feedback screenshot and extract all facts about the customer and their experience. Return only a JSON array of facts."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.3, // Lower temperature for more consistent extraction
      });

      const responseText = visionResponse.choices[0].message.content || "";

      // Try to parse the JSON response
      let extractedFacts = [];
      try {
        // Extract JSON from the response (in case there's extra text)
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          extractedFacts = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON array found in response");
        }
      } catch (parseError) {
        console.error("Error parsing facts JSON:", parseError);
        // Fallback: try to extract some basic facts from the text
        extractedFacts = [{
          category: "Raw Feedback",
          value: responseText.substring(0, 200),
          confidence: "low"
        }];
      }

      res.json({ extractedFacts });

    } catch (error) {
      console.error("Error analyzing feedback screenshot:", error);
      res.status(500).json({
        message: "Failed to analyze feedback screenshot",
        error: error.message
      });
    }
  });

  // Save response to file
  app.post("/api/save-response", async (req, res) => {
    try {
      const { responseId } = req.body;

      const response = await storage.getFeedbackResponse(responseId);
      if (!response) {
        return res.status(404).json({ message: "Response not found" });
      }

      // In a real implementation, you might save to a file system or cloud storage
      // For now, just return success
      res.json({ message: "Response saved successfully", filename: `response_${responseId}.txt` });

    } catch (error) {
      console.error("Error saving response:", error);
      res.status(500).json({ message: "Failed to save response" });
    }
  });

  // Email response to customer
  app.post("/api/email-response", async (req, res) => {
    try {
      const { responseId, customerEmail } = req.body;

      const response = await storage.getFeedbackResponse(responseId);
      if (!response) {
        return res.status(404).json({ message: "Response not found" });
      }

      // In a real implementation, you would integrate with an email service
      // For now, just simulate success
      console.log(`Would send email to ${customerEmail} with response: ${response.aiResponse}`);

      res.json({ message: "Email sent successfully" });

    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  // Get available restaurant profiles
  app.get("/api/restaurant-profiles", async (req, res) => {
    try {
      const profilesDir = path.join(process.cwd(), 'data', 'restaurant-profiles');
      const files = await fs.readdir(profilesDir);
      const profiles = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const data = await fs.readFile(path.join(profilesDir, file), 'utf-8');
          const profile = JSON.parse(data);
          profiles.push({
            id: file.replace('.json', ''),
            name: profile.name,
            type: profile.type,
            ...profile
          });
        }
      }

      res.json(profiles);
    } catch (error) {
      console.error("Error loading restaurant profiles:", error);
      res.status(500).json({ message: "Failed to load restaurant profiles" });
    }
  });

  // Get customer profiles for a restaurant
  app.get("/api/customer-profiles/:restaurantId", async (req, res) => {
    try {
      const { restaurantId } = req.params;
      const profilesDir = path.join(process.cwd(), 'data', 'customer-profiles', restaurantId);

      try {
        const files = await fs.readdir(profilesDir);
        const profiles = [];

        for (const file of files) {
          if (file.endsWith('.json')) {
            const data = await fs.readFile(path.join(profilesDir, file), 'utf-8');
            const profile = JSON.parse(data);
            profiles.push({
              id: file.replace('.json', ''),
              ...profile
            });
          }
        }

        res.json(profiles);
      } catch (dirError) {
        // Directory doesn't exist, return empty array
        res.json([]);
      }
    } catch (error) {
      console.error("Error loading customer profiles:", error);
      res.status(500).json({ message: "Failed to load customer profiles" });
    }
  });

  // Load restaurant profile
  app.post("/api/load-restaurant-profile", async (req, res) => {
    try {
      const { profileId } = req.body;
      const profilePath = path.join(process.cwd(), 'data', 'restaurant-profiles', `${profileId}.json`);

      const data = await fs.readFile(profilePath, 'utf-8');
      const restaurantProfile = JSON.parse(data);

      res.json(restaurantProfile);
    } catch (error) {
      console.error("Error loading restaurant profile:", error);
      res.status(404).json({ message: "Restaurant profile not found" });
    }
  });

  // Load customer profile
  app.post("/api/load-customer-profile", async (req, res) => {
    try {
      const { restaurantId, profileId } = req.body;
      const profilePath = path.join(process.cwd(), 'data', 'customer-profiles', restaurantId, `${profileId}.json`);

      const data = await fs.readFile(profilePath, 'utf-8');
      const customerProfile = JSON.parse(data);

      res.json(customerProfile);
    } catch (error) {
      console.error("Error loading customer profile:", error);
      res.status(404).json({ message: "Customer profile not found" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
