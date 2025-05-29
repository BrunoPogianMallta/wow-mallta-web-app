import { apiRequest } from './modules/api.js';
import { selectors } from './modules/selectors.js';
import { updateUserProfileUI } from './modules/userProfile.js';
import { renderVoteSites, handleVote } from './modules/vote.js';
import { renderCharacters } from './modules/characters.js';
import { setupDashboardEvents } from './modules/events.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    let userProfile = {};
    let voteStatus = {};
    let characters = [];

    if (!localStorage.getItem('authToken')) {
        window.location.href = 'login.html';
        return;
    }

    setupDashboardEvents(selectors, () => {
        localStorage.removeItem('authToken');
        window.location.href = 'login.html';
    });

    async function loadAll() {
        const profile = await apiRequest('/api/dashboard/profile');
        if (profile) {
            userProfile = profile;
            updateUserProfileUI(userProfile, selectors);
        }

        const votes = await apiRequest('/api/dashboard/vote-status');
        if (votes) {
            voteStatus = votes;
            renderVoteSites(voteStatus, selectors, id => handleVote(id, selectors, voteStatus));
        }

        const chars = await apiRequest('/api/characters');
        if (chars) {
            characters = chars;
            renderCharacters(characters, selectors, userProfile);
        }
    }

    await loadAll();

    setInterval(async () => {
        const votes = await apiRequest('/api/dashboard/vote-status');
        if (votes) {
            voteStatus = votes;
            renderVoteSites(voteStatus, selectors, id => handleVote(id, selectors, voteStatus));
        }
    }, 60000);
});
