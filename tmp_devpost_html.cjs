const https = require('https');
const fs = require('fs');
(async()=>{
  try {
    const res = await fetch('https://devpost.com/hackathons?challenge_type=online&status=open', { agent: new https.Agent({ rejectUnauthorized: false }) });
    const html = await res.text();
    fs.writeFileSync('devpost.html', html, 'utf8');
    console.log('saved devpost.html', html.length);
  } catch (e) { console.error(e); }
})();
