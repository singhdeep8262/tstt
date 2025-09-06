const { TeamsActivityHandler } = require('botbuilder');
const { searchGithubCode } = require('./github');
const { analyzeErrorWithAI } = require('./openai');

class TeamsBot extends TeamsActivityHandler {
    async onMessage(context, next) {
        const userMsg = context.activity.text;
        // Simple error-detection logic
        if (userMsg.toLowerCase().includes('error')) {
            // Search codebase
            const results = await searchGithubCode(
                process.env.GITHUB_REPO,
                userMsg,
                process.env.GITHUB_TOKEN
            );
            let reply;
            if (results.length > 0) {
                // Get code snippet from first result
                const codeUrl = results.html_url;
                // (Ideally, fetch code content; for now, just show link)
                reply = `I found a possible match in your codebase: ${codeUrl}\n\nAnalyzing with AI...`;
                // Optionally, fetch and send the code to the AI model
                // const aiSuggestion = await analyzeErrorWithAI(userMsg, '<code snippet here>', process.env.OPENAI_KEY);
                // reply += `\n\nAI Suggestion: ${aiSuggestion}`;
            } else {
                reply = "Sorry, I couldn't find a related file in your codebase.";
            }
            await context.sendActivity(reply);
        } else {
            await context.sendActivity("Send me an error message and I'll search your codebase!");
        }
        await next();
    }
}

module.exports = TeamsBot;
