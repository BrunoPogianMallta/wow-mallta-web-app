// Simula uma chamada de API para obter os itens da loja
async function mockFetchShopItems() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        items: [
          {
            id: 'item1',
            name: 'Lâmina de Gelo Épica',
            description: 'Espada lendária que emana um frio penetrante.',
            fullDescription: 'A lendária lâmina de Gelo, forjada pelo Lich Rei. Aumenta o dano de Gelo em 15% e tem 10% de chance de congelar o inimigo por 3 segundos.',
            category: 'weapon',
            rarity: 'epic',
            level: 80,
            price: 4000,
            originalPrice: 5000,
            discount: 20,
            image: 'frostmourne.png',
            stats: [
              'Dano: 250-300',
              'Velocidade: 3.60',
              '+45 Força',
              '+30 Agilidade',
              'Aumenta o dano de Gelo em 15%',
              'Chance de congelar o inimigo'
            ]
          },
          {
            id: 'item2',
            name: 'Abençoada Lâmina do Cruzado',
            description: 'Espada sagrada que brilha com a luz da Aurora.',
            category: 'weapon',
            rarity: 'legendary',
            level: 80,
            price: 8000,
            image: 'ashbringer.png',
            stats: [
              'Dano: 280-340',
              'Velocidade: 3.40',
              '+50 Força',
              '+20 Espírito',
              'Cura 2% da vida máxima por acerto',
              'Dano aumentado contra mortos-vivos'
            ]
          },
          {
            id: 'item3',
            name: 'Cavalo de Batalha de Ébano',
            description: 'Montaria imponente com armadura de ébano.',
            category: 'mount',
            rarity: 'epic',
            level: 40,
            price: 2500,
            image: 'ebonhorse.png',
            stats: [
              'Velocidade de movimento: +100%',
              'Pode ser usado em todas as áreas',
              'Efeito visual único'
            ]
          },
          {
            id: 'item4',
            name: 'Túnica do Arcanista',
            description: 'Veste tecida com fios de mana pura.',
            category: 'armor',
            rarity: 'rare',
            level: 70,
            price: 1800,
            image: 'arcanerobe.png',
            stats: [
              'Armadura: 120',
              '+35 Intelecto',
              '+20 Acerto',
              'Reduz o custo de mana em 5%'
            ]
          },
          {
            id: 'item5',
            name: 'Fúria de Trovão',
            description: 'Espada que canaliza o poder dos trovões.',
            category: 'weapon',
            rarity: 'legendary',
            level: 80,
            price: 7500,
            image: 'thunderfury.png',
            stats: [
              'Dano: 260-320',
              'Velocidade: 3.50',
              '+40 Agilidade',
              'Chance de chamar um raio que acerta múltiplos inimigos',
              'Aumenta o dano de Natureza em 10%'
            ]
          },
          {
            id: 'item6',
            name: 'Mascote Dragônico',
            description: 'Pequeno dragão que segue seu mestre.',
            category: 'pet',
            rarity: 'uncommon',
            level: 1,
            price: 500,
            image: 'dragonpet.png',
            stats: [
              'Companheiro não-combatente',
              'Efeitos visuais especiais',
              '5 variações de cores'
            ]
          },
          {
            id: 'item7',
            name: 'Elmo da Vingança',
            description: 'Protege e fortalece seu portador.',
            category: 'armor',
            rarity: 'epic',
            level: 80,
            price: 3200,
            image: 'vengeancehelm.png',
            stats: [
              'Armadura: 180',
              '+30 Força',
              '+20 Resistência',
              'Aumenta o dano crítico em 5%'
            ]
          },
          {
            id: 'item8',
            name: 'Serviço: Mudança de Raça',
            description: 'Altere a raça do seu personagem.',
            category: 'service',
            rarity: 'common',
            level: 1,
            price: 1500,
            image: 'racechange.png',
            stats: [
              'Mantém todos os progressos',
              'Ajusta atributos conforme nova raça',
              'Pode alterar aparência'
            ]
          },
          {
            id: 'item9',
            name: 'Anel da Sabedoria',
            description: 'Aumenta o poder mental de seu portador.',
            category: 'armor',
            rarity: 'rare',
            level: 60,
            price: 1200,
            image: 'wisdomring.png',
            stats: [
              '+25 Intelecto',
              '+15 Espírito',
              'Regeneração de mana 2% por segundo'
            ]
          },
          {
            id: 'item10',
            name: 'Machado do Berserker',
            description: 'Fúria em forma de arma.',
            category: 'weapon',
            rarity: 'epic',
            level: 70,
            price: 3500,
            originalPrice: 4000,
            discount: 12,
            image: 'berserkeraxe.png',
            stats: [
              'Dano: 220-280',
              'Velocidade: 3.80',
              '+30 Força',
              '+15 Agilidade',
              'Aumenta o dano crítico em 8%'
            ]
          }
        ]
      });
    }, 500); // Simula um delay de rede
  });
}