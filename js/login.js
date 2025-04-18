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
                localStorage.setItem('flowstate_loggedIn', 'true'); // Simple flag for demonstration
                window.location.href = 'home.html';
            } else {
                loginError.textContent = 'Invalid username or password.';
                loginError.style.display = 'block';
            }
        });
    }
});