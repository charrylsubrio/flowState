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
    const registrationForm = document.getElementById('registrationForm');

    if (registrationForm) {
        registrationForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            localStorage.setItem('flowstate_username', username);
            localStorage.setItem('flowstate_password', password);

            // Note: alert() is blocking and will interrupt CSS animations triggered by submit
            // For smoother feedback, replace alert and direct redirect with modal/in-page message
            alert('Registration successful! Please log in.');
            window.location.href = 'login.html';
        });
    }
});