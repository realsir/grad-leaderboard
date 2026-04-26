const fs = require('fs/promises');
const path = require('path');

export default async function handler(req, res) {
  try {
    const dataPath = path.join(process.cwd(), '.data/leaderboard.json');
    let data = [];
    
    try {
      data = JSON.parse(await fs.readFile(dataPath, 'utf8'));
    } catch (e) {
      // No cache yet
    }
    
    res.status(200).json({
      success: true,
      data,
      count: data.length,
      cached: data.length > 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Leaderboard API error', 
      details: error.message 
    });
  }
}