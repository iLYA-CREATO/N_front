/**
 * Contracts Component
 * 
 * This component displays a list of contracts (договоры).
 * Contracts are derived from bids that have a contract number assigned.
 * Features: column visibility, ordering, sorting, and filtering.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getContracts, getUsers, getClientObjects } from '../services/api';
import { ChevronUp, ChevronDown, Settings, X } from 'lucide-react';
import ContractDetailModal from './ContractDetailModal';

const Contracts = () => {
    const navigate = useNavigate();
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedContract, setSelectedContract] = useState(null);
    const [showContractModal, setShowContractModal] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    });
    const [searchTerm, setSearchTerm] = useState('');
    
    // Filters state
    const [filters, setFilters] = useState({
        client: '',
        responsible: '',
        clientObject: '',
        equipment: '',
    });
    
    // Sorting state
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: 'asc',
    });
    
    // Column visibility settings
    const allColumns = ['id', 'bidNumber', 'clientName', 'responsibleName', 'clientObject', 'equipmentName', 'imei', 'quantity', 'contractEndDate', 'remainingDays'];
    const defaultVisibleColumns = {
        id: true,
        bidNumber: true,
        clientName: true,
        responsibleName: true,
        clientObject: true,
        equipmentName: true,
        imei: true,
        quantity: true,
        contractEndDate: true,
        remainingDays: true,
    };
    
    const savedColumns = localStorage.getItem('contractsVisibleColumns');
    const initialVisibleColumns = savedColumns ? { ...defaultVisibleColumns, ...JSON.parse(savedColumns) } : defaultVisibleColumns;
    
    const savedOrder = localStorage.getItem('contractsColumnOrder');
    let initialColumnOrder = savedOrder ? JSON.parse(savedOrder).filter(col => allColumns.includes(col)) : allColumns;
    
    // Ensure all columns are in order
    allColumns.forEach(col => {
        if (!initialColumnOrder.includes(col)) {
            initialColumnOrder.push(col);
        }
    });
    
    const [columnOrder, setColumnOrder] = useState(initialColumnOrder);
    const [visibleColumns, setVisibleColumns] = useState(initialVisibleColumns);
    const [showColumnSettings, setShowColumnSettings] = useState(false);
    
    // Additional filter options
    const [users, setUsers] = useState([]);
    const [clientObjects, setClientObjects] = useState([]);
    
    // Visible filters state (saved to localStorage)
    const [visibleFilters, setVisibleFilters] = useState(() => {
        const saved = localStorage.getItem('contractsVisibleFilters');
        return saved ? JSON.parse(saved) : { client: true, responsible: true, clientObject: true, equipment: true };
    });
    const [showFilterModal, setShowFilterModal] = useState(false);

    useEffect(() => {
        fetchContracts();
        fetchFilters();
    }, [pagination.page, pagination.limit, filters, sortConfig]);

    useEffect(() => {
        localStorage.setItem('contractsVisibleColumns', JSON.stringify(visibleColumns));
    }, [visibleColumns]);

    useEffect(() => {
        localStorage.setItem('contractsColumnOrder', JSON.stringify(columnOrder));
    }, [columnOrder]);

    useEffect(() => {
        localStorage.setItem('contractsVisibleFilters', JSON.stringify(visibleFilters));
    }, [visibleFilters]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showColumnSettings && !event.target.closest('.column-settings')) {
                setShowColumnSettings(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showColumnSettings]);

    const fetchFilters = async () => {
        try {
            const usersResponse = await getUsers();
            setUsers(usersResponse.data);
            
            const objectsResponse = await getClientObjects();
            setClientObjects(objectsResponse.data);
        } catch (error) {
            console.error('Error fetching filters:', error);
        }
    };

    const fetchContracts = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                search: searchTerm,
                ...filters,
            };
            
            // Add sorting
            if (sortConfig.key) {
                params.sortBy = sortConfig.key;
                params.sortOrder = sortConfig.direction;
            }
            
            const response = await getContracts(params);
            setContracts(response.data.data);
            setPagination(prev => ({
                ...prev,
                total: response.data.pagination.total,
                totalPages: response.data.pagination.totalPages,
            }));
        } catch (error) {
            console.error('Error fetching contracts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchContracts();
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleColumnToggle = (column) => {
        setVisibleColumns(prev => ({
            ...prev,
            [column]: !prev[column]
        }));
    };

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

    const getSortIcon = (column) => {
        if (sortConfig.key !== column) {
            return <div className="w-4 h-4 flex items-center justify-center opacity-30"><ChevronUp size={14} /><ChevronDown size={14} /></div>;
        }
        return sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
    };

    const getColumnLabel = (column) => {
        switch (column) {
            case 'id': return '№';
            case 'bidNumber': return '№ Заявки';
            case 'clientName': return 'Клиент';
            case 'responsibleName': return 'Ответственный';
            case 'clientObject': return 'Объект';
            case 'equipmentName': return 'Оборудование';
            case 'imei': return 'Imei';
            case 'quantity': return 'Количество';
            case 'contractEndDate': return 'Срок договора';
            case 'remainingDays': return 'Остаток времени (дней)';
            default: return column;
        }
    };

    const getCellContent = (contract, column) => {
        switch (column) {
            case 'id':
                return <span className="font-medium">№ {contract.id}</span>;
            case 'bidNumber':
                return (
                    <span 
                        className="font-medium text-blue-600 hover:underline"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/dashboard/bids/${contract.id}`);
                        }}
                    >
                        № {contract.id}
                    </span>
                );
            case 'clientName':
                return contract.clientName || '-';
            case 'responsibleName':
                return contract.responsibleName || '-';
            case 'clientObject':
                return contract.clientObject ? 
                    `${contract.clientObject.brandModel} ${contract.clientObject.stateNumber ? `(${contract.clientObject.stateNumber})` : ''}` : '-';
            case 'equipmentName':
                return contract.equipmentName || '-';
            case 'imei':
                return contract.imei || '-';
            case 'quantity':
                return contract.quantity || '-';
            case 'contractEndDate':
                return contract.contractEndDate ? new Date(contract.contractEndDate).toLocaleDateString() : '-';
            case 'remainingDays':
                if (contract.contractEndDate) {
                    const now = new Date();
                    const end = new Date(contract.contractEndDate);
                    const diffMs = end - now;
                    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                    if (diffDays < 0) {
                        return <span className="text-red-500 font-medium">Истёк ({Math.abs(diffDays)} дн.)</span>;
                    } else if (diffDays <= 7) {
                        return <span className="text-orange-500 font-medium">{diffDays} дн.</span>;
                    } else {
                        return <span className="text-green-500">{diffDays} дн.</span>;
                    }
                }
                return '-';
            default:
                return '';
        }
    };

    const visibleColumnsList = columnOrder.filter(col => visibleColumns[col]);

    return (
        <div className="contracts-page">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Договоры</h1>
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
                                        {filterKey === 'client' ? 'Клиент' : 
                                         filterKey === 'responsible' ? 'Ответственный' : 
                                         filterKey === 'clientObject' ? 'Объект' : 
                                         filterKey === 'equipment' ? 'Оборудование' : filterKey}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Filter Form */}
            <form onSubmit={handleSearch} className="bg-gray-200 rounded-lg p-4 mb-6 border border-gray-300 flex-none">
                <div className="flex flex-col gap-4">
                    {/* Buttons at top right */}
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
                    
                    {/* Search and filters row */}
                    <div className="flex flex-wrap gap-4 items-center">
                        {/* Search */}
                        <div className="flex-1 min-w-64">
                            <input
                                type="text"
                                placeholder="Поиск..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    
                    {/* Filters */}
                    {visibleFilters.client && (
                        <div className="w-48">
                            <select
                                value={filters.client}
                                onChange={(e) => setFilters(prev => ({ ...prev, client: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Все клиенты</option>
                                {/* Clients are fetched as part of contracts data */}
                            </select>
                        </div>
                    )}
                    
                    {visibleFilters.responsible && (
                        <div className="w-48">
                            <select
                                value={filters.responsible}
                                onChange={(e) => setFilters(prev => ({ ...prev, responsible: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Все ответственные</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>{user.fullName}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    
                    {visibleFilters.clientObject && (
                        <div className="w-48">
                            <select
                                value={filters.clientObject}
                                onChange={(e) => setFilters(prev => ({ ...prev, clientObject: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Все объекты</option>
                                {clientObjects.map(obj => (
                                    <option key={obj.id} value={obj.id}>
                                        {obj.brandModel} {obj.stateNumber}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    
                    {visibleFilters.equipment && (
                        <div className="w-48">
                            <input
                                type="text"
                                placeholder="Оборудование..."
                                value={filters.equipment}
                                onChange={(e) => setFilters(prev => ({ ...prev, equipment: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            setFilters({ client: '', responsible: '', clientObject: '', equipment: '' });
                            setSearchTerm('');
                            setPagination(prev => ({ ...prev, page: 1 }));
                            fetchContracts();
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                        Сброс
                    </button>
                    </div>
                    </div>
                </form>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto table-container flex-1 min-h-0">
                    <table className="divide-y divide-gray-200" style={{ minWidth: `${visibleColumnsList.length * 120}px` }}>
                        <thead className="bg-gray-50">
                            <tr>
                                {visibleColumnsList.map(column => (
                                    <th
                                        key={column}
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 resize-x overflow-auto cursor-pointer hover:bg-gray-100 transition"
                                        style={{ minWidth: '1px' }}
                                        onClick={() => handleSort(column)}
                                    >
                                        <div className="flex items-center gap-1">
                                            {getColumnLabel(column)}
                                            {getSortIcon(column)}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={visibleColumnsList.length} className="px-4 py-8 text-center text-gray-500">
                                        Загрузка...
                                    </td>
                                </tr>
                            ) : contracts.length === 0 ? (
                                <tr>
                                    <td colSpan={visibleColumnsList.length} className="px-4 py-8 text-center text-gray-500">
                                        Договоры не найдены
                                    </td>
                                </tr>
                            ) : (
                                contracts.map(contract => (
                                    <tr
                                        key={contract.id}
                                        className="hover:bg-gray-50 cursor-pointer transition"
                                        onClick={() => {
                                            setSelectedContract(contract);
                                            setShowContractModal(true);
                                        }}
                                    >
                                        {visibleColumnsList.map(column => (
                                            <td key={column} className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                                                {getCellContent(contract, column)}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && contracts.length > 0 && (
                    <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Показано {contracts.length} из {pagination.total} записей
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                disabled={pagination.page === 1}
                                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Назад
                            </button>
                            <span className="px-3 py-1">
                                Страница {pagination.page} из {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                disabled={pagination.page === pagination.totalPages}
                                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Вперёд
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Contract Detail Modal */}
            {showContractModal && (
                <ContractDetailModal
                    contract={selectedContract}
                    onClose={() => {
                        setShowContractModal(false);
                        setSelectedContract(null);
                    }}
                />
            )}
        </div>
    );
};

export default Contracts;
