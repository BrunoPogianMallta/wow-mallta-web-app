import { apiRequest } from './modules/api.js';
import { selectors } from './modules/selectors.js';
import { updateUserProfileUI, updateCharacterInfoUI } from './modules/userProfile.js';
import { renderVoteSites, handleVote } from './modules/vote.js';
import { renderCharacters } from './modules/characters.js';
import { setupDashboardEvents } from './modules/events.js';
import { setupCharacterSelectionModal } from './modules/characterSelector.js';
import { mockVoteStatus } from './mocks/mockVoteData.js';

//Configuração dos tabs no modal de configurações
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    const tabId = button.getAttribute('data-tab');
    
    // Remove active class de todos os botões e conteúdos
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Adiciona active class ao botão clicado e ao conteúdo correspondente
    button.classList.add('active');
    document.querySelector(`.tab-content[data-tab="${tabId}"]`).classList.add('active');
  });
});

// Configuração do formulário de alteração de email
const changeEmailForm = document.getElementById('change-email-form');
if (changeEmailForm) {
  changeEmailForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const currentPassword = document.getElementById('current-password-email').value;
    const newEmail = document.getElementById('new-email').value;
    const messageEl = document.getElementById('account-settings-message');
    
    try {
      const response = await apiRequest('/api/account/email', 'PUT', {
        currentPassword,
        email: newEmail
      });

      if (response && response.success) {
        showMessage(messageEl, 'Email atualizado com sucesso!', 'success');
        // Atualiza o email exibido no perfil
        const emailDisplay = document.getElementById('email');
        if (emailDisplay) emailDisplay.value = newEmail;
      } else {
        throw new Error(response?.message || 'Erro ao atualizar email');
      }
    } catch (error) {
      showMessage(messageEl, error.message, 'error');
      console.error('Erro ao atualizar email:', error);
    }
  });
}

// Configuração do formulário de alteração de senha
const changePasswordForm = document.getElementById('change-password-form');
if (changePasswordForm) {
  changePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const messageEl = document.getElementById('account-settings-message');
    
    // Validação básica
    if (newPassword !== confirmPassword) {
      showMessage(messageEl, 'As senhas não coincidem!', 'error');
      return;
    }
    
    if (newPassword.length < 6) {
      showMessage(messageEl, 'A senha deve ter pelo menos 6 caracteres', 'error');
      return;
    }
    
    try {
      const response = await apiRequest('/api/account/password', 'PUT', {
        currentPassword,
        newPassword
      });

      if (response && response.success) {
        showMessage(messageEl, 'Senha atualizada com sucesso!', 'success');
        // Limpa os campos do formulário
        changePasswordForm.reset();
      } else {
        throw new Error(response?.message || 'Erro ao atualizar senha');
      }
    } catch (error) {
      showMessage(messageEl, error.message, 'error');
      console.error('Erro ao atualizar senha:', error);
    }
  });
}

// Função auxiliar para mostrar mensagens
function showMessage(element, text, type) {
  if (!element) return;
  
  element.textContent = text;
  element.className = `form-message ${type}`;
  element.style.display = 'block';
  
  // Esconde a mensagem após 5 segundos
  setTimeout(() => {
    element.style.display = 'none';
  }, 5000);
}




const useMockVoteData = false;


document.addEventListener('DOMContentLoaded', async () => {
  if (!localStorage.getItem('authToken')) {
    window.location.href = 'login.html';
    return;
  }

  setupDashboardEvents(selectors, () => {
    localStorage.removeItem('authToken');
    window.location.href = 'login.html';
  });

  await setupCharacterSelectionModal();

  const voteSitesContainerEl = document.querySelector('#vote-sites-container');
  const votePointsEl = document.getElementById('vote-points');
  const nextVoteEl = document.getElementById('next-vote-time');

  let userProfile = null;
  let voteStatus = null;
  let characters = null;
  let mainCharacter = null;

  function updateNextVoteTime(voteStatusData) {
    if (!voteStatusData?.sites?.length) return;

    const now = Date.now();
    let minTime = Infinity;

    for (const site of voteStatusData.sites) {
      if (!site.canVote && site.nextVote) {
        const diff = new Date(site.nextVote).getTime() - now;
        if (diff > 0 && diff < minTime) minTime = diff;
      }
    }

    if (minTime === Infinity) {
      nextVoteEl.textContent = 'Agora disponível!';
    } else {
      const hours = Math.floor(minTime / (1000 * 60 * 60));
      const minutes = Math.floor((minTime % (1000 * 60 * 60)) / (1000 * 60));
      nextVoteEl.textContent = `${hours}h ${minutes}m`;
    }
  }

  function updateVotePoints(voteStatusData) {
    votePointsEl.textContent = voteStatusData?.votePoints ?? '0';
  }

  async function loadVoteStatus() {
    if (useMockVoteData) {
      voteStatus = mockVoteStatus;
    } else {
      const votes = await apiRequest('/api/dashboard/vote-status');
      if (votes) voteStatus = votes;
    }

    if (voteStatus) {
      renderVoteSites(voteStatus, { voteSitesContainer: voteSitesContainerEl }, id => handleVote(id, { voteSitesContainer: voteSitesContainerEl }, voteStatus));
      updateNextVoteTime(voteStatus);
      updateVotePoints(voteStatus);
    }
  }

  async function loadProfile() {
    const profile = await apiRequest('/api/dashboard/profile');
    if (profile) {
      userProfile = profile;
      updateUserProfileUI(userProfile, selectors);
    }
  }

  async function loadCharacters() {
    characters = await apiRequest('/api/characters');
    if (!characters?.length) return;

    // Armazena os personagens no localStorage para uso no carrinho
    localStorage.setItem('cachedCharacters', JSON.stringify(characters));

    // Tenta pegar personagem selecionado salvo no localStorage
    const savedCharacterId = localStorage.getItem('selectedCharacterId');
    mainCharacter = savedCharacterId ? characters.find(c => c.guid === parseInt(savedCharacterId)) : null;

    // Se não achou no localStorage, pega o principal do backend
    if (!mainCharacter) {
      mainCharacter = await apiRequest('/api/characters/main');
      if (mainCharacter) {
        localStorage.setItem('selectedCharacterId', mainCharacter.guid);
      }
    }

    if (mainCharacter) {
      updateCharacterInfoUI(mainCharacter);
    }

    renderCharacters(characters, selectors, userProfile);
  }

  async function loadAll() {
    await loadProfile();
    await loadCharacters();
    await loadVoteStatus();
  }

  await loadAll();

  setInterval(loadVoteStatus, 60000);

  // Config modal configurações da conta
  const settingsBtn = document.getElementById("open-account-settings");
  const accountSettingsModal = document.getElementById("account-settings-modal");
  const closeModalButtons = accountSettingsModal?.querySelectorAll(".close-modal") ?? [];

  if (settingsBtn && accountSettingsModal) {
    settingsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      accountSettingsModal.style.display = "block";
    });
  }

  closeModalButtons.forEach(btn => btn.addEventListener("click", () => {
    accountSettingsModal.style.display = "none";
  }));

  window.addEventListener("click", (e) => {
    if (e.target === accountSettingsModal) {
      accountSettingsModal.style.display = "none";
    }
  });
});

const accountSettingsForm = document.getElementById("account-settings-form");

if (accountSettingsForm) {
  accountSettingsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const currentPassword = document.getElementById("modal-current-password").value;
    const newPassword = document.getElementById("modal-new-password").value;
    const email = document.getElementById("modal-email").value;

    try {
      // Verificar se há uma nova senha para atualizar
      if (newPassword) {
        const response = await apiRequest('/api/account/password', 'PUT', {
          currentPassword,
          newPassword
        });

        if (!response) {
          throw new Error('Erro ao atualizar senha');
        }
      }

      // Atualizar email se necessário
      if (email) {
        const response = await apiRequest('/api/account/email', 'PUT', {
          email
        });

        if (!response) {
          throw new Error('Erro ao atualizar email');
        }
      }

      // Feedback para o usuário
      alert('Configurações atualizadas com sucesso!');
      accountSettingsModal.style.display = "none";
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      alert(error.message || 'Erro ao atualizar configurações');
    }
  });
}