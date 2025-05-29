document.addEventListener('DOMContentLoaded', async () => {
    const API_BASE_URL = 'https://api-backend-server.onrender.com';
    const selectors = {
        userAvatar: '#user-avatar',
        usernameDisplay: '#username-display',
        userClassLevel: '#user-class-level',
        votePoints: '#vote-points',
        nextVoteTime: '#next-vote-time',
        voteSitesContainer: '#vote-sites-container',
        logoutBtn: '#logout-btn',
        accountForm: '#account-form',
        formMessage: '#form-message',
        hoursPlayed: '#hours-played',
        joinDate: '#join-date',
        ranking: '#ranking',
        changeCharacterBtn: '#change-character',
        characterModal: '#character-modal',
        modalCharactersList: '#modal-characters-list',
        charactersList: '#characters-list',
        closeModal: '.close-modal',
        dashboardSections: '.dashboard-content > section',
        menuLinks: '.dashboard-menu a[data-section]'
    };

    let userProfile = {};
    let voteStatus = {};
    let characters = [];

    if (!isAuthenticated()) {
        redirectToLogin();
        return;
    }

    try {
        await Promise.all([loadUserProfile(), loadVoteStatus(), loadCharacters()]);
        setupEventListeners();
        startVoteTimer();
    } catch (error) {
        showMessage('error', 'Erro ao carregar o dashboard.');
        console.error(error);
    }

    function $(selector) {
        return document.querySelector(selector);
    }

    function isAuthenticated() {
        return !!localStorage.getItem('authToken');
    }

    function redirectToLogin() {
        window.location.href = `login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
    }

    async function apiRequest(endpoint, method = 'GET', body = null) {
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            },
        };
        if (body) options.body = JSON.stringify(body);

        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Erro desconhecido');
        }
        return data.data;
    }

    async function loadUserProfile() {
        userProfile = await apiRequest('/api/dashboard/profile');
        updateUserProfileUI();
    }

    async function loadCharacters() {
        characters = await apiRequest('/api/characters');
        renderCharactersList();
    }

    function updateUserProfileUI() {
        $(selectors.usernameDisplay).textContent = userProfile.account.username;
        $('#username').value = userProfile.account.username;
        $('#email').value = userProfile.account.email;
        $(selectors.votePoints).textContent = userProfile.account.votePoints;
        $(selectors.hoursPlayed).textContent = `${userProfile.stats.hoursPlayed} horas`;
        $(selectors.joinDate).textContent = formatDate(userProfile.account.joinDate);
        $(selectors.ranking).textContent = `#${userProfile.stats.ranking}`;

        if (userProfile.mainCharacter) {
            updateCharacterDisplay(userProfile.mainCharacter);
        }
    }

    function updateCharacterDisplay(character) {
        const classElement = document.createElement('span');
        classElement.className = `class-${getClassName(character.class).toLowerCase()}`;
        classElement.textContent = getClassName(character.class);
        
        $(selectors.userClassLevel).innerHTML = `Nível ${character.level} - `;
        $(selectors.userClassLevel).appendChild(classElement);
        
        updateCharacterAvatar(character.race, character.gender, character.class);
    }

    async function loadVoteStatus() {
        voteStatus = await apiRequest('/api/dashboard/vote-status');
        renderVoteSites();
    }

    function renderVoteSites() {
        const container = $(selectors.voteSitesContainer);
        container.innerHTML = '';

        if (!voteStatus.sites?.length) {
            container.innerHTML = '<p>Nenhum site de votação disponível no momento.</p>';
            return;
        }

        voteStatus.sites.forEach(site => {
            const div = document.createElement('div');
            div.className = 'vote-site';
            div.innerHTML = `
                <img src="../images/vote-${site.name.toLowerCase()}.png" alt="${site.name}">
                <a href="#" class="btn btn-vote ${site.canVote ? '' : 'disabled'}" 
                   data-site="${site.name}" ${site.canVote ? '' : 'disabled'}>
                    <i class="fas ${site.canVote ? 'fa-vote-yea' : 'fa-check-circle'}"></i> 
                    ${site.canVote ? 'Votar Agora' : `Aguardar (${formatTime(voteStatus.nextVoteTime)})`}
                </a>
            `;
            container.appendChild(div);
        });
    }

    function renderCharactersList() {
        const container = $(selectors.charactersList);
        const modalContainer = $(selectors.modalCharactersList);
        
        container.innerHTML = '';
        modalContainer.innerHTML = '';
        
        if (!characters.length) {
            container.innerHTML = '<p>Você ainda não criou personagens neste servidor.</p>';
            return;
        }

        characters.forEach(character => {
            // Lista no modal de seleção
            const modalChar = document.createElement('div');
            modalChar.className = `character-item ${character.isMain ? 'main-character' : ''}`;
            modalChar.innerHTML = `
                <div class="character-avatar">
                    <img src="../images/avatars/${character.race}_${character.gender}_${character.class}.jpg" alt="${character.name}">
                </div>
                <div class="character-info">
                    <h4>${character.name}</h4>
                    <p>Nível ${character.level} ${getClassName(character.class)}</p>
                    <p>${character.raceName} - ${character.gender === 0 ? 'Masculino' : 'Feminino'}</p>
                </div>
                <button class="btn btn-small select-character" data-id="${character.guid}">
                    ${character.isMain ? 'Selecionado' : 'Selecionar'}
                </button>
            `;
            modalContainer.appendChild(modalChar);

            // Lista na seção de personagens
            if (character.isMain) return; // Não mostrar o principal na lista
            
            const charItem = document.createElement('div');
            charItem.className = 'character-item';
            charItem.innerHTML = `
                <div class="character-avatar">
                    <img src="../images/avatars/${character.race}_${character.gender}_${character.class}.jpg" alt="${character.name}">
                </div>
                <div class="character-info">
                    <h4>${character.name}</h4>
                    <p>Nível ${character.level} ${getClassName(character.class)}</p>
                    <p>${character.raceName} - ${character.gender === 0 ? 'Masculino' : 'Feminino'}</p>
                </div>
                <div class="character-stats">
                    <div class="stat-item">
                        <span>Honra</span>
                        <strong>${character.honorPoints}</strong>
                    </div>
                    <div class="stat-item">
                        <span>Arena</span>
                        <strong>${character.arenaPoints}</strong>
                    </div>
                </div>
            `;
            container.appendChild(charItem);
        });
    }

    function setupEventListeners() {
        $(selectors.logoutBtn).addEventListener('click', logout);
        
        document.querySelectorAll(selectors.menuLinks).forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                showSection(link.getAttribute('data-section'));
            });
        });
        
        $(selectors.voteSitesContainer).addEventListener('click', async e => {
            const btn = e.target.closest('.btn-vote');
            if (btn && !btn.classList.contains('disabled')) {
                e.preventDefault();
                await registerVote(btn.getAttribute('data-site'));
            }
        });
        
        $(selectors.accountForm).addEventListener('submit', async e => {
            e.preventDefault();
            await updateAccount();
        });
        
        $(selectors.changeCharacterBtn).addEventListener('click', () => {
            $(selectors.characterModal).style.display = 'block';
        });
        
        $(selectors.closeModal).addEventListener('click', () => {
            $(selectors.characterModal).style.display = 'none';
        });
        
        $(selectors.modalCharactersList).addEventListener('click', async e => {
            const btn = e.target.closest('.select-character');
            if (btn) {
                e.preventDefault();
                await setMainCharacter(btn.getAttribute('data-id'));
            }
        });
        
        window.addEventListener('click', e => {
            if (e.target === $(selectors.characterModal)) {
                $(selectors.characterModal).style.display = 'none';
            }
        });
    }

    function showSection(sectionId) {
        document.querySelectorAll(selectors.dashboardSections).forEach(section => {
            section.style.display = 'none';
        });
        $(`#${sectionId}-section`).style.display = 'block';
        
        // Atualizar menu ativo
        document.querySelectorAll(selectors.menuLinks).forEach(link => {
            link.parentElement.classList.remove('active');
            if (link.getAttribute('data-section') === sectionId) {
                link.parentElement.classList.add('active');
            }
        });
    }

    async function registerVote(siteName) {
        try {
            const data = await apiRequest('/api/dashboard/register-vote', 'POST', { site: siteName });
            userProfile.account.votePoints += data.pointsAdded;
            $(selectors.votePoints).textContent = userProfile.account.votePoints;
            await loadVoteStatus();
            showMessage('success', 'Voto registrado com sucesso!');
        } catch (error) {
            showMessage('error', error.message);
        }
    }

    async function setMainCharacter(characterGuid) {
        try {
            const data = await apiRequest('/api/characters/set-main', 'POST', { guid: characterGuid });
            userProfile.mainCharacter = data.character;
            updateCharacterDisplay(userProfile.mainCharacter);
            $(selectors.characterModal).style.display = 'none';
            await loadCharacters();
            showMessage('success', 'Personagem principal atualizado!');
        } catch (error) {
            showMessage('error', error.message);
        }
    }

    async function updateAccount() {
        const formData = {
            email: $('#email').value,
            currentPassword: $('#current-password').value,
            newPassword: $('#new-password').value
        };
        
        if (!formData.email && !formData.newPassword) {
            showMessage('error', 'Preencha algum campo para atualizar.');
            return;
        }
        
        if (formData.newPassword && !formData.currentPassword) {
            showMessage('error', 'Informe sua senha atual para mudar a senha.');
            return;
        }

        try {
            const data = await apiRequest('/api/dashboard/update-profile', 'PUT', formData);
            userProfile.account.email = data.account.email;
            $('#email').value = data.account.email;
            $('#current-password').value = '';
            $('#new-password').value = '';
            showMessage('success', 'Dados atualizados!');
        } catch (error) {
            showMessage('error', error.message);
        }
    }

    function logout() {
        localStorage.removeItem('authToken');
        redirectToLogin();
    }

    function showMessage(type, text) {
        const msg = $(selectors.formMessage);
        msg.textContent = text;
        msg.className = `form-message ${type}`;
        setTimeout(() => {
            msg.textContent = '';
            msg.className = 'form-message';
        }, 5000);
    }

    function getClassName(classId) {
        const classes = {
            1: 'Guerreiro', 2: 'Paladino', 3: 'Caçador', 4: 'Ladino',
            5: 'Sacerdote', 6: 'Cavaleiro da Morte', 7: 'Xamã',
            8: 'Mago', 9: 'Bruxo', 10: 'Monge', 11: 'Druida'
        };
        return classes[classId] || 'Desconhecido';
    }

    function updateCharacterAvatar(raceId, genderId, classId) {
        $(selectors.userAvatar).src = `../images/avatars/${raceId}_${genderId}_${classId}.jpg`;
    }

    function formatTime(minutes) {
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hrs}h ${mins}m`;
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    function startVoteTimer() {
        if (voteStatus.nextVoteTime > 0) {
            $(selectors.nextVoteTime).textContent = formatTime(voteStatus.nextVoteTime);
            setTimeout(startVoteTimer, 60000);
        } else {
            $(selectors.nextVoteTime).textContent = 'Agora!';
            loadVoteStatus();
        }
    }
});