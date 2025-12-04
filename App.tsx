
import React, { useState, useEffect, useMemo } from 'react';
import { Icons } from './constants';
import { larkService } from './services/larkService';
import { ITask, IUser, PriorityLevel } from './types';

// --- Utility Components ---

const Badge = ({ children, colorClass }: { children?: React.ReactNode, colorClass: string }) => (
  <span className={`px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}>
    {children}
  </span>
);

const Avatar = ({ user }: { user: IUser | null }) => {
  if (!user) return <div className="w-6 h-6 rounded-full bg-slate-200 border border-white flex items-center justify-center text-[10px] text-slate-500">?</div>;
  return (
    <img 
      src={user.avatarUrl} 
      alt={user.name} 
      title={user.name}
      className="w-6 h-6 rounded-full border border-white shadow-sm object-cover" 
    />
  );
};

// --- Task Card Component ---

interface TaskCardProps {
  task: ITask;
  onEdit: (task: ITask) => void;
  onDelete: (id: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);

  // Logic: Overdue if EndDate < Now AND Not Completed
  const isOverdue = task.endDate && (!task.completedDate) && (task.endDate < Date.now());
  const isCompleted = !!task.completedDate;

  // Priority Styles
  const getPriorityColor = (p: PriorityLevel) => {
    switch (p) {
      case PriorityLevel.HIGH: return 'bg-red-100 text-red-700';
      case PriorityLevel.MEDIUM: return 'bg-orange-100 text-orange-700';
      case PriorityLevel.LOW: return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className={`group relative bg-white p-3 rounded-lg border shadow-sm hover:shadow-md transition-all mb-3 ${isOverdue ? 'border-l-4 border-l-red-500 border-y-red-100 border-r-red-100' : 'border-slate-200'}`}>
      
      {/* Header: Name & Menu */}
      <div className="flex justify-between items-start mb-2">
        <h4 className={`text-sm font-medium leading-tight ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
          {task.name}
        </h4>
        <button 
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          className="text-slate-400 hover:text-slate-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>

      {/* Menu Dropdown */}
      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
          <div className="absolute right-2 top-8 w-28 bg-white rounded-md shadow-xl border border-slate-100 z-20 py-1">
            <button 
              onClick={() => { setShowMenu(false); onEdit(task); }}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              Edit Task
            </button>
            <button 
              onClick={() => { setShowMenu(false); onDelete(task.id); }}
              className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </>
      )}

      {/* Tags Row */}
      <div className="flex items-center gap-2 mb-3">
        <Badge colorClass={getPriorityColor(task.priority)}>{task.priority}</Badge>
        {isOverdue && <Badge colorClass="bg-red-500 text-white animate-pulse">Overdue</Badge>}
        {isCompleted && <Badge colorClass="bg-green-100 text-green-700">Done</Badge>}
      </div>

      {/* Footer: Dates & Assignee */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
        <div className="text-[10px] text-slate-500 flex flex-col gap-0.5">
           {task.startDate && <span>Start: {new Date(task.startDate).toLocaleDateString('vi-VN')}</span>}
           {task.endDate && (
             <span className={isOverdue ? 'text-red-600 font-bold' : ''}>
               Due: {new Date(task.endDate).toLocaleDateString('vi-VN')}
             </span>
           )}
        </div>
        <Avatar user={task.assignee} />
      </div>
    </div>
  );
};

// --- Modal Component ---

const TaskModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialTask, 
  users, 
  groups 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onSave: (t: Partial<ITask>) => void, 
  initialTask?: ITask,
  users: IUser[],
  groups: string[]
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(initialTask?.name || '');
  const [priority, setPriority] = useState<PriorityLevel>(initialTask?.priority || PriorityLevel.MEDIUM);
  const [group, setGroup] = useState(initialTask?.group || groups[0]);
  const [assigneeId, setAssigneeId] = useState(initialTask?.assignee?.id || '');
  const [endDate, setEndDate] = useState(initialTask?.endDate ? new Date(initialTask.endDate).toISOString().split('T')[0] : '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const assignee = users.find(u => u.id === assigneeId) || null;
    const endTimestamp = endDate ? new Date(endDate).getTime() : null;
    
    onSave({
      name,
      priority,
      group,
      assignee,
      endDate: endTimestamp,
      // Keep existing values if editing
      ...(initialTask ? {} : { startDate: Date.now(), completedDate: null })
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
           <h3 className="font-bold text-slate-800">{initialTask ? 'Edit Task' : 'New Task'}</h3>
           <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Task Name</label>
            <input 
              required
              className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
              value={name} 
              onChange={e => setName(e.target.value)} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Group</label>
              <select className="w-full p-2 border border-slate-300 rounded" value={group} onChange={e => setGroup(e.target.value)}>
                {groups.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Priority</label>
              <select className="w-full p-2 border border-slate-300 rounded" value={priority} onChange={e => setPriority(e.target.value as PriorityLevel)}>
                {Object.values(PriorityLevel).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assignee</label>
              <select className="w-full p-2 border border-slate-300 rounded" value={assigneeId} onChange={e => setAssigneeId(e.target.value)}>
                <option value="">Unassigned</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Due Date</label>
              <input 
                type="date"
                className="w-full p-2 border border-slate-300 rounded" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded shadow-sm">
              {initialTask ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Main App ---

const App: React.FC = () => {
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [groupBy, setGroupBy] = useState<'group' | 'assignee'>('group');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ITask | undefined>(undefined);

  useEffect(() => {
    const loadData = async () => {
      const [t, u, g] = await Promise.all([
        larkService.getTasks(),
        larkService.getUsers(),
        larkService.getGroups()
      ]);
      setTasks(t);
      setUsers(u);
      setGroups(g);
    };
    loadData();
  }, []);

  // --- Logic for Board Columns ---

  const columns = useMemo(() => {
    if (groupBy === 'group') {
      return groups.map(g => ({
        id: g,
        title: g,
        tasks: tasks.filter(t => t.group === g)
      }));
    } else {
      // Group by Assignee
      const assigned = users.map(u => ({
        id: u.id,
        title: u.name,
        tasks: tasks.filter(t => t.assignee?.id === u.id)
      }));
      const unassigned = {
        id: 'unassigned',
        title: 'Unassigned',
        tasks: tasks.filter(t => !t.assignee)
      };
      return [...assigned, unassigned];
    }
  }, [tasks, groups, users, groupBy]);

  // --- Handlers ---

  const handleCreate = async (taskData: Partial<ITask>) => {
    const newTask = await larkService.addTask(taskData as any);
    setTasks(prev => [...prev, newTask]);
  };

  const handleUpdate = async (taskData: Partial<ITask>) => {
    if (!editingTask) return;
    await larkService.updateTask(editingTask.id, taskData);
    setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...taskData } : t));
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    await larkService.deleteTask(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const openCreateModal = () => {
    setEditingTask(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (task: ITask) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col h-screen font-sans">
      
      {/* --- Toolbar --- */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
             <div className="bg-blue-600 p-1.5 rounded-lg">
                <Icons.LarkLogo />
             </div>
             <h1 className="font-bold text-slate-800 text-lg">Project Board</h1>
          </div>
          
          <div className="h-6 w-px bg-slate-200 mx-2"></div>
          
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>Group by:</span>
            <select 
              value={groupBy} 
              onChange={(e) => setGroupBy(e.target.value as any)}
              className="bg-slate-100 border-none rounded px-2 py-1 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="group">Nhóm công việc</option>
              <option value="assignee">Người thực hiện</option>
            </select>
          </div>
        </div>

        <button 
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Task
        </button>
      </div>

      {/* --- Board Area --- */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex h-full gap-6">
          {columns.map(col => (
            <div key={col.id} className="w-80 flex-shrink-0 flex flex-col max-h-full">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-700">{col.title}</h3>
                  <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">
                    {col.tasks.length}
                  </span>
                </div>
              </div>

              {/* Column Content */}
              <div className="flex-1 overflow-y-auto pr-2 pb-10">
                {col.tasks.length === 0 ? (
                  <div className="h-24 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-sm">
                    No tasks
                  </div>
                ) : (
                  col.tasks.map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onEdit={openEditModal} 
                      onDelete={handleDelete}
                    />
                  ))
                )}
                
                {/* Add Quick Button at bottom of column */}
                <button 
                  onClick={() => {
                     // Pre-fill group or assignee based on column
                     setEditingTask(undefined);
                     // This is a simple implementation, ideally pass these pre-fills to modal
                     setIsModalOpen(true);
                  }}
                  className="w-full py-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded border border-transparent hover:border-slate-200 text-sm transition flex items-center justify-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add Card
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={editingTask ? handleUpdate : handleCreate}
        initialTask={editingTask}
        users={users}
        groups={groups}
      />
    </div>
  );
};

export default App;
