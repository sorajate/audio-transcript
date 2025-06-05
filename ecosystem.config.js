module.exports = {
  apps: [{
    // Application Configuration
    name: 'nongtor-record-api',
    script: 'server.js', // Your actual server file
    cwd: process.cwd(), // Current working directory
    
    // Instances and Scaling
    instances: 'max', // Use all available CPU cores
    exec_mode: 'cluster', // Enable cluster mode for better performance
    
    // Auto Restart Configuration
    autorestart: true,
    watch: false, // Disable file watching in production
    max_memory_restart: '1G', // Restart if memory usage exceeds 1GB
    
    // Environment Variables
    env: {
      NODE_ENV: 'production',
      PORT: 3100,
      // GEMINI_API_KEY will be loaded from system environment or .env file
    },
    
    // Development Environment
    env_development: {
      NODE_ENV: 'development',
      PORT: 3100,
      watch: true,
      ignore_watch: ['node_modules', 'uploads', 'logs', '.git'],
      watch_options: {
        followSymlinks: false
      }
    },
    
    // Staging Environment  
    env_staging: {
      NODE_ENV: 'staging',
      PORT: 3001,
    },
    
    // Logging Configuration
    log_file: './logs/combined.log',
    out_file: './logs/out.log', 
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Advanced Configuration
    min_uptime: '10s', // Minimum uptime before considering a restart successful
    max_restarts: 10, // Maximum number of restarts within restart_delay
    restart_delay: 4000, // Delay between restarts (4 seconds)
    
    // Process Management
    kill_timeout: 5000, // Time to wait before force killing
    wait_ready: true, // Wait for process to be ready before considering it online
    listen_timeout: 3000, // Time to wait for app to listen on port
    
    // Node.js specific
    node_args: '--max-old-space-size=4096', // Increase heap size for large audio files
    
    // Additional Options
    increment_var: 'PORT', // Increment PORT for multiple instances
    combine_logs: true,
    
    // Graceful Shutdown
    shutdown_with_message: true,
    kill_retry_time: 100
  }],
};
