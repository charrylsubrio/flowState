document.body.style.background = `linear-gradient(to right, ${getRandomColor()}, ${getRandomColor()})`;

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

document.addEventListener('DOMContentLoaded', () => {
    const todayIndex = new Date().getDay();
    const boxes = document.querySelectorAll('.day-box');
    if (boxes[todayIndex]) {
        boxes[todayIndex].classList.add('today-highlight');
    }

    const username = localStorage.getItem('username');

    if (!localStorage.getItem('flowstate_loggedIn')) {
        window.location.href = 'login.html';
    }

    const dayBoxes = document.querySelectorAll('.day-box');
    dayBoxes.forEach(box => {
        box.addEventListener('click', () => {
            const day = box.getAttribute('data-day');
            window.location.href = `daily.html?day=${day}`;
        });
    });
});