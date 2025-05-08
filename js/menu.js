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
    const closeButton = profileModal ? profileModal.querySelector('.close-button') : null;
    const profileName = document.getElementById('profileName');


    function showModal() {
        if (profileModal) {
            const username = localStorage.getItem('username') || 'Unknown User';
            if (profileName) {
                profileName.textContent = username;
            }

            profileModal.classList.add('active');
        }
    }

    function hideModal() {
        if (profileModal) {
            profileModal.classList.remove('active');
        }
    }

    if (profileTrigger) {
        profileTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            showModal();
        });
    }

    if (closeButton) {
        closeButton.addEventListener('click', () => {
            hideModal();
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === profileModal) {
            hideModal();
        }
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && profileModal && profileModal.classList.contains('active')) {
            hideModal();
        }
    });

    if (profileModal) {
        if (!profileModal.classList.contains('active')) {
             // CSS handles initial hidden state
        }
    }
});