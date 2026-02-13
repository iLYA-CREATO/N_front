import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClient, getClientObjects, updateClient, getUsers, getEnabledClientAttributes, getClientEquipmentByClient, createClientEquipment, deleteClientEquipment, getEquipment, getSubjectForms } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';

const ClientDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const [client, setClient] = useState(null);
    const [clientObjects, setClientObjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('Заявки');
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subjectForm: '',
        responsibleId: null,
        attributes: {}
    });
    const [users, setUsers] = useState([]);
    const [saving, setSaving] = useState(false);
    const [enabledAttributes, setEnabledAttributes] = useState([]);
    const [clientEquipment, setClientEquipment] = useState([]);
    const [clientFiles, setClientFiles] = useState([]);
    const [clientContracts, setClientContracts] = useState([]);
    const [allEquipment, setAllEquipment] = useState([]);
    const [subjectForms, setSubjectForms] = useState([]);
    const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
    const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
    const [imei, setImei] = useState('');

    // Column settings for bids table
    const bidsAllColumns = ['id', 'tema', 'status', 'description'];
    const savedBidsColumns = localStorage.getItem('clientDetailBidsVisibleColumns');
    const bidsDefaultVisibleColumns = {
        id: true,
        tema: true,
        status: true,
        description: true,
    };
    const initialBidsVisibleColumns = savedBidsColumns ? { ...bidsDefaultVisibleColumns, ...JSON.parse(savedBidsColumns) } : bidsDefaultVisibleColumns;
    const savedBidsOrder = localStorage.getItem('clientDetailBidsColumnOrder');
    let initialBidsColumnOrder = savedBidsOrder ? JSON.parse(savedBidsOrder).filter(col => bidsAllColumns.includes(col)) : bidsAllColumns;
    bidsAllColumns.forEach(col => {
        if (!initialBidsColumnOrder.includes(col)) {
            initialBidsColumnOrder.push(col);
        }
    });
    const [bidsColumnOrder, setBidsColumnOrder] = useState(initialBidsColumnOrder);
    const [bidsVisibleColumns, setBidsVisibleColumns] = useState(initialBidsVisibleColumns);
    const [showBidsColumnSettings, setShowBidsColumnSettings] = useState(false);

    // Column settings for equipment table
    const equipmentAllColumns = ['equipmentName', 'productCode', 'imei', 'bidId', 'actions'];
    const savedEquipmentColumns = localStorage.getItem('clientDetailEquipmentVisibleColumns');
    const equipmentDefaultVisibleColumns = {
        equipmentName: true,
        productCode: true,
        imei: true,
        bidId: true,
        actions: true,
    };
    const initialEquipmentVisibleColumns = savedEquipmentColumns ? { ...equipmentDefaultVisibleColumns, ...JSON.parse(savedEquipmentColumns) } : equipmentDefaultVisibleColumns;
    const savedEquipmentOrder = localStorage.getItem('clientDetailEquipmentColumnOrder');
    let initialEquipmentColumnOrder = savedEquipmentOrder ? JSON.parse(savedEquipmentOrder).filter(col => equipmentAllColumns.includes(col)) : equipmentAllColumns;
    equipmentAllColumns.forEach(col => {
        if (!initialEquipmentColumnOrder.includes(col)) {
            initialEquipmentColumnOrder.push(col);
        }
    });
    const [equipmentColumnOrder, setEquipmentColumnOrder] = useState(initialEquipmentColumnOrder);
    const [equipmentVisibleColumns, setEquipmentVisibleColumns] = useState(initialEquipmentVisibleColumns);
    const [showEquipmentColumnSettings, setShowEquipmentColumnSettings] = useState(false);

    // Column settings for objects table
    const objectsAllColumns = ['brandModel', 'stateNumber', 'bids'];
    const savedObjectsColumns = localStorage.getItem('clientDetailObjectsVisibleColumns');
    const objectsDefaultVisibleColumns = {
        brandModel: true,
        stateNumber: true,
        bids: true,
    };
    const initialObjectsVisibleColumns = savedObjectsColumns ? { ...objectsDefaultVisibleColumns, ...JSON.parse(savedObjectsColumns) } : objectsDefaultVisibleColumns;
    const savedObjectsOrder = localStorage.getItem('clientDetailObjectsColumnOrder');
    let initialObjectsColumnOrder = savedObjectsOrder ? JSON.parse(savedObjectsOrder).filter(col => objectsAllColumns.includes(col)) : objectsAllColumns;
    objectsAllColumns.forEach(col => {
        if (!initialObjectsColumnOrder.includes(col)) {
            initialObjectsColumnOrder.push(col);
        }
    });
    const [objectsColumnOrder, setObjectsColumnOrder] = useState(initialObjectsColumnOrder);
    const [objectsVisibleColumns, setObjectsVisibleColumns] = useState(initialObjectsVisibleColumns);
    const [showObjectsColumnSettings, setShowObjectsColumnSettings] = useState(false);

    useEffect(() => {
        fetchClient();
        fetchClientObjects();
        fetchUsers();
        fetchEnabledAttributes();
        fetchClientEquipment();
        fetchAllEquipment();
        fetchSubjectForms();
    }, [id]);

    // Save column settings to localStorage
    useEffect(() => {
        localStorage.setItem('clientDetailBidsVisibleColumns', JSON.stringify(bidsVisibleColumns));
    }, [bidsVisibleColumns]);

    useEffect(() => {
        localStorage.setItem('clientDetailBidsColumnOrder', JSON.stringify(bidsColumnOrder));
    }, [bidsColumnOrder]);

    useEffect(() => {
        localStorage.setItem('clientDetailEquipmentVisibleColumns', JSON.stringify(equipmentVisibleColumns));
    }, [equipmentVisibleColumns]);

    useEffect(() => {
        localStorage.setItem('clientDetailEquipmentColumnOrder', JSON.stringify(equipmentColumnOrder));
    }, [equipmentColumnOrder]);

    useEffect(() => {
        localStorage.setItem('clientDetailObjectsVisibleColumns', JSON.stringify(objectsVisibleColumns));
    }, [objectsVisibleColumns]);

    useEffect(() => {
        localStorage.setItem('clientDetailObjectsColumnOrder', JSON.stringify(objectsColumnOrder));
    }, [objectsColumnOrder]);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showBidsColumnSettings && !event.target.closest('.bids-column-settings')) {
                setShowBidsColumnSettings(false);
            }
            if (showEquipmentColumnSettings && !event.target.closest('.equipment-column-settings')) {
                setShowEquipmentColumnSettings(false);
            }
            if (showObjectsColumnSettings && !event.target.closest('.objects-column-settings')) {
                setShowObjectsColumnSettings(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showBidsColumnSettings, showEquipmentColumnSettings, showObjectsColumnSettings]);

    const fetchClient = async () => {
        try {
            const response = await getClient(id);
            setClient(response.data);
        } catch (error) {
            setError('Клиент не найден');
            console.error('Error fetching client:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchClientObjects = async () => {
        try {
            const response = await getClientObjects(id);
            setClientObjects(response.data);
        } catch (error) {
            console.error('Error fetching client objects:', error);
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

    const fetchEnabledAttributes = async () => {
        try {
            const response = await getEnabledClientAttributes();
            setEnabledAttributes(response.data);
        } catch (error) {
            console.error('Error fetching enabled attributes:', error);
        }
    };

    const fetchClientEquipment = async () => {
        try {
            const response = await getClientEquipmentByClient(id);
            setClientEquipment(response.data);
        } catch (error) {
            console.error('Error fetching client equipment:', error);
        }
    };

    const fetchAllEquipment = async () => {
        try {
            const response = await getEquipment();
            setAllEquipment(response.data);
        } catch (error) {
            console.error('Error fetching all equipment:', error);
        }
    };

    const fetchSubjectForms = async () => {
        try {
            const response = await getSubjectForms();
            setSubjectForms(response.data);
        } catch (error) {
            console.error('Error fetching subject forms:', error);
        }
    };

    const handleDeleteClientEquipment = async (clientEquipmentId) => {
        if (!confirm('Вы уверены, что хотите удалить это оборудование у клиента?')) return;
        try {
            await deleteClientEquipment(clientEquipmentId);
            fetchClientEquipment();
        } catch (error) {
            console.error('Error deleting client equipment:', error);
            alert('Ошибка при удалении оборудования.');
        }
    };

    const handleAddClientEquipment = async () => {
        if (!selectedEquipmentId) return;
        try {
            await createClientEquipment({
                clientId: parseInt(id),
                equipmentId: parseInt(selectedEquipmentId),
                imei: imei.trim() || null
            });
            setShowAddEquipmentModal(false);
            setSelectedEquipmentId('');
            setImei('');
            fetchClientEquipment();
        } catch (error) {
            console.error('Error adding client equipment:', error);
            alert('Ошибка при добавлении оборудования.');
        }
    };

    // Column settings handlers
    const handleBidsColumnToggle = (column) => {
        setBidsVisibleColumns(prev => ({
            ...prev,
            [column]: !prev[column]
        }));
    };

    const handleBidsColumnMoveUp = (index) => {
        if (index > 0) {
            const newOrder = [...bidsColumnOrder];
            [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
            setBidsColumnOrder(newOrder);
        }
    };

    const handleBidsColumnMoveDown = (index) => {
        if (index < bidsColumnOrder.length - 1) {
            const newOrder = [...bidsColumnOrder];
            [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
            setBidsColumnOrder(newOrder);
        }
    };

    const handleEquipmentColumnToggle = (column) => {
        setEquipmentVisibleColumns(prev => ({
            ...prev,
            [column]: !prev[column]
        }));
    };

    const handleEquipmentColumnMoveUp = (index) => {
        if (index > 0) {
            const newOrder = [...equipmentColumnOrder];
            [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
            setEquipmentColumnOrder(newOrder);
        }
    };

    const handleEquipmentColumnMoveDown = (index) => {
        if (index < equipmentColumnOrder.length - 1) {
            const newOrder = [...equipmentColumnOrder];
            [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
            setEquipmentColumnOrder(newOrder);
        }
    };

    const handleObjectsColumnToggle = (column) => {
        setObjectsVisibleColumns(prev => ({
            ...prev,
            [column]: !prev[column]
        }));
    };

    const handleObjectsColumnMoveUp = (index) => {
        if (index > 0) {
            const newOrder = [...objectsColumnOrder];
            [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
            setObjectsColumnOrder(newOrder);
        }
    };

    const handleObjectsColumnMoveDown = (index) => {
        if (index < objectsColumnOrder.length - 1) {
            const newOrder = [...objectsColumnOrder];
            [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
            setObjectsColumnOrder(newOrder);
        }
    };

    // Column label functions
    const getBidsColumnLabel = (column) => {
        switch (column) {
            case 'id': return '№';
            case 'tema': return 'Тема';
            case 'status': return 'Статус';
            case 'description': return 'Описание';
            default: return column;
        }
    };

    const getEquipmentColumnLabel = (column) => {
        switch (column) {
            case 'equipmentName': return 'Оборудование';
            case 'productCode': return 'Код товара';
            case 'imei': return 'IMEI';
            case 'bidId': return 'Заявка';
            case 'actions': return 'Действия';
            default: return column;
        }
    };

    const getObjectsColumnLabel = (column) => {
        switch (column) {
            case 'brandModel': return 'Марка/Модель';
            case 'stateNumber': return 'Гос. Номер';
            case 'bids': return 'Заявки';
            default: return column;
        }
    };

    // Cell content functions
    const getBidsCellContent = (bid, column) => {
        switch (column) {
            case 'id': return `№ ${bid.id}`;
            case 'tema': return bid.tema;
            case 'status': {
                // Find the status configuration from bidType
                let statusConfig = null;
                if (bid.bidType?.statuses && Array.isArray(bid.bidType.statuses)) {
                    statusConfig = bid.bidType.statuses.find(s => s.name === bid.status);
                }

                // Use status config if available, otherwise default
                const color = statusConfig?.color || '#7a7777'; // Default gray
                const displayName = statusConfig?.name || bid.status;

                // Check if color is light/white and adjust text color accordingly
                const isLightColor = color === '#ffffff' || color.toLowerCase() === '#fff';
                const textColor = isLightColor ? '#333333' : '#ffffff'; // Dark text on light bg, white on dark bg

                return (
                    <span
                        className="px-2 py-1 text-xs rounded-full border"
                        style={{
                            backgroundColor: color,
                            color: textColor,
                            borderColor: isLightColor ? '#cccccc' : color
                        }}
                    >
                        {displayName}
                    </span>
                );
            }
            case 'description': return <div className="max-w-xs truncate">{bid.description}</div>;
            default: return '';
        }
    };

    const getEquipmentCellContent = (ce, column) => {
        switch (column) {
            case 'equipmentName': return ce.equipment.name;
            case 'productCode': return ce.equipment.productCode || '-';
            case 'imei': return ce.imei || '-';
            case 'bidId': return ce.bid ? (
                <button
                    onClick={() => navigate(`/dashboard/bids/${ce.bid.id}`)}
                    className="text-blue-500 hover:text-blue-700 underline"
                >
                    {ce.bid.id}
                </button>
            ) : '-';
            case 'actions': return hasPermission('client_equipment_delete') ? (
                <button
                    onClick={() => handleDeleteClientEquipment(ce.id)}
                    className="text-red-500 hover:text-red-700"
                >
                    Удалить
                </button>
            ) : null;
            default: return '';
        }
    };

    const getObjectsCellContent = (obj, column) => {
        switch (column) {
            case 'brandModel': return obj.brandModel;
            case 'stateNumber': return obj.stateNumber;
            case 'bids': return obj.bids && obj.bids.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                    {obj.bids.map((bid) => (
                        <span key={bid.id} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            {bid.tema}
                        </span>
                    ))}
                </div>
            ) : (
                <span className="text-gray-500">Нет заявок</span>
            );
            default: return '';
        }
    };

    const handleEdit = () => {
        const attributes = {};
        enabledAttributes.forEach(attr => {
            const value = client.attributeValues?.find(av => av.attributeId === attr.id)?.value || '';
            if (attr.type === 'multiselect' && value) {
                try {
                    attributes[attr.id] = JSON.parse(value);
                } catch {
                    attributes[attr.id] = [];
                }
            } else {
                attributes[attr.id] = value;
            }
        });
        setFormData({
            name: client.name || '',
            email: client.email || '',
            phone: client.phone || '',
            subjectForm: client.subjectForm || '',
            responsibleId: client.responsibleId || null,
            attributes
        });
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setFormData({
            name: '',
            email: '',
            phone: '',
            subjectForm: '',
            responsibleId: null,
            attributes: {}
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await updateClient(id, formData);
            setClient(response.data);
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating client:', error);
            setError('Ошибка при сохранении изменений');
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('attr_')) {
            const attrId = name.replace('attr_', '');
            setFormData(prev => ({
                ...prev,
                attributes: {
                    ...prev.attributes,
                    [attrId]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: name === 'responsibleId' ? (value ? parseInt(value) : null) : value
            }));
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-500">Загрузка...</div>
            </div>
        );
    }

    if (error || !client) {
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
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Информация о клиенте</h2>
                <div className="flex space-x-2">
                    {!isEditing ? (
                        <>
                            {hasPermission('client_edit') && (
                                <button
                                    onClick={handleEdit}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                                >
                                    Редактировать
                                </button>
                            )}
                            <button
                                onClick={() => navigate('/dashboard/clients')}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                            >
                                Назад
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
                            >
                                {saving ? 'Сохранение...' : 'Сохранить'}
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={saving}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
                            >
                                Отмена
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={saving}
                            />
                        ) : (
                            <p className="text-gray-900 text-lg">{client.name}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        {isEditing ? (
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={saving}
                            />
                        ) : (
                            <p className="text-gray-900 text-lg">{client.email}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                        {isEditing ? (
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={saving}
                            />
                        ) : (
                            <p className="text-gray-900 text-lg">{client.phone}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Форма субъекта</label>
                        {isEditing ? (
                            <select
                                name="subjectForm"
                                value={formData.subjectForm}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={saving}
                            >
                                <option value="">Выберите форму субъекта</option>
                                {subjectForms.map((sf) => (
                                    <option key={sf.id} value={sf.name}>{sf.name}</option>
                                ))}
                            </select>
                        ) : (
                            <p className="text-gray-900 text-lg">{client.subjectForm || '-'}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ответственный</label>
                        {isEditing ? (
                            <select
                                name="responsibleId"
                                value={formData.responsibleId || ''}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={saving}
                            >
                                <option value="">Не назначен</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.fullName || user.email}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <p className="text-gray-900 text-lg">{client.responsible ? client.responsible.fullName || client.responsible.email : 'Не назначен'}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Количество заявок</label>
                        <p className="text-gray-900 text-lg">{client.bids?.length || 0}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Количество объектов</label>
                        <p className="text-gray-900 text-lg">{clientObjects.length}</p>
                    </div>
                    {enabledAttributes.map(attr => {
                        const value = client.attributeValues?.find(av => av.attributeId === attr.id)?.value || '';
                        return (
                            <div key={attr.id}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{attr.name}</label>
                                {isEditing ? (
                                    attr.type === 'select' ? (
                                        <select
                                            name={`attr_${attr.id}`}
                                            value={formData.attributes[attr.id] || ''}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            disabled={saving}
                                        >
                                            <option value="">Не выбрано</option>
                                            {attr.options?.map(option => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                    ) : attr.type === 'multiselect' ? (
                                        <div className="space-y-2">
                                            {attr.options?.map(option => {
                                                const currentValues = formData.attributes[attr.id] ? JSON.parse(formData.attributes[attr.id]) : [];
                                                return (
                                                    <label key={option} className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={currentValues.includes(option)}
                                                            onChange={(e) => {
                                                                const newValues = e.target.checked
                                                                    ? [...currentValues, option]
                                                                    : currentValues.filter(v => v !== option);
                                                                handleInputChange({
                                                                    target: {
                                                                        name: `attr_${attr.id}`,
                                                                        value: JSON.stringify(newValues)
                                                                    }
                                                                });
                                                            }}
                                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                                            disabled={saving}
                                                        />
                                                        <span className="ml-2 text-sm text-gray-700">{option}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    ) : attr.type === 'image' ? (
                                        <div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onload = (event) => {
                                                            handleInputChange({
                                                                target: {
                                                                    name: `attr_${attr.id}`,
                                                                    value: event.target.result
                                                                }
                                                            });
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                disabled={saving}
                                            />
                                            {formData.attributes[attr.id] && (
                                                <img
                                                    src={formData.attributes[attr.id]}
                                                    alt="Preview"
                                                    className="mt-2 max-w-full h-32 object-cover rounded"
                                                />
                                            )}
                                        </div>
                                    ) : attr.type === 'boolean' ? (
                                        <input
                                            type="checkbox"
                                            name={`attr_${attr.id}`}
                                            checked={formData.attributes[attr.id] === 'true'}
                                            onChange={(e) => handleInputChange({
                                                target: {
                                                    name: `attr_${attr.id}`,
                                                    value: e.target.checked ? 'true' : 'false'
                                                }
                                            })}
                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                            disabled={saving}
                                        />
                                    ) : attr.type === 'number' ? (
                                        <input
                                            type="number"
                                            name={`attr_${attr.id}`}
                                            value={formData.attributes[attr.id] || ''}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            disabled={saving}
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            name={`attr_${attr.id}`}
                                            value={formData.attributes[attr.id] || ''}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            disabled={saving}
                                        />
                                    )
                                ) : (
                                    attr.type === 'multiselect' ? (
                                        <p className="text-gray-900 text-lg">
                                            {value ? (() => {
                                                try {
                                                    const parsed = JSON.parse(value);
                                                    return Array.isArray(parsed) ? parsed.join(', ') : 'Не указано';
                                                } catch {
                                                    return 'Не указано';
                                                }
                                            })() : 'Не указано'}
                                        </p>
                                    ) : attr.type === 'image' ? (
                                        value ? (
                                            <img
                                                src={value}
                                                alt={attr.name}
                                                className="max-w-full h-32 object-cover rounded"
                                            />
                                        ) : (
                                            <p className="text-gray-900 text-lg">Не указано</p>
                                        )
                                    ) : (
                                        <p className="text-gray-900 text-lg">{value || 'Не указано'}</p>
                                    )
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="mt-6">
                <div className="flex space-x-1 mb-4">
                    {[
                        'Заявки',
                        'Оборудование',
                        'Файлы',
                        'Объекты',
                        'Договоры'
                    ].map((tab) => {
                        let displayTab = tab;
                        let count = 0;
                        if (tab === 'Заявки') {
                            count = client.bids ? client.bids.length : 0;
                        } else if (tab === 'Оборудование') {
                            count = clientEquipment.length;
                        } else if (tab === 'Файлы') {
                            count = clientFiles.length;
                        } else if (tab === 'Объекты') {
                            count = clientObjects.length;
                        } else if (tab === 'Договоры') {
                            count = clientContracts.length;
                        }
                        displayTab = `${tab} (${count})`;
                        return (
                            <button
                                key={tab}
                                onClick={() => {
                                    if (tab === 'Оборудование') {
                                        console.log('Оборудование tab clicked');
                                    }
                                    setActiveTab(tab);
                                }}
                                className={`px-4 py-2 rounded-t-lg font-medium transition ${
                                    activeTab === tab
                                        ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {displayTab}
                            </button>
                        );
                    })}
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    {activeTab === 'Заявки' && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Заявки клиента</h3>
                                <div className="relative bids-column-settings">
                                    <button
                                        onClick={() => setShowBidsColumnSettings(!showBidsColumnSettings)}
                                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition text-sm"
                                    >
                                        Настройки столбцов
                                    </button>
                                    {showBidsColumnSettings && (
                                        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                                            <div className="p-4">
                                                <h4 className="font-medium mb-2">Настройки столбцов</h4>
                                                {bidsColumnOrder.map((column, index) => (
                                                    <div key={column} className="flex items-center justify-between mb-2">
                                                        <label className="flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={bidsVisibleColumns[column]}
                                                                onChange={() => handleBidsColumnToggle(column)}
                                                                className="mr-2"
                                                            />
                                                            {getBidsColumnLabel(column)}
                                                        </label>
                                                        {bidsVisibleColumns[column] && (
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => handleBidsColumnMoveUp(index)}
                                                                    disabled={index === 0}
                                                                    className="px-2 py-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-xs rounded"
                                                                >
                                                                    ↑
                                                                </button>
                                                                <button
                                                                    onClick={() => handleBidsColumnMoveDown(index)}
                                                                    disabled={index === bidsColumnOrder.length - 1}
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
                            {client.bids && client.bids.length > 0 ? (
                                <div className="bg-white rounded-lg shadow overflow-hidden">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                {bidsColumnOrder.filter(col => bidsVisibleColumns[col]).map(column => (
                                                    <th key={column} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                        {getBidsColumnLabel(column)}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {client.bids.map((bid) => (
                                                <tr key={bid.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/dashboard/bids/${bid.id}`)}>
                                                    {bidsColumnOrder.filter(col => bidsVisibleColumns[col]).map(column => (
                                                        <td key={column} className={`px-6 py-4 ${column === 'description' ? '' : 'whitespace-nowrap'}`}>
                                                            {getBidsCellContent(bid, column)}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-500">У клиента нет заявок</p>
                            )}
                        </div>
                    )}
                    {activeTab === 'Оборудование' && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Оборудование клиента</h3>
                                <div className="flex gap-2">
                                    <div className="relative equipment-column-settings">
                                        <button
                                            onClick={() => setShowEquipmentColumnSettings(!showEquipmentColumnSettings)}
                                            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition text-sm"
                                        >
                                            Настройки столбцов
                                        </button>
                                        {showEquipmentColumnSettings && (
                                            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                                                <div className="p-4">
                                                    <h4 className="font-medium mb-2">Настройки столбцов</h4>
                                                    {equipmentColumnOrder.map((column, index) => (
                                                        <div key={column} className="flex items-center justify-between mb-2">
                                                            <label className="flex items-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={equipmentVisibleColumns[column]}
                                                                    onChange={() => handleEquipmentColumnToggle(column)}
                                                                    className="mr-2"
                                                                />
                                                                {getEquipmentColumnLabel(column)}
                                                            </label>
                                                            {equipmentVisibleColumns[column] && (
                                                                <div className="flex gap-1">
                                                                    <button
                                                                        onClick={() => handleEquipmentColumnMoveUp(index)}
                                                                        disabled={index === 0}
                                                                        className="px-2 py-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-xs rounded"
                                                                    >
                                                                        ↑
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleEquipmentColumnMoveDown(index)}
                                                                        disabled={index === equipmentColumnOrder.length - 1}
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
                                    {hasPermission('client_equipment_add') && (
                                        <button
                                            onClick={() => setShowAddEquipmentModal(true)}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition text-sm"
                                        >
                                            Добавить оборудование
                                        </button>
                                    )}
                                </div>
                            </div>
                            {clientEquipment.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full bg-white border border-gray-300">
                                        <thead>
                                            <tr className="bg-gray-50">
                                                {equipmentColumnOrder.filter(col => equipmentVisibleColumns[col]).map(column => (
                                                    <th key={column} className="px-4 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase">
                                                        {getEquipmentColumnLabel(column)}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {clientEquipment.map(ce => (
                                                <tr key={ce.id} className="hover:bg-gray-50">
                                                    {equipmentColumnOrder.filter(col => equipmentVisibleColumns[col]).map(column => (
                                                        <td key={column} className="px-4 py-2 border-b">
                                                            {getEquipmentCellContent(ce, column)}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-4">Оборудование не добавлено</p>
                            )}
                        </div>
                    )}
                    {activeTab === 'Файлы' && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Файлы</h3>
                            <p className="text-gray-500">В разработке</p>
                        </div>
                    )}
                    {activeTab === 'Объекты' && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Объекты клиента</h3>
                                <div className="relative objects-column-settings">
                                    <button
                                        onClick={() => setShowObjectsColumnSettings(!showObjectsColumnSettings)}
                                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition text-sm"
                                    >
                                        Настройки столбцов
                                    </button>
                                    {showObjectsColumnSettings && (
                                        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                                            <div className="p-4">
                                                <h4 className="font-medium mb-2">Настройки столбцов</h4>
                                                {objectsColumnOrder.map((column, index) => (
                                                    <div key={column} className="flex items-center justify-between mb-2">
                                                        <label className="flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={objectsVisibleColumns[column]}
                                                                onChange={() => handleObjectsColumnToggle(column)}
                                                                className="mr-2"
                                                            />
                                                            {getObjectsColumnLabel(column)}
                                                        </label>
                                                        {objectsVisibleColumns[column] && (
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => handleObjectsColumnMoveUp(index)}
                                                                    disabled={index === 0}
                                                                    className="px-2 py-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-xs rounded"
                                                                >
                                                                    ↑
                                                                </button>
                                                                <button
                                                                    onClick={() => handleObjectsColumnMoveDown(index)}
                                                                    disabled={index === objectsColumnOrder.length - 1}
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
                            {clientObjects && clientObjects.length > 0 ? (
                                <div className="bg-white rounded-lg shadow overflow-hidden">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                {objectsColumnOrder.filter(col => objectsVisibleColumns[col]).map(column => (
                                                    <th key={column} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                        {getObjectsColumnLabel(column)}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {clientObjects.map((obj) => (
                                                <tr key={obj.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/dashboard/client-objects/${obj.id}`)}>
                                                    {objectsColumnOrder.filter(col => objectsVisibleColumns[col]).map(column => (
                                                        <td key={column} className="px-6 py-4">
                                                            {getObjectsCellContent(obj, column)}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-500">У клиента нет объектов</p>
                            )}
                        </div>
                    )}
                    {activeTab === 'Договоры' && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Договоры</h3>
                            <p className="text-gray-500">В разработке</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Equipment Modal */}
            {showAddEquipmentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Добавить оборудование</h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Выберите оборудование</label>
                            <select
                                value={selectedEquipmentId}
                                onChange={(e) => setSelectedEquipmentId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Выберите оборудование</option>
                                {allEquipment
                                    .filter(eq => !clientEquipment.some(ce => ce.equipmentId === eq.id))
                                    .map(eq => (
                                        <option key={eq.id} value={eq.id}>
                                            {eq.name} {eq.productCode ? `(${eq.productCode})` : ''}
                                        </option>
                                    ))}
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">IMEI (необязательно)</label>
                            <input
                                type="text"
                                value={imei}
                                onChange={(e) => setImei(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Введите IMEI"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleAddClientEquipment}
                                disabled={!selectedEquipmentId}
                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Добавить
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddEquipmentModal(false);
                                    setSelectedEquipmentId('');
                                    setImei('');
                                }}
                                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
                            >
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientDetail;