document.addEventListener('DOMContentLoaded', () => {
    const currentDayElement = document.getElementById('currentDay');
    const newTaskInput = document.getElementById('newTask');
    const newCommentInput = document.getElementById('newComment');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');

    const urlParams = new URLSearchParams(window.location.search);
    const day = urlParams.get('day');

    if (day) {
        currentDayElement.textContent = day.charAt(0).toUpperCase() + day.slice(1);
        loadTasks(day);
    } else {
        currentDayElement.textContent = 'Today'; // Default if no day is specified
    }

    addTaskBtn.addEventListener('click', addTask);

    function loadTasks(day) {
        const tasksJSON = localStorage.getItem(`flowstate_tasks_${day}`);
        if (tasksJSON) {
            const tasks = JSON.parse(tasksJSON);
            tasks.forEach(task => {
                addTaskToUI(task.text, task.comment, task.completed);
            });
        }
    }

    function saveTasks(day, tasks) {
        localStorage.setItem(`flowstate_tasks_${day}`, JSON.stringify(tasks));
    }

    function addTask() {
        const taskText = newTaskInput.value.trim();
        const commentText = newCommentInput.value.trim();
        const day = urlParams.get('day') || 'today';

        if (taskText) {
            const task = { text: taskText, comment: commentText, completed: false };
            addTaskToUI(taskText, commentText, false);

            const tasksJSON = localStorage.getItem(`flowstate_tasks_${day}`);
            const tasks = tasksJSON ? JSON.parse(tasksJSON) : [];
            tasks.push(task);
            saveTasks(day, tasks);

            newTaskInput.value = '';
            newCommentInput.value = '';
        }
    }

    function addTaskToUI(text, comment, completed) {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <input type="checkbox" ${completed ? 'checked' : ''}>
            <span>${text}</span>
            ${comment ? `<p class="comment">- ${comment}</p>` : ''}
            <button class="delete-btn">Delete</button>
        `;
        taskList.appendChild(listItem);

        const checkbox = listItem.querySelector('input[type="checkbox"]');
        const deleteButton = listItem.querySelector('.delete-btn');

        checkbox.addEventListener('change', () => {
            listItem.querySelector('span').classList.toggle('completed', checkbox.checked);
            updateTaskCompletion(text, checkbox.checked);
        });

        deleteButton.addEventListener('click', () => {
            removeTask(listItem, text);
        });

        if (completed) {
            listItem.querySelector('span').classList.add('completed');
        }
    }

    function updateTaskCompletion(taskText, completed) {
        const day = urlParams.get('day') || 'today';
        const tasksJSON = localStorage.getItem(`flowstate_tasks_${day}`);
        if (tasksJSON) {
            const tasks = JSON.parse(tasksJSON);
            const updatedTasks = tasks.map(task => {
                if (task.text === taskText) {
                    task.completed = completed;
                }
                return task;
            });
            saveTasks(day, updatedTasks);
        }
    }

    function removeTask(listItemToRemove, taskText) {
        const day = urlParams.get('day') || 'today';
        const tasksJSON = localStorage.getItem(`flowstate_tasks_${day}`);
        if (tasksJSON) {
            let tasks = JSON.parse(tasksJSON);
            tasks = tasks.filter(task => task.text !== taskText);
            saveTasks(day, tasks);
            listItemToRemove.remove();
        }
    }

    // Basic Drag and Drop (Further implementation needed for reordering)
    taskList.addEventListener('dragstart', (event) => {
        event.dataTransfer.setData('text/plain', event.target.textContent);
        event.target.classList.add('dragging');
    });

    taskList.addEventListener('dragover', (event) => {
        event.preventDefault();
    });

    taskList.addEventListener('drop', (event) => {
        const draggedTaskText = event.dataTransfer.getData('text/plain');
        const targetListItem = event.target.closest('li');
        const draggedListItem = document.querySelector('.dragging');

        if (targetListItem && draggedListItem && targetListItem !== draggedListItem) {
            // Basic swap (needs more robust logic for actual reordering in data)
            const parent = taskList;
            const draggedIndex = Array.from(parent.children).indexOf(draggedListItem);
            const targetIndex = Array.from(parent.children).indexOf(targetListItem);

            if (draggedIndex < targetIndex) {
                parent.insertBefore(draggedListItem, targetListItem.nextSibling);
            } else {
                parent.insertBefore(draggedListItem, targetListItem);
            }
            // You'll need to update the order in localStorage as well
        }
        if (draggedListItem) {
            draggedListItem.classList.remove('dragging');
        }
    });
});