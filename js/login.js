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
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');


    function showErrorMessage(message) {
        loginError.textContent = message;
        loginError.classList.add('show');
    }

    function hideErrorMessage() {
        loginError.classList.remove('show');
    }

    // Add click listener to toggle password visibility
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function () {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);

            this.classList.toggle('bi-eye');
            this.classList.toggle('bi-eye-slash');
        });
    }


    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();

            hideErrorMessage();

            const usernameInput = document.getElementById('username').value;
            const passwordInput = document.getElementById('password').value;

            const storedUsername = localStorage.getItem('flowstate_username');
            const storedPassword = localStorage.getItem('flowstate_password');

            if (usernameInput === storedUsername && passwordInput === storedPassword) {
                alert('Login successful!');
                localStorage.setItem('username', usernameInput);
                localStorage.setItem('flowstate_loggedIn', 'true');
                window.location.href = 'home.html';
            } else {
                showErrorMessage('Invalid username or password.');
            }
        });

        document.getElementById('username').addEventListener('focus', hideErrorMessage);
        document.getElementById('password').addEventListener('focus', hideErrorMessage);
    }
});