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
    const sortPriorityLowBtn = document.getElementById('sortPriorityLowBtn');  // Sort button Low

    // --- URL Params and State Variables ---
    const urlParams = new URLSearchParams(window.location.search);
    const day = urlParams.get('day') || 'today';
    let draggedItem = null;
    let isEditing = false;

    // --- Constants for Priority ---
    const PRIORITIES = ['Low', 'Medium', 'High']; // Order matters for cycling
    const DEFAULT_PRIORITY = 'Medium';
    const priorityMap = { 'High': 2, 'Medium': 1, 'Low': 0 }; // For sorting logic

    // --- Helper Function: Update Action Buttons Visibility (using class for transition) ---
    function updateActionButtonsVisibility() {
        if (!taskActionsSection) return;
        const taskCount = taskList.children.length;
        if (taskCount > 0) {
            // Add class to show the section with transition
            taskActionsSection.classList.add('show-actions');
            // Show sort buttons only if there's more than one task to sort
            const showSort = taskCount > 1;
             if(sortPriorityHighBtn) sortPriorityHighBtn.style.display = showSort ? '' : 'none';
             if(sortPriorityLowBtn) sortPriorityLowBtn.style.display = showSort ? '' : 'none';
        } else {
            // Remove class to hide the section with transition
            taskActionsSection.classList.remove('show-actions');
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
                // Animate removal of all tasks
                 Array.from(taskList.children).forEach(listItem => {
                     // Add fade-out class and remove after animation
                     listItem.classList.add('fade-out');
                     listItem.addEventListener('transitionend', () => {
                         listItem.remove();
                         // Only save and update visibility after the last item is removed
                         if (taskList.children.length === 0) {
                             localStorage.removeItem(`flowstate_tasks_${day}`);
                             console.log(`All tasks deleted for: ${day}`);
                             updateActionButtonsVisibility();
                         }
                     }, { once: true }); // Ensure the event listener runs only once
                 });
                 // If there were items, save and update visibility will happen in the transitionend
                 // If there were no items (handled by the initial check), the original logic applies.
            }
        });
    }

    // Sort Button Listeners
    if (sortPriorityHighBtn) {
        // Adding animation suggestion - more complex, involves animating list reorder
        sortPriorityHighBtn.addEventListener('click', () => sortTasks(true)); // true for high-to-low
    }
    if (sortPriorityLowBtn) {
         // Adding animation suggestion - more complex, involves animating list reorder
        sortPriorityLowBtn.addEventListener('click', () => sortTasks(false)); // false for low-to-high
    }

     // --- Load Tasks ---
     function loadTasks(dayKey) {
         taskList.innerHTML = ''; // Clear the list instantly before loading
         const tasksJSON = localStorage.getItem(`flowstate_tasks_${dayKey}`);
         if (tasksJSON) {
              try {
                  let tasks = JSON.parse(tasksJSON);
                  if (Array.isArray(tasks)) {
                      // Introduce a slight delay or stagger for loaded items if desired
                      tasks.forEach((task, index) => {
                          const priority = task.priority && PRIORITIES.includes(task.priority) ? task.priority : DEFAULT_PRIORITY;
                          if (task && typeof task.text === 'string') {
                              // Add tasks to UI without fade-in animation initially on load
                              addTaskToUI(task.text, task.comment || '', priority, typeof task.completed === 'boolean' ? task.completed : false, false); // Pass false for animate
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
             // Skip items currently fading out (being removed)
             if (li.classList.contains('fade-out')) return;

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
             addTaskToUI(taskText, commentText, priority, false, true); // Pass true to animate
             // Save happens after animation (optional delay) or immediately
             // Let's save immediately for data integrity, animation is visual only
             saveTasks(currentDayKey);

             // Reset inputs
             newTaskInput.value = '';
             newCommentInput.value = '';
             newPrioritySelect.value = DEFAULT_PRIORITY; // Reset priority dropdown
             newTaskInput.focus();
             updateActionButtonsVisibility();
         } else {
              // Optional: Animate the input field instead of alert
             alert('Please enter a task description.');
         }
     }

     // --- Add Task to UI (Includes Priority Label and Data Attribute) ---
     // Added 'animate' parameter to control fade-in
     function addTaskToUI(text, comment, priority, completed, animate = true) {
         const listItem = document.createElement('li');
         listItem.setAttribute('draggable', 'true');
         listItem.dataset.priority = priority; // Store priority on the element

         // Create priority label span
         const priorityLabel = document.createElement('span');
         // Set initial class based on priority
         priorityLabel.className = `priority-label priority-${priority.toLowerCase()}`;
         priorityLabel.title = `${priority} Priority - Click to change`; // Tooltip
         priorityLabel.textContent = priority; // Set text content

         listItem.innerHTML = `
             <input type="checkbox" ${completed ? 'checked' : ''} title="Mark task as complete">
             <span title="${text}">${text}</span> ${comment ? `<p class="comment" title="Comment: ${comment}">- ${comment}</p>` : ''}
             <button class="delete-btn" title="Delete Task">X</button>
         `;

         // Prepend the priority label after the checkbox
         const checkbox = listItem.querySelector('input[type="checkbox"]');
         listItem.insertBefore(priorityLabel, checkbox.nextSibling);

         const taskSpan = listItem.querySelector('span:not(.priority-label)'); // Get the task span after insertion
         if (completed) {
             taskSpan.classList.add('completed');
         }
         taskList.appendChild(listItem);

         // Add fade-in class if animation is requested
         if (animate) {
             // Use setTimeout to allow the element to be added to the DOM first
             setTimeout(() => {
                 listItem.classList.add('fade-in');
                  // Remove the class after animation completes to reset state
                 listItem.addEventListener('animationend', () => {
                     listItem.classList.remove('fade-in');
                 }, { once: true });
             }, 10); // Small delay
         }


         // --- Event Listeners for Checkbox, Delete, and Priority Cycle ---
         const deleteButton = listItem.querySelector('.delete-btn');

         checkbox.addEventListener('change', () => {
             if (isEditing) return;
             taskSpan.classList.toggle('completed', checkbox.checked);
             updateTaskCompletionInStorage(); // Just needs to call saveTasks
         });

         deleteButton.addEventListener('click', () => {
             if (isEditing) return;
             const taskText = taskSpan.textContent;
             if (window.confirm(`Are you sure you want to delete this task?\n\n"${taskText}"`)) {
                 removeTask(listItem); // Use animated remove function
             }
         });

          // Add event listener for priority label click (use event delegation or add directly)
         priorityLabel.addEventListener('click', () => {
              if (isEditing) return; // Prevent cycling while editing
              cyclePriority(priorityLabel); // Call the cycle priority function
         });
     }

     // --- Update Completion (No change, relies on saveTasks) ---
     function updateTaskCompletionInStorage() {
         const currentDayKey = urlParams.get('day') || 'today';
         saveTasks(currentDayKey);
     }

     // --- Remove Single Task (Animated) ---
     function removeTask(listItemToRemove) {
         if (isEditing) return; // Prevent removal while editing

         // Add fade-out class to trigger animation
         listItemToRemove.classList.add('fade-out');

         // Remove the element from the DOM after the transition ends
         listItemToRemove.addEventListener('transitionend', () => {
             const currentDayKey = urlParams.get('day') || 'today';
             listItemToRemove.remove();
             saveTasks(currentDayKey); // Save after removal
             updateActionButtonsVisibility(); // Update button visibility
         }, { once: true }); // Ensure the event listener runs only once
     }


     // --- Sort Tasks ---
     // Animation for sorting is more complex (e.g., animating elements moving to new positions).
     // For this scope, we'll keep the instant sort but ensure the save captures the new order.
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

         // Re-append items in sorted order (instantly)
         taskList.innerHTML = ''; // Clear existing list
         listItems.forEach(item => taskList.appendChild(item)); // Append in new order

         // Save the new order
         saveTasks(currentDayKey);
         console.log(`Tasks sorted: ${highToLow ? 'High to Low' : 'Low to High'}`);
     }


     // --- Drag and Drop Event Listeners ---
     // Existing drag/drop handlers work with the new CSS transition on `.dragging` and `.drag-over`
     taskList.addEventListener('dragstart', (e) => {
         if (isEditing) { e.preventDefault(); return; }
         // Ensure we are dragging an LI element
         if (e.target.tagName === 'LI') {
             draggedItem = e.target;
             e.dataTransfer.effectAllowed = 'move';
             // e.dataTransfer.setData('text/plain', e.target.dataset.priority); // Optional: include data
              // Add class after a slight delay to ensure it doesn't interfere with drag initiation
             setTimeout(() => draggedItem.classList.add('dragging'), 0);
         } else {
             e.preventDefault(); // Prevent dragging non-LI elements
         }
     });

     taskList.addEventListener('dragend', (e) => {
         if (draggedItem) {
             draggedItem.classList.remove('dragging');
             // Remove drag-over class from any element that might still have it
             taskList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
             const currentDayKey = urlParams.get('day') || 'today';
             // Ensure save happens *after* DOM reflects drop
             saveTasks(currentDayKey); // Save potentially new drag-and-drop order
             draggedItem = null;
         }
     });

     taskList.addEventListener('dragover', (e) => {
         if (isEditing) return;
         e.preventDefault(); // Necessary to allow dropping

         // Find the closest LI element that is NOT the dragged item
         const targetItem = e.target.closest('li');
         if (!targetItem || targetItem === draggedItem) {
              // Remove drag-over class if not over a valid target
             taskList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
             return;
         }

         // Add drag-over class to the target item
         taskList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
         targetItem.classList.add('drag-over');

         e.dataTransfer.dropEffect = 'move'; // Show 'move' cursor
     });

     taskList.addEventListener('dragleave', (e) => {
         // This event is tricky, fires when leaving the element or its children
         // Use check to see if we've truly left the list area
         const listRect = taskList.getBoundingClientRect();
          // Check if mouse is outside the list bounds
         if (e.clientX < listRect.left || e.clientX > listRect.right || e.clientY < listRect.top || e.clientY > listRect.bottom) {
              // If leaving the whole list, remove drag-over from everything
              taskList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
         } else {
             // If just leaving a child element, check if still over an LI
             const target = e.relatedTarget;
              if (!target || !target.closest('li')) {
                 // If relatedTarget is null or not an LI, remove drag-over
                 taskList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
             }
         }
     });

     taskList.addEventListener('drop', (e) => {
         if (isEditing || !draggedItem) return; // Cannot drop if editing or nothing is dragged
         e.preventDefault();

         // Remove drag-over class from any element that might have it
         taskList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));

         const targetItem = e.target.closest('li');

         // If dropped outside the list or on the dragged item, do nothing
         if (!targetItem || targetItem === draggedItem) return;

         // Perform the DOM insertion
         const targetRect = targetItem.getBoundingClientRect();
         const targetMidY = targetRect.top + targetRect.height / 2;

         if (e.clientY < targetMidY) {
             // Drop above the target item
             taskList.insertBefore(draggedItem, targetItem);
         } else {
             // Drop below the target item
             taskList.insertBefore(draggedItem, targetItem.nextSibling);
         }

         // DOM order changed, saveTasks in dragend will capture it
         // The dragend event fires immediately after drop if successful
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

         // Update label class and title (CSS transition handles the color change)
         labelElement.className = `priority-label priority-${newPriority.toLowerCase()}`;
         labelElement.title = `${newPriority} Priority - Click to change`;
         labelElement.textContent = newPriority; // Update text content


         // Save the change
         const currentDayKey = urlParams.get('day') || 'today';
         saveTasks(currentDayKey);
         console.log(`Priority changed to ${newPriority} for task.`);
     }


     // --- Editing Functions (No significant changes needed here) ---
     function startEditing(element) {
         // Prevent starting a new edit if already editing
         if (isEditing) return;

         isEditing = true;
         const originalText = (element.tagName === 'P') ? element.textContent.replace('- ', '').trim() : element.textContent;
         const listItem = element.closest('li');
         if (listItem) listItem.setAttribute('draggable', 'false'); // Disable drag during edit

         const input = document.createElement('input');
         input.type = 'text';
         input.className = 'edit-input'; // Apply edit input class for styling
         input.value = originalText;
         input.dataset.originalText = originalText;
         input.dataset.originalTag = element.tagName; // Store original tag (SPAN or P)
         // Determine which element is being replaced for styling/positioning hints
         input.dataset.replacedElementClass = element.className;


         // Replace the element with the input
         element.parentNode.replaceChild(input, element);

         // Apply specific styles if needed based on what was replaced
         // e.g., if replacing comment, add italic style to input? This is handled by CSS
         // using [data-original-tag='P']

         input.focus();
         input.select();

         // Attach event listeners using named functions to allow removal
         input.addEventListener('blur', handleEditFinish);
         input.addEventListener('keydown', handleEditKeyDown);
     }

     function handleEditKeyDown(e) {
         const input = e.target;
         if (e.key === 'Enter') {
             e.preventDefault(); // Prevent default form submission behavior
             finishEditing(input, true); // Save changes on Enter
         } else if (e.key === 'Escape') {
             finishEditing(input, false); // Discard changes on Escape
         }
     }

     function handleEditFinish(e) {
         const input = e.target;
          // Check if the blur is happening on the currently active edit input
          // and editing state is true. This prevents issues if another element
          // gains focus unexpectedly.
         if (input && input.tagName === 'INPUT' && input.classList.contains('edit-input') && isEditing) {
              // Use a timeout to allow potential relatedTarget to be determined on blur
              // (though not strictly needed for this simple blur handler)
              setTimeout(() => {
                  // Check if the input is still in the DOM (wasn't replaced by finishEditing yet)
                  if (input.parentNode) {
                     finishEditing(input, true); // Save changes on blur
                  }
              }, 0);
         }
     }

     function finishEditing(inputElement, saveChanges) {
         // Ensure we are in an editing state and the input element is valid
         if (!isEditing || !inputElement || inputElement.tagName !== 'INPUT' || !inputElement.classList.contains('edit-input')) {
              console.warn("finishEditing called in invalid state.");
              return;
         }

         // Detach listeners FIRST to prevent them from firing again
         inputElement.removeEventListener('blur', handleEditFinish);
         inputElement.removeEventListener('keydown', handleEditKeyDown);

         const newText = inputElement.value.trim();
         const originalText = inputElement.dataset.originalText;
         const originalTag = inputElement.dataset.originalTag;
         const listItem = inputElement.closest('li');

         let elementToRestore = null; // Initialize as null

         if (saveChanges && (newText !== '' || originalTag === 'P')) { // Allow saving empty comment to delete it
             elementToRestore = document.createElement(originalTag);
             if (originalTag === 'P') { // Handling comment (<p>)
                 if (newText !== '') {
                     elementToRestore.className = 'comment';
                     elementToRestore.textContent = `- ${newText}`;
                     elementToRestore.title = `Comment: ${newText}`;
                 } else {
                     // If new text is empty for a comment, we want to remove the comment element
                     elementToRestore = null;
                 }
             } else { // Handling task span (<span>)
                 // If task text becomes empty, treat as cancel (restore original) unless saving empty is desired
                  if (newText !== '') {
                     elementToRestore.textContent = newText;
                     elementToRestore.title = newText;
                     const checkbox = listItem?.querySelector('input[type="checkbox"]');
                     if (checkbox && checkbox.checked) elementToRestore.classList.add('completed');
                  } else {
                     // Task text cannot be empty, restore original if empty on save
                     elementToRestore = document.createElement(originalTag);
                     elementToRestore.textContent = originalText;
                     elementToRestore.title = originalText;
                     const checkbox = listItem?.querySelector('input[type="checkbox"]');
                     if (checkbox && checkbox.checked) elementToRestore.classList.add('completed');
                  }
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
          // Check if the input element is still in the DOM before trying to replace it
          if (inputElement.parentNode) {
              if (elementToRestore) {
                  inputElement.parentNode.replaceChild(elementToRestore, inputElement);
              } else {
                  // If elementToRestore is null (meaning comment was deleted), remove the input
                  inputElement.remove();
              }
          } else {
              // Input element was already removed, possibly by another blur event,
              // but we still need to handle the save/cancel logic.
              console.warn("Edit input already removed from DOM.");
          }


         isEditing = false;
         if (listItem) listItem.setAttribute('draggable', 'true'); // Re-enable drag

         // Save changes if necessary, after DOM is updated
         if (saveChanges) {
              // Check if the content actually changed for task span, or if it was a comment (which can be deleted)
             const taskTextChanged = originalTag !== 'P' && newText !== originalText && newText !== '';
             const commentChangedOrDeleted = originalTag === 'P'; // Assume comment edit/delete always requires save

             if (taskTextChanged || commentChangedOrleted) {
                 const currentDayKey = urlParams.get('day') || 'today';
                 // Use timeout to ensure DOM updates before save, especially on blur
                 setTimeout(() => saveTasks(currentDayKey), 50);
             }
         }
     } // End finishEditing

}); // End DOMContentLoaded