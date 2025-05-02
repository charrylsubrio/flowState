document.addEventListener('DOMContentLoaded', () => {
    // --- Get References to Elements ---
    const currentDayElement = document.getElementById('currentDay');
    const newTaskInput = document.getElementById('newTask');
    const newCommentInput = document.getElementById('newComment');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const deleteAllBtn = document.getElementById('deleteAllBtn');
    const taskActionsSection = document.querySelector('.task-actions');

    // --- URL Params and State Variables ---
    const urlParams = new URLSearchParams(window.location.search);
    const day = urlParams.get('day') || 'today';
    let draggedItem = null;
    let isEditing = false;

    // --- Helper Function: Update Delete All Button Visibility ---
    function updateDeleteAllButtonVisibility() {
        if (!taskActionsSection) return; // Safety check
        if (taskList.children.length > 0) {
            taskActionsSection.classList.remove('hidden'); // Show if tasks exist
        } else {
            taskActionsSection.classList.add('hidden'); // Hide if no tasks
        }
    }

    // --- Initialize Page ---
    if (day) {
        const displayDay = day === 'today' ? 'Today' : day.charAt(0).toUpperCase() + day.slice(1);
        currentDayElement.textContent = displayDay;
        loadTasks(day);
    } else {
        currentDayElement.textContent = 'Today';
        loadTasks('today');
    }
    // Initial visibility check after loading tasks might have finished
    updateDeleteAllButtonVisibility();


    // --- Core Event Listeners ---
    addTaskBtn.addEventListener('click', addTask);
    newTaskInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });
    newCommentInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });

    // Add listener for the Delete All button
    if (deleteAllBtn) {
        deleteAllBtn.addEventListener('click', () => {
            if (isEditing) {
                alert("Please finish editing before deleting all tasks.");
                return; // Prevent action if editing
            }

            // Double-check if there are tasks
            if (taskList.children.length === 0) {
                return;
            }

            const currentDayKey = urlParams.get('day') || 'today';
            // Use the displayed day name for better confirmation message context
            const displayDay = currentDayElement.textContent;
            const confirmationMessage = `Are you sure you want to delete ALL tasks for ${displayDay}?\n\nThis action cannot be undone.`;

            // Show confirmation dialog
            if (window.confirm(confirmationMessage)) {
                // --- Proceed with Deletion ---
                // 1. Clear the UI
                taskList.innerHTML = '';

                // 2. Clear data from localStorage
                localStorage.removeItem(`flowstate_tasks_${currentDayKey}`);
                console.log(`All tasks deleted for: ${currentDayKey}`);

                // 3. Update the visibility of the 'Delete All' button section (hide it)
                updateDeleteAllButtonVisibility();
            }
            // If user clicks Cancel, do nothing
        });
    }


    // --- Load Tasks ---
    function loadTasks(dayKey) {
        taskList.innerHTML = ''; // Clear list before loading
        const tasksJSON = localStorage.getItem(`flowstate_tasks_${dayKey}`);
        if (tasksJSON) {
             try {
                 const tasks = JSON.parse(tasksJSON);
                 if (Array.isArray(tasks)) {
                     tasks.forEach(task => {
                         if (task && typeof task.text === 'string') {
                             addTaskToUI(task.text, task.comment || '', typeof task.completed === 'boolean' ? task.completed : false);
                         } else {
                              console.warn("Skipping invalid task object:", task);
                         }
                     });
                 } else {
                     console.error("Stored tasks data is not an array. Clearing invalid data.");
                     localStorage.removeItem(`flowstate_tasks_${dayKey}`);
                 }
             } catch (error) {
                 console.error("Error parsing tasks from localStorage. Clearing invalid data.", error);
                 localStorage.removeItem(`flowstate_tasks_${dayKey}`);
             }
        }
        isEditing = false; // Reset editing state on load
        updateDeleteAllButtonVisibility(); // Update button visibility after loading
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
    }

    // --- Add Task Logic ---
    function addTask() {
        if (isEditing) return;
        const taskText = newTaskInput.value.trim();
        const commentText = newCommentInput.value.trim();
        const currentDayKey = urlParams.get('day') || 'today';

        if (taskText) {
            addTaskToUI(taskText, commentText, false); // Adds to UI
            saveTasks(currentDayKey); // Saves the new state
            newTaskInput.value = '';
            newCommentInput.value = '';
            newTaskInput.focus();
            updateDeleteAllButtonVisibility(); // Check visibility after adding
        } else {
            alert('Please enter a task description.');
        }
    }

    // --- Add Task to UI (Handles individual item listeners) ---
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

        // Get elements for listeners
        const checkbox = listItem.querySelector('input[type="checkbox"]');
        const deleteButton = listItem.querySelector('.delete-btn');
        const taskSpan = listItem.querySelector('span'); // Used for styling and delete confirmation

        // Checkbox listener
        checkbox.addEventListener('change', () => {
            if (isEditing) return;
            taskSpan.classList.toggle('completed', checkbox.checked);
            updateTaskCompletionInStorage();
        });

        // Individual Delete Button listener (with confirmation)
        deleteButton.addEventListener('click', () => {
            if (isEditing) return;
            const taskText = taskSpan.textContent;
            const confirmationMessage = `Are you sure you want to delete this task?\n\n"${taskText}"`;
            if (window.confirm(confirmationMessage)) {
                removeTask(listItem); // removeTask handles UI, storage, and visibility update
            }
        });
    }

    // --- Update Task Completion ---
    function updateTaskCompletionInStorage() {
        const currentDayKey = urlParams.get('day') || 'today';
        saveTasks(currentDayKey);
    }

    // --- Remove Single Task ---
    function removeTask(listItemToRemove) {
        const currentDayKey = urlParams.get('day') || 'today';
        listItemToRemove.remove(); // Remove from UI
        saveTasks(currentDayKey); // Resave the list state
        updateDeleteAllButtonVisibility(); // Update button visibility after removing
    }

    // --- Drag and Drop Event Listeners ---
    taskList.addEventListener('dragstart', (e) => {
        if (isEditing) { e.preventDefault(); return; }
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
             // Save final order *after* potential DOM updates from 'drop' are done
            const currentDayKey = urlParams.get('day') || 'today';
            saveTasks(currentDayKey); // Save new order
            draggedItem = null; // Clear reference after saving
        }
    });

     taskList.addEventListener('dragover', (e) => {
         if (isEditing) return;
         e.preventDefault();
         const targetItem = e.target.closest('li');
         const listRect = taskList.getBoundingClientRect();
         if (e.clientY < listRect.top || e.clientY > listRect.bottom) {
             taskList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over')); return;
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
             // Reordering complete in DOM, saveTasks will be called in dragend
         }
         // Clean up dragging class immediately if drop happens, even if dragend is delayed
         if (draggedItem) {
              draggedItem.classList.remove('dragging');
         }
     });

    // --- Inline Editing ---
    taskList.addEventListener('dblclick', (e) => {
        if (isEditing) return;
        const target = e.target;
        if ((target.tagName === 'SPAN' && !target.classList.contains('completed')) || target.matches('p.comment')) {
            startEditing(target);
        }
    });

    function startEditing(element) {
        isEditing = true;
        const originalText = (element.tagName === 'P') ? element.textContent.replace('- ', '').trim() : element.textContent;
        const listItem = element.closest('li');
        if (listItem) listItem.setAttribute('draggable', 'false'); // Check if listItem exists

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'edit-input';
        input.value = originalText;
        input.dataset.originalText = originalText;
        input.dataset.originalTag = element.tagName;
        if (element.tagName === 'P') input.dataset.isComment = 'true';

        element.parentNode.replaceChild(input, element);
        input.focus();
        input.select();

        input.addEventListener('blur', handleEditFinish);
        input.addEventListener('keydown', handleEditKeyDown);
    }

    function handleEditKeyDown(e) {
        const input = e.target;
        if (e.key === 'Enter') { e.preventDefault(); finishEditing(input, true); }
        else if (e.key === 'Escape') { finishEditing(input, false); }
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
                elementToRestore.className = 'comment'; elementToRestore.textContent = `- ${newText}`;
            } else {
                elementToRestore.textContent = newText;
                const checkbox = listItem?.querySelector('input[type="checkbox"]');
                if (checkbox && checkbox.checked) elementToRestore.classList.add('completed');
            }
        } else {
            elementToRestore = document.createElement(originalTag);
            if (isComment) {
                elementToRestore.className = 'comment'; elementToRestore.textContent = `- ${originalText}`;
            } else {
                elementToRestore.textContent = originalText;
                const checkbox = listItem?.querySelector('input[type="checkbox"]');
                if (checkbox && checkbox.checked) elementToRestore.classList.add('completed');
            }
            if (saveChanges && newText === '' && isComment) elementToRestore = null;
        }

        if (elementToRestore) inputElement.parentNode.replaceChild(elementToRestore, inputElement);
        else if (isComment) inputElement.remove();

        isEditing = false;
        if (listItem) listItem.setAttribute('draggable', 'true');

        if (saveChanges) {
            const currentDayKey = urlParams.get('day') || 'today';
            setTimeout(() => saveTasks(currentDayKey), 50);
        }
    }

}); // End DOMContentLoaded