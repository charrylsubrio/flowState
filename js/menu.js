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
    const profileModal = document.getElementById('profileModal'); // This is the modal-overlay
    // Ensure closeButton and profileName elements exist before getting references
    const closeButton = profileModal ? profileModal.querySelector('.close-button') : null;
    const profileName = document.getElementById('profileName');


    // Function to show the modal with animation
    function showModal() {
         if (profileModal) {
             // Get username from login
             const username = localStorage.getItem('username') || 'Unknown User';
             if (profileName) { // Check if profileName element exists
                profileName.textContent = username;
             }

             // Add the 'active' class to trigger the CSS transitions
             profileModal.classList.add('active');
             // The 'display: flex' was removed from CSS initial state
             // CSS handles visibility via the 'active' class and transitions
         }
    }

    // Function to hide the modal with animation
    function hideModal() {
         if (profileModal) {
             // Remove the 'active' class to trigger the CSS transitions back to hidden
             profileModal.classList.remove('active');
              // Optional: Wait for the transition to finish before setting display: none
              // This is often not necessary when using visibility: hidden and opacity: 0
              // profileModal.addEventListener('transitionend', () => {
              //     profileModal.style.display = 'none';
              // }, { once: true });
         }
    }


    if (profileTrigger) {
        profileTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            showModal(); // Call the animated show function
        });
    }

    // Ensure closeButton element exists before adding listener
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            hideModal(); // Call the animated hide function
        });
    }

    // Hide modal if clicked outside content (on the overlay)
    window.addEventListener('click', (e) => {
        if (e.target === profileModal) { // Check if the clicked element IS the overlay
            hideModal(); // Call the animated hide function
        }
    });

    // Optional: Handle Escape key to close modal
     window.addEventListener('keydown', (e) => {
         if (e.key === 'Escape' && profileModal && profileModal.classList.contains('active')) {
             hideModal();
         }
     });


    // Ensure modal is hidden initially in case CSS fails or JS runs late
    // The CSS handles the initial hidden state now, but this is a robust fallback.
     if (profileModal) {
         // Check if the modal is not already active by CSS/initial load
          if (!profileModal.classList.contains('active')) {
            // No direct display manipulation needed if CSS initial state is opacity/visibility
            // profileModal.style.display = 'none';
          }
     }
});