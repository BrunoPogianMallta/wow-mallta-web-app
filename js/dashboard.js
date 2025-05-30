import { apiRequest } from './modules/api.js';
import { selectors } from './modules/selectors.js';
import { updateUserProfileUI, updateCharacterInfoUI } from './modules/userProfile.js';
import { renderVoteSites, handleVote } from './modules/vote.js';
import { renderCharacters } from './modules/characters.js';
import { setupDashboardEvents } from './modules/events.js';
import { setupCharacterSelectionModal } from './modules/characterSelector.js';

document.addEventListener('DOMContentLoaded', async () => {
  if (!localStorage.getItem('authToken')) {
    window.location.href = 'login.html';
    return;
  }

  // Configura eventos do dashboard (ex: logout)
  setupDashboardEvents(selectors, () => {
    localStorage.removeItem('authToken');
    window.location.href = 'login.html';
  });

  // Inicializa modal, que só abrirá se o usuário clicar no botão para trocar personagem
  await setupCharacterSelectionModal();

  let userProfile = {};
  let voteStatus = {};
  let characters = [];

  async function loadAll() {
    // 1. Pega dados do perfil do usuário
    const profile = await apiRequest('/api/dashboard/profile');
    if (profile) {
      userProfile = profile;
      updateUserProfileUI(userProfile, selectors);
    }

    // 2. Pega lista de personagens
    const chars = await apiRequest('/api/characters');
    if (chars) {
      characters = chars;

      // 3. Tenta pegar personagem salvo no localStorage
      const savedCharacterId = localStorage.getItem('selectedCharacterId');
      let mainCharacter = null;

      if (savedCharacterId) {
        mainCharacter = characters.find(c => c.guid === parseInt(savedCharacterId));
      }

      // 4. Se não existir personagem salvo, tenta usar personagem principal do backend
      if (!mainCharacter) {
        // Usa a rota que retorna o personagem principal
        const mainCharFromApi = await apiRequest('/api/characters/main');
        if (mainCharFromApi) {
          mainCharacter = mainCharFromApi;
          localStorage.setItem('selectedCharacterId', mainCharacter.guid);
        }
      }

      // 5. Atualiza UI com personagem principal, se existir
      if (mainCharacter) {
        updateCharacterInfoUI(mainCharacter);
      }

      // 6. Renderiza lista de personagens no dashboard (se quiser mostrar todos)
      renderCharacters(characters, selectors, userProfile);
    }

    // 7. Pega status de votação
    const votes = await apiRequest('/api/dashboard/vote-status');
    if (votes) {
      voteStatus = votes;
      renderVoteSites(voteStatus, selectors, id => handleVote(id, selectors, voteStatus));
    }
  }

  await loadAll();

  // Atualiza status de votação a cada minuto
  setInterval(async () => {
    const votes = await apiRequest('/api/dashboard/vote-status');
    if (votes) {
      voteStatus = votes;
      renderVoteSites(voteStatus, selectors, id => handleVote(id, selectors, voteStatus));
    }
  }, 60000);


  const settingsBtn = document.getElementById("open-account-settings");
    const accountSettingsModal = document.getElementById("account-settings-modal");
    const closeModalButtons = accountSettingsModal.querySelectorAll(".close-modal");

    if (settingsBtn && accountSettingsModal) {
        settingsBtn.addEventListener("click", (e) => {
            e.preventDefault();
            accountSettingsModal.style.display = "block";
        });
    }

    // Fechar o modal ao clicar no botão X
    closeModalButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            accountSettingsModal.style.display = "none";
        });
    });

    // Fechar o modal ao clicar fora do conteúdo
    window.addEventListener("click", (e) => {
        if (e.target === accountSettingsModal) {
            accountSettingsModal.style.display = "none";
        }
    });
});
