import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClientObjects, createClientObject, getClients } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';

const Objects = () => {
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const [objects, setObjects] = useState([]);
    const [clients, setClients] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        clientId: '',
        brandModel: '',
        stateNumber: '',
    });

    useEffect(() => {
        fetchObjects();
        fetchClients();
        setShowForm(false);
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
        setFormData({
            clientId: '',
            brandModel: '',
            stateNumber: '',
        });
        setShowForm(false);
    };

    const filteredObjects = objects.filter(obj =>
        obj.id.toString().includes(searchTerm) ||
        obj.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obj.brandModel.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                        {/* Кнопка создания нового объекта */}
                        <div className="flex justify-end mb-4">
                            {hasPermission('client_object_create') && (
                                <button
                                    onClick={() => setShowForm(!showForm)}
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="bg-white rounded-lg shadow overflow-x-auto table-container flex-1 min-h-0">
                        <table className="divide-y divide-gray-200" style={{ minWidth: '480px' }}>
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[120px]" style={{ resize: 'horizontal', overflow: 'auto' }}>Клиент</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[120px]" style={{ resize: 'horizontal', overflow: 'auto' }}>Марка/Модель</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[120px]" style={{ resize: 'horizontal', overflow: 'auto' }}>Гос. Номер</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[120px]" style={{ resize: 'horizontal', overflow: 'auto' }}>Заявки</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredObjects.map((obj) => (
                                    <tr key={obj.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleView(obj)}>
                                        <td className="px-6 py-4 whitespace-nowrap">{obj.client.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{obj.brandModel}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{obj.stateNumber}</td>
                                        <td className="px-6 py-4">
                                            {obj.bids && obj.bids.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {obj.bids.map(bid => (
                                                        <span key={bid.id} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                                            {bid.tema}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-gray-500">Нет заявок</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Objects;