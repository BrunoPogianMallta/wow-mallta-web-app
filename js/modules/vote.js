import { apiRequest } from './api.js';

export async function renderVoteSites(voteStatus, selectors, onVoteClick) {
    const container = document.querySelector(selectors.voteSitesContainer);
    container.innerHTML = '';
    voteStatus.sites.forEach(site => {
        const siteEl = document.createElement('div');
        siteEl.innerHTML = `
            <p>${site.name} - Próximo voto: ${site.nextVote}</p>
            <button ${site.canVote ? '' : 'disabled'} data-id="${site.id}">Votar</button>
        `;
        siteEl.querySelector('button').addEventListener('click', () => onVoteClick(site.id));
        container.appendChild(siteEl);
    });

    document.querySelector(selectors.nextVoteTime).textContent = voteStatus.nextVoteIn;
}

export async function handleVote(siteId, selectors, voteStatusRef) {
    const result = await apiRequest(`/api/dashboard/vote/${siteId}`, 'POST');
    if (result) {
        alert('Voto registrado!');
        const updated = await apiRequest('/api/dashboard/vote-status');
        if (updated) {
            voteStatusRef.sites = updated.sites;
            voteStatusRef.nextVoteIn = updated.nextVoteIn;
            renderVoteSites(voteStatusRef, selectors, id => handleVote(id, selectors, voteStatusRef));
        }
    }
}
