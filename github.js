const fetch = require('node-fetch');

async function searchGithubCode(repo, query, githubToken) {
    const url = `https://api.github.com/search/code?q=${encodeURIComponent(query)}+repo:${repo}`;
    console.log('GitHub API URL:', url);
    
    const response = await fetch(url, {
        headers: { Authorization: `token ${githubToken}` }
    });
    
    console.log('GitHub API Response Status:', response.status);
    const data = await response.json();
    console.log('GitHub API Response:', JSON.stringify(data, null, 2));
    
    return data.items || [];
}

module.exports = { searchGithubCode };
