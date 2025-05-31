import { apiRequest } from './modules/api.js';
import { selectors } from './modules/selectors.js';
import { updateUserProfileUI, updateCharacterInfoUI } from './modules/userProfile.js';
import { renderVoteSites, handleVote } from './modules/vote.js';
import { renderCharacters } from './modules/characters.js';
import { setupDashboardEvents } from './modules/events.js';
import { setupCharacterSelectionModal } from './modules/characterSelector.js';
import { mockVoteStatus } from './mocks/mockVoteData.js'; // Ajuste o caminho se necessário

const useMockVoteData = false; // Mude para true para usar dados mockados

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

  let userProfile = {};
  let voteStatus = {};
  let characters = [];

  const voteSitesContainerEl = document.querySelector('#vote-sites-container');
  const votePointsEl = document.getElementById('vote-points');

  // Função fake para simular voto no mock
  async function fakeHandleVote(siteId, voteStatusRef) {
    alert(`Voto simulado no site ${siteId}`);
    const site = voteStatusRef.sites.find(s => s.id === siteId);
    if (site) {
      site.canVote = false;
      site.nextVote = Date.now() + 12 * 60 * 60 * 1000; // Próximo voto em 12h (simulado)
    }
    renderVoteSites(voteStatusRef, { voteSitesContainer: voteSitesContainerEl }, id => fakeHandleVote(id, voteStatusRef));
    updateNextVoteTime(voteStatusRef);
    updateVotePoints(voteStatusRef);
  }

  // Atualiza o texto do próximo voto na UI
  function updateNextVoteTime(voteStatusData) {
    if (!voteStatusData || !voteStatusData.sites) return;

    const now = Date.now();
    let minTime = Infinity;

    voteStatusData.sites.forEach(site => {
      if (!site.canVote && site.nextVote) {
        const nextVoteTime = new Date(site.nextVote).getTime();
        const diff = nextVoteTime - now;
        if (diff > 0 && diff < minTime) {
          minTime = diff;
        }
      }
    });

    const nextVoteEl = document.getElementById('next-vote-time');
    if (!nextVoteEl) return;

    if (minTime === Infinity) {
      nextVoteEl.textContent = 'Agora disponível!';
    } else {
      const hours = Math.floor(minTime / (1000 * 60 * 60));
      const minutes = Math.floor((minTime % (1000 * 60 * 60)) / (1000 * 60));
      nextVoteEl.textContent = `${hours}h ${minutes}m`;
    }
  }

  // Atualiza o texto dos pontos de voto na UI
  function updateVotePoints(voteStatusData) {
    if (!votePointsEl) return;
    votePointsEl.textContent = voteStatusData.votePoints ?? '0';
  }

  async function loadVoteStatus() {
    if (useMockVoteData) {
      voteStatus = mockVoteStatus;
      renderVoteSites(mockVoteStatus, { voteSitesContainer: voteSitesContainerEl }, id => fakeHandleVote(id, mockVoteStatus));
      updateNextVoteTime(mockVoteStatus);
      updateVotePoints(mockVoteStatus);
    } else {
      const votes = await apiRequest('/api/dashboard/vote-status');
      if (votes) {
        voteStatus = votes;
        renderVoteSites(voteStatus, { voteSitesContainer: voteSitesContainerEl }, id => handleVote(id, { voteSitesContainer: voteSitesContainerEl }, voteStatus));
        updateNextVoteTime(voteStatus);
        updateVotePoints(voteStatus);
      }
    }
  }

  async function loadAll() {
    // Perfil
    const profile = await apiRequest('/api/dashboard/profile');
    if (profile) {
      userProfile = profile;
      updateUserProfileUI(userProfile, selectors);
    }

    // Personagens
    const chars = await apiRequest('/api/characters');
    if (chars) {
      characters = chars;

      const savedCharacterId = localStorage.getItem('selectedCharacterId');
      let mainCharacter = null;

      if (savedCharacterId) {
        mainCharacter = characters.find(c => c.guid === parseInt(savedCharacterId));
      }

      if (!mainCharacter) {
        const mainCharFromApi = await apiRequest('/api/characters/main');
        if (mainCharFromApi) {
          mainCharacter = mainCharFromApi;
          localStorage.setItem('selectedCharacterId', mainCharacter.guid);
        }
      }

      if (mainCharacter) {
        updateCharacterInfoUI(mainCharacter);
      }

      renderCharacters(characters, selectors, userProfile);
    }

    // Votação
    await loadVoteStatus();
  }

  await loadAll();

  setInterval(loadVoteStatus, 60000); // Atualiza a cada minuto

  // Modal Configurações da conta
  const settingsBtn = document.getElementById("open-account-settings");
  const accountSettingsModal = document.getElementById("account-settings-modal");
  const closeModalButtons = accountSettingsModal.querySelectorAll(".close-modal");

  if (settingsBtn && accountSettingsModal) {
    settingsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      accountSettingsModal.style.display = "block";
    });
  }

  closeModalButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      accountSettingsModal.style.display = "none";
    });
  });

  window.addEventListener("click", (e) => {
    if (e.target === accountSettingsModal) {
      accountSettingsModal.style.display = "none";
    }
  });
});
