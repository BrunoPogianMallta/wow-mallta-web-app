document.addEventListener('DOMContentLoaded', function() {
  // Configurações globais
  const config = {
      apiBaseUrl: window.config?.apiBaseUrl || 'https://api-backend-server.onrender.com'
  };

  // ==================== NAVEGAÇÃO ==================== //
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const mainNav = document.querySelector('.main-nav');
  
  // Menu Mobile
  if (mobileMenuToggle && mainNav) {
      mobileMenuToggle.addEventListener('click', function() {
          mainNav.classList.toggle('active');
          this.classList.toggle('active');
      });
  }

  // Efeito de scroll no header
  const header = document.querySelector('.main-header');
  if (header) {
      window.addEventListener('scroll', function() {
          header.classList.toggle('scrolled', window.scrollY > 50);
      });
  }

  // Scroll suave para âncoras
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
          e.preventDefault();
          const targetId = this.getAttribute('href');
          if (targetId === '#') return;
          
          const targetElement = document.querySelector(targetId);
          if (targetElement) {
              window.scrollTo({
                  top: targetElement.offsetTop - 80,
                  behavior: 'smooth'
              });
              
              // Fecha o menu mobile se estiver aberto
              if (mainNav?.classList.contains('active')) {
                  mainNav.classList.remove('active');
                  mobileMenuToggle?.classList.remove('active');
              }
          }
      });
  });

  // ==================== SERVIDOR ==================== //
  // Status do servidor
  const statusElement = document.querySelector('.status-indicator');
  if (statusElement) {
      const updateServerStatus = async () => {
          try {
              const response = await fetch(`${config.apiBaseUrl}/api/server/status`);
              const data = await response.json();
              
              statusElement.className = 'status-indicator';
              statusElement.classList.add(data.online ? 'online' : 'offline');
              (statusElement.querySelector('.status-text') || statusElement).textContent = 
                  data.online ? 'Online' : 'Offline';
          } catch (error) {
              console.error('Erro ao verificar status:', error);
              statusElement.textContent = 'Erro';
          }
      };

      updateServerStatus();
      setInterval(updateServerStatus, 30000);
  }

  // Contagem de jogadores
  const onlineCountElement = document.getElementById('online-count');
  if (onlineCountElement) {
      const updatePlayerCount = async () => {
          try {
              const response = await fetch(`${config.apiBaseUrl}/api/server/players`);
              const data = await response.json();
              onlineCountElement.textContent = data.count?.toLocaleString() || '0';
          } catch (error) {
              console.error('Erro ao verificar jogadores:', error);
              onlineCountElement.textContent = '--';
          }
      };

      updatePlayerCount();
      setInterval(updatePlayerCount, 60000);
  }

  // ==================== AUTENTICAÇÃO ==================== //
  // Verificação inicial de login (para páginas protegidas)
  const protectedPages = ['dashboard.html', 'profile.html'];
  const currentPage = window.location.pathname.split('/').pop();

  if (protectedPages.includes(currentPage)) {
      const authToken = localStorage.getItem('authToken');
      
      if (authToken) {
          verifyToken(authToken).catch(() => {
              redirectToLogin();
          });
      } else {
          redirectToLogin();
      }
  }

  // Função para verificar token
  async function verifyToken(token) {
      try {
          const response = await fetch(`${config.apiBaseUrl}/api/auth/verify`, {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (!response.ok) throw new Error('Token inválido');
          
          return await response.json();
          
      } catch (error) {
          console.error('Falha na verificação:', error);
          throw error;
      }
  }

  // Função para redirecionar para login
  function redirectToLogin() {
      const loginPath = `${window.location.origin}/wow-mallta-web-app/pages/login.html`;
      
      if (!window.location.href.includes('login.html')) {
          console.log('Redirecionando para login:', loginPath);
          window.location.href = loginPath;
      }
  }
});

// ==================== FUNÇÕES GLOBAIS ==================== //
// Logout (pode ser chamado de qualquer lugar)
function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('rememberMe');
  localStorage.clear();
  window.location.href = `${window.location.origin}/wow-mallta-web-app/pages/login.html`;
}