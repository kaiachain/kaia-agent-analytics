# Docker Setup Guide

This guide explains how to set up and run the Kaia Agent Analytics application using Docker.

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Required API Keys
DUNE_API_KEY=your_dune_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
SLACK_WEBHOOK_URL=your_slack_webhook_url_here

# Optional Configuration
CRON_SCHEDULE=0 10 * * 1  # Run every Monday at 10:00 AM
TZ=Asia/Singapore          # Timezone for cron scheduling
DEBUG_LOGS=false           # Set to 'true' to enable detailed debug logging
```

## Scheduling Behavior

The application has two operating modes:

1. **Scheduled Mode**: When `CRON_SCHEDULE` is set, the container will keep running and execute the analytics job according to the schedule.

2. **Single Run Mode**: If `CRON_SCHEDULE` is not set, the container will execute the analytics job once and then exit. This is useful for running the job from an external scheduler like Kubernetes CronJobs.

**Examples:**
```
# For scheduled mode (container keeps running)
CRON_SCHEDULE=0 10 * * 1

# For single run mode (runs once and exits)
# Simply leave CRON_SCHEDULE unset
```

## Building and Running with Docker

### Option 1: Using Docker Directly

```bash
# Build the image
docker build -t kaia-agent-analytics .

# Run the container
docker run --env-file .env -v ./logs:/app/logs kaia-agent-analytics
```

### Option 2: Using Docker Compose

```bash
# Start the service
npm run docker:up

# NOTE: Uncomment to show logs to files (only if it is enabled in logger.ts)
# View logs
# npm run docker:log

# Stop the service
npm run docker:down
```

## Container Time Zone

The container is configured to use Singapore time (Asia/Singapore) to ensure cron jobs run at the expected time. You can modify this setting in the `docker-compose.yml` file if needed.

## Volume Mounts

The Docker setup includes a volume mount for logs:
- `./logs:/app/logs`: Maps the local `logs` directory to the container's log directory

This ensures that logs persist even if the container is restarted.