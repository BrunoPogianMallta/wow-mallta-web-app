import { updateUserProfileUI } from './userProfile.js';

export function renderCharacters(characters, selectors, userProfile) {
    const list = document.querySelector(selectors.modalCharactersList);
    const dashboardList = document.querySelector(selectors.charactersList);
    list.innerHTML = '';
    dashboardList.innerHTML = '';

    characters.forEach(char => {
        const item = document.createElement('div');
        item.textContent = `${char.name} - ${char.class} Nível ${char.level}`;
        item.addEventListener('click', () => {
            selectCharacter(char, userProfile, selectors);
        });
        list.appendChild(item);

        const dashItem = document.createElement('div');
        dashItem.textContent = `${char.name} - ${char.class} Nível ${char.level}`;
        dashboardList.appendChild(dashItem);
    });
}

function selectCharacter(char, userProfile, selectors) {
    userProfile.class = char.classId;
    userProfile.gender = char.gender;
    userProfile.race = char.race;
    userProfile.level = char.level;
    userProfile.className = char.class;
    document.querySelector(selectors.characterModal).style.display = 'none';
    updateUserProfileUI(userProfile, selectors);
}
