import { apiRequest } from './api.js';
import { showToast } from './toast.js';

export function renderVoteSites(voteData, selectors, onVoteClick) {
  const container = selectors.voteSitesContainer;
  container.innerHTML = '';

  const now = Date.now();
  const sites = voteData.sites || [];

  sites.forEach(site => {
    const nextVoteTime = site.nextVote ? new Date(site.nextVote).getTime() : 0;
    const canVote = site.canVote ?? (nextVoteTime <= now);

    let statusText = '';
    if (!canVote) {
      const diffMs = nextVoteTime - now;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      statusText = `Aguarde ${hours}h ${minutes}m`;
    }

    const siteElement = document.createElement('div');
    siteElement.className = 'vote-site';
    siteElement.setAttribute('data-site-id', site.site_id);

    siteElement.innerHTML = `
      <h4>${site.name}</h4>
      <img src="${site.iconUrl}" alt="${site.name} icon" class="vote-icon" />
      <p class="vote-status">${statusText}</p>
      ${canVote 
        ? `<button class="btn btn-primary vote-btn">Votar</button>` 
        : `<p class="text-muted">Você já votou</p>`
      }
    `;

    if (canVote) {
      const voteButton = siteElement.querySelector('.vote-btn');
      voteButton.addEventListener('click', () => {
        onVoteClick(site.site_id);
      });
    }

    container.appendChild(siteElement);
  });

  // Atualiza pontos na UI
  const pointsEl = document.getElementById('vote-points');
  if (pointsEl && typeof voteData.votePoints === 'number') {
    pointsEl.textContent = `Pontos de voto: ${voteData.votePoints}`;
  }
}

export async function handleVote(siteId, selectors, voteStatusRef) {
  const siteElem = selectors.voteSitesContainer.querySelector(`.vote-site[data-site-id="${siteId}"]`);
  if (!siteElem) return;

  const voteButton = siteElem.querySelector('.vote-btn');
  if (!voteButton) return;

  // Abre o site de votação em nova aba
  const site = voteStatusRef.sites.find(s => s.site_id === siteId);
  if (!site) return;
  window.open(site.voteUrl, '_blank');

  // Esconde botão e mostra texto "Registrando seu voto..."
  voteButton.style.display = 'none';
  let registeringMsg = siteElem.querySelector('.registering-msg');
  if (!registeringMsg) {
    registeringMsg = document.createElement('p');
    registeringMsg.className = 'registering-msg';
    registeringMsg.textContent = 'Registrando seu voto...';
    siteElem.appendChild(registeringMsg);
  }
  registeringMsg.style.display = 'block';

  // Aguarda 40 segundos para o usuário votar de fato
  await new Promise(resolve => setTimeout(resolve, 10000));

  // Faz o POST para registrar o voto
  const result = await apiRequest(`/api/dashboard/vote`, 'POST', { site_id: siteId });

  // Remove mensagem de registrando
  registeringMsg.style.display = 'none';

  if (result) {
    showToast('Voto registrado com sucesso! Obrigado!', { type: 'success' });

    // Atualiza dados da UI
    const updated = await apiRequest('/api/dashboard/vote-status');
    if (updated) {
      voteStatusRef.sites = updated.sites;
      voteStatusRef.votePoints = updated.votePoints;
      renderVoteSites(voteStatusRef, selectors, id => handleVote(id, selectors, voteStatusRef));
      updateNextVoteTime(voteStatusRef);
    }
  } else {
    voteButton.style.display = 'inline-block';
    showToast('Erro ao registrar voto, tente novamente.', { type: 'error' });
  }
}

export function updateNextVoteTime(voteStatusData) {
  if (!voteStatusData || !voteStatusData.sites) return;

  const now = Date.now();
  let minTime = Infinity;

  voteStatusData.sites.forEach(site => {
    const nextVoteTime = new Date(site.nextVote).getTime();
    if (!site.canVote && nextVoteTime > now) {
      const diff = nextVoteTime - now;
      if (diff < minTime) {
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
