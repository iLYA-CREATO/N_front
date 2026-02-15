/**
 * Bids Component - Full Version
 * 
 * Компонент для отображения списка заявок с фильтрами, поиском и пагинацией.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBids, getBidTypes, getClients, getUsers, createBid, deleteBid } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { Search, Plus, X, ChevronLeft, ChevronRight, Settings, Trash2, Eye, ChevronUp, ChevronDown } from 'lucide-react';

const Bids = () => {
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();

    // Состояние для списка заявок
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Состояние для пагинации
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const limit = 20;

    // Состояние для фильтров
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [clientFilter, setClientFilter] = useState('');
    const [responsibleFilter, setResponsibleFilter] = useState('');
    const [dateFromFilter, setDateFromFilter] = useState('');
    const [dateToFilter, setDateToFilter] = useState('');

    // Состояние для справочников
    const [bidTypes, setBidTypes] = useState([]);
    const [clients, setClients] = useState([]);
    const [users, setUsers] = useState([]);

    // Состояние для видимых фильтров (сохраняется в localStorage)
    const [visibleFilters, setVisibleFilters] = useState(() => {
        const saved = localStorage.getItem('bidsVisibleFilters');
        return saved ? JSON.parse(saved) : { status: true, type: true, client: true, responsible: true, date: true };
    });
    const [showFilterModal, setShowFilterModal] = useState(false);

    // Состояние для модального окна создания заявки
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newBidData, setNewBidData] = useState({
        clientId: '',
        bidTypeId: '',
        tema: '',
        description: '',
        contactFullName: '',
        contactPhone: '',
        workAddress: ''
    });

    // Состояние для настроек колонок
    const allColumns = ['id', 'title', 'client', 'type', 'status', 'responsible', 'createdAt', 'plannedDate', 'amount'];
    const defaultVisibleColumns = {
        id: true,
        title: true,
        client: true,
        type: true,
        status: true,
        responsible: true,
        createdAt: true,
        plannedDate: false,
        amount: false
    };

    const savedColumns = localStorage.getItem('bidsVisibleColumns');
    const initialVisibleColumns = savedColumns ? { ...defaultVisibleColumns, ...JSON.parse(savedColumns) } : defaultVisibleColumns;
    
    const savedOrder = localStorage.getItem('bidsColumnOrder');
    let initialColumnOrder = savedOrder ? JSON.parse(savedOrder).filter(col => allColumns.includes(col)) : allColumns;
    
    allColumns.forEach(col => {
        if (!initialColumnOrder.includes(col)) {
            initialColumnOrder.push(col);
        }
    });

    const [columnOrder, setColumnOrder] = useState(initialColumnOrder);
    const [visibleColumns, setVisibleColumns] = useState(initialVisibleColumns);
    const [showColumnSettings, setShowColumnSettings] = useState(false);

    // Состояние для сортировки
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: 'asc',
    });

    // Сохранение настроек в localStorage
    useEffect(() => {
        localStorage.setItem('bidsVisibleColumns', JSON.stringify(visibleColumns));
    }, [visibleColumns]);

    useEffect(() => {
        localStorage.setItem('bidsColumnOrder', JSON.stringify(columnOrder));
    }, [columnOrder]);

    useEffect(() => {
        localStorage.setItem('bidsVisibleFilters', JSON.stringify(visibleFilters));
    }, [visibleFilters]);

    // Закрытие выпадающих списков при клике вне
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showColumnSettings && !event.target.closest('.column-settings')) {
                setShowColumnSettings(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showColumnSettings]);

    // Загрузка справочников
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [typesRes, clientsRes, usersRes] = await Promise.all([
                    getBidTypes(),
                    getClients(),
                    getUsers()
                ]);
                setBidTypes(typesRes.data || []);
                setClients(clientsRes.data || []);
                setUsers(usersRes.data || []);
            } catch (err) {
                console.error('Error fetching reference data:', err);
            }
        };
        fetchData();
    }, []);

    // Загрузка заявок
    const fetchBids = async () => {
        setLoading(true);
        setError('');
        try {
            const params = {
                page,
                limit,
                sortBy: sortConfig.key || 'createdAt',
                sortOrder: sortConfig.direction || 'desc'
            };

            if (searchQuery) params.search = searchQuery;
            if (statusFilter) params.status = statusFilter;
            if (typeFilter) params.bidTypeId = typeFilter;
            if (clientFilter) params.clientId = clientFilter;
            if (responsibleFilter) params.responsibleId = responsibleFilter;
            if (dateFromFilter) params.dateFrom = dateFromFilter;
            if (dateToFilter) params.dateTo = dateToFilter;

            const response = await getBids(params);
            setBids(response.data.data || []);
            setTotalPages(response.data.pagination?.totalPages || 1);
            setTotalCount(response.data.pagination?.total || 0);
        } catch (err) {
            console.error('Error fetching bids:', err);
            setError('Ошибка при загрузке заявок');
        } finally {
            setLoading(false);
        }
    };

    // Загрузка заявок при изменении фильтров
    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchBids();
        }, 300);
        return () => clearTimeout(timeout);
    }, [page, searchQuery, statusFilter, typeFilter, clientFilter, responsibleFilter, dateFromFilter, dateToFilter, sortConfig]);

    // Очистка фильтров
    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('');
        setTypeFilter('');
        setClientFilter('');
        setResponsibleFilter('');
        setDateFromFilter('');
        setDateToFilter('');
        setPage(1);
    };

    // Обработчик поиска
    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchBids();
    };

    // Обработчик сортировки
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Получение иконки сортировки
    const getSortIcon = (column) => {
        if (sortConfig.key !== column) {
            return <div className="w-4 h-4 flex items-center justify-center opacity-30"><ChevronUp size={14} /><ChevronDown size={14} /></div>;
        }
        return sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
    };

    // Перемещение колонки вверх
    const moveUp = (index) => {
        if (index > 0) {
            const newOrder = [...columnOrder];
            [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
            setColumnOrder(newOrder);
        }
    };

    // Перемещение колонки вниз
    const moveDown = (index) => {
        if (index < columnOrder.length - 1) {
            const newOrder = [...columnOrder];
            [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
            setColumnOrder(newOrder);
        }
    };

    // Переключение видимости колонки
    const handleColumnToggle = (column) => {
        setVisibleColumns(prev => ({
            ...prev,
            [column]: !prev[column]
        }));
    };

    // Получение метки колонки
    const getColumnLabel = (column) => {
        switch (column) {
            case 'id': return 'ID';
            case 'title': return 'Название';
            case 'client': return 'Клиент';
            case 'type': return 'Тип';
            case 'status': return 'Статус';
            case 'responsible': return 'Ответственный';
            case 'createdAt': return 'Дата создания';
            case 'plannedDate': return 'План. дата';
            case 'amount': return 'Сумма';
            default: return column;
        }
    };

    // Создание заявки
    const handleCreateBid = async (e) => {
        e.preventDefault();
        try {
            await createBid(newBidData);
            setShowCreateModal(false);
            setNewBidData({
                clientId: '',
                bidTypeId: '',
                tema: '',
                description: '',
                contactFullName: '',
                contactPhone: '',
                workAddress: ''
            });
            fetchBids();
        } catch (err) {
            console.error('Error creating bid:', err);
            setError('Ошибка при создании заявки');
        }
    };

    // Удаление заявки
    const handleDeleteBid = async (id) => {
        if (!window.confirm('Вы уверены, что хотите удалить эту заявку?')) return;
        
        try {
            await deleteBid(id);
            fetchBids();
        } catch (err) {
            console.error('Error deleting bid:', err);
            setError('Ошибка при удалении заявки');
        }
    };

    // Получение уникальных статусов из типов заявок
    const getAllStatuses = () => {
        const statuses = new Set();
        bidTypes.forEach(type => {
            if (type.statuses && Array.isArray(type.statuses)) {
                type.statuses.forEach(status => {
                    statuses.add(status.name);
                });
            }
        });
        return Array.from(statuses);
    };

    // Форматирование даты
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Форматирование даты и времени
    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Получение цвета статуса
    const getStatusColor = (status) => {
        const colors = {
            'Новая': 'bg-blue-100 text-blue-800',
            'В работе': 'bg-yellow-100 text-yellow-800',
            'Выполнена': 'bg-green-100 text-green-800',
            'Отменена': 'bg-red-100 text-red-800',
            'На согласовании': 'bg-purple-100 text-purple-800',
            'Ожидание': 'bg-orange-100 text-orange-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const visibleColumnsList = columnOrder.filter(col => visibleColumns[col]);

    return (
        <div className="space-y-4">
            {/* Заголовок */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-800">Заявки</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        <Plus size={20} />
                        <span>Создать заявку</span>
                    </button>
                </div>
            </div>

            {/* Filter Modal */}
            {showFilterModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium">Видимость фильтров</h3>
                            <button onClick={() => setShowFilterModal(false)}><X size={20} /></button>
                        </div>
                        <div className="space-y-3">
                            {Object.keys(visibleFilters).map(filterKey => (
                                <label key={filterKey} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={visibleFilters[filterKey]}
                                        onChange={() => setVisibleFilters(prev => ({
                                            ...prev,
                                            [filterKey]: !prev[filterKey]
                                        }))}
                                        className="rounded"
                                    />
                                    <span className="capitalize">
                                        {filterKey === 'status' ? 'Статус' : 
                                         filterKey === 'type' ? 'Тип' : 
                                         filterKey === 'client' ? 'Клиент' : 
                                         filterKey === 'responsible' ? 'Ответственный' : 
                                         filterKey === 'date' ? 'Дата' : filterKey}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Поиск и фильтры - серый фон как в Objects */}
            <form onSubmit={handleSearch} className="bg-gray-200 rounded-lg p-4 mb-6 border border-gray-300 flex-none">
                <div className="flex flex-col gap-4">
                    {/* Кнопки настроек */}
                    <div className="flex justify-end gap-2">
                        {/* Column Settings Button */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowColumnSettings(!showColumnSettings)}
                                className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
                            >
                                Колонки
                            </button>
                            {showColumnSettings && (
                                <div className="column-settings absolute right-0 top-full mt-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                                    <div className="p-3 border-b border-gray-200 flex justify-between items-center">
                                        <h3 className="font-medium">Настройка колонок</h3>
                                        <button type="button" onClick={() => setShowColumnSettings(false)}><X size={16} /></button>
                                    </div>
                                    <div className="p-2">
                                        {columnOrder.map((column, index) => (
                                            <div key={column} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                                                <label className="flex items-center gap-2 flex-1 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={visibleColumns[column]}
                                                        onChange={() => handleColumnToggle(column)}
                                                        className="rounded"
                                                    />
                                                    <span className="text-sm">{getColumnLabel(column)}</span>
                                                </label>
                                                <div className="flex flex-col">
                                                    <button
                                                        type="button"
                                                        onClick={() => moveUp(index)}
                                                        disabled={index === 0}
                                                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                                    >
                                                        <ChevronUp size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => moveDown(index)}
                                                        disabled={index === columnOrder.length - 1}
                                                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                                    >
                                                        <ChevronDown size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Filter Settings Button */}
                        <button
                            type="button"
                            onClick={() => setShowFilterModal(true)}
                            className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
                        >
                            Фильтры
                        </button>
                    </div>
                    
                    {/* Поиск и фильтры */}
                    <div className="flex flex-wrap gap-4 items-center">
                        {/* Поиск */}
                        <div className="flex-1 min-w-64">
                            <input
                                type="text"
                                placeholder="Поиск по названию или описанию..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    
                        {/* Фильтры */}
                        {visibleFilters.status && (
                            <div className="w-48">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Все статусы</option>
                                    {getAllStatuses().map(status => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        
                        {visibleFilters.type && (
                            <div className="w-48">
                                <select
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Все типы</option>
                                    {bidTypes.map(type => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        
                        {visibleFilters.client && (
                            <div className="w-48">
                                <select
                                    value={clientFilter}
                                    onChange={(e) => setClientFilter(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Все клиенты</option>
                                    {clients.map(client => (
                                        <option key={client.id} value={client.id}>{client.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        
                        {visibleFilters.responsible && (
                            <div className="w-48">
                                <select
                                    value={responsibleFilter}
                                    onChange={(e) => setResponsibleFilter(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Все ответственные</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>{user.fullName || user.username}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        
                        {visibleFilters.date && (
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    value={dateFromFilter}
                                    onChange={(e) => setDateFromFilter(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="От"
                                />
                                <input
                                    type="date"
                                    value={dateToFilter}
                                    onChange={(e) => setDateToFilter(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="До"
                                />
                            </div>
                        )}
                        
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                        >
                            Применить
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => {
                                clearFilters();
                                fetchBids();
                            }}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                        >
                            Сброс
                        </button>
                    </div>
                </div>
            </form>

            {/* Таблица заявок */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Загрузка...</div>
                ) : error ? (
                    <div className="p-8 text-center text-red-500">{error}</div>
                ) : bids.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">Заявок не найдено</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    {visibleColumnsList.map(column => (
                                        <th 
                                            key={column} 
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort(column)}
                                        >
                                            <div className="flex items-center gap-1">
                                                {getColumnLabel(column)}
                                                {getSortIcon(column)}
                                            </div>
                                        </th>
                                    ))}
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Действия</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {bids.map(bid => (
                                    <tr 
                                        key={bid.id} 
                                        className="hover:bg-gray-50 cursor-pointer"
                                        onClick={() => navigate(`/dashboard/bids/${bid.id}`)}
                                    >
                                        {visibleColumnsList.map(column => (
                                            <td key={column} className="px-6 py-4 whitespace-nowrap">
                                                {column === 'id' && (
                                                    <span className="text-sm font-medium text-gray-900">#{bid.id}</span>
                                                )}
                                                {column === 'title' && (
                                                    <span className="text-sm text-gray-900">{bid.title}</span>
                                                )}
                                                {column === 'client' && (
                                                    <span className="text-sm text-gray-600">{bid.clientName}</span>
                                                )}
                                                {column === 'type' && (
                                                    <span className="text-sm text-gray-600">{bid.bidType?.name || '-'}</span>
                                                )}
                                                {column === 'status' && (
                                                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(bid.status)}`}>
                                                        {bid.status}
                                                    </span>
                                                )}
                                                {column === 'responsible' && (
                                                    <span className="text-sm text-gray-600">
                                                        {bid.bidTypeResponsibleName || bid.currentResponsibleUserName || '-'}
                                                    </span>
                                                )}
                                                {column === 'createdAt' && (
                                                    <span className="text-sm text-gray-600">{formatDateTime(bid.createdAt)}</span>
                                                )}
                                                {column === 'plannedDate' && (
                                                    <span className="text-sm text-gray-600">{formatDate(bid.plannedResolutionDate)}</span>
                                                )}
                                                {column === 'amount' && (
                                                    <span className="text-sm text-gray-600">
                                                        {bid.amount ? `${Number(bid.amount).toLocaleString('ru-RU')} ₽` : '-'}
                                                    </span>
                                                )}
                                            </td>
                                        ))}
                                        <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => navigate(`/dashboard/bids/${bid.id}`)}
                                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                    title="Просмотр"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                {hasPermission('delete_bid') && (
                                                    <button
                                                        onClick={() => handleDeleteBid(bid.id)}
                                                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                        title="Удалить"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Пагинация */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        Показано {((page - 1) * limit) + 1}-{Math.min(page * limit, totalCount)} из {totalCount}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="text-sm">
                            Страница {page} из {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Модальное окно создания заявки */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold">Создание заявки</h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateBid} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Клиент *</label>
                                <select
                                    required
                                    value={newBidData.clientId}
                                    onChange={(e) => setNewBidData(prev => ({ ...prev, clientId: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Выберите клиента</option>
                                    {clients.map(client => (
                                        <option key={client.id} value={client.id}>{client.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Тип заявки *</label>
                                <select
                                    required
                                    value={newBidData.bidTypeId}
                                    onChange={(e) => setNewBidData(prev => ({ ...prev, bidTypeId: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Выберите тип</option>
                                    {bidTypes.map(type => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
                                <input
                                    required
                                    type="text"
                                    value={newBidData.tema}
                                    onChange={(e) => setNewBidData(prev => ({ ...prev, tema: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Тема заявки"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                                <textarea
                                    value={newBidData.description}
                                    onChange={(e) => setNewBidData(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                    placeholder="Описание заявки"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Контактное лицо</label>
                                <input
                                    type="text"
                                    value={newBidData.contactFullName}
                                    onChange={(e) => setNewBidData(prev => ({ ...prev, contactFullName: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="ФИО контакта"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Телефон контакта</label>
                                <input
                                    type="text"
                                    value={newBidData.contactPhone}
                                    onChange={(e) => setNewBidData(prev => ({ ...prev, contactPhone: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Телефон"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Адрес работ</label>
                                <input
                                    type="text"
                                    value={newBidData.workAddress}
                                    onChange={(e) => setNewBidData(prev => ({ ...prev, workAddress: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Адрес"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    Создать
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Bids;
