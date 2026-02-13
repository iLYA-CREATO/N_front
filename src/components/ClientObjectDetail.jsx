import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClientObject, updateClientObject, deleteClientObject, getClients } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';

const ClientObjectDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const [clientObject, setClientObject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('Заявки');
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        brandModel: '',
        stateNumber: '',
        equipment: '',
    });
    const [clients, setClients] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showLinkedBidsModal, setShowLinkedBidsModal] = useState(false);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        fetchClientObject();
        fetchClients();
    }, [id]);

    const fetchClientObject = async () => {
        try {
            const response = await getClientObject(id);
            setClientObject(response.data);
            setEditForm({
                brandModel: response.data.brandModel,
                stateNumber: response.data.stateNumber,
                equipment: response.data.equipment || '',
            });
        } catch (error) {
            setError('Объект не найден');
            console.error('Error fetching client object:', error);
        } finally {
            setLoading(false);
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

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSave = async () => {
        try {
            await updateClientObject(id, editForm);
            setClientObject({ ...clientObject, ...editForm });
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating object:', error);
        }
    };

    const handleCancel = () => {
        setEditForm({
            brandModel: clientObject.brandModel,
            stateNumber: clientObject.stateNumber,
            equipment: clientObject.equipment || '',
        });
        setIsEditing(false);
    };

    const handleDelete = () => {
        if (clientObject.bids && clientObject.bids.length > 0) {
            setShowLinkedBidsModal(true);
            return;
        }
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            await deleteClientObject(id);
            navigate('/dashboard/objects');
        } catch (error) {
            console.error('Error deleting object:', error);
            setNotification({ type: 'error', message: 'Ошибка при удалении объекта.' });
            setTimeout(() => setNotification(null), 3000);
        } finally {
            setShowDeleteModal(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-500">Загрузка...</div>
            </div>
        );
    }

    if (error || !clientObject) {
        return (
            <div className="text-center py-8">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={() => navigate('/dashboard/clients')}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                >
                    Вернуться к клиентам
                </button>
            </div>
        );
    }

    return (
        <div>
            {notification && (
                <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                    {notification.message}
                </div>
            )}

            {showLinkedBidsModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                        <h3 className="text-lg font-bold mb-4">Невозможно удалить объект</h3>
                        <p className="mb-4">Этот объект используется в следующих заявках:</p>
                        <ul className="mb-4 space-y-2">
                            {clientObject.bids.map((bid) => (
                                <li key={bid.id} className="flex items-center gap-2">
                                    <span className="font-medium">№ {bid.id}</span>
                                    <span>{bid.tema}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowLinkedBidsModal(false)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                            >
                                Ок
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h3 className="text-lg font-bold mb-4">Подтверждение удаления</h3>
                        <p className="mb-4">Вы уверены, что хотите удалить этот объект?</p>
                        <div className="flex gap-2">
                            <button
                                onClick={confirmDelete}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
                            >
                                Удалить
                            </button>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg transition"
                            >
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Информация об объекте</h2>
                <div className="flex gap-2">
                    {!isEditing ? (
                        <>
                            {hasPermission('client_object_edit') && (
                                <button
                                    onClick={handleEdit}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                                >
                                    Редактировать
                                </button>
                            )}
                            {hasPermission('client_object_delete') && (
                                <button
                                    onClick={handleDelete}
                                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
                                >
                                    Удалить
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleSave}
                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
                            >
                                Сохранить
                            </button>
                            <button
                                onClick={handleCancel}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                            >
                                Отмена
                            </button>
                        </>
                    )}
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                    >
                        Назад
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Марка/Модель</label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={editForm.brandModel}
                                onChange={(e) => setEditForm({ ...editForm, brandModel: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        ) : (
                            <p className="text-gray-900 text-lg">{clientObject.brandModel}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Гос. Номер</label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={editForm.stateNumber}
                                onChange={(e) => setEditForm({ ...editForm, stateNumber: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        ) : (
                            <p className="text-gray-900 text-lg">{clientObject.stateNumber}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Клиент</label>
                        <span
                            className="text-blue-600 text-lg cursor-pointer hover:underline"
                            onClick={() => navigate(`/dashboard/clients/${clientObject.client.id}`)}
                        >
                            {clientObject.client.name}
                        </span>
                    </div>
                    {isEditing && (
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Оборудование</label>
                            <textarea
                                value={editForm.equipment}
                                onChange={(e) => setEditForm({ ...editForm, equipment: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows="3"
                                placeholder="Необязательно"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-6">
                <div className="flex space-x-1 mb-4">
                    {['Заявки', 'Оборудование'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-t-lg font-medium transition ${
                                activeTab === tab
                                    ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    {activeTab === 'Заявки' && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Связанные заявки</h3>
                            {clientObject.bids && clientObject.bids.length > 0 ? (
                                <div className="bg-white rounded-lg shadow overflow-hidden">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">№</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">тема</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Описание</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {clientObject.bids.map((bid) => (
                                                <tr key={bid.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/dashboard/bids/${bid.id}`)}>
                                                    <td className="px-6 py-4 whitespace-nowrap">№ {bid.id}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">{bid.tema}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                                            bid.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                                                            bid.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                            {bid.status === 'Pending' ? 'В ожидании' :
                                                             bid.status === 'Accepted' ? 'Принята' :
                                                             bid.status === 'Rejected' ? 'Отклонена' : bid.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="max-w-xs truncate">{bid.description}</div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-500">Нет связанных заявок</p>
                            )}
                        </div>
                    )}
                    {activeTab === 'Оборудование' && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Оборудование</h3>
                            <p className="text-center text-gray-500">Пока в разработке</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClientObjectDetail;