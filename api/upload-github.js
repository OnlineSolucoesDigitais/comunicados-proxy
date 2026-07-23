export default async function (request, response) {
    // Configurações de segurança para permitir que o Google Sites acesse a API
    response.setHeader('Access-Control-Allow-Credentials', true);
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    response.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Responde rapidamente a requisições de pré-verificação (CORS)
    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    if (request.method !== 'POST') {
        return response.status(405).send('Method Not Allowed');
    }

    const { filename, content, owner, repo } = request.body;

    if (!filename || !content || !owner || !repo) {
        return response.status(400).json({ error: 'Dados incompletos no corpo da requisição.' });
    }

    // O Token deve ser configurado no Vercel como variável de ambiente GITHUB_TOKEN
    const githubToken = process.env.GITHUB_TOKEN;

    if (!githubToken) {
        return response.status(500).json({ error: 'Token do GitHub não configurado no Vercel.' });
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
                message: `Upload via Gerador: ${filename}`,
                content: content
            } )
        });

        if (githubResponse.ok) {
            const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${path}`;
            return response.status(200 ).json({ success: true, url: rawUrl });
        } else {
            const errorData = await githubResponse.json();
            return response.status(githubResponse.status).json({ error: 'Falha no GitHub', details: errorData.message });
        }
    } catch (error) {
        return response.status(500).json({ error: 'Erro interno no servidor', details: error.message });
    }
}
