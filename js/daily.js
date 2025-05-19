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
    const currentDayElement = document.getElementById('currentDay');
    const newTaskInput = document.getElementById('newTask');
    const newCommentInput = document.getElementById('newComment');
    const newPrioritySelect = document.getElementById('newPriority');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const deleteAllBtn = document.getElementById('deleteAllBtn');
    const taskActionsSection = document.querySelector('.task-actions');
    const sortPriorityHighBtn = document.getElementById('sortPriorityHighBtn');
    const sortPriorityLowBtn = document.getElementById('sortPriorityLowBtn');
    const taskCounterElement = document.getElementById('taskCounter');

    const urlParams = new URLSearchParams(window.location.search);
    const day = urlParams.get('day') || 'today';
    let draggedItem = null;
    let isEditing = false;

    const PRIORITIES = ['Low', 'Medium', 'High'];
    const DEFAULT_PRIORITY = 'Medium';
    const priorityMap = { 'High': 2, 'Medium': 1, 'Low': 0 };

    function updateTaskStatsAndControls() {
        if (!taskActionsSection && !taskCounterElement) return;

        const taskCount = taskList.children.length;

        if (taskCounterElement) {
            taskCounterElement.textContent = `Tasks: ${taskCount}`;
        }

        if (taskActionsSection) {
            if (taskCount > 0) {
                taskActionsSection.classList.add('show-actions');
                if(deleteAllBtn) deleteAllBtn.style.display = '';

                const showSort = taskCount > 1;
                if(sortPriorityHighBtn) sortPriorityHighBtn.style.display = showSort ? '' : 'none';
                if(sortPriorityLowBtn) sortPriorityLowBtn.style.display = showSort ? '' : 'none';
            } else {
                taskActionsSection.classList.remove('show-actions');
                if(deleteAllBtn) deleteAllBtn.style.display = 'none';
                if(sortPriorityHighBtn) sortPriorityHighBtn.style.display = 'none';
                if(sortPriorityLowBtn) sortPriorityLowBtn.style.display = 'none';
            }
        }
    }

    function getNextPriority(currentPriority) {
        const currentIndex = PRIORITIES.indexOf(currentPriority);
        const nextIndex = (currentIndex + 1) % PRIORITIES.length;
        return PRIORITIES[nextIndex];
    }

    if (day) {
        const displayDay = day === 'today' ? 'Today' : day.charAt(0).toUpperCase() + day.slice(1);
        currentDayElement.textContent = displayDay;
        loadTasks(day);
    } else {
        currentDayElement.textContent = 'Today';
        loadTasks('today');
    }
    updateTaskStatsAndControls();

    addTaskBtn.addEventListener('click', addTask);
    newTaskInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });
    newCommentInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });
    newPrioritySelect.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });

    if (deleteAllBtn) {
        deleteAllBtn.addEventListener('click', () => {
            if (isEditing) { alert("Please finish editing first."); return; }
            if (taskList.children.length === 0) {
                updateTaskStatsAndControls();
                return;
            }
            const displayDay = currentDayElement.textContent;
            if (window.confirm(`Are you sure you want to delete ALL tasks for ${displayDay}?\n\nThis action cannot be undone.`)) {
                const itemsToRemove = Array.from(taskList.children);
                if (itemsToRemove.length === 0) {
                    localStorage.removeItem(`flowstate_tasks_${day}`);
                    console.log(`All tasks deleted for: ${day}`);
                    updateTaskStatsAndControls();
                    return;
                }
                itemsToRemove.forEach((listItem) => {
                    listItem.classList.add('fade-out');
                    listItem.addEventListener('transitionend', () => {
                        listItem.remove();
                        if (taskList.children.length === 0) {
                            localStorage.removeItem(`flowstate_tasks_${day}`);
                            console.log(`All tasks deleted for: ${day}`);
                        }
                        updateTaskStatsAndControls();
                    }, { once: true });
                });

                if (itemsToRemove.length > 0) {
                     updateTaskStatsAndControls();
                }
            }
        });
    }

    if (sortPriorityHighBtn) {
        sortPriorityHighBtn.addEventListener('click', () => sortTasks(true));
    }
    if (sortPriorityLowBtn) {
        sortPriorityLowBtn.addEventListener('click', () => sortTasks(false));
    }

    function loadTasks(dayKey) {
        taskList.innerHTML = '';
        const tasksJSON = localStorage.getItem(`flowstate_tasks_${dayKey}`);
        if (tasksJSON) {
            try {
                let tasks = JSON.parse(tasksJSON);
                if (Array.isArray(tasks)) {
                    tasks.forEach((task) => {
                        const priority = task.priority && PRIORITIES.includes(task.priority) ? task.priority : DEFAULT_PRIORITY;
                        if (task && typeof task.text === 'string') {
                            addTaskToUI(task.text, task.comment || '', priority, typeof task.completed === 'boolean' ? task.completed : false, false);
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
        updateTaskStatsAndControls();
    }

    function saveTasks(dayKey) {
        if (isEditing) { console.warn("Save prevented: editing active."); return; }
        const tasks = [];
        taskList.querySelectorAll('li').forEach(li => {
            if (li.classList.contains('fade-out')) return;

            const taskSpan = li.querySelector('span:not(.priority-label)');
            const commentP = li.querySelector('p.comment');
            const priority = li.dataset.priority || DEFAULT_PRIORITY;

            if (!taskSpan || li.querySelector('.edit-input')) {
                console.error("Unexpected list item state during save:", li);
                return;
            }

            const text = taskSpan.textContent;
            const comment = commentP ? commentP.textContent.replace('- ', '').trim() : '';
            const completed = li.querySelector('input[type="checkbox"]').checked;
            tasks.push({ text, comment, priority, completed });
        });
        localStorage.setItem(`flowstate_tasks_${dayKey}`, JSON.stringify(tasks));
        console.log(`Tasks saved for ${dayKey} including priorities.`);
    }

    function addTask() {
        if (isEditing) return;
        const taskText = newTaskInput.value.trim();
        const commentText = newCommentInput.value.trim();
        const priority = newPrioritySelect.value;
        const currentDayKey = urlParams.get('day') || 'today';

        if (taskText) {
            addTaskToUI(taskText, commentText, priority, false, true);
            saveTasks(currentDayKey);

            newTaskInput.value = '';
            newCommentInput.value = '';
            newPrioritySelect.value = DEFAULT_PRIORITY;
            newTaskInput.focus();
            updateTaskStatsAndControls();
        } else {
            alert('Please enter a task description.');
        }
    }

    function addTaskToUI(text, comment, priority, completed, animate = true) {
        const listItem = document.createElement('li');
        listItem.setAttribute('draggable', 'true');
        listItem.dataset.priority = priority;
        if (completed) {
            listItem.classList.add('completed-item');
        }

        const priorityLabel = document.createElement('span');
        priorityLabel.className = `priority-label priority-${priority.toLowerCase()}`;
        priorityLabel.title = `${priority} Priority - Click to change`;
        priorityLabel.textContent = priority;

        listItem.innerHTML = `
            <input type="checkbox" ${completed ? 'checked' : ''} title="Mark task as complete">
            <span title="${text}">${text}</span> ${comment ? `<p class="comment" title="Comment: ${comment}">- ${comment}</p>` : ''}
            <button class="delete-btn" title="Delete Task">X</button>
        `;

        const checkbox = listItem.querySelector('input[type="checkbox"]');
        listItem.insertBefore(priorityLabel, checkbox.nextSibling);

        const taskSpan = listItem.querySelector('span:not(.priority-label)');
        if (completed) {
            taskSpan.classList.add('completed');
        }
        taskList.appendChild(listItem);

        if (animate) {
            setTimeout(() => {
                listItem.classList.add('fade-in');
                listItem.addEventListener('animationend', () => {
                    listItem.classList.remove('fade-in');
                }, { once: true });
            }, 10);
        }

        const deleteButton = listItem.querySelector('.delete-btn');

        checkbox.addEventListener('change', () => {
            if (isEditing) { checkbox.checked = !checkbox.checked; return; }
            taskSpan.classList.toggle('completed', checkbox.checked);
            listItem.classList.toggle('completed-item', checkbox.checked);
            updateTaskCompletionInStorage();
        });

        deleteButton.addEventListener('click', () => {
            if (isEditing) return;
            const taskText = taskSpan.textContent;
            if (window.confirm(`Are you sure you want to delete this task?\n\n"${taskText}"`)) {
                removeTask(listItem);
            }
        });

        priorityLabel.addEventListener('click', () => {
            if (isEditing) return;
            cyclePriority(priorityLabel);
        });
    }

    function updateTaskCompletionInStorage() {
        const currentDayKey = urlParams.get('day') || 'today';
        saveTasks(currentDayKey);
    }

    function removeTask(listItemToRemove) {
        if (isEditing) return;

        listItemToRemove.classList.add('fade-out');

        listItemToRemove.addEventListener('transitionend', () => {
            const currentDayKey = urlParams.get('day') || 'today';
            listItemToRemove.remove();
            saveTasks(currentDayKey);
            updateTaskStatsAndControls();
        }, { once: true });
    }

    function sortTasks(highToLow) {
        if (isEditing) { alert("Please finish editing before sorting."); return; }

        const currentDayKey = urlParams.get('day') || 'today';
        const listItems = Array.from(taskList.children);

        listItems.sort((a, b) => {
            const priorityA = priorityMap[a.dataset.priority || DEFAULT_PRIORITY];
            const priorityB = priorityMap[b.dataset.priority || DEFAULT_PRIORITY];

            if (highToLow) {
                return priorityB - priorityA;
            } else {
                return priorityA - priorityB;
            }
        });

        taskList.innerHTML = '';
        listItems.forEach(item => taskList.appendChild(item));

        saveTasks(currentDayKey);
        console.log(`Tasks sorted: ${highToLow ? 'High to Low' : 'Low to High'}`);
    }

    taskList.addEventListener('dragstart', (e) => {
        if (isEditing) { e.preventDefault(); return; }
        if (e.target.tagName === 'LI') {
            draggedItem = e.target;
            e.dataTransfer.effectAllowed = 'move';
            setTimeout(() => draggedItem.classList.add('dragging'), 0);
        } else {
            e.preventDefault();
        }
    });

    taskList.addEventListener('dragend', (e) => {
        if (draggedItem) {
            draggedItem.classList.remove('dragging');
            taskList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
            const currentDayKey = urlParams.get('day') || 'today';
            saveTasks(currentDayKey);
            draggedItem = null;
        }
    });

    taskList.addEventListener('dragover', (e) => {
        if (isEditing) return;
        e.preventDefault();

        const targetItem = e.target.closest('li');
        if (!targetItem || targetItem === draggedItem) {
            taskList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
            return;
        }

        taskList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        targetItem.classList.add('drag-over');

        e.dataTransfer.dropEffect = 'move';
    });

    taskList.addEventListener('dragleave', (e) => {
        const listRect = taskList.getBoundingClientRect();
        if (e.clientX < listRect.left || e.clientX > listRect.right || e.clientY < listRect.top || e.clientY > listRect.bottom) {
            taskList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        } else {
            const target = e.relatedTarget;
            if (!target || !target.closest('li')) {
                taskList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
            }
        }
    });

    taskList.addEventListener('drop', (e) => {
        if (isEditing || !draggedItem) return;
        e.preventDefault();

        taskList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));

        const targetItem = e.target.closest('li');

        if (!targetItem || targetItem === draggedItem) return;

        const targetRect = targetItem.getBoundingClientRect();
        const targetMidY = targetRect.top + targetRect.height / 2;

        if (e.clientY < targetMidY) {
            taskList.insertBefore(draggedItem, targetItem);
        } else {
            taskList.insertBefore(draggedItem, targetItem.nextSibling);
        }
    });

    taskList.addEventListener('dblclick', handleDoubleClick);
    taskList.addEventListener('click', handleClick);

    function handleDoubleClick(e) {
        if (isEditing) return;
        const target = e.target;
        if ((target.tagName === 'SPAN' && !target.classList.contains('priority-label') && !target.classList.contains('completed')) || (target.matches('p.comment') && !target.closest('li').classList.contains('completed-item'))) {
            startEditing(target);
        }
    }

    function handleClick(e) {
        if (isEditing) return;
        const target = e.target;
        if (target.classList.contains('priority-label')) {
            cyclePriority(target);
        }
    }

    function cyclePriority(labelElement) {
        const listItem = labelElement.closest('li');
        if (!listItem || listItem.classList.contains('completed-item')) return;

        const currentPriority = listItem.dataset.priority || DEFAULT_PRIORITY;
        const newPriority = getNextPriority(currentPriority);

        listItem.dataset.priority = newPriority;

        labelElement.className = `priority-label priority-${newPriority.toLowerCase()}`;
        labelElement.title = `${newPriority} Priority - Click to change`;
        labelElement.textContent = newPriority;

        const currentDayKey = urlParams.get('day') || 'today';
        saveTasks(currentDayKey);
        console.log(`Priority changed to ${newPriority} for task.`);
    }

    function startEditing(element) {
        if (isEditing) return;

        isEditing = true;
        const originalText = (element.tagName === 'P') ? element.textContent.replace('- ', '').trim() : element.textContent;
        const listItem = element.closest('li');
        if (listItem) listItem.setAttribute('draggable', 'false');

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'edit-input';
        input.value = originalText;
        input.dataset.originalText = originalText;
        input.dataset.originalTag = element.tagName;
        input.dataset.replacedElementClass = element.className;

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
            setTimeout(() => {
                if (input.parentNode) {
                    finishEditing(input, true);
                }
            }, 0);
        }
    }

    function finishEditing(inputElement, saveChanges) {
        if (!isEditing || !inputElement || inputElement.tagName !== 'INPUT' || !inputElement.classList.contains('edit-input')) {
            console.warn("finishEditing called in invalid state.");
            if (inputElement && inputElement.closest('li')) {
                 inputElement.closest('li').setAttribute('draggable', 'true');
            }
            isEditing = false;
            return;
        }

        inputElement.removeEventListener('blur', handleEditFinish);
        inputElement.removeEventListener('keydown', handleEditKeyDown);

        const newText = inputElement.value.trim();
        const originalText = inputElement.dataset.originalText;
        const originalTag = inputElement.dataset.originalTag;
        const listItem = inputElement.closest('li');

        let elementToRestore = null;

        if (saveChanges && (newText !== '' || originalTag === 'P')) {
            elementToRestore = document.createElement(originalTag);
            if (originalTag === 'P') {
                if (newText !== '') {
                    elementToRestore.className = 'comment';
                    elementToRestore.textContent = `- ${newText}`;
                    elementToRestore.title = `Comment: ${newText}`;
                } else {
                    elementToRestore = null;
                }
            } else {
                if (newText !== '') {
                    elementToRestore.textContent = newText;
                    elementToRestore.title = newText;
                } else {
                    elementToRestore.textContent = originalText;
                    elementToRestore.title = originalText;
                }
                const checkbox = listItem?.querySelector('input[type="checkbox"]');
                if (checkbox && checkbox.checked) elementToRestore.classList.add('completed');
            }
        } else {
            elementToRestore = document.createElement(originalTag);
            if (originalTag === 'P') {
                if (originalText !== '') {
                    elementToRestore.className = 'comment';
                    elementToRestore.textContent = `- ${originalText}`;
                    elementToRestore.title = `Comment: ${originalText}`;
                } else {
                    elementToRestore = null;
                }
            } else {
                elementToRestore.textContent = originalText;
                elementToRestore.title = originalText;
                const checkbox = listItem?.querySelector('input[type="checkbox"]');
                if (checkbox && checkbox.checked) elementToRestore.classList.add('completed');
            }
        }

        if (inputElement.parentNode) {
            if (elementToRestore) {
                inputElement.parentNode.replaceChild(elementToRestore, inputElement);
            } else {
                inputElement.remove();
            }
        } else {
            console.warn("Edit input already removed from DOM before restoring element.");
        }

        isEditing = false;
        if (listItem) listItem.setAttribute('draggable', 'true');

        if (saveChanges) {
            const taskTextChanged = originalTag !== 'P' && newText !== '' && newText !== originalText;
            const commentChangedOrDeleted = originalTag === 'P' && (newText !== originalText || (originalText !== '' && newText === ''));

            if (taskTextChanged || commentChangedOrDeleted) {
                const currentDayKey = urlParams.get('day') || 'today';
                setTimeout(() => saveTasks(currentDayKey), 50);
            }
        }
    }
});