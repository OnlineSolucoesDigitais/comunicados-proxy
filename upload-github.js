import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function (request: VercelRequest, response: VercelResponse) {
    if (request.method !== 'POST') {
        return response.status(405).send('Method Not Allowed');
    }

    const { filename, content, owner, repo } = request.body;

    if (!filename || !content || !owner || !repo) {
        return response.status(400).json({ error: 'Missing filename, content, owner, or repo in request body.' });
    }

    const githubToken = process.env.GITHUB_TOKEN;

    if (!githubToken) {
        return response.status(500).json({ error: 'GitHub Token not configured on the server.' });
    }

    try {
        const path = `main/${filename}`; // Salva na pasta main do repositório
        const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

        const githubResponse = await fetch(githubApiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Content-Type': 'application/json',
                'User-Agent': 'Vercel-Serverless-Function'
            },
            body: JSON.stringify({
                message: `Upload via Gerador de Comunicados: ${filename}`,
                content: content
            })
        });

        if (githubResponse.ok) {
            const data = await githubResponse.json();
            const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${path}`;
            return response.status(200).json({ success: true, url: rawUrl, githubData: data });
        } else {
            const errorData = await githubResponse.json();
            console.error('GitHub API Error:', errorData);
            return response.status(githubResponse.status).json({ error: 'Failed to upload to GitHub', details: errorData });
        }
    } catch (error) {
        console.error('Serverless Function Error:', error);
        return response.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
