import puppeteer from 'puppeteer-core';

export default async function handler(req, res) {
  try {
    console.log('🎨 Gradient Leaderboard - Scraping started');
    
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--disable-background-timer-throttling'
      ]
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    const communityUrl = 'https://x.com/i/communities/1834090250387554433/members';
    await page.goto(communityUrl, { 
      waitUntil: 'networkidle2', 
      timeout: 45000 
    });
    
    // Infinite scroll для загрузки участников
    let previousHeight;
    for (let i = 0; i < 10; i++) {
      previousHeight = await page.evaluate('document.body.scrollHeight');
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      await page.waitForTimeout(4000);
      
      const newHeight = await page.evaluate('document.body.scrollHeight');
      if (newHeight === previousHeight) break;
    }
    
    const members = await page.evaluate(() => {
      const userCells = Array.from(document.querySelectorAll('[data-testid="UserCell"]'));
      return userCells.slice(0, 100).map((cell, index) => {
        const avatarImg = cell.querySelector('img');
        const nameElement = cell.querySelector('[data-testid="UserName"]');
        const usernameElement = cell.querySelector('a[role="link"] span');
        const postsText = cell.textContent;
        
        // Парсим количество постов
        const postsMatch = postsText.match(/(\d{1,3}(?:,\d{3})*|^\d+) posts?/i);
        const postsCount = postsMatch ? 
          parseInt(postsMatch[1].replace(/,/g, '')) : 0;
        
        return {
          rank: index + 1,
          name: nameElement?.textContent?.trim() || `Gradient Member #${index + 1}`,
          username: usernameElement?.textContent?.trim()?.slice(1) || `member${index}`,
          avatar: avatarImg?.src || '',
          posts: postsCount,
          replies: 0,
          retweets: 0,
          quotes: 0,
          score: postsCount * 4  // 4 очка за пост
        };
      }).filter(member => member.username && member.username.length > 1);
    });
    
    await browser.close();
    
    // Сохранение данных
    const fs = require('fs/promises');
    const dataPath = require('path').join(process.cwd(), '.data');
    await fs.mkdir(dataPath, { recursive: true });
    
    const sortedMembers = members.sort((a, b) => b.score - a.score);
    await fs.writeFile(
      require('path').join(dataPath, 'leaderboard.json'),
      JSON.stringify(sortedMembers, null, 2)
    );
    
    console.log(`✅ Gradient Leaderboard updated: ${sortedMembers.length} members`);
    res.json({ 
      success: true, 
      count: sortedMembers.length, 
      message: `Leaderboard обновлен! Топ: ${sortedMembers[0]?.name}` 
    });
    
  } catch (error) {
    console.error('Scraper Error:', error);
    res.status(500).json({ 
      error: 'Scraping failed', 
      details: error.message 
    });
  }
}