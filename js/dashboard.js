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

  const voteSitesContainerEl = document.querySelector('#vote-sites-container');
  const votePointsEl = document.getElementById('vote-points');
  const nextVoteEl = document.getElementById('next-vote-time');

  let userProfile = null;
  let voteStatus = null;
  let characters = null;
  let mainCharacter = null;

  // Função para atualizar UI de votação - usa refs armazenadas para evitar buscar DOM toda hora
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

    // Tenta pegar personagem selecionado salvo no localStorage
    const savedCharacterId = localStorage.getItem('selectedCharacterId');
    mainCharacter = savedCharacterId ? characters.find(c => c.guid === parseInt(savedCharacterId)) : null;

    // Se não achou no localStorage, pega o principal do backend — evite chamada dupla!
    if (!mainCharacter) {
      mainCharacter = await apiRequest('/api/characters/main');
      if (mainCharacter) localStorage.setItem('selectedCharacterId', mainCharacter.guid);
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

  // Atualiza só o voteStatus a cada minuto (cache de voto pode ser gerenciado no backend para evitar falsos positivos)
  setInterval(loadVoteStatus, 60000);

  // Config modal configurações da conta (manter, sem mudança)
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
