import React, { useState } from 'react';

const Calculator: React.FC = () => {
    const [input, setInput] = useState<string>('');
    const [history, setHistory] = useState<string[]>([]);

    const handleInputChange = (value: string) => {
        setInput(prevInput => prevInput + value);
    };

    const handleCalculate = () => {
        try {
            const result = eval(input);
            setHistory(prevHistory => [...prevHistory, `${input} = ${result}`]);
            setInput('');
        } catch (error) {
            console.error('Invalid input');
        }
    };

    return (
        <div className="p-4 w-full h-full overflow-auto">
            <h1 className="text-2xl font-bold mb-4">Calculator</h1>
            <input
                type="text"
                className="w-full bg-gray-100 p-2 rounded-md mb-4"
                value={input}
                readOnly
            />
            <div className="grid grid-cols-4 gap-2">
                <button
                    className="bg-gray-200 p-2 rounded-md hover:bg-gray-300"
                    onClick={() => handleInputChange('1')}
                >
                    1
                </button>
                <button
                    className="bg-gray-200 p-2 rounded-md hover:bg-gray-300"
                    onClick={() => handleInputChange('2')}
                >
                    2
                </button>
                <button
                    className="bg-gray-200 p-2 rounded-md hover:bg-gray-300"
                    onClick={() => handleInputChange('3')}
                >
                    3
                </button>
                <button
                    className="bg-gray-200 p-2 rounded-md hover:bg-gray-300"
                    onClick={() => handleInputChange('+')}
                >
                    +
                </button>
                <button
                    className="bg-gray-200 p-2 rounded-md hover:bg-gray-300"
                    onClick={() => handleInputChange('4')}
                >
                    4
                </button>
                <button
                    className="bg-gray-200 p-2 rounded-md hover:bg-gray-300"
                    onClick={() => handleInputChange('5')}
                >
                    5
                </button>
                <button
                    className="bg-gray-200 p-2 rounded-md hover:bg-gray-300"
                    onClick={() => handleInputChange('6')}
                >
                    6
                </button>
                <button
                    className="bg-gray-200 p-2 rounded-md hover:bg-gray-300"
                    onClick={() => handleInputChange('-')}
                >
                    -
                </button>
                <button
                    className="bg-gray-200 p-2 rounded-md hover:bg-gray-300"
                    onClick={() => handleInputChange('7')}
                >
                    7
                </button>
                <button
                    className="bg-gray-200 p-2 rounded-md hover:bg-gray-300"
                    onClick={() => handleInputChange('8')}
                >
                    8
                </button>
                <button
                    className="bg-gray-200 p-2 rounded-md hover:bg-gray-300"
                    onClick={() => handleInputChange('9')}
                >
                    9
                </button>
                <button
                    className="bg-gray-200 p-2 rounded-md hover:bg-gray-300"
                    onClick={() => handleInputChange('*')}
                >
                    *
                </button>
                <button
                    className="bg-gray-200 p-2 rounded-md hover:bg-gray-300"
                    onClick={() => handleInputChange('0')}
                >
                    0
                </button>
                <button
                    className="bg-gray-200 p-2 rounded-md hover:bg-gray-300"
                    onClick={() => handleInputChange('.')}
                >
                    .
                </button>
                <button
                    className="bg-gray-200 p-2 rounded-md hover:bg-gray-300"
                    onClick={() => handleCalculate()}
                >
                    =
                </button>
                <button
                    className="bg-gray-200 p-2 rounded-md hover:bg-gray-300"
                    onClick={() => handleInputChange('/')}
                >
                    /
                </button>
                <button
                    className="col-span-4 bg-gray-200 p-2 rounded-md hover:bg-gray-300"
                    onClick={() => setInput('')}
                >
                    Clear
                </button>
            </div>
            <div className="mt-4">
                <h2 className="text-lg font-bold mb-2">History</h2>
                <ul>
                    {history.map((item, index) => (
                        <li key={index}>{item}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Calculator;
