document.addEventListener('DOMContentLoaded', () => {
    const registrationForm = document.getElementById('registrationForm');

    if (registrationForm) {
        registrationForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            localStorage.setItem('flowstate_username', username);
            localStorage.setItem('flowstate_password', password);

            alert('Registration successful! Please log in.');
            window.location.href = 'login.html';
        });
    }
});