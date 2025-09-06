require('dotenv').config();
const express = require('express');
const { BotFrameworkAdapter } = require('botbuilder');
const TeamsBot = require('./bot');
const { searchGithubCode } = require('./github');
const { analyzeErrorWithAI } = require('./openai');

const app = express();

// Add middleware to parse JSON requests
app.use(express.json());

// Production-ready Bot Framework Adapter with proper authentication
const adapter = new BotFrameworkAdapter({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Validate required environment variables for production
if (!process.env.MICROSOFT_APP_ID || !process.env.MICROSOFT_APP_PASSWORD) {
    console.error('ERROR: Missing required environment variables MICROSOFT_APP_ID or MICROSOFT_APP_PASSWORD');
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
}

// Enhanced error handler for production
adapter.onTurnError = async (context, error) => {
    console.error(`[${new Date().toISOString()}] Bot error:`, error);
    
    // Send trace activity only in development
    if (process.env.NODE_ENV !== 'production') {
        await context.sendTraceActivity(
            'OnTurnError Trace',
            `${ error }`,
            'https://www.botframework.com/schemas/error',
            'TurnError'
        );
    }
    
    // Send user-friendly error message
    await context.sendActivity('I encountered an issue processing your request. Please try again.');
};

const bot = new TeamsBot();

// Health check endpoint for Azure monitoring
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'Teams Bot',
        status: 'running',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Main bot endpoint for Microsoft Teams
app.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, async (context) => {
        try {
            await bot.run(context);
        } catch (error) {
            console.error(`[${new Date().toISOString()}] Error processing bot activity:`, error);
            throw error;
        }
    });
});

// Graceful shutdown handler
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Azure App Service uses PORT environment variable
const port = process.env.PORT || 3978;
const server = app.listen(port, '0.0.0.0', () => {
    console.log(`[${new Date().toISOString()}] Teams Bot started successfully`);
    console.log(`Server listening on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Health check available at: /health`);
});

// Handle server errors
server.on('error', (error) => {
    console.error(`[${new Date().toISOString()}] Server error:`, error);
});
