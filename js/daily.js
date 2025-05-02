document.addEventListener('DOMContentLoaded', () => {
    const currentDayElement = document.getElementById('currentDay');
    const newTaskInput = document.getElementById('newTask');
    const newCommentInput = document.getElementById('newComment');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');

    const urlParams = new URLSearchParams(window.location.search);
    const day = urlParams.get('day') || 'today'; // Default to 'today'

    let draggedItem = null;
    let isEditing = false;

    // --- Initialize ---
    if (day) {
        const displayDay = day === 'today' ? 'Today' : day.charAt(0).toUpperCase() + day.slice(1);
        currentDayElement.textContent = displayDay;
        loadTasks(day);
    } else {
        currentDayElement.textContent = 'Today';
        loadTasks('today');
    }

    // --- Event Listeners ---
    addTaskBtn.addEventListener('click', addTask);
    newTaskInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });
    newCommentInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });

    // --- Load Tasks ---
    function loadTasks(dayKey) {
        taskList.innerHTML = '';
        const tasksJSON = localStorage.getItem(`flowstate_tasks_${dayKey}`);
        if (tasksJSON) {
            const tasks = JSON.parse(tasksJSON);
            tasks.forEach(task => addTaskToUI(task.text, task.comment, task.completed));
        }
        isEditing = false;
    }

    // --- Save Tasks ---
    function saveTasks(dayKey) {
        if (isEditing) {
            console.warn("Attempted to save while editing is active. Save prevented.");
            return;
        }
        const tasks = [];
        taskList.querySelectorAll('li').forEach(li => {
            const taskSpan = li.querySelector('span');
            const commentP = li.querySelector('p.comment');

            if (!taskSpan || li.querySelector('.edit-input')) {
                console.error("Found list item in unexpected state during save:", li);
                return;
            }

            const text = taskSpan.textContent;
            const comment = commentP ? commentP.textContent.replace('- ', '').trim() : '';
            const completed = li.querySelector('input[type="checkbox"]').checked;
            tasks.push({ text, comment, completed });
        });
        localStorage.setItem(`flowstate_tasks_${dayKey}`, JSON.stringify(tasks));
        // console.log("Tasks saved for:", dayKey); // Keep for debugging if needed
    }

    // --- Add Task Logic ---
    function addTask() {
        if (isEditing) return;
        const taskText = newTaskInput.value.trim();
        const commentText = newCommentInput.value.trim();
        const currentDayKey = urlParams.get('day') || 'today';

        if (taskText) {
            addTaskToUI(taskText, commentText, false);
            saveTasks(currentDayKey);
            newTaskInput.value = '';
            newCommentInput.value = '';
            newTaskInput.focus();
        } else {
            alert('Please enter a task description.');
        }
    }

    // --- Add Task to UI ---
    function addTaskToUI(text, comment, completed) {
        const listItem = document.createElement('li');
        listItem.setAttribute('draggable', 'true');

        listItem.innerHTML = `
            <input type="checkbox" ${completed ? 'checked' : ''}>
            <span>${text}</span>
            ${comment ? `<p class="comment">- ${comment}</p>` : ''}
            <button class="delete-btn">X</button>
        `;

        if (completed) {
            listItem.querySelector('span').classList.add('completed');
        }
        taskList.appendChild(listItem);

        // --- Event Listeners for Checkbox and Delete ---
        const checkbox = listItem.querySelector('input[type="checkbox"]');
        const deleteButton = listItem.querySelector('.delete-btn');
        const taskSpan = listItem.querySelector('span');

        checkbox.addEventListener('change', () => {
            if (isEditing) return;
            taskSpan.classList.toggle('completed', checkbox.checked);
            updateTaskCompletionInStorage();
        });

        // --- DELETE BUTTON LISTENER ---
        deleteButton.addEventListener('click', () => {
            if (isEditing) return; // Don't delete if editing is active

            // Get the task text for the confirmation message
            const taskText = taskSpan.textContent; // Use the captured taskSpan
            const confirmationMessage = `Are you sure you want to delete this task?\n\n"${taskText}"`;

            // Show confirmation dialog using window.confirm()
            if (window.confirm(confirmationMessage)) {
                // If user clicks "OK" (confirm returns true), proceed with deletion
                removeTask(listItem);
            }
            // If user clicks "Cancel" (confirm returns false), do nothing
        });
        // --- END OF DELETE BUTTON LISTENER ---
    }

    // --- Update/Remove Task ---
    function updateTaskCompletionInStorage() {
        const currentDayKey = urlParams.get('day') || 'today';
        saveTasks(currentDayKey);
    }

    function removeTask(listItemToRemove) {
        const currentDayKey = urlParams.get('day') || 'today';
        listItemToRemove.remove(); // Remove from UI
        saveTasks(currentDayKey); // Resave the list state
    }

    // --- Drag and Drop Event Listeners ---
    taskList.addEventListener('dragstart', (e) => {
        if (isEditing) {
            e.preventDefault();
            return;
        }
        if (e.target.tagName === 'LI') {
            draggedItem = e.target;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', null);
            setTimeout(() => e.target.classList.add('dragging'), 0);
        }
    });

    taskList.addEventListener('dragend', (e) => {
        if (draggedItem) {
            draggedItem.classList.remove('dragging');
            taskList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
            draggedItem = null;
            const currentDayKey = urlParams.get('day') || 'today';
            saveTasks(currentDayKey); // Save new order
        }
    });

    taskList.addEventListener('dragover', (e) => {
        if (isEditing) return;
        e.preventDefault();
        const targetItem = e.target.closest('li');
        const listRect = taskList.getBoundingClientRect();
        if (e.clientY < listRect.top || e.clientY > listRect.bottom) {
             taskList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
             return;
        }
        if (!targetItem || targetItem === draggedItem) return;
        taskList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        targetItem.classList.add('drag-over');
        e.dataTransfer.dropEffect = 'move';
    });

     taskList.addEventListener('dragleave', (e) => {
         const listRect = taskList.getBoundingClientRect();
         if (e.clientY < listRect.top || e.clientY > listRect.bottom || e.clientX < listRect.left || e.clientX > listRect.right) {
             taskList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
         } else if (e.target.closest('li')) {
              if(e.target.tagName === 'LI') {
                  e.target.classList.remove('drag-over');
              }
         } else {
             taskList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
         }
    });

    taskList.addEventListener('drop', (e) => {
        if (isEditing) return;
        e.preventDefault();
        const targetItem = e.target.closest('li');
        taskList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        if (targetItem && draggedItem && targetItem !== draggedItem) {
            const targetRect = targetItem.getBoundingClientRect();
            const targetMidY = targetRect.top + targetRect.height / 2;
            if (e.clientY < targetMidY) {
                taskList.insertBefore(draggedItem, targetItem);
            } else {
                taskList.insertBefore(draggedItem, targetItem.nextSibling);
            }
        }
        // Save is handled in dragend
        if (draggedItem) {
             draggedItem.classList.remove('dragging');
        }
    });

    // --- Inline Editing Event Listener ---
    taskList.addEventListener('dblclick', (e) => {
        if (isEditing) return;
        const target = e.target;
        if ((target.tagName === 'SPAN' && !target.classList.contains('completed')) || target.matches('p.comment')) {
             if (target.tagName === 'SPAN' && target.classList.contains('completed')) {
                return;
            }
            startEditing(target);
        }
    });

    // --- Editing Functions ---
    function startEditing(element) {
        isEditing = true;
        const originalText = (element.tagName === 'P') ? element.textContent.replace('- ', '').trim() : element.textContent;
        const listItem = element.closest('li');
        listItem.setAttribute('draggable', 'false');

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'edit-input';
        input.value = originalText;
        input.dataset.originalText = originalText;
        input.dataset.originalTag = element.tagName;
        if (element.tagName === 'P') {
            input.dataset.isComment = 'true';
        }

        element.parentNode.replaceChild(input, element);
        input.focus();
        input.select();

        input.addEventListener('blur', handleEditFinish);
        input.addEventListener('keydown', handleEditKeyDown);
    }

    function handleEditKeyDown(e) {
        const input = e.target;
        if (e.key === 'Enter') {
            e.preventDefault();
            finishEditing(input, true);
        } else if (e.key === 'Escape') {
            finishEditing(input, false);
        }
    }

    function handleEditFinish(e) {
        const input = e.target;
         if (input && input.tagName === 'INPUT' && input.classList.contains('edit-input') && isEditing) {
           finishEditing(input, true);
        }
    }

    function finishEditing(inputElement, saveChanges) {
        if (!isEditing || !inputElement.parentNode) return;

        inputElement.removeEventListener('blur', handleEditFinish);
        inputElement.removeEventListener('keydown', handleEditKeyDown);

        const newText = inputElement.value.trim();
        const originalText = inputElement.dataset.originalText;
        const originalTag = inputElement.dataset.originalTag;
        const isComment = inputElement.dataset.isComment === 'true';
        const listItem = inputElement.closest('li');

        let elementToRestore;
        if (saveChanges && newText !== '') {
            elementToRestore = document.createElement(originalTag);
            if (isComment) {
                elementToRestore.className = 'comment';
                elementToRestore.textContent = `- ${newText}`;
            } else {
                elementToRestore.textContent = newText;
                const checkbox = listItem?.querySelector('input[type="checkbox"]'); // Add safe navigation
                if (checkbox && checkbox.checked) {
                    elementToRestore.classList.add('completed');
                }
            }
        } else {
            elementToRestore = document.createElement(originalTag);
            if (isComment) {
                elementToRestore.className = 'comment';
                elementToRestore.textContent = `- ${originalText}`;
            } else {
                elementToRestore.textContent = originalText;
                const checkbox = listItem?.querySelector('input[type="checkbox"]'); // Add safe navigation
                 if (checkbox && checkbox.checked) {
                     elementToRestore.classList.add('completed');
                 }
            }
            if (saveChanges && newText === '' && isComment) {
                elementToRestore = null;
            }
        }

        if (elementToRestore) {
            inputElement.parentNode.replaceChild(elementToRestore, inputElement);
        } else if (isComment) {
            inputElement.remove();
        }

        isEditing = false;
        if (listItem) listItem.setAttribute('draggable', 'true');

        if (saveChanges) {
            const currentDayKey = urlParams.get('day') || 'today';
             setTimeout(() => saveTasks(currentDayKey), 50);
        }
    }

}); // End DOMContentLoaded