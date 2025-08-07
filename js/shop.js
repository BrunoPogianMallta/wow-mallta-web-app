// Constantes globais
const SHOP_CONFIG = {
  ITEM_TYPES: {
    2: 'weapon',
    4: 'armor',
    15: 'misc'
  },
  
  RARITY_NAMES: {
    1: 'Comum',
    2: 'Incomum',
    3: 'Raro',
    4: 'Épico',
    5: 'Lendário',
    6: 'Artefato'
  },
  
  WEAPON_TYPES: {
    0: 'Arma Diversa',
    1: 'Machado',
    2: 'Arco',
    3: 'Arma de Fogo',
    4: 'Arma Branca',
    5: 'Arma de Arremesso',
    6: 'Arma de haste',
    7: 'Espada',
    8: 'Arma exótica',
    9: 'Arma exótica',
    10: 'Bastão',
    11: 'Arma diversa',
    12: 'Arma diversa',
    13: 'Arma de punho',
    14: 'Arma diversa',
    15: 'Adaga',
    16: 'Arma de arremesso',
    17: 'Lança',
    18: 'Arma de haste',
    19: 'Maça',
    20: 'Martelo'
  },
  
  ARMOR_TYPES: {
    0: 'Miscelânea',
    1: 'Tecido',
    2: 'Couro',
    3: 'Malha',
    4: 'Placa',
    5: 'Couro (exótico)',
    6: 'Escudo',
    7: 'Libram',
    8: 'Símbolo',
    9: 'Totem',
    10: 'Sinal'
  },
  
  ITEMS_PER_PAGE: 12,
  API_URL: 'https://api-backend-server.onrender.com/api/shop/shop-items',
  DEFAULT_ICON: 'inv_misc_questionmark',
  FALLBACK_IMAGE: '../images/frostmourne.jpg'
};

// Estado da aplicação
const shopState = {
  currentPage: 1,
  allItems: [],
  filteredItems: [],
  currentCategory: 'all',
  cartCount: 0,
  lastFilterHash: ''
};

// Utilitários
const Utils = {
  debounce: (fn, delay) => {
    let timer;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(context, args), delay);
    };
  },

  getItemType: (item) => {
    const inv = item.inventory_type;
    const cls = item.class;
    const subcls = item.subclass;

    if (cls === 15 && subcls === 5) return 'mount';
    if (cls === 15 && subcls === 2) return 'pet';
    if (item.name?.toLowerCase().includes('montaria') || inv === 23) return 'mount';
    if (cls === 2) return 'weapon';
    if (cls === 4) return 'armor';
    return 'misc';
  },

  getTypeName: (item) => {
    if (item.InventoryType === 23) return 'Montaria';
    if (item.InventoryType === 24) return 'Mascote';
    
    if (item.class === 2) {
      return SHOP_CONFIG.WEAPON_TYPES[item.subclass] || 'Arma';
    }
    
    if (item.class === 4) {
      return SHOP_CONFIG.ARMOR_TYPES[item.subclass] || 'Armadura';
    }
    
    return 'Diversos';
  },

  normalizeItem: (item) => ({
    ...item,
    itemType: Utils.getItemType(item),
    rarityName: SHOP_CONFIG.RARITY_NAMES[item.quality || item.Quality || 1] || 'Desconhecido',
    vote_price: item.vote_price || item.price || 0,
    token_price: item.token_price || 0,
    item_entry: item.item_entry || item.id || 0,
    name: item.name || 'Item sem nome',
    icon: item.icon || SHOP_CONFIG.DEFAULT_ICON,
    quality: item.quality || item.Quality || 1
  }),

  createElement: (tag, attributes = {}, children = []) => {
    const element = document.createElement(tag);
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'class') {
        element.className = value;
      } else {
        element.setAttribute(key, value);
      }
    });
    
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(child);
      }
    });
    
    return element;
  },

  generateFilterHash: (filters) => {
    return JSON.stringify({
      category: filters.category,
      rarities: filters.rarities,
      maxPrice: filters.maxPrice,
      searchTerm: filters.searchTerm,
      sortOption: filters.sortOption
    });
  }
};

// Renderização
const Renderer = {
  initCarousel: () => {
    $('.shop-banner-carousel').slick({
      dots: true,
      infinite: true,
      speed: 500,
      slidesToShow: 1,
      slidesToScroll: 1,
      autoplay: true,
      autoplaySpeed: 5000,
      arrows: true
    });
  },

  renderItems: () => {
    window.innerWidth <= 768 ? Renderer.renderMobileItems() : Renderer.renderDesktopItems();
  },

  renderDesktopItems: () => {
    const shopGrid = document.querySelector('.shop-grid');
    shopGrid.innerHTML = '<div class="loading-spinner">Carregando itens...</div>';

    setTimeout(() => {
      const { pageItems } = Renderer.getPageItems();

      if (!pageItems || pageItems.length === 0) {
        shopGrid.innerHTML = '<p class="no-items">Nenhum item encontrado.</p>';
        Renderer.renderPagination();
        return;
      }

      const fragment = document.createDocumentFragment();
      const table = Utils.createElement('table', { class: 'shop-table' });
      const thead = Utils.createElement('thead');
      const tbody = Utils.createElement('tbody');
      
      // Cabeçalho
      thead.innerHTML = `
        <tr>
          <th>Imagem</th>
          <th>Nome</th>
          <th>Tipo</th>
          <th>Raridade</th>
          <th>Vote Points</th>
          <th>Mallta Coin</th>
          <th></th>
        </tr>
      `;
      
      // Corpo
      pageItems.forEach(item => {
        const tr = Utils.createElement('tr');
        tr.innerHTML = `
          <td>
            <a href="https://wotlk.cavernoftime.com/item=${item.item_entry}" target="_blank">
              <img src="https://wow.zamimg.com/images/wow/icons/large/${item.icon}.jpg" 
                   alt="${item.name}" width="40" height="40" 
                   loading="lazy" decoding="async" 
                   onerror="this.src='${SHOP_CONFIG.FALLBACK_IMAGE}'" />
            </a>
          </td>
          <td><span class="item-link">${item.name}</span></td>
          <td>${Utils.getTypeName(item)}</td>
          <td class="rarity-${item.quality}">${item.rarityName}</td>
          <td>${item.vote_price} pontos</td>
          <td>${item.token_price} pontos</td>
          <td><button class="add-to-cart-btn" data-item-id="${item.item_entry}">Adicionar ao Carrinho</button></td>
        `;
        tbody.appendChild(tr);
      });
      
      table.appendChild(thead);
      table.appendChild(tbody);
      fragment.appendChild(table);
      
      shopGrid.innerHTML = '';
      shopGrid.appendChild(fragment);
      Renderer.renderPagination();
    }, 50);
  },

  renderMobileItems: () => {
    const shopGrid = document.querySelector('.shop-grid');
    shopGrid.innerHTML = '<div class="loading-spinner">Carregando itens...</div>';

    setTimeout(() => {
      const { pageItems } = Renderer.getPageItems();

      if (!pageItems || pageItems.length === 0) {
        shopGrid.innerHTML = '<p class="no-items">Nenhum item encontrado.</p>';
        Renderer.renderPagination();
        return;
      }

      const fragment = document.createDocumentFragment();
      const grid = Utils.createElement('div', { class: 'mobile-items-grid' });
      
      pageItems.forEach(item => {
        const card = Utils.createElement('div', { class: 'mobile-item-card' });
        card.innerHTML = `
          <div class="mobile-item-header">
            <img class="mobile-item-img" 
                 src="https://wow.zamimg.com/images/wow/icons/large/${item.icon}.jpg" 
                 alt="${item.name}"
                 loading="lazy" decoding="async"
                 onerror="this.src='${SHOP_CONFIG.FALLBACK_IMAGE}'">
            <div class="mobile-item-name">${item.name}</div>
          </div>
          <div class="mobile-item-details">
            <div class="mobile-item-detail">
              <span>Tipo</span>
              <span>${Utils.getTypeName(item)}</span>
            </div>
            <div class="mobile-item-detail">
              <span>Raridade</span>
              <span class="rarity-${item.quality}">${item.rarityName}</span>
            </div>
            <div class="mobile-item-detail">
              <span>Vote Points</span>
              <span>${item.vote_price}</span>
            </div>
            <div class="mobile-item-detail">
              <span>Mallta Coin</span>
              <span>${item.token_price}</span>
            </div>
          </div>
          <button class="add-to-cart-btn" data-item-id="${item.item_entry}">Adicionar ao Carrinho</button>
        `;
        grid.appendChild(card);
      });
      
      fragment.appendChild(grid);
      shopGrid.innerHTML = '';
      shopGrid.appendChild(fragment);
      Renderer.renderPagination();
    }, 50);
  },

  getPageItems: () => {
    const startIdx = (shopState.currentPage - 1) * SHOP_CONFIG.ITEMS_PER_PAGE;
    const endIdx = startIdx + SHOP_CONFIG.ITEMS_PER_PAGE;
    return {
      startIdx,
      endIdx,
      pageItems: shopState.filteredItems.slice(startIdx, endIdx)
    };
  },

  renderPagination: () => {
    const totalPages = Math.ceil(shopState.filteredItems.length / SHOP_CONFIG.ITEMS_PER_PAGE);
    const paginationContainer = document.querySelector('.pagination-container');
    
    if (totalPages <= 1) {
      paginationContainer.innerHTML = '';
      return;
    }

    paginationContainer.innerHTML = `
      <button ${shopState.currentPage === 1 ? 'disabled' : ''} id="prevPage">
        Anterior
      </button>
      <span class="page-info">
        Página ${shopState.currentPage} de ${totalPages}
      </span>
      <button ${shopState.currentPage === totalPages ? 'disabled' : ''} id="nextPage">
        Próxima
      </button>
    `;
  },

  showCartFeedback: () => {
    const feedback = document.createElement('div');
    feedback.className = 'cart-feedback';
    feedback.textContent = 'Item adicionado ao carrinho!';
    document.body.appendChild(feedback);
    
    setTimeout(() => {
      feedback.style.opacity = '0';
      setTimeout(() => feedback.remove(), 300);
    }, 1700);
  },

  updateCartCount: () => {
    const countElement = document.getElementById('cart-count');
    if (countElement) {
      countElement.textContent = shopState.cartCount;
      countElement.classList.add('pulse');
      setTimeout(() => countElement.classList.remove('pulse'), 500);
    }
  }
};

// Manipulação de dados
const DataHandler = {
  loadShopItems: async () => {
    const shopGrid = document.querySelector('.shop-grid');
    shopGrid.innerHTML = '<div class="loading-spinner">Carregando itens...</div>';
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        shopGrid.innerHTML = '<p class="error-message">Você precisa estar logado para ver os itens da loja.</p>';
        return;
      }

      const response = await fetch(SHOP_CONFIG.API_URL, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(response.status === 401 ? 
          'Token inválido ou sessão expirada. Faça login novamente.' : 
          'Erro ao carregar dados da loja.');
      }

      const data = await response.json();
      shopState.allItems = Array.isArray(data) ? data : (data.items || data.products || []);
      
      if (shopState.allItems.length === 0) {
        shopGrid.innerHTML = '<p class="no-items">A loja está vazia no momento.</p>';
        return;
      }
      
      // Processamento garantido
      shopState.allItems = shopState.allItems.map(Utils.normalizeItem);
      shopState.filteredItems = [...shopState.allItems];
      Renderer.renderItems();
      
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
      shopGrid.innerHTML = `<p class="error-message">${error.message}</p>`;
    }
  },

  prefetchImages: (items) => {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            observer.unobserve(img);
          }
        });
      }, {
        rootMargin: '200px 0px'
      });

      items.slice(0, SHOP_CONFIG.ITEMS_PER_PAGE * 2).forEach(item => {
        const img = new Image();
        img.dataset.src = `https://wow.zamimg.com/images/wow/icons/large/${item.icon}.jpg`;
        observer.observe(img);
      });
    }
  }
};

// Filtros
const Filter = {
  applyFilters: () => {
    const currentFilters = Filter.getCurrentFilters();
    const newHash = Utils.generateFilterHash(currentFilters);
    
    if (newHash === shopState.lastFilterHash) return;
    
    shopState.lastFilterHash = newHash;
    shopState.currentPage = 1;
    
    // Filtrar em lotes para não bloquear a UI
    setTimeout(() => {
      shopState.filteredItems = shopState.allItems.filter(item => 
        Filter.filterByCategory(item, currentFilters.category) &&
        Filter.filterByRarity(item, currentFilters.rarities) &&
        Filter.filterByPrice(item, currentFilters.maxPrice) &&
        Filter.filterBySearch(item, currentFilters.searchTerm)
      );
      
      Filter.sortItems(currentFilters.sortOption);
      Renderer.renderItems();
      DataHandler.prefetchImages(shopState.filteredItems);
    }, 0);
  },

  getCurrentFilters: () => {
    const selectedRarities = [];
    $('.rarity-filter input:checked').each(function() {
      selectedRarities.push(parseInt($(this).val()));
    });
    
    return {
      category: shopState.currentCategory,
      rarities: selectedRarities,
      maxPrice: parseInt($('#priceRange').val()) || 1000,
      searchTerm: $('#searchInput').val().toLowerCase(),
      sortOption: $('#sortSelect').val()
    };
  },

  filterByCategory: (item, category) => {
    return category === 'all' || item.itemType === category;
  },

  filterByRarity: (item, rarities) => {
    return rarities.length === 0 || rarities.includes(item.quality);
  },

  filterByPrice: (item, maxPrice) => {
    return (item.vote_price || 0) <= maxPrice;
  },

  filterBySearch: (item, searchTerm) => {
    return searchTerm === '' || (item.name || '').toLowerCase().includes(searchTerm);
  },

  sortItems: (sortOption) => {
    switch(sortOption) {
      case 'price-asc':
        shopState.filteredItems.sort((a, b) => a.vote_price - b.vote_price);
        break;
      case 'price-desc':
        shopState.filteredItems.sort((a, b) => b.vote_price - a.vote_price);
        break;
      case 'name-asc':
        shopState.filteredItems.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        shopState.filteredItems.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        // Mantém a ordenação padrão
        break;
    }
  }
};

// Manipuladores de eventos
const EventHandlers = {
  init: () => {
    // Carrossel
    Renderer.initCarousel();

    // Filtros com debounce
    $('#priceRange').on('input', Utils.debounce(() => {
      $('#priceValue').text($('#priceRange').val());
      Filter.applyFilters();
    }, 200));

    $('.rarity-filter input').on('change', Utils.debounce(Filter.applyFilters, 200));
    $('#searchInput').on('input', Utils.debounce(Filter.applyFilters, 300));
    $('#sortSelect').on('change', Filter.applyFilters);

    // Categorias
    $('#categoryList').on('click', 'li', function(e) {
      e.preventDefault();
      $('#categoryList li').removeClass('active');
      $(this).addClass('active');
      shopState.currentCategory = $(this).data('category');
      Filter.applyFilters();
    });

    // Menu mobile
    document.getElementById('mobileMenuBtn').addEventListener('click', () => {
      document.querySelector('.main-nav').classList.toggle('active');
    });

    // Redimensionamento com debounce
    window.addEventListener('resize', Utils.debounce(() => {
      Renderer.renderItems();
    }, 200));

    // Delegação de eventos para elementos dinâmicos
    document.addEventListener('click', (e) => {
      if (e.target.matches('.add-to-cart-btn')) {
        const itemId = e.target.getAttribute('data-item-id');
        EventHandlers.addToCart(itemId);
      }
      
      if (e.target.matches('#prevPage')) {
        if (shopState.currentPage > 1) {
          shopState.currentPage--;
          Renderer.renderItems();
        }
      }
      
      if (e.target.matches('#nextPage')) {
        const totalPages = Math.ceil(shopState.filteredItems.length / SHOP_CONFIG.ITEMS_PER_PAGE);
        if (shopState.currentPage < totalPages) {
          shopState.currentPage++;
          Renderer.renderItems();
        }
      }
    });

    // Carregar dados iniciais
    DataHandler.loadShopItems();
    
    // Carregar contagem inicial do carrinho
    const initialCart = JSON.parse(localStorage.getItem('cartItems')) || [];
    shopState.cartCount = initialCart.reduce((total, item) => total + (item.quantity || 1), 0);
    Renderer.updateCartCount();
  },

  addToCart: (itemId) => {
    const itemToAdd = shopState.allItems.find(item => item.item_entry == itemId);
    if (!itemToAdd) return;

    // Obter carrinho atual
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    
    // Verificar se o item já está no carrinho
    const existingItemIndex = cartItems.findIndex(item => item.item_entry == itemId);
    
    if (existingItemIndex !== -1) {
      // Se já existe, aumenta a quantidade
      cartItems[existingItemIndex].quantity = (cartItems[existingItemIndex].quantity || 1) + 1;
    } else {
      // Adicionar novo item ao carrinho
      const cartItem = {
        item_entry: itemToAdd.item_entry,
        name: itemToAdd.name,
        price: itemToAdd.vote_price,
        icon: itemToAdd.icon,
        quantity: 1,
        itemType: itemToAdd.itemType,
        quality: itemToAdd.quality
      };
      
      cartItems.push(cartItem);
    }
    
    // Salvar no localStorage
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    
    // Atualizar contador
    shopState.cartCount = cartItems.reduce((total, item) => total + (item.quantity || 1), 0);
    Renderer.updateCartCount();
    
    // Mostrar feedback visual
    Renderer.showCartFeedback();
    
    // Se o carrinho estiver aberto, renderizar novamente
    if (document.getElementById('cartModal').classList.contains('active')) {
      window.renderCart(); // Chamamos a função global do cart.js
    }
  }
};

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  EventHandlers.init();
});