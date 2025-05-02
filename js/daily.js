document.addEventListener('DOMContentLoaded', () => {
    // --- Get References to Elements ---
    const currentDayElement = document.getElementById('currentDay');
    const newTaskInput = document.getElementById('newTask');
    const newCommentInput = document.getElementById('newComment');
    const newPrioritySelect = document.getElementById('newPriority'); // Priority selector
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const deleteAllBtn = document.getElementById('deleteAllBtn');
    const taskActionsSection = document.querySelector('.task-actions');
    const sortPriorityHighBtn = document.getElementById('sortPriorityHighBtn'); // Sort button High
    const sortPriorityLowBtn = document.getElementById('sortPriorityLowBtn');  // Sort button Low

    // --- URL Params and State Variables ---
    const urlParams = new URLSearchParams(window.location.search);
    const day = urlParams.get('day') || 'today';
    let draggedItem = null;
    let isEditing = false;

    // --- Constants for Priority ---
    const PRIORITIES = ['Low', 'Medium', 'High']; // Order matters for cycling
    const DEFAULT_PRIORITY = 'Medium';
    const priorityMap = { 'High': 2, 'Medium': 1, 'Low': 0 }; // For sorting logic

    // --- Helper Function: Update Action Buttons Visibility ---
    function updateActionButtonsVisibility() {
        if (!taskActionsSection) return;
        const taskCount = taskList.children.length;
        if (taskCount > 0) {
            taskActionsSection.classList.remove('hidden'); // Show section if tasks exist
            // Show sort buttons only if there's more than one task to sort
            const showSort = taskCount > 1;
             if(sortPriorityHighBtn) sortPriorityHighBtn.style.display = showSort ? '' : 'none';
             if(sortPriorityLowBtn) sortPriorityLowBtn.style.display = showSort ? '' : 'none';
        } else {
            taskActionsSection.classList.add('hidden'); // Hide section if no tasks
        }
    }

    // --- Helper Function: Get Next Priority ---
    function getNextPriority(currentPriority) {
        const currentIndex = PRIORITIES.indexOf(currentPriority);
        const nextIndex = (currentIndex + 1) % PRIORITIES.length;
        return PRIORITIES[nextIndex];
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
    updateActionButtonsVisibility(); // Initial visibility check

    // --- Core Event Listeners ---
    addTaskBtn.addEventListener('click', addTask);
    newTaskInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });
    newCommentInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });
    newPrioritySelect.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); }); // Allow enter on priority too

    // Delete All Listener
    if (deleteAllBtn) {
        deleteAllBtn.addEventListener('click', () => {
            if (isEditing) { alert("Please finish editing first."); return; }
            if (taskList.children.length === 0) return;
            const displayDay = currentDayElement.textContent;
            if (window.confirm(`Are you sure you want to delete ALL tasks for ${displayDay}?\n\nThis action cannot be undone.`)) {
                taskList.innerHTML = '';
                localStorage.removeItem(`flowstate_tasks_${day}`);
                console.log(`All tasks deleted for: ${day}`);
                updateActionButtonsVisibility();
            }
        });
    }

    // Sort Button Listeners
    if (sortPriorityHighBtn) {
        sortPriorityHighBtn.addEventListener('click', () => sortTasks(true)); // true for high-to-low
    }
    if (sortPriorityLowBtn) {
        sortPriorityLowBtn.addEventListener('click', () => sortTasks(false)); // false for low-to-high
    }

    // --- Load Tasks ---
    function loadTasks(dayKey) {
        taskList.innerHTML = '';
        const tasksJSON = localStorage.getItem(`flowstate_tasks_${dayKey}`);
        if (tasksJSON) {
             try {
                 let tasks = JSON.parse(tasksJSON);
                 if (Array.isArray(tasks)) {
                     tasks.forEach(task => {
                         // Add default priority if missing (for backward compatibility)
                         const priority = task.priority && PRIORITIES.includes(task.priority) ? task.priority : DEFAULT_PRIORITY;
                         if (task && typeof task.text === 'string') {
                             addTaskToUI(task.text, task.comment || '', priority, typeof task.completed === 'boolean' ? task.completed : false);
                         } else { console.warn("Skipping invalid task object:", task); }
                     });
                 } else {
                     console.error("Stored tasks data is not an array. Clearing.");
                     localStorage.removeItem(`flowstate_tasks_${dayKey}`);
                 }
             } catch (error) {
                 console.error("Error parsing tasks. Clearing.", error);
                 localStorage.removeItem(`flowstate_tasks_${dayKey}`);
             }
        }
        isEditing = false;
        updateActionButtonsVisibility();
    }

    // --- Save Tasks (Includes Priority) ---
    function saveTasks(dayKey) {
        if (isEditing) { console.warn("Save prevented: editing active."); return; }
        const tasks = [];
        taskList.querySelectorAll('li').forEach(li => {
            const taskSpan = li.querySelector('span:not(.priority-label)'); // Main task text span
            const commentP = li.querySelector('p.comment');
            const priority = li.dataset.priority || DEFAULT_PRIORITY; // Read priority from data attribute

            if (!taskSpan || li.querySelector('.edit-input')) {
                console.error("Unexpected list item state during save:", li);
                return;
            }

            const text = taskSpan.textContent;
            const comment = commentP ? commentP.textContent.replace('- ', '').trim() : '';
            const completed = li.querySelector('input[type="checkbox"]').checked;
            tasks.push({ text, comment, priority, completed }); // Add priority to saved object
        });
        localStorage.setItem(`flowstate_tasks_${dayKey}`, JSON.stringify(tasks));
        console.log(`Tasks saved for ${dayKey} including priorities.`);
    }

    // --- Add Task Logic (Includes Priority) ---
    function addTask() {
        if (isEditing) return;
        const taskText = newTaskInput.value.trim();
        const commentText = newCommentInput.value.trim();
        const priority = newPrioritySelect.value; // Get selected priority
        const currentDayKey = urlParams.get('day') || 'today';

        if (taskText) {
            addTaskToUI(taskText, commentText, priority, false); // Pass priority
            saveTasks(currentDayKey); // Save new state including priority
            // Reset inputs
            newTaskInput.value = '';
            newCommentInput.value = '';
            newPrioritySelect.value = DEFAULT_PRIORITY; // Reset priority dropdown
            newTaskInput.focus();
            updateActionButtonsVisibility();
        } else {
            alert('Please enter a task description.');
        }
    }

    // --- Add Task to UI (Includes Priority Label and Data Attribute) ---
    function addTaskToUI(text, comment, priority, completed) {
        const listItem = document.createElement('li');
        listItem.setAttribute('draggable', 'true');
        listItem.dataset.priority = priority; // Store priority on the element

        // Create priority label span
        const priorityLabel = document.createElement('span');
        priorityLabel.className = `priority-label priority-${priority.toLowerCase()}`;
        priorityLabel.title = `${priority} Priority - Click to change`; // Tooltip

        listItem.innerHTML = `
            <input type="checkbox" ${completed ? 'checked' : ''} title="Mark task as complete">
            <span title="${text}">${text}</span> ${comment ? `<p class="comment" title="Comment: ${comment}">- ${comment}</p>` : ''}
            <button class="delete-btn" title="Delete Task">X</button>
        `;

        // Prepend the priority label after the checkbox
        listItem.insertBefore(priorityLabel, listItem.querySelector('span'));

        if (completed) {
            listItem.querySelector('span:not(.priority-label)').classList.add('completed');
        }
        taskList.appendChild(listItem);

        // --- Event Listeners for Checkbox and Delete ---
        const checkbox = listItem.querySelector('input[type="checkbox"]');
        const deleteButton = listItem.querySelector('.delete-btn');
        const taskSpan = listItem.querySelector('span:not(.priority-label)');

        checkbox.addEventListener('change', () => {
            if (isEditing) return;
            taskSpan.classList.toggle('completed', checkbox.checked);
            updateTaskCompletionInStorage(); // Just needs to call saveTasks
        });

        deleteButton.addEventListener('click', () => {
            if (isEditing) return;
            const taskText = taskSpan.textContent;
            if (window.confirm(`Are you sure you want to delete this task?\n\n"${taskText}"`)) {
                removeTask(listItem);
            }
        });
    }

     // --- Update Completion (No change, relies on saveTasks) ---
     function updateTaskCompletionInStorage() {
         const currentDayKey = urlParams.get('day') || 'today';
         saveTasks(currentDayKey);
     }

     // --- Remove Single Task ---
     function removeTask(listItemToRemove) {
         const currentDayKey = urlParams.get('day') || 'today';
         listItemToRemove.remove();
         saveTasks(currentDayKey);
         updateActionButtonsVisibility();
     }

     // --- Sort Tasks ---
     function sortTasks(highToLow) {
         if (isEditing) { alert("Please finish editing before sorting."); return; }

         const currentDayKey = urlParams.get('day') || 'today';
         const listItems = Array.from(taskList.children);

         listItems.sort((a, b) => {
             const priorityA = priorityMap[a.dataset.priority || DEFAULT_PRIORITY];
             const priorityB = priorityMap[b.dataset.priority || DEFAULT_PRIORITY];

             if (highToLow) {
                 return priorityB - priorityA; // Descending sort (High first)
             } else {
                 return priorityA - priorityB; // Ascending sort (Low first)
             }
             // Note: This sort might not be stable for items with the same priority
         });

         // Re-append items in sorted order
         // taskList.innerHTML = ''; // Clear existing list
         listItems.forEach(item => taskList.appendChild(item)); // Append in new order

         // Save the new order
         saveTasks(currentDayKey);
         console.log(`Tasks sorted: ${highToLow ? 'High to Low' : 'Low to High'}`);
     }


    // --- Drag and Drop Event Listeners ---
    // (No changes needed here, but note sorting overrides drag order)
     taskList.addEventListener('dragstart', (e) => {
        if (isEditing) { e.preventDefault(); return; }
        if (e.target.tagName === 'LI') {
            draggedItem = e.target;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', e.target.dataset.priority); // Can optionally include data
            setTimeout(() => e.target.classList.add('dragging'), 0);
        }
    });
     taskList.addEventListener('dragend', (e) => {
        if (draggedItem) {
            draggedItem.classList.remove('dragging');
            taskList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
            const currentDayKey = urlParams.get('day') || 'today';
            // Ensure save happens *after* DOM reflects drop
            saveTasks(currentDayKey); // Save potentially new drag-and-drop order
            draggedItem = null;
        }
     });
    // ... (Keep dragover, dragleave, drop listeners as they were, they handle DOM move) ...
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
          } else if (e.target.closest('li')) { if(e.target.tagName === 'LI') { e.target.classList.remove('drag-over'); } }
          else { taskList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over')); }
     });
     taskList.addEventListener('drop', (e) => {
         if (isEditing) return;
         e.preventDefault();
         const targetItem = e.target.closest('li');
         taskList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
         if (targetItem && draggedItem && targetItem !== draggedItem) {
             const targetRect = targetItem.getBoundingClientRect();
             const targetMidY = targetRect.top + targetRect.height / 2;
             if (e.clientY < targetMidY) { taskList.insertBefore(draggedItem, targetItem); }
             else { taskList.insertBefore(draggedItem, targetItem.nextSibling); }
             // DOM order changed, saveTasks in dragend will capture it
         }
         if (draggedItem) { draggedItem.classList.remove('dragging'); }
     });


    // --- Inline Editing & Priority Cycling ---
    taskList.addEventListener('dblclick', handleDoubleClick); // Use named handler
    taskList.addEventListener('click', handleClick); // Use named handler for priority cycle

    function handleDoubleClick(e) {
        if (isEditing) return;
        const target = e.target;
        // Allow editing on task span or comment, but NOT priority label
        if ((target.tagName === 'SPAN' && !target.classList.contains('priority-label') && !target.classList.contains('completed')) || target.matches('p.comment')) {
            startEditing(target);
        }
    }

    function handleClick(e) {
        if (isEditing) return;
        const target = e.target;
        // Check if the click was on a priority label
        if (target.classList.contains('priority-label')) {
            cyclePriority(target);
        }
    }

    function cyclePriority(labelElement) {
        const listItem = labelElement.closest('li');
        if (!listItem) return;

        const currentPriority = listItem.dataset.priority || DEFAULT_PRIORITY;
        const newPriority = getNextPriority(currentPriority);

        // Update data attribute
        listItem.dataset.priority = newPriority;

        // Update label class and title
        labelElement.className = `priority-label priority-${newPriority.toLowerCase()}`;
        labelElement.title = `${newPriority} Priority - Click to change`;

        // Save the change
        const currentDayKey = urlParams.get('day') || 'today';
        saveTasks(currentDayKey);
        console.log(`Priority changed to ${newPriority} for task.`);
    }


    // --- Editing Functions (No significant changes needed here) ---
     function startEditing(element) {
         isEditing = true;
         const originalText = (element.tagName === 'P') ? element.textContent.replace('- ', '').trim() : element.textContent;
         const listItem = element.closest('li');
         if (listItem) listItem.setAttribute('draggable', 'false');

         const input = document.createElement('input');
         input.type = 'text';
         input.className = 'edit-input';
         input.value = originalText;
         input.dataset.originalText = originalText;
         input.dataset.originalTag = element.tagName; // SPAN or P
         // Determine which element is being replaced for styling/positioning hints
         input.dataset.replacedElementClass = element.className;

         element.parentNode.replaceChild(input, element);

         // Apply specific styles if needed based on what was replaced
         // e.g., if replacing comment, add italic style to input?

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

        // Detach listeners FIRST
        inputElement.removeEventListener('blur', handleEditFinish);
        inputElement.removeEventListener('keydown', handleEditKeyDown);

        const newText = inputElement.value.trim();
        const originalText = inputElement.dataset.originalText;
        const originalTag = inputElement.dataset.originalTag;
        // const isComment = originalTag === 'P'; // Simpler check
        const listItem = inputElement.closest('li');

        let elementToRestore;

        if (saveChanges && (newText !== '' || originalTag === 'P')) { // Allow saving empty comment to delete it
            elementToRestore = document.createElement(originalTag);
            if (originalTag === 'P') { // Handling comment
                if (newText !== '') {
                     elementToRestore.className = 'comment';
                     elementToRestore.textContent = `- ${newText}`;
                     elementToRestore.title = `Comment: ${newText}`;
                } else {
                    elementToRestore = null; // Delete comment if text is empty
                }
            } else { // Handling task span
                elementToRestore.textContent = newText;
                 elementToRestore.title = newText;
                const checkbox = listItem?.querySelector('input[type="checkbox"]');
                if (checkbox && checkbox.checked) elementToRestore.classList.add('completed');
            }
        } else { // Cancel or save empty task text (restore original)
            elementToRestore = document.createElement(originalTag);
            if (originalTag === 'P') {
                elementToRestore.className = 'comment';
                elementToRestore.textContent = `- ${originalText}`;
                 elementToRestore.title = `Comment: ${originalText}`;
            } else {
                elementToRestore.textContent = originalText;
                 elementToRestore.title = originalText;
                const checkbox = listItem?.querySelector('input[type="checkbox"]');
                if (checkbox && checkbox.checked) elementToRestore.classList.add('completed');
            }
        }

        // Perform replacement or removal
        if (elementToRestore) {
            inputElement.parentNode.replaceChild(elementToRestore, inputElement);
        } else if (originalTag === 'P') { // Only remove if it was the comment being deleted
            inputElement.remove();
        }


        isEditing = false;
        if (listItem) listItem.setAttribute('draggable', 'true');

        if (saveChanges) {
             // Check if the element was actually changed before saving
             const needsSave = (originalTag === 'P') || (newText !== originalText && newText !== '');
             if (needsSave) {
                const currentDayKey = urlParams.get('day') || 'today';
                 // Use timeout to ensure DOM updates before save, especially on blur
                 setTimeout(() => saveTasks(currentDayKey), 50);
             }
        }
    } // End finishEditing

}); // End DOMContentLoaded