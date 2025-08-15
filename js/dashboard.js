import { apiRequest } from './modules/api.js';
import { selectors } from './modules/selectors.js';
import { updateUserProfileUI, updateCharacterInfoUI } from './modules/userProfile.js';
import { renderVoteSites, handleVote } from './modules/vote.js';
import { renderCharacters } from './modules/characters.js';
import { setupDashboardEvents } from './modules/events.js';
import { setupCharacterSelectionModal } from './modules/characterSelector.js';
import { mockVoteStatus } from './mocks/mockVoteData.js';

// Função auxiliar para mostrar mensagens
function showMessage(element, text, type) {
    if (!element) return;
    
    element.textContent = text;
    element.className = `form-message ${type}`;
    element.style.display = 'block';
    
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

// Configuração dos tabs no modal de configurações
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tabId = button.getAttribute('data-tab');
        
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
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

            if (response) {
                if (response.success) {
                    showMessage(messageEl, 'Email atualizado com sucesso!', 'success');
                    document.getElementById('email').value = newEmail;
                    changeEmailForm.reset();
                } else {
                    throw new Error(response.message || 'Erro ao atualizar email');
                }
            } else {
                throw new Error('Resposta inválida do servidor');
            }
        } catch (error) {
            showMessage(messageEl, error.message, 'error');
            console.error('Erro ao atualizar email:', error);
        }
    });
}

// Configuração do formulário de alteração de senha CORRIGIDO
const changePasswordForm = document.getElementById('change-password-form');
if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const currentPassword = document.getElementById('current-password-modal').value;
        const newPassword = document.getElementById('new-password-modal').value;
        const confirmPassword = document.getElementById('confirm-password-modal').value;
        const messageEl = document.getElementById('account-settings-message');
        
        // Validação
        if (!newPassword || !confirmPassword) {
            showMessage(messageEl, 'Por favor, preencha ambos os campos de senha', 'error');
            return;
        }
        
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

            console.log('Resposta completa:', response); // Debug
            
            if (response) {
                if (response.success || response.message?.includes('sucesso')) {
                    const successMsg = response.message || 'Senha atualizada com sucesso!';
                    showMessage(messageEl, successMsg, 'success');
                    changePasswordForm.reset();
                } else {
                    throw new Error(response.message || 'Erro ao atualizar senha');
                }
            } else {
                throw new Error('Resposta inválida do servidor');
            }
        } catch (error) {
            console.error('Erro completo:', error); // Debug
            showMessage(messageEl, error.message, 'error');
        }
    });
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

        localStorage.setItem('cachedCharacters', JSON.stringify(characters));

        const savedCharacterId = localStorage.getItem('selectedCharacterId');
        mainCharacter = savedCharacterId ? characters.find(c => c.guid === parseInt(savedCharacterId)) : null;

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

    // Validação em tempo real das senhas
    const newPasswordField = document.getElementById('new-password-modal');
    const confirmPasswordField = document.getElementById('confirm-password-modal');
    
    if (newPasswordField && confirmPasswordField) {
        confirmPasswordField.addEventListener('input', function() {
            const newPass = newPasswordField.value;
            const confirmPass = this.value;
            
            if (newPass && confirmPass && newPass !== confirmPass) {
                this.classList.add('error');
            } else {
                this.classList.remove('error');
            }
        });
    }
});