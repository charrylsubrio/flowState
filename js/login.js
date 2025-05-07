// Dynamic Gradient Background on Load
// The CSS transition on the body handles the animation for this
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

    // Function to show error message with animation
    function showErrorMessage(message) {
        loginError.textContent = message;
        // Add the 'show' class to trigger the CSS transition
        loginError.classList.add('show');
    }

    // Function to hide error message with animation
    function hideErrorMessage() {
         // Remove the 'show' class to trigger the CSS transition back to hidden
        loginError.classList.remove('show');
        // Clear content after transition completes (optional delay)
        // setTimeout(() => { loginError.textContent = ''; }, 500); // Match CSS transition duration
    }


    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();

            // Hide any previous error message before attempting login
            hideErrorMessage();

            const usernameInput = document.getElementById('username').value;
            const passwordInput = document.getElementById('password').value;

            const storedUsername = localStorage.getItem('flowstate_username');
            const storedPassword = localStorage.getItem('flowstate_password');

            if (usernameInput === storedUsername && passwordInput === storedPassword) {
                // Optional: Add a small delay to allow button press animation to complete
                // setTimeout(() => {
                    alert('Login successful!'); // This is blocking
                    localStorage.setItem('username', usernameInput); // Store username for profile modal later
                    localStorage.setItem('flowstate_loggedIn', 'true'); // Optional login flag
                    window.location.href = 'home.html';
                // }, 100); // Delay in milliseconds
            } else {
                showErrorMessage('Invalid username or password.');
            }
        });

        // Optional: Hide error message when inputs are focused after an error
        document.getElementById('username').addEventListener('focus', hideErrorMessage);
        document.getElementById('password').addEventListener('focus', hideErrorMessage);
    }
});