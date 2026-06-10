const { execSync } = require('child_process');
try {
    console.log('Adding files...');
    execSync('git add .', { stdio: 'inherit' });
    console.log('Committing changes...');
    execSync('git commit -m "fix: dynamic production sockets and vercel configurations"', { stdio: 'inherit' });
    console.log('Pushing to GitHub...');
    execSync('git push origin master', { stdio: 'inherit' });
    console.log('Successfully pushed all changes to GitHub!');
} catch (e) {
    console.error('Git operation failed:', e.message);
}
