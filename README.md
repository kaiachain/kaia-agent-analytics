# Kaia Agent Analytics

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A Node.js application that automates blockchain metric analysis using AI for the Kaia blockchain ecosystem.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
- [Usage](#usage)
- [Customization](#customization)
  - [Adding New Metrics](#adding-new-metrics)
  - [Modifying Report Format](#modifying-report-format)
- [Development](#development)
  - [Project Structure](#project-structure)
  - [Error Handling](#error-handling)
- [Docker](#docker)
- [Logging](#logging)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)


## 🔍 Overview

Kaia Agent Analytics bridges the gap between blockchain data and actionable insights. By automating the data collection, analysis, and reporting process, this application helps stakeholders make data-driven decisions about the Kaia blockchain ecosystem.

The application fetches relevant metrics from Dune Analytics, processes the data using Google's Gemini AI model to generate meaningful insights, and delivers comprehensive reports to a designated Slack channel.

## ✨ Features

- **Automated Data Collection**
  - Scheduled fetching of blockchain metrics from Dune Analytics
  - Configurable query parameters and time ranges
  - Efficient API usage with robust error handling

- **AI-Powered Analysis**
  - Trend identification using Google's Gemini AI model
  - Anomaly detection and highlighting of significant changes
  - Natural language explanations of technical metrics

- **Seamless Reporting**
  - Customizable Slack messages with rich formatting
  - Interactive charts and visualizations
  - Historical performance comparisons

- **Highly Configurable**
  - Easily add or modify tracked metrics
  - Adjustable reporting schedules
  - Customizable alert thresholds

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ and npm (project includes an `.nvmrc` file)
- API keys for:
  - Dune Analytics
  - Google Gemini AI
  - Slack Webhook URL

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/kaiachain/kaia-agent-analytics.git
   cd kaia-agent-analytics
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Configuration

1. Copy `.env.example` and rename it to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Configure the required environment variables in the `.env` file:
   ```
   # Required API Keys
   DUNE_API_KEY=your_dune_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   SLACK_WEBHOOK_URL=your_slack_webhook_url_here
   
   # Optional Configuration
   CRON_SCHEDULE=0 10 * * 1  # Run every Monday at 10:00 AM
   TZ=Asia/Singapore         # Timezone for cron scheduling
   NODE_ENV=production       # Set to 'development' for debug logs
   ```

## 📊 Usage

Run the application in development mode:
```bash
npm run dev
```

Build the application:
```bash
npm run build
```

Run the built application:
```bash
npm start
```

## ⚙️ Customization

### Adding New Metrics

To add a new metric for tracking:

1. Open `src/constants/metric.ts`
2. Add a new entry to the `METRICS` array:
   ```typescript
   {
     name: "Your Metric Name",
     queryId: 123456,  // Dune Analytics query ID
     sectionUrl: "https://dune.com/queries/123456",
     frequency: "daily", // or "weekly", "monthly", "yearly"
     fromHistoricalDate: "past month",
     limit: 30 // Number of data points to retrieve
   }
   ```
   
### Modifying Report Format

To customize how reports are displayed in Slack:

1. Navigate to `src/services/slackService.ts`
2. Modify the message formatting templates in the `sendFormattedSlackMessage` function

## 💻 Development

### Project Structure

```
kaia-agent-analytics/
├── src/
│   ├── constants/    # Metric configurations and other constant values
│   ├── services/     # Core service implementations (Dune, Gemini, Slack)
│   ├── types/        # TypeScript type definitions
│   ├── utils/        # Logging and error handling utilities
│   └── index.ts      # Application entry point
├── .env.example      # Example environment variables
├── .nvmrc            # Node version specification
├── Dockerfile        # Container definition
├── docker-compose.yml # Docker Compose configuration
├── package.json      # Project dependencies and scripts
└── tsconfig.json     # TypeScript configuration
```

### Error Handling

The application incorporates a robust error handling system:

- **Async Error Handler**: A wrapper for async functions that catches and logs errors with context
- **Global Error Handlers**: Process-level handlers for uncaught exceptions and unhandled rejections
- **Contextual Logging**: All errors are logged with their context and stack traces for easier debugging

Example of using the error handler in your own code:

```typescript
import { asyncErrorHandler } from './utils';

const myFunction = asyncErrorHandler(async () => {
  // Your code here
  // Any errors will be caught, logged, and re-thrown
}, 'MyFunctionContext');
```

## 🐳 Docker

This application can be run using Docker for easy deployment and environment consistency.

### Using Docker

1. Build the Docker image:
   ```bash
   docker build -t kaia-agent-analytics .
   ```

2. Run the container:
   ```bash
   docker run --env-file .env kaia-agent-analytics
   ```

### Using Docker Compose

1. Ensure your `.env` file is configured with all required environment variables

2. Run the application using Docker Compose:
   ```bash
   npm run docker:up
   ```

3. Stop the container:
   ```bash
   npm run docker:down
   ```

For more detailed Docker setup instructions, see [DOCKER.md](DOCKER.md).

## 📝 Logging

The application uses Winston for structured logging with the following features:

- **Log levels**: error, warn, info, http, debug (controlled by NODE_ENV)
- **Environment configuration**:
  - **Production mode** (default): Only shows info-level and above logs
  - **Development mode**: Shows all logs including debug-level for detailed troubleshooting

> **Note**: The file logging functionality (logs/combined.log and logs/error.log) is included in the code but is commented out by default. To enable file logging, uncomment the relevant section in `src/utils/logger.ts`.

### Environment Configuration

You can control the logging level with the NODE_ENV variable:

```bash
# Production mode (default if not specified)
# Shows only info, warn, and error logs
NODE_ENV=production npm start

# Development mode
# Shows all logs including debug messages
NODE_ENV=development npm start
```

### Using the logger

```typescript
import { logger } from './utils';

// Different log levels
logger.error('Critical error occurred', { error: 'details', userId: '123' });
logger.warn('Warning message', { source: 'function name' });
logger.info('Regular information', { data: 'some value' });
logger.debug('Debugging information');
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- [Dune Analytics](https://dune.com/) for providing the data query platform
- [Google Gemini AI](https://gemini.google.com/) for powering the analytics
- [Slack](https://slack.com/) for the messaging platform