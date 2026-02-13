/**
 * Analytics Component
 *
 * Компонент для отображения аналитики и статистики.
 * Показывает количество выданного оборудования и созданных заявок.
 */

import { useState, useEffect } from 'react';
import { getAnalytics } from '../services/api';
import { useError } from './ErrorModal';
import { Package, ClipboardList, TrendingUp, RefreshCw, Calendar, FileText, CheckCircle, Clock, Users } from 'lucide-react';

const Analytics = () => {
    const [stats, setStats] = useState({
        totalBids: 0,
        issuedEquipmentCount: 0,
        totalSpecifications: 0,
        completedBids: 0,
        avgCompletionHours: 0,
        userStats: []
    });
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('all');
    const [specificDate, setSpecificDate] = useState('');
    const { showError } = useError();

    const periods = [
        { value: 'all', label: 'Всё время' },
        { value: 'year', label: 'Год' },
        { value: 'halfYear', label: 'Пол года' },
        { value: 'month', label: 'Месяц' },
        { value: 'week', label: 'Неделя' },
        { value: 'day', label: 'День' }
    ];

    // Периоды, которые поддерживают выбор конкретной даты
    const periodsWithDate = ['day', 'week', 'month', 'halfYear', 'year'];

    useEffect(() => {
        fetchAnalytics();
    }, [period, specificDate]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const response = await getAnalytics(period, specificDate);
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
            showError('Ошибка при загрузке аналитики', 'Не удалось получить статистику');
        } finally {
            setLoading(false);
        }
    };

    const getPeriodLabel = () => {
        const p = periods.find(item => item.value === period);
        return p ? p.label : 'Всё время';
    };

    const handlePeriodChange = (e) => {
        const newPeriod = e.target.value;
        setPeriod(newPeriod);
        // Сбрасываем дату при смене периода
        setSpecificDate('');
    };

    const handleDateChange = (e) => {
        setSpecificDate(e.target.value);
    };

    const isDateSelectionEnabled = () => {
        return periodsWithDate.includes(period);
    };

    // Получаем диапазон дат для отображения
    const getDateRangeText = () => {
        if (!specificDate) {
            return 'последний период';
        }
        
        const date = new Date(specificDate);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        
        if (period === 'day') {
            return `за ${date.toLocaleDateString('ru-RU', options)}`;
        } else if (period === 'week') {
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 6);
            return `с ${date.toLocaleDateString('ru-RU', options)} по ${endDate.toLocaleDateString('ru-RU', options)}`;
        } else if (period === 'month') {
            const endDate = new Date(date);
            endDate.setMonth(endDate.getMonth() + 1);
            endDate.setDate(endDate.getDate() - 1);
            return `с ${date.toLocaleDateString('ru-RU', options)} по ${endDate.toLocaleDateString('ru-RU', options)}`;
        } else if (period === 'halfYear') {
            const endDate = new Date(date);
            endDate.setMonth(endDate.getMonth() + 6);
            endDate.setDate(endDate.getDate() - 1);
            return `с ${date.toLocaleDateString('ru-RU', options)} по ${endDate.toLocaleDateString('ru-RU', options)}`;
        } else if (period === 'year') {
            const endDate = new Date(date);
            endDate.setFullYear(endDate.getFullYear() + 1);
            endDate.setDate(endDate.getDate() - 1);
            return `с ${date.toLocaleDateString('ru-RU', options)} по ${endDate.toLocaleDateString('ru-RU', options)}`;
        }
        return '';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Загрузка аналитики...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h1 className="text-2xl font-bold text-gray-800">Аналитика</h1>
                <div className="flex items-center gap-4 flex-wrap">
                    {/* Селектор периода */}
                    <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-gray-500" />
                        <select
                            value={period}
                            onChange={handlePeriodChange}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            {periods.map(p => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Выбор конкретной даты (только для периодов: день, неделя, месяц, полгода) */}
                    {isDateSelectionEnabled() && (
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={specificDate}
                                onChange={handleDateChange}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            />
                        </div>
                    )}
                    
                    <button
                        onClick={fetchAnalytics}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
                    >
                        <RefreshCw size={18} />
                        Обновить
                    </button>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                <span className="text-blue-700 font-medium">
                    Период: {getPeriodLabel()}
                    {isDateSelectionEnabled() && specificDate && (
                        <span className="text-blue-600"> {getDateRangeText()}</span>
                    )}
                    {isDateSelectionEnabled() && !specificDate && (
                        <span className="text-gray-500"> (последний период)</span>
                    )}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Карточка: Количество выданного оборудования */}
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Выдано оборудования</p>
                            <p className="text-3xl font-bold text-gray-800">{stats.issuedEquipmentCount}</p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-full">
                            <Package className="text-blue-600" size={28} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-green-600">
                        <TrendingUp size={16} className="mr-1" />
                        <span>Единиц оборудования</span>
                    </div>
                </div>

                {/* Карточка: Количество созданных заявок */}
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Создано заявок</p>
                            <p className="text-3xl font-bold text-gray-800">{stats.totalBids}</p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-full">
                            <ClipboardList className="text-green-600" size={28} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-green-600">
                        <TrendingUp size={16} className="mr-1" />
                        <span>Заявок в системе</span>
                    </div>
                </div>

                {/* Дополнительная карточка: Общая статистика */}
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Соотношение</p>
                            <p className="text-3xl font-bold text-gray-800">
                                {stats.totalBids > 0 
                                    ? (stats.issuedEquipmentCount / stats.totalBids).toFixed(2)
                                    : 0}
                            </p>
                        </div>
                        <div className="bg-purple-100 p-3 rounded-full">
                            <TrendingUp className="text-purple-600" size={28} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-purple-600">
                        <span>Единиц оборудования на заявку</span>
                    </div>
                </div>

                {/* Карточка: Количество созданных спецификаций */}
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Создано спецификаций</p>
                            <p className="text-3xl font-bold text-gray-800">{stats.totalSpecifications}</p>
                        </div>
                        <div className="bg-orange-100 p-3 rounded-full">
                            <FileText className="text-orange-600" size={28} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-orange-600">
                        <TrendingUp size={16} className="mr-1" />
                        <span>Спецификаций в системе</span>
                    </div>
                </div>

                {/* Карточка: Количество завершенных заявок */}
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Завершено заявок</p>
                            <p className="text-3xl font-bold text-gray-800">{stats.completedBids}</p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-full">
                            <CheckCircle className="text-green-600" size={28} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-green-600">
                        <TrendingUp size={16} className="mr-1" />
                        <span>Заявок завершено</span>
                    </div>
                </div>

                {/* Карточка: Среднее время выполнения заявки */}
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Среднее время выполнения</p>
                            <p className="text-3xl font-bold text-gray-800">
                                {stats.avgCompletionHours > 0 
                                    ? `${stats.avgCompletionHours.toFixed(1)} ч.`
                                    : '—'}
                            </p>
                        </div>
                        <div className="bg-indigo-100 p-3 rounded-full">
                            <Clock className="text-indigo-600" size={28} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-indigo-600">
                        <TrendingUp size={16} className="mr-1" />
                        <span>От создания до закрытия</span>
                    </div>
                </div>
            </div>

            {/* График или дополнительная информация */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Сводная информация</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Оборудование</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Выдано единиц:</span>
                                <span className="font-semibold">{stats.issuedEquipmentCount}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Период:</span>
                                <span className="font-semibold text-blue-600">{getPeriodLabel()}</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Заявки</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Всего заявок:</span>
                                <span className="font-semibold">{stats.totalBids}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Спецификаций:</span>
                                <span className="font-semibold text-orange-600">{stats.totalSpecifications}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Завершено:</span>
                                <span className="font-semibold text-green-600">{stats.completedBids}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Ср. время:</span>
                                <span className="font-semibold text-indigo-600">
                                    {stats.avgCompletionHours > 0 ? `${stats.avgCompletionHours.toFixed(1)} ч.` : '—'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Среднее:</span>
                                <span className="font-semibold text-blue-600">
                                    {stats.totalBids > 0 ? '100%' : '0%'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Таблица пользователей по количеству созданных заявок */}
            {stats.userStats && stats.userStats.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="text-gray-600" size={20} />
                        <h2 className="text-lg font-semibold text-gray-800">Статистика по пользователям</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">№</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Пользователь</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Создано заявок</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Доля</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.userStats.map((user, index) => {
                                    const percentage = stats.totalBids > 0 
                                        ? ((user.bidCount / stats.totalBids) * 100).toFixed(1) 
                                        : 0;
                                    return (
                                        <tr 
                                            key={user.userId} 
                                            className={`border-b ${index === 0 ? 'bg-yellow-50' : ''}`}
                                        >
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                                                    index === 0 ? 'bg-yellow-400 text-white' : 
                                                    index === 1 ? 'bg-gray-400 text-white' : 
                                                    index === 2 ? 'bg-orange-400 text-white' : 
                                                    'bg-gray-200 text-gray-600'
                                                }`}>
                                                    {index + 1}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-800">
                                                {user.userName}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {user.bidCount}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-100">
                                                        <div 
                                                            className="bg-blue-500 h-2 rounded-full" 
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm text-gray-600">{percentage}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Analytics;
