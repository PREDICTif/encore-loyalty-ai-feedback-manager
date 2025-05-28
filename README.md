# Encore Loyalty AI Feedback Manager

A React-based AI-powered feedback response system for restaurants that generates personalized responses to customer feedback using OpenAI's GPT-4o model.

## Features

- **Profile Management**: Load different restaurant and customer profiles from JSON files
- **AI Response Generation**: Generate contextual responses based on restaurant facts, customer history, and feedback
- **Image Analysis**: Upload screenshots of customer reviews for automatic text extraction
- **Multiple Restaurant Types**: Support for casual dining, fine dining, fast-food, and family restaurants
- **Customer Segmentation**: Different customer profiles with history and preferences
- **Response Analytics**: Word count and sentiment analysis of generated responses

## Customer Feedback Screenshot Feature

The application now includes an advanced screenshot upload feature that automatically extracts detailed customer information from feedback forms and review screenshots.

### How It Works

1. **Drag and Drop or Click to Upload**: Simply drag a screenshot of a customer feedback form onto the designated area, or click to browse and select an image
2. **Automatic Fact Extraction**: The AI analyzes the image and extracts all relevant information including:
   - Service ratings (e.g., "Service: 1/5 stars")
   - Food quality ratings
   - Value/price ratings
   - Customer demographics (age, gender, marital status)
   - Visit frequency and timing
   - How they found the restaurant
   - Likelihood to recommend
   - Specific complaints or compliments
   - Server and location information

3. **Confidence Levels**: Each extracted fact is labeled with a confidence level (high, medium, or low) based on how clearly the information appears in the image

4. **Automatic Integration**: Extracted facts are automatically added to the customer's profile facts, enriching the context for AI response generation

### Supported Information Types

The screenshot analyzer can extract:

- **Ratings**: Service, food quality, value, atmosphere, overall experience
- **Demographics**: Age range, gender, marital status
- **Visit Details**: Time of day, visit frequency, party size
- **Feedback**: Written comments and specific complaints/compliments
- **Contact Info**: Email, phone (if visible)
- **Other**: How they found the restaurant, likelihood to recommend

This feature significantly speeds up the process of capturing customer feedback data and ensures no important details are missed when crafting personalized responses.

## Technology Stack

- **Frontend**: React, TypeScript, TailwindCSS, Shadcn/ui
- **Backend**: Express.js, Node.js
- **AI**: OpenAI GPT-4o for text generation and image analysis
- **Storage**: JSON file-based storage system
- **Styling**: TailwindCSS with custom components

## Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd encore-loyalty-ai
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:

   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Access the application**
   Open your browser and navigate to `http://localhost:4000`

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Main application pages
│   │   ├── lib/           # Utilities and types
│   │   └── hooks/         # Custom React hooks
├── server/                 # Express backend
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   └── file-storage.ts    # JSON file storage system
├── data/                   # JSON data files
│   ├── restaurant-profiles/  # Restaurant profile templates
│   ├── customer-profiles/    # Customer profile templates
│   ├── configurations.json  # Active configurations
│   └── responses.json       # Generated responses
└── shared/                 # Shared types and schemas
```

## Usage

### Profile Management

1. Use the **Profile Manager** to select different restaurant and customer combinations
2. Choose from pre-built profiles or customize your own
3. Each restaurant type has specific customer profiles tailored to that dining experience

### Generating AI Responses

1. Enter or upload customer feedback in the text area
2. Optionally upload a screenshot for automatic text extraction
3. Click "Generate AI Response" to create a personalized response
4. Save or email the response to the customer

### Restaurant Profiles Included

- **Sample Bistro**: Casual dining with seafood specialties
- **Le Jardin Noir**: Fine dining, Michelin-starred restaurant
- **Quick Bites Express**: Fast-food with 24/7 service
- **Family Table Restaurant**: Family-friendly with kids activities

## API Endpoints

- `GET /api/fact-configuration` - Get current configuration
- `POST /api/fact-configuration` - Update configuration
- `POST /api/generate-response` - Generate AI response
- `POST /api/analyze-image` - Extract text from uploaded images
- `POST /api/analyze-feedback-screenshot` - Extract structured facts from feedback screenshots
- `GET /api/restaurant-profiles` - Get available restaurant profiles
- `GET /api/customer-profiles/:restaurantId` - Get customer profiles for restaurant
- `POST /api/load-restaurant-profile` - Load specific restaurant profile
- `POST /api/load-customer-profile` - Load specific customer profile

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.
