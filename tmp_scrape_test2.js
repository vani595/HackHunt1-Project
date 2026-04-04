const { getLiveScrapedHackathons } = require('./server/utils/scrapers/liveHackathonScraper');
(async () => {
  try {
    const r = await getLiveScrapedHackathons({ forceRefresh: true });
    console.log('total', r.hackathons.length, 'sources', r.sources);
    console.log('first 8:', r.hackathons.slice(0, 8));
  } catch (e) {
    console.error('ERR', e);
  }
})();
