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
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const usernameError = document.getElementById('usernameError');
    const passwordError = document.getElementById('passwordError');
    const togglePasswordIcons = document.querySelectorAll('.toggle-password-icon');

    function showErrorMessage(element, message) {
        element.textContent = message;
        element.classList.add('show');
    }

    function hideErrorMessage(element) {
        element.textContent = '';
        element.classList.remove('show');
    }

    togglePasswordIcons.forEach(icon => {
        icon.addEventListener('click', function() {
            const passwordInput = this.previousElementSibling;

            if (passwordInput && passwordInput.type === 'password') {
                passwordInput.type = 'text';
                this.classList.remove('bi-eye-slash');
                this.classList.add('bi-eye');
            } else if (passwordInput && passwordInput.type === 'text') {
                 passwordInput.type = 'password';
                 this.classList.remove('bi-eye');
                 this.classList.add('bi-eye-slash');
            }
        });
    });

    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            hideErrorMessage(loginError);
            hideErrorMessage(usernameError);
            hideErrorMessage(passwordError);

            const usernameValue = usernameInput.value.trim();
            const passwordValue = passwordInput.value;
            const storedUsername = localStorage.getItem('flowstate_username');
            const storedPassword = localStorage.getItem('flowstate_password');

            let isValid = true;
            if (!usernameValue) {
                isValid = false;
            }
             if (!passwordValue) {
                isValid = false;
            }

            if (usernameValue === storedUsername && passwordValue === storedPassword) {
                alert('Login successful!');
                localStorage.setItem('username', usernameValue);
                localStorage.setItem('flowstate_loggedIn', 'true');
                window.location.href = 'home.html';
            } else {
                showErrorMessage(loginError, 'Invalid username or password.');
            }
        });

        usernameInput.addEventListener('focus', () => hideErrorMessage(loginError));
        passwordInput.addEventListener('focus', () => hideErrorMessage(loginError));
        usernameInput.addEventListener('focus', () => hideErrorMessage(usernameError));
        passwordInput.addEventListener('focus', () => hideErrorMessage(passwordError));
    }
});