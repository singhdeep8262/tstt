const fetch = require('node-fetch');

async function analyzeErrorWithAI(errorMsg, codeSnippet, openAiKey) {
    const body = {
        model: "gpt-5-nano",
        messages: [{ role: "user", content: `Given this error: ${errorMsg}\nAnd this code:\n${codeSnippet}\nWhere is the bug likely located?` }],
        max_tokens: 150
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAiKey}`
        },
        body: JSON.stringify(body)
    });
    const result = await response.json();
    return result.choices ? result.choices.message.content.trim() : "No suggestion from AI.";
}

module.exports = { analyzeErrorWithAI };
