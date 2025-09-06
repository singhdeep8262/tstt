require('dotenv').config();
const express = require('express');
const { BotFrameworkAdapter } = require('botbuilder');
const TeamsBot = require('./bot');
const { searchGithubCode } = require('./github');
const { analyzeErrorWithAI } = require('./openai');

const app = express();

// Add middleware to parse JSON requests
app.use(express.json());

// For local development, allow empty credentials to bypass authentication
const adapter = new BotFrameworkAdapter({
    appId: process.env.MICROSOFT_APP_ID || '',
    appPassword: process.env.MICROSOFT_APP_PASSWORD || ''
});

// Error handler for the adapter
adapter.onTurnError = async (context, error) => {
    console.error(`\n [onTurnError] unhandled error: ${ error }`);
    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${ error }`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );
    await context.sendActivity('The bot encountered an error or bug.');
};

const bot = new TeamsBot();

// Add a simple GET endpoint for testing
app.get('/api/messages', (req, res) => {
    res.json({ 
        message: 'Bot is running! This endpoint accepts POST requests for Teams messages.',
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// Add a test endpoint to simulate bot functionality without Teams authentication
app.post('/api/test', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        let response;
        
        if (message.toLowerCase().includes('error')) {
            // Search codebase
            const results = await searchGithubCode(
                'singhdeep8262/tstt-bot', // Extract repo name from GITHUB_REPO
                message,
                process.env.GITHUB_TOKEN
            );
            
            if (results.length > 0) {
                response = `I found ${results.length} possible match(es) in your codebase:\n`;
                results.slice(0, 3).forEach((result, index) => {
                    response += `${index + 1}. ${result.name} - ${result.html_url}\n`;
                });
                response += '\nAnalyzing with AI...';
                
                // Optionally analyze with AI
                try {
                    const aiSuggestion = await analyzeErrorWithAI(message, results[0].name, process.env.OPENAI_KEY);
                    response += `\n\nAI Suggestion: ${aiSuggestion}`;
                } catch (aiError) {
                    response += '\n\nAI analysis temporarily unavailable.';
                }
            } else {
                response = "Sorry, I couldn't find a related file in your codebase.";
            }
        } else {
            response = "Send me an error message and I'll search your codebase!";
        }
        
        res.json({ 
            response,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Test endpoint error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

app.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, async (context) => {
        await bot.run(context);
    });
});

const port = process.env.PORT || 3978;
app.listen(port, () => {
    console.log(`Bot is listening on port ${port}`);
});
