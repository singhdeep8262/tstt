const fetch = require('node-fetch');

async function searchGithubCode(repo, query, githubToken) {
    const url = `https://api.github.com/search/code?q=${encodeURIComponent(query)}+repo:${repo}`;
    const response = await fetch(url, {
        headers: { Authorization: `token ${githubToken}` }
    });
    const data = await response.json();
    return data.items || [];
}

module.exports = { searchGithubCode };
