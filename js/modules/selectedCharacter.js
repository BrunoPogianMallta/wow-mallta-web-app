    export function saveSelectedCharacter(character) {
  localStorage.setItem('selectedCharacter', JSON.stringify(character));
}

export function getSelectedCharacter() {
  const data = localStorage.getItem('selectedCharacter');
  return data ? JSON.parse(data) : null;
}
