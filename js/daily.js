document.addEventListener('DOMContentLoaded', () => {
    // ... (keep existing variables: currentDayElement, inputs, buttons, taskList, day, etc.) ...
    const currentDayElement = document.getElementById('currentDay');
    const newTaskInput = document.getElementById('newTask');
    const newCommentInput = document.getElementById('newComment');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');

    const urlParams = new URLSearchParams(window.location.search);
    const day = urlParams.get('day') || 'today'; // Default to 'today'

    let draggedItem = null;
    // --- State variable to prevent conflicts ---
    let isEditing = false; // Flag to track if an input is currently active

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
         isEditing = false; // Reset editing state on load
    }

    // --- Save Tasks (Reads current DOM state, including edits) ---
    function saveTasks(dayKey) {
        // Prevent saving if an edit is in progress but not yet committed
        if (isEditing) {
            console.warn("Attempted to save while editing is active. Save prevented.");
            return;
        }
        const tasks = [];
        taskList.querySelectorAll('li').forEach(li => {
            // Ensure we are not trying to read from an input field during save
             const taskSpan = li.querySelector('span');
             const commentP = li.querySelector('p.comment');

            if (!taskSpan || li.querySelector('.edit-input')) {
                console.error("Found list item in unexpected state during save:", li);
                // Option: try to revert edit or skip this item
                return; // Skip potentially broken item
            }

            const text = taskSpan.textContent;
            const comment = commentP ? commentP.textContent.replace('- ', '').trim() : '';
            const completed = li.querySelector('input[type="checkbox"]').checked;
            tasks.push({ text, comment, completed });
        });
        localStorage.setItem(`flowstate_tasks_${dayKey}`, JSON.stringify(tasks));
        console.log("Tasks saved for:", dayKey); // Add console log for debugging
    }

    // --- Add Task Logic ---
    function addTask() {
        if (isEditing) return; // Prevent adding if editing
        const taskText = newTaskInput.value.trim();
        const commentText = newCommentInput.value.trim();
        const currentDayKey = urlParams.get('day') || 'today';

        if (taskText) {
            addTaskToUI(taskText, commentText, false);
            saveTasks(currentDayKey); // Save the updated list
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
             if (isEditing) return; // Don't toggle if editing
            taskSpan.classList.toggle('completed', checkbox.checked);
            updateTaskCompletionInStorage();
        });

        deleteButton.addEventListener('click', () => {
            if (isEditing) return; // Don't delete if editing
            removeTask(listItem);
        });
    }

    // --- Update/Remove Task (Simplified - rely on saveTasks) ---
    function updateTaskCompletionInStorage() {
        const currentDayKey = urlParams.get('day') || 'today';
        saveTasks(currentDayKey);
    }

    function removeTask(listItemToRemove) {
        const currentDayKey = urlParams.get('day') || 'today';
        listItemToRemove.remove();
        saveTasks(currentDayKey);
    }

    // --- Drag and Drop Event Listeners (Delegated) ---
    taskList.addEventListener('dragstart', (e) => {
        if (isEditing) { // Prevent dragging while editing
             e.preventDefault();
             return;
        }
        if (e.target.tagName === 'LI') {
            draggedItem = e.target;
            // Make sure dataTransfer is set early
            e.dataTransfer.effectAllowed = 'move';
             // Optional: You might need setData for some browsers/scenarios, though not strictly needed for same-list reordering
             e.dataTransfer.setData('text/plain', null); // Or some dummy data
            setTimeout(() => e.target.classList.add('dragging'), 0);
        }
    });

    taskList.addEventListener('dragend', (e) => {
        if (draggedItem) {
            draggedItem.classList.remove('dragging');
            taskList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
            draggedItem = null;
             // Save order after drag completes successfully
             const currentDayKey = urlParams.get('day') || 'today';
             saveTasks(currentDayKey); // Save new order
        }
    });

    taskList.addEventListener('dragover', (e) => {
        if (isEditing) return; // Prevent interaction if editing
        e.preventDefault();
        const targetItem = e.target.closest('li');
         const listRect = taskList.getBoundingClientRect();

         // Basic check if dragging within the list bounds vertically
         if (e.clientY < listRect.top || e.clientY > listRect.bottom) {
             taskList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over')); // Clear indicator if outside
             return;
         }

        if (!targetItem || targetItem === draggedItem) return;

        taskList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        targetItem.classList.add('drag-over');
        e.dataTransfer.dropEffect = 'move';
    });

     taskList.addEventListener('dragleave', (e) => {
         // Check if the mouse truly left the list or just moved between items
         const listRect = taskList.getBoundingClientRect();
         if (e.clientY < listRect.top || e.clientY > listRect.bottom || e.clientX < listRect.left || e.clientX > listRect.right) {
             taskList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
         } else if (e.target.closest('li')) {
             // It might have left one li but entered another, dragover will handle the new target
             // However, if it leaves an LI to go to the UL padding, remove the style
              if(e.target.tagName === 'LI') {
                  e.target.classList.remove('drag-over');
              }
         } else {
             // Left the list container entirely
             taskList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
         }
    });

    taskList.addEventListener('drop', (e) => {
        if (isEditing) return; // Prevent drop if editing
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
            // NOTE: Saving is now handled in 'dragend' to ensure it happens *after* the drop operation completes.
        }

        // Reset dragged item reference if drop occurred, even if dragend doesn't fire reliably
        if (draggedItem) {
             draggedItem.classList.remove('dragging'); // Ensure class is removed
             // Don't nullify draggedItem here, let dragend handle it and the save.
        }
    });

    // --- Inline Editing Event Listener (Delegated) ---
    taskList.addEventListener('dblclick', (e) => {
        if (isEditing) return; // Prevent starting a new edit if one is active

        const target = e.target;
        // Allow editing on the task span or the comment paragraph
        if (target.tagName === 'SPAN' && !target.classList.contains('completed') || target.matches('p.comment')) {
             // Don't allow editing completed task text for now (optional choice)
            if (target.tagName === 'SPAN' && target.classList.contains('completed')) {
                // Maybe provide feedback like a tooltip "Cannot edit completed tasks"
                return;
            }
            startEditing(target);
        }
    });

    // --- Start Editing Function ---
    function startEditing(element) {
        isEditing = true; // Set editing flag
        const originalText = (element.tagName === 'P') ? element.textContent.replace('- ', '').trim() : element.textContent;
        const listItem = element.closest('li');
        listItem.setAttribute('draggable', 'false'); // Disable dragging while editing

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'edit-input'; // Apply styling
        input.value = originalText;
        input.dataset.originalText = originalText; // Store original value for cancel
        input.dataset.originalTag = element.tagName; // Store tag type (SPAN or P)
        if (element.tagName === 'P') {
            input.dataset.isComment = 'true'; // Mark if it's a comment
        }

        // Replace the element with the input field
        element.parentNode.replaceChild(input, element);
        input.focus();
        input.select(); // Select text for easy replacement

        // Add listeners directly to the input
        input.addEventListener('blur', handleEditFinish);
        input.addEventListener('keydown', handleEditKeyDown);
    }

    // --- Handle Input Keydown (Enter/Escape) ---
    function handleEditKeyDown(e) {
        const input = e.target;
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent potential form submission
            finishEditing(input, true); // Save changes
        } else if (e.key === 'Escape') {
            finishEditing(input, false); // Cancel changes
        }
    }

    // --- Handle Input Blur ---
    function handleEditFinish(e) {
        // Blur events can sometimes fire unexpectedly.
        // Check if the element still exists and is an input.
        const input = e.target;
        if (input && input.tagName === 'INPUT' && input.classList.contains('edit-input')) {
           finishEditing(input, true); // Assume save on blur
        }
    }


    // --- Finish Editing (Save or Cancel) ---
    function finishEditing(inputElement, saveChanges) {
        if (!isEditing || !inputElement.parentNode) return; // Prevent running if already finished or element removed

        // Remove listeners immediately to prevent double execution (e.g., Enter then Blur)
         inputElement.removeEventListener('blur', handleEditFinish);
         inputElement.removeEventListener('keydown', handleEditKeyDown);

        const newText = inputElement.value.trim();
        const originalText = inputElement.dataset.originalText;
        const originalTag = inputElement.dataset.originalTag;
        const isComment = inputElement.dataset.isComment === 'true';
        const listItem = inputElement.closest('li');


        let elementToRestore;
        if (saveChanges && newText !== '') {
             // Create the element (SPAN or P) with the new text
             elementToRestore = document.createElement(originalTag);
             if (isComment) {
                 elementToRestore.className = 'comment';
                 elementToRestore.textContent = `- ${newText}`; // Add prefix back
             } else {
                 elementToRestore.textContent = newText;
                 // Re-apply 'completed' class if the original task was completed (though we disabled editing completed ones)
                  const checkbox = listItem.querySelector('input[type="checkbox"]');
                  if (checkbox && checkbox.checked) {
                       elementToRestore.classList.add('completed');
                  }
             }
        } else {
            // Restore original element (Cancel or empty input)
            elementToRestore = document.createElement(originalTag);
             if (isComment) {
                 elementToRestore.className = 'comment';
                 elementToRestore.textContent = `- ${originalText}`;
             } else {
                 elementToRestore.textContent = originalText;
                  const checkbox = listItem.querySelector('input[type="checkbox"]');
                  if (checkbox && checkbox.checked) {
                       elementToRestore.classList.add('completed');
                  }
             }
             // If saving empty text for a non-comment, treat as cancel? Or allow empty task text?
             // Current logic restores original if newText is empty.
             // If saving empty text for a *comment*, effectively *removes* the comment.
             if (saveChanges && newText === '' && isComment) {
                 elementToRestore = null; // Signal to remove the comment element entirely
             }
        }

        // Replace input with the restored/updated element, or remove if it was a comment being deleted
         if (elementToRestore) {
            inputElement.parentNode.replaceChild(elementToRestore, inputElement);
         } else if (isComment) {
             inputElement.remove(); // Remove the input node (which represented the comment)
         }


        // --- Cleanup and Save ---
        isEditing = false; // Reset editing flag
        if (listItem) listItem.setAttribute('draggable', 'true'); // Re-enable dragging

        // Save only if changes were intended to be saved and potentially made
        if (saveChanges) {
             const currentDayKey = urlParams.get('day') || 'today';
            // Use a small delay to ensure DOM is fully updated before saving,
            // especially if blur triggered the save.
             setTimeout(() => saveTasks(currentDayKey), 50);
        }
    }

}); // End DOMContentLoaded