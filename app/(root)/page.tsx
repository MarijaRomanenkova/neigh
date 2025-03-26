import TaskList from '@/components/shared/task/task-list';
import {
  getLatestTasks,
} from '@/lib/actions/task.actions';
import ViewAllTasksButton from '@/components/view-all-tasks-button';

const Homepage = async () => {
  const latesttasks = await getLatestTasks();

  return (
    <>
      <TaskList data={latesttasks} title='Newest Tasks' limit={12} />
      <ViewAllTasksButton />
    </>
  );
};

export default Homepage;
