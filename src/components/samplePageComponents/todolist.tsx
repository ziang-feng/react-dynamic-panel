import React, { useState } from 'react';

interface TodoItem {
    id: number;
    name: string;
    completed: boolean;
    addedTime: number;
}

const TodoApp: React.FC = () => {
    const [todoList, setTodoList] = useState<TodoItem[]>([]);
    const [inputValue, setInputValue] = useState<string>('');

    const handleAddItem = () => {
        if (inputValue.trim() !== '') {
            const newItem: TodoItem = {
                id: Date.now(),
                name: inputValue,
                completed: false,
                addedTime: Date.now(),
            };
            setTodoList([...todoList, newItem]);
            setInputValue('');
        }
    };

    const handleDeleteItem = (id: number) => {
        setTodoList(todoList.filter(item => item.id !== id));
    };

    const handleToggleComplete = (id: number) => {
        setTodoList(todoList.map(item => {
            if (item.id === id) {
                return { ...item, completed: !item.completed };
            }
            return item;
        }));
    };

    const handleSortByName = () => {
        const sortedList = [...todoList].sort((a, b) => a.name.localeCompare(b.name));
        setTodoList(sortedList);
    };

    const handleSortByAddedTime = () => {
        const sortedList = [...todoList].sort((a, b) => a.addedTime - b.addedTime);
        setTodoList(sortedList);
    };

    return (
        <div className="w-full h-full overflow-auto p-4">
            <h1 className="text-3xl font-bold mb-4">Todo App</h1>
            <div className="flex items-center mb-4">
                <input
                    type="text"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    placeholder="Add new item"
                    className="py-2 px-3 w-full border rounded mr-2"
                />
                <button onClick={handleAddItem} className="py-2 px-4 bg-blue-500 text-white rounded">Add</button>
            </div>
            <div className="flex mb-4">
                <button onClick={handleSortByName} className="py-2 px-4 bg-gray-300 rounded mr-2">Sort by Name</button>
                <button onClick={handleSortByAddedTime} className="py-2 px-4 bg-gray-300 rounded">Sort by Added Time</button>
            </div>
            <div>
                <h2 className="text-xl font-bold mb-2">Todo List</h2>
                <ul>
                    {todoList.map(item => item.completed?null:(
                        <li key={item.id} className={`mb-2 flex ${item.completed ? 'line-through text-gray-500' : ''}`}>
                            <span className='mr-auto my-auto text-xl'>{item.name}</span>
                            <button onClick={() => handleToggleComplete(item.id)} className="py-1 px-2 bg-green-500 text-white rounded ml-2">Complete</button>
                            <button onClick={() => handleDeleteItem(item.id)} className="py-1 px-2 bg-red-500 text-white rounded ml-2">Delete</button>
                        </li>
                    ))}
                </ul>
            </div>
            <div>
                <h2 className="text-xl font-bold mb-2">Completed Items</h2>
                <ul>
                    {todoList.filter(item => item.completed).map(item => (
                        <li key={item.id} className="text-gray-500 mb-2 flex">
                            <span className='mr-auto my-auto text-xl line-through'>{item.name}</span>
                            <button onClick={() => handleToggleComplete(item.id)} className="py-1 px-2 bg-green-500 text-white rounded ml-2">Revert</button>
                            <button onClick={() => handleDeleteItem(item.id)} className="py-1 px-2 bg-red-500 text-white rounded ml-2">Delete</button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default TodoApp;
