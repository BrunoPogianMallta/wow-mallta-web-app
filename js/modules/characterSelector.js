import { apiRequest } from './api.js';
import { updateCharacterInfoUI } from './userProfile.js';
import { classMap } from '../utils/classMap.js';

const CHARACTER_CACHE_KEY = 'cachedCharacters';
const CHARACTER_CACHE_TIME_KEY = 'cachedCharactersTimestamp';
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hora

export async function setupCharacterSelectionModal() {
  const modal = document.getElementById('character-modal');
  const container = document.getElementById('modal-characters-list');
  const closeModal = document.querySelector('.close-modal');
  const changeCharBtn = document.getElementById('change-character');

  changeCharBtn.addEventListener('click', async () => {
    container.innerHTML = '<p>Carregando personagens...</p>';
    modal.style.display = 'block';

    const characters = await getCachedCharacters();

    container.innerHTML = ''; // Limpa loading

    if (!characters || characters.length === 0) {
      container.innerHTML = '<p>Nenhum personagem encontrado.</p>';
      return;
    }

    characters.forEach(char => {
      const className = classMap[char.class] || 'unknown';
      const imageName = `${className}.png`;

      const div = document.createElement('div');
      div.className = 'character-card';
      div.innerHTML = `
        <img src="../images/avatars/${imageName}" alt="${char.name}" 
          onerror="this.onerror=null;this.src='../images/avatars/default.png'">
        <p>${char.name}</p>
        <span>${char.level} - ${className.charAt(0).toUpperCase() + className.slice(1)}</span>
      `;
      div.addEventListener('click', () => selectCharacter(char.guid));
      container.appendChild(div);
    });
  });

  closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  async function selectCharacter(characterId) {
    const characters = await getCachedCharacters();
    const selected = characters.find(c => c.guid === characterId);
    if (!selected) return;

    updateCharacterInfoUI(selected);
    localStorage.setItem('selectedCharacterId', characterId);
    modal.style.display = 'none';
  }
}

export async function loadPrimaryCharacter() {
  const userProfile = await apiRequest('/api/user/profile');

  if (!userProfile || !userProfile.primaryCharacter) {
    return null;
  }

  localStorage.setItem('selectedCharacterId', userProfile.primaryCharacter.guid);
  updateCharacterInfoUI(userProfile.primaryCharacter);
  return userProfile.primaryCharacter;
}

// ✅ Usa cache local com expiração
async function getCachedCharacters() {
  const cached = localStorage.getItem(CHARACTER_CACHE_KEY);
  const timestamp = localStorage.getItem(CHARACTER_CACHE_TIME_KEY);

  const now = Date.now();

  if (cached && timestamp && (now - parseInt(timestamp, 10)) < CACHE_DURATION_MS) {
    return JSON.parse(cached);
  }

  try {
    const characters = await apiRequest('/api/characters/');
    localStorage.setItem(CHARACTER_CACHE_KEY, JSON.stringify(characters));
    localStorage.setItem(CHARACTER_CACHE_TIME_KEY, now.toString());
    return characters;
  } catch (err) {
    console.error('Erro ao buscar personagens:', err);
    return [];
  }
}

// (Opcional) função para limpar cache manualmente
export function clearCharacterCache() {
  localStorage.removeItem(CHARACTER_CACHE_KEY);
  localStorage.removeItem(CHARACTER_CACHE_TIME_KEY);
}
