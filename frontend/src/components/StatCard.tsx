import React from 'react';

interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: string | number;
    color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, color }) => {
    const colorMap: { [key: string]: string } = {
        blue: 'text-blue-500',
        green: 'text-green-500',
        yellow: 'text-yellow-500',
        red: 'text-red-500',
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-4 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
            <div className={`text-4xl ${colorMap[color]}`}>{icon}</div>
            <div>
                <p className="text-md font-semibold text-gray-600">{title}</p>
                <p className="text-3xl font-bold text-gray-800">{value}</p>
            </div>
        </div>
    );
};

export default StatCard;