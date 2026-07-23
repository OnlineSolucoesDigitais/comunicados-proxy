export default async function (request, response) {
    // 1. Configurações de CORS para autorizar o navegador
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // 2. Responde imediatamente à verificação de segurança (Preflight) do navegador
    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    // 3. Bloqueia qualquer coisa que não seja envio (POST)
    if (request.method !== 'POST') {
        return response.status(405).send('Method Not Allowed');
    }

    const { filename, content, owner, repo } = request.body;

    if (!filename || !content || !owner || !repo) {
        return response.status(400).json({ error: 'Faltam dados na requisição.' });
    }

    const githubToken = process.env.GITHUB_TOKEN;

    if (!githubToken) {
        return response.status(500).json({ error: 'Token do GitHub não configurado no servidor.' });
    }

    try {
        const path = `main/${filename}`;
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
            return response.status(githubResponse.status).json({ error: 'Falha no upload para o GitHub', details: errorData });
        }
    } catch (error) {
        return response.status(500).json({ error: 'Erro Interno no Servidor', details: error.message });
    }
}
