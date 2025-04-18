document.addEventListener('DOMContentLoaded', () => {
    const welcomeMessage = document.getElementById('welcomeMessage');
    const username = localStorage.getItem('flowstate_username');
    const dayBoxes = document.querySelectorAll('.day-box');

    if (username) {
        welcomeMessage.textContent = `Welcome, ${username}!`;
    } else if (!localStorage.getItem('flowstate_loggedIn')) {
        window.location.href = 'login.html'; // Redirect if not logged in
    }

    dayBoxes.forEach(box => {
        box.addEventListener('click', () => {
            const day = box.getAttribute('data-day');
            window.location.href = `daily.html?day=${day}`;
        });
    });
});