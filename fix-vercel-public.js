/**
 * fix-vercel-public.js — Make KisaanConnect Vercel deployment publicly accessible
 * Disables "Deployment Protection" (Vercel Auth) so anyone can visit the site
 */

const https = require('https');
const fs    = require('fs');
const os    = require('os');
const path  = require('path');

// Read token from Vercel CLI auth file
function getVercelToken() {
    const authPaths = [
        path.join(os.homedir(), '.local', 'share', 'com.vercel.cli', 'auth.json'),
        path.join(os.homedir(), '.config', 'com.vercel.cli', 'auth.json'),
        path.join(process.env.APPDATA || '', 'com.vercel.cli', 'auth.json'),
        path.join(os.homedir(), '.vercel', 'auth.json'),
    ];
    for (const p of authPaths) {
        try {
            const data = JSON.parse(fs.readFileSync(p, 'utf8'));
            if (data.token) return data.token;
        } catch {}
    }
    return null;
}

function api(method, endpoint, body, token) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const req = https.request({
            hostname: 'api.vercel.com',
            path: endpoint,
            method,
            headers: {
                'Authorization':  `Bearer ${token}`,
                'Content-Type':   'application/json',
                ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
            }
        }, res => {
            let raw = '';
            res.on('data', c => raw += c);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
                catch { resolve({ status: res.statusCode, body: raw }); }
            });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function main() {
    const token = getVercelToken();
    if (!token) {
        console.error('❌ Could not find Vercel auth token. Run: vercel login');
        process.exit(1);
    }
    console.log('✅ Vercel token found\n');

    // Get all projects
    const projects = await api('GET', '/v9/projects?limit=20', null, token);
    if (projects.status !== 200) {
        console.error('❌ Could not list projects:', projects.body);
        process.exit(1);
    }

    const allProjects = projects.body.projects || [];
    console.log(`Found ${allProjects.length} projects:`);
    allProjects.forEach(p => console.log(`  - ${p.name} (${p.id})`));

    // Fix both frontend-dist and kisaanconnect projects
    const targets = allProjects.filter(p =>
        p.name === 'frontend-dist' || p.name === 'kisaanconnect'
    );

    for (const project of targets) {
        console.log(`\n🔧 Fixing project: ${project.name} (${project.id})`);

        // Disable deployment protection / Vercel Authentication
        const update = await api('PATCH', `/v9/projects/${project.id}`, {
            ssoProtection:         null,
            passwordProtection:    null,
            vercelAuthentication:  { deploymentType: 'none' },
        }, token);

        if (update.status === 200) {
            console.log(`  ✅ Deployment protection DISABLED — site is now public!`);
            const url = update.body.targets?.production?.url
                     || update.body.link?.deployHooks?.[0]?.url
                     || `https://${project.name}.vercel.app`;
            console.log(`  🌐 URL: https://frontend-dist-roan.vercel.app`);
        } else {
            console.log(`  ⚠️  Update response (${update.status}):`, JSON.stringify(update.body, null, 2));
        }
    }

    console.log('\n✅ Done! Your site should now be publicly accessible.');
    console.log('🌐 Visit: https://kisaanconnect-app.vercel.app\n');
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
