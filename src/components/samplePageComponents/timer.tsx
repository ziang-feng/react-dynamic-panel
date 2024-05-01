import React, { useState } from 'react';

interface Timer {
    id: number;
    name: string;
    time: number;
    isActive: boolean;
}

const TimerApp: React.FC = () => {
    const [timers, setTimers] = useState<Timer[]>([]);
    const [timerName, setTimerName] = useState<string>('');

    const formatTime = (time: number): string => {
        const hours = Math.floor(time / 3600);
        const minutes = Math.floor((time % 3600) / 60);
        const seconds = Math.floor(time % 60);
        const milliseconds = Math.floor((time - Math.floor(time)) * 1000);
    
        return `${hours.toString().padStart(2, '0')}:${minutes
          .toString()
          .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${milliseconds
          .toString()
          .padStart(3, '0')}`;
      };

    const handleAddTimer = () => {
        if (timerName.trim() === '') return;

        const newTimer: Timer = {
            id: Date.now(),
            name: timerName,
            time: 0,
            isActive: false,
        };

        setTimers([...timers, newTimer]);
        setTimerName('');
    };

    const handleRemoveTimer = (id: number) => {
        setTimers(timers.filter(timer => timer.id !== id));
    };

    const handleToggleTimer = (id: number) => {
        setTimers(
            timers.map(timer =>
                timer.id === id ? { ...timer, isActive: !timer.isActive } : timer
            )
        );
    };

    const handleModifyTimer = (id: number, time: number) => {
        setTimers(
            timers.map(timer =>
                timer.id === id ? { ...timer, time: time } : timer
            )
        );
    };

    const handleTimerTick = () => {
        setTimers(
            timers.map(timer =>
                timer.isActive ? { ...timer, time: timer.time + 0.01 } : timer
            )
        );
    };

    React.useEffect(() => {
        const intervalId = setInterval(handleTimerTick, 10); // Millisecond precision

        return () => clearInterval(intervalId);
    }, [timers]);

    return (
        <div className="container w-full h-full overflow-auto p-4">
            <h1 className="text-3xl font-bold mb-4">Timer App</h1>
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Enter timer name"
                    value={timerName}
                    onChange={e => setTimerName(e.target.value)}
                    className="border rounded px-2 py-1 mr-2"
                />
                <button onClick={handleAddTimer} className="bg-blue-500 text-white px-4 py-2 rounded">
                    Add Timer
                </button>
            </div>
            {timers.map(timer => (
                <div key={timer.id} className="mb-4 border rounded p-4">
                    <h2 className="text-xl font-bold mb-2">{timer.name}</h2>
                    <p className="mb-2">Time: {formatTime(timer.time)}</p>
                    <div className="space-x-2">
                        <button
                            onClick={() => handleModifyTimer(timer.id, 0)}
                            className="bg-gray-300 text-gray-700 px-3 py-1 rounded"
                        >
                            Reset
                        </button>
                        <button
                            onClick={() => handleToggleTimer(timer.id)}
                            className={`${timer.isActive ? 'bg-red-500' : 'bg-green-500'
                                } text-white px-3 py-1 rounded`}
                        >
                            {timer.isActive ? 'Pause' : 'Start'}
                        </button>
                        <button
                            onClick={() => handleRemoveTimer(timer.id)}
                            className="bg-gray-500 text-white px-3 py-1 rounded"
                        >
                            Remove
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TimerApp;
