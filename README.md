# Kaia Agent Analytics

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A Node.js application that automates blockchain metric analysis using AI for the Kaia blockchain ecosystem.

<p align="center">
  <img src="https://via.placeholder.com/600x300?text=Kaia+Agent+Analytics" alt="Kaia Agent Analytics" width="600">
</p>

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
  - [Testing](#testing)
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
  - Caching mechanism to optimize API usage

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

- Node.js 18+ and npm
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

1. Create a `.env` file at the root with the following variables:
   ```
   DUNE_API_KEY=your_dune_api_key
   GEMINI_API_KEY=your_gemini_api_key
   SLACK_WEBHOOK_URL=your_slack_webhook_url
   ```

2. Adjust configuration settings in `src/config/index.ts` if needed

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
2. Add a new entry to the `metrics` array:
   ```typescript
   {
     id: 'unique_metric_id',
     name: 'Human-Readable Metric Name',
     duneQueryId: '123456',
     description: 'Brief description of what this metric represents',
     importance: 'Why this metric matters for the ecosystem'
   }
   ```

### Modifying Report Format

To customize how reports are displayed in Slack:

1. Navigate to `src/services/slack.ts`
2. Modify the message formatting templates to suit your needs

## 💻 Development

### Project Structure

```
kaia-agent-analytics/
├── src/
│   ├── config/       # Application configuration
│   ├── constants/    # Constant values used across the app
│   ├── services/     # Core service implementations
│   ├── types/        # TypeScript type definitions
│   ├── utils/        # Utility functions
│   └── index.ts      # Application entry point
├── tests/            # Test files
├── .env              # Environment variables (git-ignored)
├── package.json      # Project dependencies and scripts
└── tsconfig.json     # TypeScript configuration
```

### Testing

Run tests with:
```bash
npm test
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
