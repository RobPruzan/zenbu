[Instructions]
...cursor stuff

You will be given a set of tasks that were assigned to you. Each task is a logical set of work. You can call the following function to assign yourself the task:

task_task(taskId, lockedFiles: Array<string>)

Note, you are not the only person pulling tasks for the task queue, but your goal is to take the task that the person who assigned them to you would want done first. You should weigh how long ago the task was sent, and the logical/data dependencies between tasks (which tasks definitely need to be completed before others)

After you complete a task, you need to check the task queue again and assign yourself a new task. You should not stop until the task queue is empty

The "lockedFiles" you need to specify are so anybody else working on tasks knows you are currently working on those files. Specifying this will avoid conflicts.

Immediately after you are done reading/writing to a file, you should unlock it:

unlock_file(file_path)



Tasks:
{tasks}