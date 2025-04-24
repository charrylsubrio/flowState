// js/daily.js
document.addEventListener('DOMContentLoaded', () => {
    const currentDayElement = document.getElementById('currentDay');
    const newTaskInput = document.getElementById('newTask');
    const newCommentInput = document.getElementById('newComment');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');

    const urlParams = new URLSearchParams(window.location.search);
    const day = urlParams.get('day') || 'today'; // Default to 'today' if no day param

    // --- State variable for dragging ---
    let draggedItem = null;
    // ---------------------------------

    if (day) {
        // Capitalize first letter for display if it's a named day
        const displayDay = day === 'today' ? 'Today' : day.charAt(0).toUpperCase() + day.slice(1);
        currentDayElement.textContent = displayDay;
        loadTasks(day);
    } else {
        // Fallback if somehow day is null/undefined after default
        currentDayElement.textContent = 'Today';
        loadTasks('today');
    }

    addTaskBtn.addEventListener('click', addTask);
    newTaskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });
    newCommentInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
             addTask(); // Allow adding task by pressing Enter in comment field too
        }
    });

    // --- Load Tasks ---
    function loadTasks(dayKey) {
        taskList.innerHTML = ''; // Clear existing list before loading
        const tasksJSON = localStorage.getItem(`flowstate_tasks_${dayKey}`);
        if (tasksJSON) {
            const tasks = JSON.parse(tasksJSON);
            tasks.forEach(task => {
                addTaskToUI(task.text, task.comment, task.completed);
            });
        }
    }

    // --- Save Tasks (now also used for saving order) ---
    function saveTasks(dayKey) {
        const tasks = [];
        taskList.querySelectorAll('li').forEach(li => {
            const text = li.querySelector('span').textContent;
            // Correctly find the comment text, handling potential absence
            const commentElement = li.querySelector('.comment');
            const comment = commentElement ? commentElement.textContent.replace('- ', '').trim() : ''; // Get raw comment text
            const completed = li.querySelector('input[type="checkbox"]').checked;
            tasks.push({ text, comment, completed });
        });
        localStorage.setItem(`flowstate_tasks_${dayKey}`, JSON.stringify(tasks));
    }

    // --- Add Task Logic ---
    function addTask() {
        const taskText = newTaskInput.value.trim();
        const commentText = newCommentInput.value.trim();
        const currentDayKey = urlParams.get('day') || 'today';

        if (taskText) {
            // Add to UI first
            addTaskToUI(taskText, commentText, false);

            // Then update and save the entire list state (including the new task)
            saveTasks(currentDayKey);

            newTaskInput.value = '';
            newCommentInput.value = '';
            newTaskInput.focus(); // Keep focus on task input
        } else {
            alert('Please enter a task description.');
        }
    }

    // --- Add Task to UI (Modified to add draggable attribute) ---
    function addTaskToUI(text, comment, completed) {
        const listItem = document.createElement('li');
        listItem.setAttribute('draggable', 'true'); // Make the list item draggable

        listItem.innerHTML = `
            <input type="checkbox" ${completed ? 'checked' : ''}>
            <span>${text}</span>
            ${comment ? `<p class="comment">- ${comment}</p>` : ''}
            <button class="delete-btn">X</button> 
        `; // Changed Delete text to X for brevity

        // Add class if completed initially
        if (completed) {
            listItem.querySelector('span').classList.add('completed');
        }

        taskList.appendChild(listItem);

        // --- Add Event Listeners for Checkbox and Delete ---
        const checkbox = listItem.querySelector('input[type="checkbox"]');
        const deleteButton = listItem.querySelector('.delete-btn');
        const taskSpan = listItem.querySelector('span'); // Get the span for styling

        checkbox.addEventListener('change', () => {
            taskSpan.classList.toggle('completed', checkbox.checked);
            updateTaskCompletionInStorage(); // Update storage based on current state
        });

        deleteButton.addEventListener('click', () => {
            removeTask(listItem); // Remove the specific list item
        });
    }

    // --- Update Completion Status (Simplified: just call saveTasks) ---
    function updateTaskCompletionInStorage() {
        const currentDayKey = urlParams.get('day') || 'today';
        saveTasks(currentDayKey); // Save the current state of all tasks
    }

    // --- Remove Task (Simplified) ---
    function removeTask(listItemToRemove) {
        const currentDayKey = urlParams.get('day') || 'today';
        listItemToRemove.remove(); // Remove from UI
        saveTasks(currentDayKey); // Resave the list without the removed item
    }

    // --- Drag and Drop Event Listeners (Delegated to taskList) ---

    taskList.addEventListener('dragstart', (e) => {
        if (e.target.tagName === 'LI') {
            draggedItem = e.target;
            setTimeout(() => e.target.classList.add('dragging'), 0); // Add style after a tick
            e.dataTransfer.effectAllowed = 'move'; // Indicate the type of drag operation
        }
    });

    taskList.addEventListener('dragend', (e) => {
        if (draggedItem) {
            draggedItem.classList.remove('dragging');
             // Remove any lingering drag-over styles
            taskList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
            draggedItem = null;
        }
    });

    taskList.addEventListener('dragover', (e) => {
        e.preventDefault(); // Necessary to allow dropping
        const targetItem = e.target.closest('li');
        if (!targetItem || targetItem === draggedItem) return; // Don't do anything if not over a different li

        // Remove previous drag-over class
        taskList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        // Add class to the item being hovered over
        targetItem.classList.add('drag-over');

        e.dataTransfer.dropEffect = 'move'; // Visual cue
    });

    taskList.addEventListener('dragleave', (e) => {
         // Remove drag-over class when leaving an item's boundary
        const targetItem = e.target.closest('li');
         if (targetItem) {
             targetItem.classList.remove('drag-over');
         }
    });


    taskList.addEventListener('drop', (e) => {
        e.preventDefault(); // Prevent default drop behavior
        const targetItem = e.target.closest('li');

        // Remove drag-over styling
        if (targetItem) {
             targetItem.classList.remove('drag-over');
        }
         taskList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));


        if (targetItem && draggedItem && targetItem !== draggedItem) {
            // Determine where to insert based on mouse position relative to the target's midpoint
             const targetRect = targetItem.getBoundingClientRect();
             const targetMidY = targetRect.top + targetRect.height / 2;

             if (e.clientY < targetMidY) {
                 // Insert before the target item
                 taskList.insertBefore(draggedItem, targetItem);
             } else {
                  // Insert after the target item
                 taskList.insertBefore(draggedItem, targetItem.nextSibling);
             }

            // Persist the new order
            const currentDayKey = urlParams.get('day') || 'today';
            saveTasks(currentDayKey);
        }

        // Ensure dragging class is removed if dragend didn't fire properly (e.g., dropping outside window)
        if (draggedItem) {
            draggedItem.classList.remove('dragging');
            draggedItem = null;
        }
    });

}); // End DOMContentLoaded