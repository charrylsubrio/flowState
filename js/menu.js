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
    const profileTrigger = document.getElementById('profileTrigger');
    const profileModal = document.getElementById('profileModal');
    const closeButton = document.querySelector('.close-button');
    const profileName = document.getElementById('profileName');

    if (profileTrigger) {
        profileTrigger.addEventListener('click', (e) => {
            e.preventDefault();

            // Get username from login
            const username = localStorage.getItem('username') || 'Unknown User';
            profileName.textContent = username;

            // Show modal
            profileModal.style.display = 'flex';
        });
    }

    if (closeButton) {
        closeButton.addEventListener('click', () => {
            profileModal.style.display = 'none';
        });
    }

    // Optional: hide modal if clicked outside content
    window.addEventListener('click', (e) => {
        if (e.target === profileModal) {
            profileModal.style.display = 'none';
        }
    });
});