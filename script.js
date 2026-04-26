class GradientLeaderboard {
  constructor() {
    this.initEventListeners();
    this.loadLeaderboard();
  }
  
  initEventListeners() {
    document.getElementById('refreshBtn').addEventListener('click', () => this.loadLeaderboard());
    document.getElementById('scrapeBtn').addEventListener('click', () => this.scrapeData());
  }
  
  async loadLeaderboard() {
    const status = document.getElementById('status');
    status.innerHTML = '⏳ Загрузка лидерборда...';
    
    try {
      const response = await fetch('/api/leaderboard');
      const result = await response.json();
      
      if (result.success && result.data.length > 0) {
        this.renderLeaderboard(result.data);
        status.innerHTML = `✅ Загружено <strong>${result.data.length}</strong> участников`;
      } else {
        status.innerHTML = `
          📊 Лидерборд пуст<br>
          <small>Нажмите "Собрать данные" чтобы начать</small>
        `;
      }
    } catch (error) {
      status.innerHTML = `
        ❌ Ошибка загрузки<br>
        <small>Проверьте подключение к интернету</small>
      `;
      console.error('Load error:', error);
    }
  }
  
  async scrapeData() {
    const status = document.getElementById('status');
    status.innerHTML = '🔄 Сбор данных из X Community... (45-90 сек)';
    
    try {
      const response = await fetch('/api/scrape', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      
      if (result.success) {
        status.innerHTML = `
          ✅ ${result.message}<br>
          <small>Обновляем таблицу...</small>
        `;
        setTimeout(() => this.loadLeaderboard(), 4000);
      } else {
        status.innerHTML = `
          ❌ Ошибка сбора данных<br>
          <small>Попробуйте позже или проверьте консоль</small>
        `;
      }
    } catch (error) {
      status.innerHTML = `
        ❌ Ошибка скрейпера<br>
        <small>X может блокировать запросы</small>
      `;
      console.error('Scrape error:', error);
    }
  }
  
  renderLeaderboard(data) {
    const container = document.getElementById('leaderboard-container');
    container.innerHTML = data.map((member, index) => `
      <div class="leaderboard-card rank-${index + 1}">
        <div class="card-top">
          <div class="rank-badge">#${member.rank}</div>
          <img src="${member.avatar || 'https://via.placeholder.com/72/667eea/ffffff?text=👤'}" 
               alt="${member.name}" class="member-avatar"
               onerror="this.src='https://via.placeholder.com/72/667eea/ffffff?text=👤'">
          <div class="member-info">
            <h3>${member.name}</h3>
            <div class="member-username">@${member.username}</div>
          </div>
        </div>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">${member.posts.toLocaleString()}</div>
            <div class="stat-label">Постов</div>
          </div>
          <div class="stat-item score-highlight">
            <div class="stat-value">${member.score.toLocaleString()}</div>
            <div class="stat-label">Всего очков</div>
          </div>
        </div>
      </div>
    `).join('');
  }
}

// Запуск при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  new GradientLeaderboard();
});