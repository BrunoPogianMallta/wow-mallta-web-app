import { classMap } from '../utils/classMap.js'

export function updateUserProfileUI(user, selectors) {
  const avatar = document.querySelector(selectors.userAvatar);
  let errorHandled = false;

  avatar.onerror = () => {
    if (!errorHandled) {
      avatar.src = '../images/avatars/default.png';
      errorHandled = true;
    }
  };

  // Usa nome da classe em inglês para pegar a imagem certa
  const className = classMap[user.class] || 'unknown';
  avatar.src = `../images/avatars/${className}.png`;

  document.querySelector(selectors.usernameDisplay).textContent = user.username;
  document.querySelector(selectors.userClassLevel).textContent = `${className.charAt(0).toUpperCase() + className.slice(1)} - ${user.level}`;
  document.querySelector(selectors.votePoints).textContent = user.votePoints;
  document.querySelector(selectors.hoursPlayed).textContent = `${user.hoursPlayed} horas`;
  document.querySelector(selectors.joinDate).textContent = user.joinDate;
  document.querySelector(selectors.ranking).textContent = user.ranking;
}

export function updateCharacterInfoUI(character) {
  const avatar = document.getElementById('user-avatar');
  const name = document.getElementById('username-display');
  const classLevel = document.getElementById('user-class-level');
  const timePlayed = document.getElementById('hours-played');

  const className = classMap[character.class] || 'unknown';

  avatar.onerror = () => {
    avatar.src = '../images/avatars/default.png';
  };

  avatar.src = `../images/avatars/${className}.png`;
  name.textContent = character.name;
  classLevel.textContent = `Nível ${character.level} - ${className.charAt(0).toUpperCase() + className.slice(1)}`;
  timePlayed.textContent = `${Math.floor(character.totaltime / 3600)} horas`;
}
