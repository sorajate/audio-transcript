# PM2 Deployment Guide for NongTor Record API

This guide explains how to deploy and manage the NongTor Record API using PM2 process manager.

## Prerequisites

1. **Install PM2 globally:**
```bash
npm install -g pm2
```

2. **Install application dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp env.example .env
# Edit .env with your GEMINI_API_KEY
```

## Quick Start

### 1. Start the Application
```bash
# Production mode (recommended)
npm run pm2:prod

# Or development mode with auto-restart on file changes
npm run pm2:dev

# Or staging mode
npm run pm2:staging
```

### 2. Check Status
```bash
npm run pm2:status
# or
pm2 status
```

### 3. View Logs
```bash
npm run pm2:logs
# or
pm2 logs nongtor-record-api
```

## Management Commands

### Basic Operations
```bash
# Start the application
npm run pm2:start

# Stop the application
npm run pm2:stop

# Restart the application (kills and starts)
npm run pm2:restart

# Reload the application (graceful restart)
npm run pm2:reload

# Delete the application from PM2
npm run pm2:delete
```

### Monitoring
```bash
# View real-time logs
npm run pm2:logs

# Monitor CPU and memory usage
npm run pm2:monit

# View detailed status
npm run pm2:status
```

## Configuration Details

The `ecosystem.config.js` file contains:

### Production Features
- **Cluster Mode**: Uses all CPU cores for better performance
- **Auto Restart**: Automatically restarts on crashes
- **Memory Limit**: Restarts if memory usage exceeds 1GB
- **Health Monitoring**: Built-in health checks
- **Log Management**: Organized log files in `/logs` directory

### Environment Configurations
- **Production**: `NODE_ENV=production`, optimized for performance
- **Development**: `NODE_ENV=development`, with file watching
- **Staging**: `NODE_ENV=staging`, for testing deployments

## Server Deployment

### 1. Update Configuration
Edit `ecosystem.config.js` and update:
```javascript
{
  cwd: '/path/to/your/audio-transcript', // Your actual server path
  deploy: {
    production: {
      user: 'your-username',
      host: ['your-server.com'],
      repo: 'https://github.com/your-username/audio-transcript.git'
    }
  }
}
```

### 2. Deploy to Server
```bash
# Setup deployment (first time only)
pm2 deploy ecosystem.config.js production setup

# Deploy application
pm2 deploy ecosystem.config.js production
```

### 3. Server Management
```bash
# Start on server
pm2 start ecosystem.config.js --env production

# Save PM2 configuration (survives reboots)
pm2 save
pm2 startup
```

## Logs and Monitoring

### Log Files Location
- **Combined logs**: `./logs/combined.log`
- **Output logs**: `./logs/out.log`  
- **Error logs**: `./logs/error.log`

### Real-time Monitoring
```bash
# View live logs
pm2 logs nongtor-record-api --lines 100

# Monitor system resources
pm2 monit

# Web-based monitoring (optional)
pm2 plus
```

## Environment Variables

Set these in your system environment or `.env` file:

```bash
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Optional
NODE_ENV=production
PORT=3000
MAX_FILE_SIZE=200MB
LOG_LEVEL=info
```

## Security Considerations

1. **File Permissions**: Ensure PM2 runs with appropriate user permissions
2. **API Keys**: Store sensitive keys in environment variables, not in code
3. **Network**: Use a reverse proxy (nginx) in production
4. **Firewall**: Restrict access to necessary ports only

## Troubleshooting

### Common Issues

1. **Port Already in Use**:
```bash
pm2 delete nongtor-record-api
npm run pm2:start
```

2. **Memory Issues**:
```bash
# Check memory usage
pm2 monit
# Increase memory limit in ecosystem.config.js
```

3. **Log Issues**:
```bash
# Check log files
ls -la logs/
# View recent errors
pm2 logs nongtor-record-api --err --lines 50
```

### Health Checks
```bash
# Test API health
curl http://localhost:3000/api/transcribe/health

# Test main endpoint
curl http://localhost:3000/health
```

## Performance Optimization

1. **Cluster Mode**: Automatically enabled in production
2. **Memory Management**: Automatic restart at 1GB usage
3. **CPU Optimization**: Uses all available cores
4. **Load Balancing**: PM2 handles load distribution across instances

## Backup and Recovery

1. **Save PM2 Configuration**:
```bash
pm2 save
```

2. **Restore After Reboot**:
```bash
pm2 resurrect
```

3. **Export/Import Configuration**:
```bash
pm2 dump
pm2 restore dump.pm2
```

---

For more information, visit the [PM2 Documentation](https://pm2.keymetrics.io/docs/). 