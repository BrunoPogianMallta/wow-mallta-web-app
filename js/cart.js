document.addEventListener("DOMContentLoaded", function() {
  // Elementos do DOM
  const cartModal = document.getElementById("cartModal");
  const cartItemsList = document.getElementById("cartItemsList");
  const cartEmptyMessage = document.getElementById("cartEmptyMessage");
  const cartItemsContainer = document.getElementById("cartItemsContainer");
  const cartSubtotal = document.getElementById("cartSubtotal");
  const cartDiscounts = document.getElementById("cartDiscounts");
  const cartTotal = document.getElementById("cartTotal");
  const finalizeButton = document.getElementById("finalizePurchase");
  const closeCartBtn = document.querySelector(".close-cart");
  const continueShoppingBtns = document.querySelectorAll(".btn-continue-shopping");
  const cartCountElement = document.getElementById("cart-count");

  // Carrinho
  let cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];

  // Função para abrir o carrinho
  window.openCart = function() {
    cartModal.classList.add("active");
    document.body.style.overflow = "hidden";
    renderCart();
  };

  // Função para fechar o carrinho
  function closeCart() {
    cartModal.classList.remove("active");
    document.body.style.overflow = "auto";
  }

  // Atualizar contador no header
  function updateCartCount() {
    if (cartCountElement) {
      const totalItems = cartItems.reduce((total, item) => total + (item.quantity || 1), 0);
      cartCountElement.textContent = totalItems;
      
      if (totalItems > 0) {
        cartCountElement.classList.add("pulse");
        setTimeout(() => cartCountElement.classList.remove("pulse"), 500);
      }
    }
  }

  // Funções auxiliares para classes e raças
  function getClassName(classId) {
    const classes = {
      1: 'Guerreiro', 2: 'Paladino', 3: 'Caçador', 4: 'Ladino',
      5: 'Sacerdote', 6: 'Cavaleiro da Morte', 7: 'Xamã', 8: 'Mago',
      9: 'Bruxo', 10: 'Monge', 11: 'Druida', 12: 'Caçador de Demônios'
    };
    return classes[classId] || 'Desconhecido';
  }

  function getRaceName(raceId) {
    const races = {
      1: 'Humano', 2: 'Orc', 3: 'Anão', 4: 'Elfo Noturno',
      5: 'Morto-vivo', 6: 'Tauren', 7: 'Gnomo', 8: 'Troll',
      9: 'Goblin', 10: 'Elfo Sangrento', 11: 'Draenei', 22: 'Worgen'
    };
    return races[raceId] || 'Desconhecido';
  }

  // Renderizar a seleção de personagens
  function renderCharacterSelection(characters) {
    const container = document.createElement('div');
    container.className = 'character-selection-container';
    
    // Obter o personagem selecionado ou usar o primeiro da lista
    let selectedGuid = localStorage.getItem('selectedCharacterId');
    if (!selectedGuid && characters.length > 0) {
      selectedGuid = characters[0].guid;
      localStorage.setItem('selectedCharacterId', selectedGuid);
    }
    
    // container.innerHTML = `
    //   <h3 class="character-selection-title">
    //     <i class="fas fa-user"></i> Enviar para qual personagem?
    //   </h3>
    //   <div class="character-list">
    //     ${characters.map(char => `
    //       <div class="character-option ${char.guid == selectedGuid ? 'selected' : ''}" 
    //            data-guid="${char.guid}">
    //         <img src="https://wow.zamimg.com/images/wow/icons/large/class_${char.class}.jpg" 
    //              alt="${getClassName(char.class)}"
    //              class="character-class-icon">
    //         <div class="character-info">
    //           <span class="character-name">${char.name}</span>
    //           <span class="character-details">
    //             Nível ${char.level} ${getClassName(char.class)} • ${getRaceName(char.race)}
    //           </span>
    //         </div>
    //         <i class="fas fa-check selection-check"></i>
    //       </div>
    //     `).join('')}
    //   </div>
    // `;
    
    container.querySelectorAll('.character-option').forEach(option => {
      option.addEventListener('click', function() {
        const selectedGuid = this.dataset.guid;
        document.querySelectorAll('.character-option').forEach(opt => 
          opt.classList.remove('selected'));
        this.classList.add('selected');
        
        // Garantir que o ID do personagem é salvo como número
        localStorage.setItem('selectedCharacterId', Number(selectedGuid));
        console.log('Personagem selecionado:', selectedGuid);
      });
    });
    
    return container;
  }

  // Renderizar o carrinho completo
  function renderCart() {
    cartItemsList.innerHTML = "";
    let subtotal = 0;

    if (cartItems.length === 0) {
      cartEmptyMessage.style.display = "flex";
      cartItemsContainer.style.display = "none";
      document.getElementById('characterSelectionContainer')?.remove();
    } else {
      cartEmptyMessage.style.display = "none";
      cartItemsContainer.style.display = "block";

      // Remover seleção de personagem existente
      const existingSelection = document.getElementById('characterSelectionContainer');
      if (existingSelection) {
        existingSelection.remove();
      }

      // Adicionar seleção de personagens no topo
      const characters = JSON.parse(localStorage.getItem('cachedCharacters')) || [];
      
      if (characters.length > 0) {
        const selectionContainer = document.createElement('div');
        selectionContainer.id = 'characterSelectionContainer';
        selectionContainer.appendChild(renderCharacterSelection(characters));
        cartItemsContainer.prepend(selectionContainer);
      } else {
        console.warn('Nenhum personagem disponível na cache');
      }

      // Renderizar itens do carrinho
      cartItems.forEach((item, index) => {
        const itemTotal = (item.price || 0) * (item.quantity || 1);
        subtotal += itemTotal;

        const itemElement = document.createElement("div");
        itemElement.className = "cart-item";
        itemElement.innerHTML = `
          <img src="https://wow.zamimg.com/images/wow/icons/large/${item.icon}.jpg" 
               class="cart-item-image" 
               alt="${item.name}"
               onerror="this.src='../images/frostmourne.jpg'">
          <div class="cart-item-details">
            <h3 class="cart-item-name">${item.name}</h3>
            <p class="cart-item-price">${item.price} pontos cada</p>
            <div class="cart-item-controls">
              <button class="quantity-btn" data-action="decrease" data-index="${index}">-</button>
              <span class="quantity-display">${item.quantity || 1}</span>
              <button class="quantity-btn" data-action="increase" data-index="${index}">+</button>
              <button class="remove-btn" data-index="${index}">
                <i class="fas fa-trash-alt"></i> Remover
              </button>
            </div>
          </div>
        `;
        cartItemsList.appendChild(itemElement);
      });
    }

    // Calcular totais
    const discounts = 0;
    const total = subtotal - discounts;
    
    cartSubtotal.textContent = subtotal;
    cartDiscounts.textContent = discounts;
    cartTotal.textContent = total;
    
    updateCartCount();
  }

  // Event Listeners
  closeCartBtn.addEventListener("click", closeCart);
  
  continueShoppingBtns.forEach(btn => {
    btn.addEventListener("click", closeCart);
  });

  // Fechar modal ao clicar fora
  document.addEventListener("click", (event) => {
    if (event.target === cartModal || event.target.classList.contains("cart-modal-overlay")) {
      closeCart();
    }
  });

  // Controles de quantidade e remoção
  cartItemsList.addEventListener("click", (e) => {
    const index = e.target.closest("[data-index]")?.getAttribute("data-index");
    const action = e.target.closest("[data-action]")?.getAttribute("data-action");

    if (index === null || index === undefined) return;

    if (action === "increase") {
      cartItems[index].quantity = (cartItems[index].quantity || 1) + 1;
    } else if (action === "decrease" && cartItems[index].quantity > 1) {
      cartItems[index].quantity -= 1;
    } else if (e.target.closest(".remove-btn")) {
      cartItems.splice(index, 1);
    }

    localStorage.setItem("cartItems", JSON.stringify(cartItems));
    renderCart();
  });

  // Função para carregar personagens do usuário
  async function loadUserCharacters() {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return [];
      
      const response = await fetch('http://localhost:2000/api/characters', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Erro ao carregar personagens');
      
      const data = await response.json();
      localStorage.setItem('cachedCharacters', JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('Erro ao carregar personagens:', error);
      return [];
    }
  }

  // Função para mostrar modal de erro
  function showErrorModal(message) {
    const modal = document.createElement('div');
    modal.className = 'error-modal';
    modal.innerHTML = `
      <div class="error-modal-content">
        <h3><i class="fas fa-exclamation-triangle"></i> Erro na Compra</h3>
        <p>${message}</p>
        <button class="btn-close-error">Entendido</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.btn-close-error').addEventListener('click', () => {
      modal.remove();
    });
  }

  // Função para adicionar botão de ajuda ao modal de erro
  function addHelpButtonToErrorModal() {
    const helpBtn = document.createElement('button');
    helpBtn.className = 'btn-help';
    helpBtn.innerHTML = '<i class="fas fa-question-circle"></i> Preciso de ajuda';
    helpBtn.addEventListener('click', () => {
      window.location.href = '/help/shop-purchase';
    });
    
    const errorModal = document.querySelector('.error-modal-content');
    if (errorModal) {
      errorModal.appendChild(helpBtn);
    }
  }

  // Função principal para finalizar compra
 finalizeButton.addEventListener("click", async () => {
  if (cartItems.length === 0) {
    showErrorModal("Seu carrinho está vazio");
    return;
  }

  try {
    // 1. Verificar autenticação
    const token = localStorage.getItem("authToken");
    if (!token) {
      showErrorModal("Você precisa estar logado para finalizar a compra");
      window.location.href = '/login';
      return;
    }

    // 2. Obter personagem selecionado
    const characters = JSON.parse(localStorage.getItem('cachedCharacters')) || [];
    const selectedGuid = Number(localStorage.getItem('selectedCharacterId'));
    const selectedCharacter = characters.find(c => c.guid === selectedGuid);
    
    if (!selectedCharacter) {
      throw new Error("Nenhum personagem válido selecionado");
    }

    // Mostrar loading
    finalizeButton.disabled = true;
    finalizeButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';

    // 3. Enviar cada item individualmente
    for (const item of cartItems) {
      const response = await fetch('https://api-backend-server.onrender.com/api/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          playerName: selectedCharacter.name,
          itemEntry: item.item_entry,  // Corrigido para usar item_entry do carrinho
          quantity: item.quantity || 1
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao enviar item");
      }
    }

    // 4. Limpar carrinho e mostrar sucesso
    localStorage.removeItem("cartItems");
    cartItems = [];
    renderCart();
    
    showPurchaseSummary({
      details: {
        playerName: selectedCharacter.name,
        characterLevel: selectedCharacter.level,
        characterClass: getClassName(selectedCharacter.class),
        items: cartItems,
        total: cartItems.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0)
      }
    });

  } catch (error) {
    console.error("Erro na compra:", error);
    showErrorModal(error.message);
  } finally {
    finalizeButton.disabled = false;
    finalizeButton.innerHTML = 'Finalizar Compra <i class="fas fa-credit-card"></i>';
  }
});

  // Mostrar resumo da compra
 function showPurchaseSummary(data) {
  const summaryModal = document.createElement('div');
  summaryModal.className = 'purchase-summary-modal';

  // Garantir que data.details.items seja um array
  const items = Array.isArray(data?.details?.items) ? data.details.items : [];

  summaryModal.innerHTML = `
    <div class="purchase-summary-content">
      <h2><i class="fas fa-check-circle success-icon"></i> Compra realizada!</h2>

      <div class="summary-details">
        <p><strong>Personagem:</strong> ${data.details?.playerName || 'Desconhecido'} 
        (Nível ${data.details?.characterLevel || '?'} 
        ${data.details?.characterClass || 'Classe não identificada'})</p>
        <p><strong>ID da Transação:</strong> ${data.details?.transactionId || 'N/A'}</p>
        <p><strong>Total gasto:</strong> ${data.details?.total || 0} pontos</p>
      </div>

      <div class="items-list">
        <h3>Itens enviados:</h3>
        <ul>
          ${items.map(item => `
            <li>
              <span class="item-quantity">${item.quantity || 1}x</span>
              <span class="item-name">${item.name || `Item ${item.item_entry}`}</span>
            </li>
          `).join('')}
        </ul>
      </div>

      <p class="delivery-info">
        Os itens chegarão por correio no jogo para <strong>${data.details?.playerName || 'seu personagem'}</strong> em até 5 minutos.<br>
        Caso não receba, contate o suporte e informe o ID da transação.
      </p>

      <button class="btn-close-summary">Fechar</button>
    </div>
  `;

  document.body.appendChild(summaryModal);

  summaryModal.querySelector('.btn-close-summary').addEventListener('click', () => {
    summaryModal.remove();
    closeCart();
  });
}

});