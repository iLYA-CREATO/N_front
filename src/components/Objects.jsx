import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClientObjects, createClientObject, getClients, getUsers } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext';
import { ChevronDown, X } from 'lucide-react';

const Objects = () => {
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const { user: currentUser } = useAuth();
    const [objects, setObjects] = useState([]);
    const [clients, setClients] = useState([]);
    const [users, setUsers] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        clientId: '',
        brandModel: '',
        stateNumber: '',
        responsibleId: '',
    });

    // Filter states
    const [filters, setFilters] = useState({
        client: [],
        brandModel: [],
        responsible: [],
    });
    const [filterDropdowns, setFilterDropdowns] = useState({
        client: false,
        brandModel: false,
        responsible: false,
    });
    const [visibleFilters, setVisibleFilters] = useState(() => {
        const saved = localStorage.getItem('objectsVisibleFilters');
        return saved ? JSON.parse(saved) : { client: false, brandModel: false, responsible: false };
    });
    const [showFilterModal, setShowFilterModal] = useState(false);

    useEffect(() => {
        fetchObjects();
        fetchClients();
        fetchUsers();
        setShowForm(false);
    }, []);

    // Save visible filters to localStorage
    useEffect(() => {
        localStorage.setItem('objectsVisibleFilters', JSON.stringify(visibleFilters));
    }, [visibleFilters]);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            const filterDropdown = event.target.closest('.filter-dropdown');
            if (!filterDropdown) {
                setFilterDropdowns(prev => {
                    const newState = {};
                    Object.keys(prev).forEach(key => {
                        newState[key] = false;
                    });
                    return newState;
                });
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchObjects = async () => {
        try {
            const response = await getClientObjects();
            setObjects(response.data);
        } catch (error) {
            console.error('Error fetching objects:', error);
        }
    };

    const fetchClients = async () => {
        try {
            const response = await getClients();
            setClients(response.data);
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await getUsers();
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await createClientObject(formData);
            navigate(`/dashboard/client-objects/${response.data.id}`);
        } catch (error) {
            console.error('Error saving object:', error);
        }
    };

    const handleView = (obj) => {
        navigate(`/dashboard/client-objects/${obj.id}`);
    };

    const resetForm = () => {
        // Pre-fill with current user
        const defaultResponsibleId = currentUser ? currentUser.id.toString() : '';
        setFormData({
            clientId: '',
            brandModel: '',
            stateNumber: '',
            responsibleId: defaultResponsibleId,
        });
        setShowForm(false);
    };

    // Toggle filter selection
    const toggleFilterSelection = (filterName, value) => {
        setFilters(prev => {
            const current = prev[filterName];
            if (current.includes(value)) {
                return { ...prev, [filterName]: current.filter(item => item !== value) };
            } else {
                return { ...prev, [filterName]: [...current, value] };
            }
        });
    };

    // Clear filter
    const clearFilter = (filterName) => {
        setFilters(prev => ({ ...prev, [filterName]: [] }));
    };

    // Get unique values for filters
    const uniqueClients = [...new Set(objects.map(obj => obj.client.name))].sort();
    const uniqueBrandModels = [...new Set(objects.map(obj => obj.brandModel))].sort();
    // Filter by object's responsible, not client's responsible
    const uniqueResponsibles = [...new Set(objects
        .map(obj => obj.responsible?.fullName)
        .filter(Boolean)
    )].sort();

    // Apply filters to objects
    const filteredObjects = objects.filter(obj => {
        // Search filter
        const searchMatch = 
            obj.id.toString().includes(searchTerm) ||
            obj.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            obj.brandModel.toLowerCase().includes(searchTerm.toLowerCase());

        // Client filter
        const clientMatch = filters.client.length === 0 || filters.client.includes(obj.client.name);

        // Brand/Model filter
        const brandModelMatch = filters.brandModel.length === 0 || filters.brandModel.includes(obj.brandModel);

        // Responsible filter - use object's responsible
        const responsibleMatch = filters.responsible.length === 0 || 
            (obj.responsible && filters.responsible.includes(obj.responsible.fullName));

        return searchMatch && clientMatch && brandModelMatch && responsibleMatch;
    });

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Объекты</h1>

            {showForm && (
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h3 className="text-xl font-bold mb-4">Добавить новый объект</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Клиент</label>
                            <select
                                value={formData.clientId}
                                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Выберите клиента</option>
                                {clients.map((client) => (
                                    <option key={client.id} value={client.id}>
                                        {client.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Марка/Модель</label>
                            <input
                                type="text"
                                value={formData.brandModel}
                                onChange={(e) => setFormData({ ...formData, brandModel: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Гос. Номер</label>
                            <input
                                type="text"
                                value={formData.stateNumber}
                                onChange={(e) => setFormData({ ...formData, stateNumber: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ответственный</label>
                            <select
                                value={formData.responsibleId}
                                onChange={(e) => setFormData({ ...formData, responsibleId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Не выбран</option>
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.fullName || user.username}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                По умолчанию установлен текущий пользователь
                            </p>
                        </div>
                        <div className="flex gap-2 pt-4">
                            <button
                                type="submit"
                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition"
                            >
                                Создать
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
                            >
                                Отмена
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {!showForm && (
                <div>
                    {/* Карточка с элементами управления */}
                    <div className="bg-gray-200 rounded-lg p-4 mb-6">
                        {/* Кнопка создания нового объекта и фильтров */}
                        <div className="flex justify-end gap-2 mb-4">
                            <button
                                onClick={() => setShowFilterModal(true)}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                            >
                                Фильтры
                            </button>
                            {hasPermission('client_object_create') && (
                                <button
                                    onClick={() => {
                                        // Pre-fill with current user when opening form
                                        const defaultResponsibleId = currentUser ? currentUser.id.toString() : '';
                                        setFormData(prev => ({ ...prev, responsibleId: defaultResponsibleId }));
                                        setShowForm(!showForm);
                                    }}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                                >
                                    {showForm ? 'Отмена' : '+ Добавить объект'}
                                </button>
                            )}
                        </div>

                        {/* Поле поиска */}
                        <input
                            type="text"
                            placeholder="Поиск по номеру объекта, клиенту или марке..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                        />

                        {/* Фильтры */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {visibleFilters.client && (
                                <div className="relative filter-dropdown">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Клиент{filters.client.length > 0 && ` (${filters.client.length})`}
                                    </label>
                                    <button
                                        onClick={() => setFilterDropdowns(prev => ({ ...prev, client: !prev.client }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-left flex justify-between items-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <span className="truncate">
                                            {filters.client.length === 0 ? 'Все' : `${filters.client.length} выбрано`}
                                        </span>
                                        <ChevronDown size={16} className={`transition-transform ${filterDropdowns.client ? 'rotate-180' : ''}`} />
                                    </button>
                                    {filterDropdowns.client && (
                                        <div className="absolute z-10 mt-1 w-full border border-gray-300 rounded-lg bg-white shadow-lg max-h-48 overflow-y-auto">
                                            <div className="p-2 border-b bg-gray-50 sticky top-0">
                                                <label className="flex items-center text-sm cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={filters.client.length === 0}
                                                        onChange={() => clearFilter('client')}
                                                        className="mr-2"
                                                    />
                                                    <span className="font-medium">Все</span>
                                                </label>
                                            </div>
                                            {uniqueClients.map(client => (
                                                <label key={client} className="flex items-center p-2 hover:bg-gray-50 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={filters.client.includes(client)}
                                                        onChange={() => toggleFilterSelection('client', client)}
                                                        className="mr-2"
                                                    />
                                                    <span className="text-sm truncate">{client}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {visibleFilters.brandModel && (
                                <div className="relative filter-dropdown">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Марка/Модель{filters.brandModel.length > 0 && ` (${filters.brandModel.length})`}
                                    </label>
                                    <button
                                        onClick={() => setFilterDropdowns(prev => ({ ...prev, brandModel: !prev.brandModel }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-left flex justify-between items-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <span className="truncate">
                                            {filters.brandModel.length === 0 ? 'Все' : `${filters.brandModel.length} выбрано`}
                                        </span>
                                        <ChevronDown size={16} className={`transition-transform ${filterDropdowns.brandModel ? 'rotate-180' : ''}`} />
                                    </button>
                                    {filterDropdowns.brandModel && (
                                        <div className="absolute z-10 mt-1 w-full border border-gray-300 rounded-lg bg-white shadow-lg max-h-48 overflow-y-auto">
                                            <div className="p-2 border-b bg-gray-50 sticky top-0">
                                                <label className="flex items-center text-sm cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={filters.brandModel.length === 0}
                                                        onChange={() => clearFilter('brandModel')}
                                                        className="mr-2"
                                                    />
                                                    <span className="font-medium">Все</span>
                                                </label>
                                            </div>
                                            {uniqueBrandModels.map(brandModel => (
                                                <label key={brandModel} className="flex items-center p-2 hover:bg-gray-50 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={filters.brandModel.includes(brandModel)}
                                                        onChange={() => toggleFilterSelection('brandModel', brandModel)}
                                                        className="mr-2"
                                                    />
                                                    <span className="text-sm truncate">{brandModel}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {visibleFilters.responsible && (
                                <div className="relative filter-dropdown">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ответственный{filters.responsible.length > 0 && ` (${filters.responsible.length})`}
                                    </label>
                                    <button
                                        onClick={() => setFilterDropdowns(prev => ({ ...prev, responsible: !prev.responsible }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-left flex justify-between items-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <span className="truncate">
                                            {filters.responsible.length === 0 ? 'Все' : `${filters.responsible.length} выбрано`}
                                        </span>
                                        <ChevronDown size={16} className={`transition-transform ${filterDropdowns.responsible ? 'rotate-180' : ''}`} />
                                    </button>
                                    {filterDropdowns.responsible && (
                                        <div className="absolute z-10 mt-1 w-full border border-gray-300 rounded-lg bg-white shadow-lg max-h-48 overflow-y-auto">
                                            <div className="p-2 border-b bg-gray-50 sticky top-0">
                                                <label className="flex items-center text-sm cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={filters.responsible.length === 0}
                                                        onChange={() => clearFilter('responsible')}
                                                        className="mr-2"
                                                    />
                                                    <span className="font-medium">Все</span>
                                                </label>
                                            </div>
                                            {uniqueResponsibles.map(responsible => (
                                                <label key={responsible} className="flex items-center p-2 hover:bg-gray-50 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={filters.responsible.includes(responsible)}
                                                        onChange={() => toggleFilterSelection('responsible', responsible)}
                                                        className="mr-2"
                                                    />
                                                    <span className="text-sm truncate">{responsible}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow overflow-x-auto table-container flex-1 min-h-0">
                        <table className="divide-y divide-gray-200" style={{ minWidth: '480px' }}>
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[120px]" style={{ resize: 'horizontal', overflow: 'auto' }}>Клиент</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[120px]" style={{ resize: 'horizontal', overflow: 'auto' }}>Марка/Модель</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[120px]" style={{ resize: 'horizontal', overflow: 'auto' }}>Гос. Номер</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[120px]" style={{ resize: 'horizontal', overflow: 'auto' }}>Ответственный</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredObjects.map((obj) => (
                                    <tr key={obj.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleView(obj)}>
                                        <td className="px-6 py-4 whitespace-nowrap">{obj.client.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{obj.brandModel}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{obj.stateNumber}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {obj.responsible ? obj.responsible.fullName : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Filter Modal */}
            {showFilterModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Настройки фильтров</h3>
                            <button
                                onClick={() => setShowFilterModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="space-y-2">
                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition">
                                <input
                                    type="checkbox"
                                    checked={visibleFilters.client}
                                    onChange={() => setVisibleFilters({ ...visibleFilters, client: !visibleFilters.client })}
                                    className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500"
                                />
                                <span className="text-gray-700">Фильтр по клиенту</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition">
                                <input
                                    type="checkbox"
                                    checked={visibleFilters.brandModel}
                                    onChange={() => setVisibleFilters({ ...visibleFilters, brandModel: !visibleFilters.brandModel })}
                                    className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500"
                                />
                                <span className="text-gray-700">Фильтр по марке/модели</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition">
                                <input
                                    type="checkbox"
                                    checked={visibleFilters.responsible}
                                    onChange={() => setVisibleFilters({ ...visibleFilters, responsible: !visibleFilters.responsible })}
                                    className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500"
                                />
                                <span className="text-gray-700">Фильтр по ответственному</span>
                            </label>
                        </div>
                        <div className="flex gap-2 pt-4">
                            <button
                                onClick={() => setShowFilterModal(false)}
                                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
                            >
                                Закрыть
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Objects;
