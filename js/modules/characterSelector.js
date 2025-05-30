import { apiRequest } from './api.js';
import { updateCharacterInfoUI } from './userProfile.js';
import { classMap } from '../utils/classMap.js';

export async function setupCharacterSelectionModal() {
  const modal = document.getElementById('character-modal');
  const container = document.getElementById('modal-characters-list');
  const closeModal = document.querySelector('.close-modal');
  const changeCharBtn = document.getElementById('change-character');

  // Evento para abrir modal só quando clicar no botão
  changeCharBtn.addEventListener('click', async () => {
    container.innerHTML = '';
    const characters = await apiRequest('/api/characters/');
    if (!characters) return;

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

    modal.style.display = 'block';
  });

  closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  async function selectCharacter(characterId) {
    const characters = await apiRequest('/api/characters/');
    const selected = characters.find(c => c.guid === characterId);
    if (!selected) return;

    updateCharacterInfoUI(selected);
    localStorage.setItem('selectedCharacterId', characterId);
    modal.style.display = 'none';
  }
}

// Função para carregar personagem principal (vindo do backend) e salvar localStorage
export async function loadPrimaryCharacter() {
  // Supondo que seu backend já retorne o personagem principal em alguma rota
  const userProfile = await apiRequest('/api/user/profile'); 

  if (!userProfile || !userProfile.primaryCharacter) {
    // Se não tem personagem principal, aí sim deixa o localStorage vazio e não exibe nada
    return null;
  }

  // Salva o personagem principal no localStorage para manter coerência
  localStorage.setItem('selectedCharacterId', userProfile.primaryCharacter.guid);
  updateCharacterInfoUI(userProfile.primaryCharacter);

  return userProfile.primaryCharacter;
}
