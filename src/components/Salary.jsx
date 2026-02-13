/**
 * Salary Component
 *
 * Этот компонент позволяет формировать отчеты по зарплате сотрудников
 * на основе выполненных спецификаций за выбранный период.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers, getSalaryReport } from '../services/api';

const Salary = () => {
    // Хук для навигации
    const navigate = useNavigate();

    // Состояние для списка пользователей
    const [users, setUsers] = useState([]);
    // Состояние для загрузки пользователей
    const [usersLoading, setUsersLoading] = useState(false);
    // Состояние для данных формы
    const [formData, setFormData] = useState({
        startDate: '',
        endDate: '',
        userId: 'all',
    });
    // Состояние для результатов отчета
    const [report, setReport] = useState([]);
    // Состояние для загрузки
    const [loading, setLoading] = useState(false);

    // Определение всех возможных колонок
    const allColumns = ['date', 'specification', 'cost', 'executor', 'bid', 'creator', 'client'];
    // Загрузка начальных состояний из localStorage
    const savedColumns = localStorage.getItem('salaryVisibleColumns');
    const initialVisibleColumns = savedColumns ? JSON.parse(savedColumns) : {
        date: true,
        specification: true,
        cost: true,
        executor: true,
        bid: true,
        client: true,
    };
    const savedOrder = localStorage.getItem('salaryColumnOrder');
    const initialColumnOrder = savedOrder ? JSON.parse(savedOrder) : allColumns;
    // Состояние для порядка колонок
    const [columnOrder, setColumnOrder] = useState(initialColumnOrder);
    // Состояние для видимых колонок в таблице
    const [visibleColumns, setVisibleColumns] = useState(initialVisibleColumns);
    // Состояние для показа выпадающего списка настроек колонок
    const [showColumnSettings, setShowColumnSettings] = useState(false);

    // Загрузка пользователей при монтировании
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await getUsers();
                setUsers(response.data);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };
        fetchUsers();
    }, []);

    // useEffect для сохранения настроек колонок в localStorage
    useEffect(() => {
        localStorage.setItem('salaryVisibleColumns', JSON.stringify(visibleColumns));
    }, [visibleColumns]);

    // useEffect для сохранения порядка колонок в localStorage
    useEffect(() => {
        localStorage.setItem('salaryColumnOrder', JSON.stringify(columnOrder));
    }, [columnOrder]);

    // useEffect для закрытия выпадающего списка при клике вне его
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showColumnSettings && !event.target.closest('.column-settings')) {
                setShowColumnSettings(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showColumnSettings]);

    // Обработчик изменения формы
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Обработчик формирования отчета
    const handleGenerateReport = async () => {
        if (!formData.startDate || !formData.endDate) {
            alert('Пожалуйста, выберите период дат');
            return;
        }

        setLoading(true);
        try {
            const params = {
                startDate: formData.startDate,
                endDate: formData.endDate,
            };
            if (formData.userId !== 'all') {
                params.userId = formData.userId;
            }
            const response = await getSalaryReport(params);
            setReport(response.data);
        } catch (error) {
            console.error('Error generating salary report:', error);
            alert('Ошибка при формировании отчета');
        } finally {
            setLoading(false);
        }
    };

    // Расчет общей суммы для отчета
    const totalAmount = report.reduce((sum, item) => sum + parseFloat(item.specification.cost), 0);

    // Группировка по исполнителям и расчет суммы для каждого
    const executorTotals = report.reduce((acc, item) => {
        const cost = parseFloat(item.specification.cost);
        const numExecutors = item.executors.length;
        const share = numExecutors > 0 ? cost / numExecutors : 0;

        item.executors.forEach(executor => {
            if (!acc[executor.id]) {
                acc[executor.id] = {
                    name: executor.fullName || executor.username,
                    total: 0,
                    count: 0
                };
            }
            acc[executor.id].total += share;
            acc[executor.id].count += 1; // Number of specs they are involved in
        });

        return acc;
    }, {});

    const executorSummary = Object.values(executorTotals).sort((a, b) => b.total - a.total);

    // Обработчик изменения видимости столбцов
    const handleColumnToggle = (column) => {
        setVisibleColumns(prev => ({
            ...prev,
            [column]: !prev[column]
        }));
    };

    // Функции для изменения порядка столбцов
    const moveUp = (index) => {
        if (index > 0) {
            const newOrder = [...columnOrder];
            [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
            setColumnOrder(newOrder);
        }
    };

    const moveDown = (index) => {
        if (index < columnOrder.length - 1) {
            const newOrder = [...columnOrder];
            [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
            setColumnOrder(newOrder);
        }
    };

    // Функция для получения названия столбца
    const getColumnLabel = (column) => {
        switch (column) {
            case 'date': return 'Дата';
            case 'specification': return 'Спецификация';
            case 'cost': return 'Стоимость';
            case 'executor': return 'Исполнитель';
            case 'bid': return 'Заявка';
            case 'creator': return 'Создатель';
            case 'client': return 'Клиент';
            default: return column;
        }
    };

    // Функция для получения содержимого ячейки
    const getCellContent = (item, column) => {
        switch (column) {
            case 'date': return new Date(item.createdAt).toLocaleDateString('ru-RU');
            case 'specification': return item.specification.name;
            case 'cost': return `${parseFloat(item.specification.cost).toFixed(2)} руб.`;
            case 'executor': return item.executors && item.executors.length > 0 ? item.executors.map(e => e.fullName || e.username).join(', ') : 'Не указаны';
            case 'bid': return (
                <span
                    className="text-blue-600 hover:text-blue-800 cursor-pointer underline"
                    onClick={() => handleBidClick(item.bid.id)}
                >
                    № {item.bid.id}
                </span>
            );
            case 'creator': return item.bid.creator ? item.bid.creator.fullName || item.bid.creator.username : 'Не указан';
            case 'client': return item.bid.client.name;
            default: return '';
        }
    };

    // Определение видимых столбцов в порядке columnOrder
    const displayColumns = columnOrder.filter(col => visibleColumns[col]);

    // Обработчик клика по заявке
    const handleBidClick = (bidId) => {
        navigate(`/dashboard/bids/${bidId}`);
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Зарплата</h1>

            {/* Карточка с элементами управления */}
            <div className="bg-gray-200 rounded-lg p-4 mb-6">
                {/* Форма для параметров отчета */}
                <div className="mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Дата начала</label>
                            <input
                                type="date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Дата окончания</label>
                            <input
                                type="date"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Сотрудник</label>
                            <select
                                name="userId"
                                value={formData.userId}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">Все сотрудники</option>
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.fullName || user.username}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={handleGenerateReport}
                                disabled={loading}
                                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg transition"
                            >
                                {loading ? 'Формирование...' : 'Сформировать'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Настройки столбцов */}
                <div className="flex justify-end">
                    <div className="relative column-settings">
                        <button
                            onClick={() => setShowColumnSettings(!showColumnSettings)}
                            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition"
                        >
                            Настройки столбцов
                        </button>
                        {showColumnSettings && (
                            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-10 column-settings">
                                <div className="p-4">
                                    <h4 className="font-medium mb-2">Настройки столбцов</h4>
                                    {columnOrder.map((column, index) => (
                                        <div key={column} className="flex items-center justify-between mb-2">
                                            <label className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={visibleColumns[column]}
                                                    onChange={() => handleColumnToggle(column)}
                                                    className="mr-2"
                                                />
                                                {getColumnLabel(column)}
                                            </label>
                                            {visibleColumns[column] && (
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => moveUp(index)}
                                                        disabled={index === 0}
                                                        className="px-2 py-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-xs rounded"
                                                    >
                                                        ↑
                                                    </button>
                                                    <button
                                                        onClick={() => moveDown(index)}
                                                        disabled={index === columnOrder.length - 1}
                                                        className="px-2 py-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-xs rounded"
                                                    >
                                                        ↓
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Таблица отчета */}
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                {report.length > 0 && (
                    <div className="px-6 py-4 bg-gray-50 border-b">
                        <h3 className="text-lg font-medium text-gray-900">
                            Отчет за период: {formData.startDate} - {formData.endDate}
                        </h3>
                        <p className="text-sm text-gray-600">
                            Всего спецификаций: {report.length} | Общая сумма: {totalAmount.toFixed(2)} руб.
                        </p>
                    </div>
                )}
                <table className="min-w-full divide-y divide-gray-200" style={{ tableLayout: 'fixed' }}>
                    <thead className="bg-gray-50">
                    <tr>
                        {displayColumns.map(column => (
                            <th key={column} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[120px]" style={{ resize: 'horizontal', overflow: 'auto' }}>
                                {getColumnLabel(column)}
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {report.length > 0 ? (
                        report.map((item) => (
                            <tr key={item.id}>
                                {displayColumns.map(column => (
                                    <td key={column} className="px-6 py-4 whitespace-nowrap">
                                        {getCellContent(item, column)}
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={displayColumns.length} className="px-6 py-8 text-center text-gray-500">
                                Выберите параметры и нажмите "Сформировать" для получения отчета
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            {/* Сводка по исполнителям */}
            {report.length > 0 && (
                <div className="bg-white rounded-lg shadow overflow-x-auto mt-6">
                    <div className="px-6 py-4 bg-gray-50 border-b">
                        <h3 className="text-lg font-medium text-gray-900">
                            Сводка по исполнителям
                        </h3>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200" style={{ tableLayout: 'fixed' }}>
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[120px]" style={{ resize: 'horizontal', overflow: 'auto' }}>Исполнитель</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[120px]" style={{ resize: 'horizontal', overflow: 'auto' }}>Количество спецификаций</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[120px]" style={{ resize: 'horizontal', overflow: 'auto' }}>Общая сумма</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {executorSummary.map((executor, index) => (
                            <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium">
                                    {executor.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {executor.count}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap font-medium">
                                    {executor.total.toFixed(2)} руб.
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

        </div>
    );
};

export default Salary;