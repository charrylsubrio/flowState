// Dynamic Gradient Background on Load
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
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');

    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const usernameInput = document.getElementById('username').value;
            const passwordInput = document.getElementById('password').value;

            const storedUsername = localStorage.getItem('flowstate_username');
            const storedPassword = localStorage.getItem('flowstate_password');

            if (usernameInput === storedUsername && passwordInput === storedPassword) {
                alert('Login successful!');

                // Store username for profile modal later
                localStorage.setItem('username', usernameInput);
                localStorage.setItem('flowstate_loggedIn', 'true'); // Optional login flag

                window.location.href = 'home.html';
            } else {
                loginError.textContent = 'Invalid username or password.';
                loginError.style.display = 'block';
            }
        });
    }
});
