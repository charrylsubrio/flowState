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
    const todayIndex = new Date().getDay(); // 0 = Sunday
    const boxes = document.querySelectorAll('.day-box');
    if (boxes[todayIndex]) {
      boxes[todayIndex].classList.add('today-highlight');
    }
  });
  
document.addEventListener('DOMContentLoaded', () => {
    const dayBoxes = document.querySelectorAll('.day-box');

    const username = localStorage.getItem('username'); // Get it safely
    const welcomeMessage = document.getElementById('welcomeMessage'); // Only if you use this

    if (username && welcomeMessage) {
        welcomeMessage.textContent = `Welcome, ${username}!`;
    } else if (!localStorage.getItem('flowstate_loggedIn')) {
        window.location.href = 'login.html';
    }

    dayBoxes.forEach(box => {
        box.addEventListener('click', () => {
            const day = box.getAttribute('data-day');
            window.location.href = `daily.html?day=${day}`;
        });
    });
});