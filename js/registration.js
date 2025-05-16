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
    const firstNameInput = document.getElementById('firstName');
    const firstNameError = document.getElementById('firstNameError');
    const lastNameInput = document.getElementById('lastName');
    const lastNameError = document.getElementById('lastNameError');
    const birthdateInput = document.getElementById('birthdate');
    const birthdateError = document.getElementById('birthdateError');
    const emailInput = document.getElementById('email');
    const emailError = document.getElementById('emailError');
    const confirmEmailInput = document.getElementById('confirmEmail');
    const confirmEmailError = document.getElementById('confirmEmailError');
    const usernameInput = document.getElementById('username');
    const usernameError = document.getElementById('usernameError');
    const passwordInput = document.getElementById('password');
    const passwordError = document.getElementById('passwordError');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const confirmPasswordError = document.getElementById('confirmPasswordError');
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

    if (registrationForm) {
        registrationForm.addEventListener('submit', (event) => {
            event.preventDefault();

            let isValid = true;

            hideErrorMessage(firstNameError);
            hideErrorMessage(lastNameError);
            hideErrorMessage(birthdateError);
            hideErrorMessage(emailError);
            hideErrorMessage(confirmEmailError);
            hideErrorMessage(usernameError);
            hideErrorMessage(passwordError);
            hideErrorMessage(confirmPasswordError);

            const firstNameValue = firstNameInput.value.trim();
            const lastNameValue = lastNameInput.value.trim();
            const birthdateValue = birthdateInput.value;
            const emailValue = emailInput.value.trim();
            const confirmEmailValue = confirmEmailInput.value.trim();
            const usernameValue = usernameInput.value.trim();
            const passwordValue = passwordInput.value;
            const confirmPasswordValue = confirmPasswordInput.value;

            const firstNameRegex = /^[a-zA-Z\s.]+$/;
            if (!firstNameValue) {
                 isValid = false;
                 showErrorMessage(firstNameError, 'First name is required.');
            } else if (!firstNameRegex.test(firstNameValue)) {
                isValid = false;
                showErrorMessage(firstNameError, 'First name should only contain letters, spaces, and periods.');
            }

            const lastNameRegex = /^[a-zA-Z\s]+$/;
             if (!lastNameValue) {
                 isValid = false;
                 showErrorMessage(lastNameError, 'Last name is required.');
             } else if (!lastNameRegex.test(lastNameValue)) {
                isValid = false;
                showErrorMessage(lastNameError, 'Last name should only contain letters and spaces.');
            }

            if (!birthdateValue) {
                isValid = false;
                showErrorMessage(birthdateError, 'Birthdate is required.');
            } else {
                 const birthdate = new Date(birthdateValue);
                 const today = new Date();
                 today.setHours(0, 0, 0, 0);

                 if (birthdate >= today) {
                    isValid = false;
                    showErrorMessage(birthdateError, 'Birthdate cannot be today or in the future.');
                 }
            }

            if (!emailValue) {
                 isValid = false;
                 showErrorMessage(emailError, 'Email is required.');
            } else if (!emailValue.includes('@') || !emailValue.endsWith('.com')) {
                isValid = false;
                showErrorMessage(emailError, 'Please enter a valid email address ending in .com.');
            }

            if (!confirmEmailValue) {
                 isValid = false;
                 showErrorMessage(confirmEmailError, 'Confirm Email is required.');
             } else if (confirmEmailValue !== emailValue) {
                isValid = false;
                showErrorMessage(confirmEmailError, 'Emails do not match.');
            }

            if (!usernameValue) {
                isValid = false;
                showErrorMessage(usernameError, 'Username is required.');
            } else if (usernameValue.length < 8) {
                isValid = false;
                showErrorMessage(usernameError, 'Username must be at least 8 characters long.');
            }

            if (!passwordValue) {
                 isValid = false;
                 showErrorMessage(passwordError, 'Password is required.');
            } else if (passwordValue.length < 8) {
                isValid = false;
                showErrorMessage(passwordError, 'Password must be at least 8 characters long.');
            }

            if (!confirmPasswordValue) {
                 isValid = false;
                 showErrorMessage(confirmPasswordError, 'Confirm Password is required.');
            } else if (confirmPasswordValue !== passwordValue) {
                isValid = false;
                showErrorMessage(confirmPasswordError, 'Passwords do not match.');
            }

            if (isValid) {
                localStorage.setItem('flowstate_username', usernameValue);
                localStorage.setItem('flowstate_password', passwordValue);

                alert('Registration successful! Please log in.');
                window.location.href = 'login.html';
            }
        });

         firstNameInput.addEventListener('focus', () => hideErrorMessage(firstNameError));
         lastNameInput.addEventListener('focus', () => hideErrorMessage(lastNameError));
         birthdateInput.addEventListener('focus', () => hideErrorMessage(birthdateError));
         emailInput.addEventListener('focus', () => hideErrorMessage(emailError));
         confirmEmailInput.addEventListener('focus', () => hideErrorMessage(confirmEmailError));
         usernameInput.addEventListener('focus', () => hideErrorMessage(usernameError));
         passwordInput.addEventListener('focus', () => hideErrorMessage(passwordError));
         confirmPasswordInput.addEventListener('focus', () => hideErrorMessage(confirmPasswordError));
    }
});