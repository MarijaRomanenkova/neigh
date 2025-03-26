import TaskCard from './task-card';
import { Task } from '@/types';

interface TaskListProps {
  data: Task[];
  title?: string;
  limit?: number;
  emptyMessage?: string;
}

const TaskList = ({
  data,
  title,
  limit,
  emptyMessage = "No tasks found"
}: TaskListProps) => {
  // Apply limit if provided, otherwise show all tasks
  const limitedData = limit ? data.slice(0, limit) : data;

  return (
    <div className='my-10'>
      {title && <h2 className='h2-bold mb-4'>{title}</h2>}
      {limitedData.length > 0 ? (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {limitedData.map((task: Task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
};

export default TaskList;
