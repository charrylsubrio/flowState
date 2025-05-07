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
    // Highlight today's box with animation via CSS transition
    const todayIndex = new Date().getDay(); // 0 = Sunday
    const boxes = document.querySelectorAll('.day-box');
    if (boxes[todayIndex]) {
      // The CSS transition on .today-highlight will make this smooth
      boxes[todayIndex].classList.add('today-highlight');
    }

    // Check login status and redirect if necessary
    // (No animation changes needed here)
    const username = localStorage.getItem('username');
    // Removed welcome message related code as the element isn't in the HTML
    // if (username) {
    //     // Potentially use JS to animate a welcome message if added later
    // }

    if (!localStorage.getItem('flowstate_loggedIn')) {
       // Consider adding a brief delay and/or animation before redirecting
       // to allow page load animations to be seen, e.g.:
       // setTimeout(() => { window.location.href = 'login.html'; }, 1000);
       window.location.href = 'login.html';
    }


    // Add click listeners to day boxes for navigation
    // (No animation changes needed here, CSS :active handles press)
    const dayBoxes = document.querySelectorAll('.day-box');
    dayBoxes.forEach(box => {
        box.addEventListener('click', () => {
            const day = box.getAttribute('data-day');
            // Consider adding a brief delay before redirecting
            // to allow the day-box :active animation to be seen, e.g.:
            // setTimeout(() => { window.location.href = `daily.html?day=${day}`; }, 100);
            window.location.href = `daily.html?day=${day}`;
        });
    });
});