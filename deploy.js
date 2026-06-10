/**
 * deploy.js — KisaanConnect Professional Auto-Deployer
 * =====================================================
 * Run: node deploy.js
 * 
 * This script:
 *   1. Reads all env vars from .env
 *   2. Creates the Render Web Service via Render API
 *   3. Sets all environment variables on Render
 *   4. Deploys frontend to Vercel via CLI
 *   5. Wires RENDER_API_URL into Vercel env
 * 
 * Prerequisites:
 *   - Set RENDER_API_KEY below (get from https://dashboard.render.com/u/settings#api-keys)
 *   - Set VERCEL_TOKEN below (get from https://vercel.com/account/tokens)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');

// ─── CONFIG ────────────────────────────────────────────────────────────────
const RENDER_API_KEY   = process.env.RENDER_API_KEY || '';
const VERCEL_TOKEN     = process.env.VERCEL_TOKEN   || '';
const GITHUB_REPO      = 'https://github.com/dhanunjayroyal/KisaanConnect_Standalone';
const SERVICE_NAME     = 'kisaanconnect-api';
const OWNER_ID         = ''; // will be fetched automatically

// ─── ENV PARSING ────────────────────────────────────────────────────────────
function parseEnvFile(filePath) {
    const raw = fs.readFileSync(filePath, 'utf8');
    const vars = {};
    for (const line of raw.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx < 0) continue;
        const key = trimmed.substring(0, eqIdx).trim();
        let val = trimmed.substring(eqIdx + 1).trim();
        // Strip surrounding quotes
        if ((val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }
        // Convert literal \n to actual newlines in private key
        if (key === 'FIREBASE_PRIVATE_KEY') {
            val = val.replace(/\\n/g, '\n');
        }
        if (val) vars[key] = val;
    }
    return vars;
}

// ─── HTTP HELPERS ────────────────────────────────────────────────────────────
function apiRequest(options, body = null) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(data) });
                } catch {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });
        req.on('error', reject);
        if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
        req.end();
    });
}

function renderApi(method, path, body = null) {
    return apiRequest({
        hostname: 'api.render.com',
        path: `/v1${path}`,
        method,
        headers: {
            'Authorization': `Bearer ${RENDER_API_KEY}`,
            'Content-Type':  'application/json',
            'Accept':        'application/json',
        }
    }, body);
}

// ─── RENDER DEPLOYMENT ────────────────────────────────────────────────────
async function deployToRender(envVars) {
    console.log('\n🚀 RENDER DEPLOYMENT');
    console.log('═══════════════════════════════════════');

    if (!RENDER_API_KEY) {
        console.error('❌ RENDER_API_KEY is not set.');
        console.log('   → Get it from: https://dashboard.render.com/u/settings#api-keys');
        console.log('   → Then run:   set RENDER_API_KEY=rnd_xxxxxx && node deploy.js');
        return null;
    }

    // 1. Get owner ID
    console.log('📡 Fetching Render account info...');
    const meRes = await renderApi('GET', '/owners?limit=1');
    if (meRes.status !== 200 || !meRes.body.length) {
        console.error('❌ Could not fetch Render owner. Check your API key.');
        return null;
    }
    const ownerId = meRes.body[0].owner.id;
    console.log(`✅ Owner ID: ${ownerId}`);

    // 2. Check if service already exists
    console.log('🔍 Checking for existing service...');
    const listRes = await renderApi('GET', `/services?name=${SERVICE_NAME}&limit=5`);
    let serviceId = null;
    if (listRes.status === 200 && listRes.body.length) {
        for (const s of listRes.body) {
            if (s.service?.name === SERVICE_NAME) {
                serviceId = s.service.id;
                console.log(`♻️  Found existing service: ${serviceId}`);
                break;
            }
        }
    }

    // 3. Create service if not exists
    if (!serviceId) {
        console.log('🔨 Creating new Render Web Service...');
        const createRes = await renderApi('POST', '/services', {
            type:     'web_service',
            name:     SERVICE_NAME,
            ownerId:  ownerId,
            repo:     GITHUB_REPO,
            branch:   'master',
            autoDeploy: 'yes',
            serviceDetails: {
                env:          'node',
                buildCommand: 'npm install --only=production',
                startCommand: 'node server.js',
                plan:         'free',
                region:       'singapore',
                numInstances: 1,
            }
        });

        if (createRes.status !== 201) {
            console.error('❌ Failed to create service:', JSON.stringify(createRes.body, null, 2));
            return null;
        }
        serviceId = createRes.body.service?.id;
        console.log(`✅ Service created: ${serviceId}`);
    }

    // 4. Set environment variables
    console.log('📋 Setting environment variables on Render...');
    const envPayload = [
        { key: 'NODE_ENV',                value: 'production' },
        { key: 'PORT',                    value: '3000' },
        { key: 'FIREBASE_PROJECT_ID',     value: envVars.FIREBASE_PROJECT_ID     || '' },
        { key: 'FIREBASE_CLIENT_EMAIL',   value: envVars.FIREBASE_CLIENT_EMAIL   || '' },
        { key: 'FIREBASE_PRIVATE_KEY',    value: envVars.FIREBASE_PRIVATE_KEY    || '' },
        { key: 'FIREBASE_CLIENT_ID',      value: envVars.FIREBASE_CLIENT_ID      || '' },
        { key: 'MAIL_USER',               value: envVars.MAIL_USER               || '' },
        { key: 'MAIL_PASS',               value: envVars.MAIL_PASS               || '' },
        { key: 'RESEND_API_KEY',          value: envVars.RESEND_API_KEY          || '' },
        { key: 'RESEND_FROM_EMAIL',       value: envVars.RESEND_FROM_EMAIL       || '' },
        { key: 'GOOGLE_AI_KEY',           value: envVars.GOOGLE_AI_KEY           || '' },
        { key: 'WEATHER_API_KEY',         value: envVars.WEATHER_API_KEY         || '' },
        { key: 'GOOGLE_MAPS_API_KEY',     value: envVars.GOOGLE_MAPS_API_KEY     || '' },
        { key: 'ADMIN_EMAIL',             value: envVars.ADMIN_EMAIL             || '' },
        { key: 'ADMIN_PASSWORD',          value: envVars.ADMIN_PASSWORD          || '' },
    ].filter(e => e.value);

    const envRes = await renderApi('PUT', `/services/${serviceId}/env-vars`, envPayload);
    if (envRes.status !== 200) {
        console.error('⚠️  Env var update issue:', envRes.status, JSON.stringify(envRes.body));
    } else {
        console.log(`✅ ${envPayload.length} environment variables set`);
    }

    // 5. Trigger a fresh deploy
    console.log('🔄 Triggering deployment...');
    const deployRes = await renderApi('POST', `/services/${serviceId}/deploys`, { clearCache: 'clear' });
    if (deployRes.status === 201) {
        console.log('✅ Deploy triggered!');
    }

    // 6. Get the service URL
    const svcRes = await renderApi('GET', `/services/${serviceId}`);
    const svcUrl = svcRes.body?.service?.serviceDetails?.url || `https://${SERVICE_NAME}.onrender.com`;
    console.log(`\n🌐 Render Backend URL: ${svcUrl}`);
    return svcUrl;
}

// ─── VERCEL DEPLOYMENT ────────────────────────────────────────────────────
async function deployToVercel(renderUrl) {
    console.log('\n⚡ VERCEL DEPLOYMENT');
    console.log('═══════════════════════════════════════');

    if (!VERCEL_TOKEN) {
        console.error('❌ VERCEL_TOKEN is not set.');
        console.log('   → Get it from: https://vercel.com/account/tokens');
        console.log('   → Then run:   set VERCEL_TOKEN=xxxx && node deploy.js');
        return null;
    }

    if (!renderUrl) {
        console.error('❌ Render URL is not available. Skipping Vercel deploy.');
        return null;
    }

    console.log('📡 Deploying frontend to Vercel...');
    console.log(`   RENDER_API_URL = ${renderUrl}`);

    // Write the env-config.js with the Render URL
    const envConfigContent = `/* Auto-generated by deploy.js — DO NOT edit manually */
(function() {
    var renderUrl = ${JSON.stringify(renderUrl)};
    if (renderUrl) {
        window.KISAAN_RENDER_URL = renderUrl;
        window.KISAAN_API_URL    = renderUrl + '/api';
        console.log('[KisaanEnv] 🌐 Production API:', window.KISAAN_API_URL);
    }
})();
`;
    fs.writeFileSync(path.join(__dirname, 'env-config.js'), envConfigContent);
    console.log('✅ env-config.js updated with Render URL');

    // Commit the update
    try {
        execSync('git add env-config.js', { cwd: __dirname });
        execSync(`git commit -m "deploy: set RENDER_API_URL=${renderUrl}"`, { cwd: __dirname });
        execSync('git push origin master', { cwd: __dirname });
        console.log('✅ env-config.js committed and pushed to GitHub');
    } catch (e) {
        console.log('⚠️  Git push skipped (no changes or auth issue)');
    }

    // Deploy via Vercel API
    const vercelRes = await apiRequest({
        hostname: 'api.vercel.com',
        path:     '/v13/deployments',
        method:   'POST',
        headers: {
            'Authorization': `Bearer ${VERCEL_TOKEN}`,
            'Content-Type':  'application/json',
        }
    }, {
        name:   'kisaanconnect',
        gitSource: {
            type:   'github',
            repoId: 'dhanunjayroyal/KisaanConnect_Standalone',
            ref:    'master',
        },
        projectSettings: {
            framework:       null,
            buildCommand:    'node build-env.js',
            outputDirectory: '.',
            installCommand:  '',
        },
        environmentVariables: [
            { key: 'RENDER_API_URL', value: renderUrl, type: 'plain', target: ['production', 'preview'] }
        ]
    });

    if (vercelRes.status === 200 || vercelRes.status === 201) {
        const vercelUrl = vercelRes.body?.url || 'Check Vercel dashboard';
        console.log(`✅ Vercel deployment started!`);
        console.log(`🌐 Frontend URL: https://${vercelUrl}`);
        return vercelUrl;
    } else {
        console.error('⚠️  Vercel deploy response:', vercelRes.status, JSON.stringify(vercelRes.body, null, 2));
        console.log('\n💡 Manual alternative: Run this in terminal:');
        console.log(`   set RENDER_API_URL=${renderUrl} && npx vercel --prod`);
        return null;
    }
}

// ─── MAIN ────────────────────────────────────────────────────────────────
async function main() {
    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║   KisaanConnect — Professional Auto-Deploy   ║');
    console.log('║   Backend: Render  |  Frontend: Vercel       ║');
    console.log('╚══════════════════════════════════════════════╝');

    // Parse environment variables
    const envVars = parseEnvFile(path.join(__dirname, '.env'));
    console.log(`\n✅ Loaded ${Object.keys(envVars).length} env vars from .env`);

    // Deploy backend first
    const renderUrl = await deployToRender(envVars);

    // Deploy frontend with the Render URL
    const vercelUrl = await deployToVercel(renderUrl);

    // Summary
    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║            DEPLOYMENT SUMMARY                ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log(`║ Backend  (Render):  ${(renderUrl || 'NOT DEPLOYED').padEnd(25)}║`);
    console.log(`║ Frontend (Vercel):  ${(vercelUrl ? 'https://'+vercelUrl : 'NOT DEPLOYED').padEnd(25)}║`);
    console.log('╚══════════════════════════════════════════════╝\n');

    if (!renderUrl || !vercelUrl) {
        console.log('📋 To complete deployment, set your API keys:');
        console.log('');
        console.log('   # Get from: https://dashboard.render.com/u/settings#api-keys');
        console.log('   set RENDER_API_KEY=rnd_xxxxxxxxxxxxxxxxxxxxxx');
        console.log('');
        console.log('   # Get from: https://vercel.com/account/tokens');
        console.log('   set VERCEL_TOKEN=xxxxxxxxxxxxxxxxxxxxxx');
        console.log('');
        console.log('   # Then run:');
        console.log('   node deploy.js');
    }
}

main().catch(err => {
    console.error('\n❌ Deployment failed:', err.message);
    process.exit(1);
});
