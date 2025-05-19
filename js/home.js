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
    const todayIndex = new Date().getDay();
    const boxes = document.querySelectorAll('.day-box');
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    if (!localStorage.getItem('flowstate_loggedIn')) {
        window.location.href = 'login.html';
    }

    const dayBoxes = document.querySelectorAll('.day-box');
    dayBoxes.forEach((box, index) => {
        const day = box.getAttribute('data-day');
        const taskCountSpan = box.querySelector('.task-count');
        const todayIndicatorSpan = box.querySelector('.today-indicator');

        if (taskCountSpan) {
            const tasksJSON = localStorage.getItem(`flowstate_tasks_${day}`);
            let taskCount = 0;
            if (tasksJSON) {
                try {
                    const tasks = JSON.parse(tasksJSON);
                    if (Array.isArray(tasks)) {
                        taskCount = tasks.length;
                    } else {
                        console.error(`Invalid tasks data for ${day}: Not an array.`);
                    }
                } catch (error) {
                    console.error(`Error parsing tasks for ${day}:`, error);
                }
            }
            taskCountSpan.textContent = `Tasks: ${taskCount}`;
            if (taskCount > 0) {
                taskCountSpan.classList.add('has-tasks');
            }
        }

        if (index === todayIndex) {
            box.classList.add('is-today');
            if (todayIndicatorSpan) {
                todayIndicatorSpan.textContent = 'TODAY';
            }
        } else {
             if (todayIndicatorSpan) {
                 todayIndicatorSpan.textContent = '';
             }
        }

        box.addEventListener('click', () => {
            window.location.href = `daily.html?day=${day}`;
        });
    });
});