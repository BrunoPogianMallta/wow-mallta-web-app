export function updateUserProfileUI(user, selectors) {
    const avatar = document.querySelector(selectors.userAvatar);
    let errorHandled = false;

    avatar.onerror = () => {
        if (!errorHandled) {
            avatar.src = '../images/avatars/default.jpg';
            errorHandled = true;
        }
    };

    avatar.src = `../images/avatars/${user.race}_${user.gender}_${user.class}.jpg`;

    document.querySelector(selectors.usernameDisplay).textContent = user.username;
    document.querySelector(selectors.userClassLevel).textContent = `${user.class} - ${user.level}`;
    document.querySelector(selectors.votePoints).textContent = user.votePoints;
    document.querySelector(selectors.hoursPlayed).textContent = `${user.hoursPlayed} horas`;
    document.querySelector(selectors.joinDate).textContent = user.joinDate;
    document.querySelector(selectors.ranking).textContent = user.ranking;
}
