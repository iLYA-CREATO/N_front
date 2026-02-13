import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEquipment, createEquipment, updateEquipment, deleteEquipment, getExpenseHistory, getReturnHistory, uploadEquipmentImages, deleteEquipmentImage } from '../services/api';
import { UPLOADS_URL } from '../services/config';
import { usePermissions } from '../hooks/usePermissions';
import ConfirmModal from './ConfirmModal';

const Equipment = () => {
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const [equipment, setEquipment] = useState([]);
    const [expenseHistory, setExpenseHistory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingItem, setEditingItem] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [equipmentToDelete, setEquipmentToDelete] = useState(null);
    const fileInputRef = useRef(null);
    
    const equipmentAllColumns = ['id', 'name', 'productCode', 'purchasePrice', 'sellingPrice'];
    const savedEquipmentColumns = localStorage.getItem('equipmentVisibleColumns');
    const defaultEquipmentVisibleColumns = {
        id: true,
        name: true,
        productCode: true,
        sellingPrice: true,
        purchasePrice: true,
    };
    const initialEquipmentVisibleColumns = savedEquipmentColumns ? { ...defaultEquipmentVisibleColumns, ...JSON.parse(savedEquipmentColumns), sellingPrice: true, purchasePrice: true, productCode: true } : defaultEquipmentVisibleColumns;
    const savedEquipmentOrder = localStorage.getItem('equipmentColumnOrder');
    const initialEquipmentColumnOrder = savedEquipmentOrder ? [...new Set([...JSON.parse(savedEquipmentOrder).filter(col => equipmentAllColumns.includes(col)), ...equipmentAllColumns])] : equipmentAllColumns;
    const [equipmentColumnOrder, setEquipmentColumnOrder] = useState(initialEquipmentColumnOrder);
    const [equipmentVisibleColumns, setEquipmentVisibleColumns] = useState(initialEquipmentVisibleColumns);
    const [showEquipmentColumnSettings, setShowEquipmentColumnSettings] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        productCode: '',
        sellingPrice: '',
        purchasePrice: '',
        description: '',
    });
    const [error, setError] = useState('');
    const [customTabs, setCustomTabs] = useState([]);
    const [activeTab, setActiveTab] = useState('nomenclature');
    const [selectedEquipment, setSelectedEquipment] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    
    const [uploadedImages, setUploadedImages] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartX = useRef(0);
    const dragCurrentX = useRef(0);

    const expenseHistoryAllColumns = ['bidId', 'bidTema', 'clientObject', 'client', 'equipmentName', 'imei', 'quantity'];
    const savedExpenseHistoryColumns = localStorage.getItem('expenseHistoryVisibleColumns');
    const defaultExpenseHistoryVisibleColumns = {
        bidId: true,
        bidTema: true,
        clientObject: true,
        client: true,
        equipmentName: true,
        imei: true,
        quantity: true,
    };
    const initialExpenseHistoryVisibleColumns = savedExpenseHistoryColumns 
        ? { ...defaultExpenseHistoryVisibleColumns, ...JSON.parse(savedExpenseHistoryColumns) } 
        : defaultExpenseHistoryVisibleColumns;
    const savedExpenseHistoryOrder = localStorage.getItem('expenseHistoryColumnOrder');
    const initialExpenseHistoryColumnOrder = savedExpenseHistoryOrder 
        ? [...new Set([...JSON.parse(savedExpenseHistoryOrder).filter(col => expenseHistoryAllColumns.includes(col)), ...expenseHistoryAllColumns])] 
        : expenseHistoryAllColumns;
    const [expenseHistoryColumnOrder, setExpenseHistoryColumnOrder] = useState(initialExpenseHistoryColumnOrder);
    const [expenseHistoryVisibleColumns, setExpenseHistoryVisibleColumns] = useState(initialExpenseHistoryVisibleColumns);
    const [showExpenseHistoryColumnSettings, setShowExpenseHistoryColumnSettings] = useState(false);
    const [returnHistoryLoading, setReturnHistoryLoading] = useState(false);
    const [returnHistory, setReturnHistory] = useState([]);

    useEffect(() => {
        fetchEquipment();
    }, []);

    useEffect(() => {
        if (activeTab === 'expense-history') {
            fetchExpenseHistory();
        }
    }, [activeTab]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (activeTab === 'expense-history' && !document.hidden) {
                fetchExpenseHistory();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'return-history') {
            fetchReturnHistory();
        }
    }, [activeTab]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (activeTab === 'return-history' && !document.hidden) {
                fetchReturnHistory();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [activeTab]);

    useEffect(() => {
        if (selectedEquipment && selectedEquipment.id !== 'new') {
            setUploadedImages(selectedEquipment.images || []);
        } else {
            setUploadedImages([]);
        }
    }, [selectedEquipment]);

    useEffect(() => {
        localStorage.setItem('equipmentVisibleColumns', JSON.stringify(equipmentVisibleColumns));
    }, [equipmentVisibleColumns]);

    useEffect(() => {
        localStorage.setItem('equipmentColumnOrder', JSON.stringify(equipmentColumnOrder));
    }, [equipmentColumnOrder]);

    useEffect(() => {
        localStorage.setItem('expenseHistoryVisibleColumns', JSON.stringify(expenseHistoryVisibleColumns));
    }, [expenseHistoryVisibleColumns]);

    useEffect(() => {
        localStorage.setItem('expenseHistoryColumnOrder', JSON.stringify(expenseHistoryColumnOrder));
    }, [expenseHistoryColumnOrder]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showEquipmentColumnSettings && !event.target.closest('.equipment-column-settings')) {
                setShowEquipmentColumnSettings(false);
            }
            if (showExpenseHistoryColumnSettings && !event.target.closest('.expense-history-column-settings')) {
                setShowExpenseHistoryColumnSettings(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showEquipmentColumnSettings, showExpenseHistoryColumnSettings]);

    const fetchEquipment = async () => {
        try {
            const response = await getEquipment();
            setEquipment(response.data);
        } catch (error) {
            console.error('Error fetching equipment:', error);
        }
    };

    const fetchExpenseHistory = async () => {
        try {
            const response = await getExpenseHistory();
            setExpenseHistory(response.data);
        } catch (error) {
            console.error('Error fetching expense history:', error);
        }
    };

    const fetchReturnHistory = async () => {
        try {
            setReturnHistoryLoading(true);
            const response = await getReturnHistory();
            setReturnHistory(response.data);
        } catch (error) {
            console.error('Error fetching return history:', error);
        } finally {
            setReturnHistoryLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (editingItem) {
                await updateEquipment(editingItem.id, formData);
            } else {
                const response = await createEquipment(formData);
                setSelectedEquipment(response.data);
            }
            fetchEquipment();
            resetForm();
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving equipment:', error);
            setError(error.response?.data?.message || 'Ошибка при сохранении оборудования');
        }
    };

    const handleView = (item) => {
        setSelectedEquipment(item);
    };

    const closeEquipmentDetail = () => {
        setSelectedEquipment(null);
        setIsEditing(false);
        setUploadedImages([]);
        if (editingItem) {
            resetForm();
        }
    };

    const handleEdit = (item) => {
        setFormData({
            name: item.name,
            productCode: item.productCode || '',
            sellingPrice: item.sellingPrice || '',
            purchasePrice: item.purchasePrice || '',
            description: item.description || '',
        });
        setEditingItem(item);
        setSelectedEquipment(item);
        setIsEditing(true);
    };

    const handleDelete = async (item) => {
        try {
            await deleteEquipment(item.id);
            fetchEquipment();
        } catch (error) {
            console.error('Error deleting equipment:', error);
            if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else {
                setError('Ошибка при удалении оборудования');
            }
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            productCode: '',
            sellingPrice: '',
            purchasePrice: '',
            description: '',
        });
        setEditingItem(null);
        setError('');
        setUploadedImages([]);
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        if (!selectedEquipment || selectedEquipment.id === 'new') {
            alert('Сначала сохраните оборудование, затем загрузите изображения');
            return;
        }

        setIsUploading(true);
        try {
            const response = await uploadEquipmentImages(selectedEquipment.id, files);
            setUploadedImages(response.data.images);
            setSelectedEquipment(prev => ({ ...prev, images: response.data.images }));
        } catch (error) {
            console.error('Error uploading images:', error);
            alert('Ошибка при загрузке изображений');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDeleteImage = async (filename) => {
        if (!selectedEquipment || selectedEquipment.id === 'new') return;

        try {
            const response = await deleteEquipmentImage(selectedEquipment.id, filename);
            setUploadedImages(response.data.images);
            setSelectedEquipment(prev => ({ ...prev, images: response.data.images }));
        } catch (error) {
            console.error('Error deleting image:', error);
            alert('Ошибка при удалении изображения');
        }
    };

    const openLightbox = (index) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    const closeLightbox = () => {
        setLightboxOpen(false);
    };

    const nextImage = () => {
        setLightboxIndex(prev => (prev + 1) % uploadedImages.length);
    };

    const prevImage = () => {
        setLightboxIndex(prev => (prev - 1 + uploadedImages.length) % uploadedImages.length);
    };

    const handleDragStart = (e) => {
        setIsDragging(true);
        dragStartX.current = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    };

    const handleDragMove = (e) => {
        if (!isDragging) return;
        dragCurrentX.current = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    };

    const handleDragEnd = () => {
        if (!isDragging) return;
        const diff = dragStartX.current - dragCurrentX.current;
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                nextImage();
            } else {
                prevImage();
            }
        }
        setIsDragging(false);
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!lightboxOpen) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight') nextImage();
            if (e.key === 'ArrowLeft') prevImage();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxOpen, uploadedImages.length]);


    const filteredEquipment = equipment.filter(item =>
        item.id.toString().includes(searchTerm) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.productCode?.toString().includes(searchTerm)
    );

    const displayEquipmentColumns = equipmentColumnOrder.filter(col => equipmentVisibleColumns[col]);

    const handleEquipmentColumnToggle = (column) => {
        setEquipmentVisibleColumns(prev => ({
            ...prev,
            [column]: !prev[column]
        }));
    };

    const moveEquipmentUp = (index) => {
        if (index > 0) {
            const newOrder = [...equipmentColumnOrder];
            [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
            setEquipmentColumnOrder(newOrder);
        }
    };

    const moveEquipmentDown = (index) => {
        if (index < equipmentColumnOrder.length - 1) {
            const newOrder = [...equipmentColumnOrder];
            [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
            setEquipmentColumnOrder(newOrder);
        }
    };

    const getEquipmentColumnLabel = (column) => {
        const labels = {
            id: 'ID',
            name: 'Название',
            productCode: 'Код товара',
            sellingPrice: 'Цена продажи',
            purchasePrice: 'Цена закупки',
        };
        return labels[column] || column;
    };

    const getEquipmentCellContent = (item, column) => {
        switch (column) {
            case 'id':
                return item.id;
            case 'name':
                return item.name;
            case 'productCode':
                return item.productCode || '-';
            case 'sellingPrice':
                return item.sellingPrice ? `${item.sellingPrice} ₽` : '-';
            case 'purchasePrice':
                return item.purchasePrice ? `${item.purchasePrice} ₽` : '-';
            default:
                return '';
        }
    };

    const handleExpenseHistoryColumnToggle = (column) => {
        setExpenseHistoryVisibleColumns(prev => ({
            ...prev,
            [column]: !prev[column]
        }));
    };

    const moveExpenseHistoryUp = (index) => {
        if (index > 0) {
            const newOrder = [...expenseHistoryColumnOrder];
            [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
            setExpenseHistoryColumnOrder(newOrder);
        }
    };

    const moveExpenseHistoryDown = (index) => {
        if (index < expenseHistoryColumnOrder.length - 1) {
            const newOrder = [...expenseHistoryColumnOrder];
            [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
            setExpenseHistoryColumnOrder(newOrder);
        }
    };

    const getExpenseHistoryColumnLabel = (column) => {
        const labels = {
            bidId: 'Номер заявки',
            bidTema: 'Тема заявки',
            clientObject: 'Объект обслуживания',
            client: 'Клиент',
            equipmentName: 'Название оборудования',
            imei: 'IMEI',
            quantity: 'Количество',
        };
        return labels[column] || column;
    };

    const displayExpenseHistoryColumns = expenseHistoryColumnOrder.filter(col => expenseHistoryVisibleColumns[col]);

    const baseTabs = [
        { id: 'nomenclature', label: 'Номенклатура' },
        { id: 'expense-history', label: 'История Расхода' },
        { id: 'return-history', label: 'История возврата' }
    ];

    const allTabs = [...baseTabs, ...customTabs];

    const openCustomTab = (tabId, tabLabel) => {
        if (!customTabs.find(tab => tab.id === tabId)) {
            setCustomTabs([...customTabs, { id: tabId, label: tabLabel }]);
        }
        setActiveTab(tabId);
    };

    const closeCustomTab = (tabId) => {
        setCustomTabs(customTabs.filter(tab => tab.id !== tabId));
        if (activeTab === tabId) {
            setActiveTab('nomenclature');
        }
    };

    const renderImageGallery = () => {
        if (uploadedImages.length === 0) {
            return (
                <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                    <div className="text-center text-gray-400">
                        <svg className="w-24 h-24 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Нет изображений</span>
                    </div>
                </div>
            );
        }

        return (
            <div className="relative">
                <div className="bg-gray-100 rounded-lg h-64 overflow-hidden flex items-center justify-center relative">
                    {uploadedImages.length > 1 && (
                        <>
                            <button
                                onClick={() => {
                                    const container = document.querySelector('.image-gallery-scroll');
                                    if (container) container.scrollBy({ left: -200, behavior: 'smooth' });
                                }}
                                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition"
                                title="Предыдущее изображение"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                onClick={() => {
                                    const container = document.querySelector('.image-gallery-scroll');
                                    if (container) container.scrollBy({ left: 200, behavior: 'smooth' });
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition"
                                title="Следующее изображение"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </>
                    )}
                    <div 
                        className="image-gallery-scroll flex gap-2 overflow-x-auto p-2 snap-x"
                        style={{ scrollSnapType: 'x mandatory', maxWidth: 'calc(100% - 60px)' }}
                    >
                        {uploadedImages.map((filename, index) => (
                            <div 
                                key={filename} 
                                className="flex-shrink-0 w-48 h-48 relative group snap-center cursor-pointer"
                                onClick={() => openLightbox(index)}
                            >
                                <img 
                                    src={`${UPLOADS_URL}/equipment/${selectedEquipment.id}/${filename}`}
                                    alt={`Изображение ${index + 1}`}
                                    className="w-full h-full object-cover rounded-lg"
                                />
                                {isEditing && hasPermission('equipment_edit') && selectedEquipment.id !== 'new' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteImage(filename);
                                        }}
                                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Удалить изображение"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                {uploadedImages.length > 1 && (
                    <div className="text-center text-sm text-gray-500 mt-2">
                        Используйте стрелки по бокам или кликните на изображение для просмотра.
                    </div>
                )}
            </div>
        );
    };

    const renderLightbox = () => {
        if (!lightboxOpen) return null;

        return (
            <div 
                className="fixed inset-0 bg-black bg-opacity-95 flex flex-col items-center justify-center z-50"
                onClick={closeLightbox}
            >
                <button
                    onClick={closeLightbox}
                    className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 z-10"
                >
                    ×
                </button>
                
                <div 
                    className="relative max-w-full max-h-[70vh] p-4"
                    onMouseDown={handleDragStart}
                    onMouseMove={handleDragMove}
                    onMouseUp={handleDragEnd}
                    onMouseLeave={handleDragEnd}
                    onTouchStart={handleDragStart}
                    onTouchMove={handleDragMove}
                    onTouchEnd={handleDragEnd}
                    onClick={(e) => e.stopPropagation()}
                >
                    <img 
                        src={`${UPLOADS_URL}/equipment/${selectedEquipment.id}/${uploadedImages[lightboxIndex]}`}
                        alt={`Изображение ${lightboxIndex + 1}`}
                        className="max-w-full max-h-[60vh] object-contain"
                        style={{ 
                            transform: isDragging ? `translateX(${dragStartX.current - dragCurrentX.current}px)` : 'none',
                            transition: isDragging ? 'none' : 'transform 0.3s ease'
                        }}
                    />
                    {isEditing && hasPermission('equipment_edit') && selectedEquipment.id !== 'new' && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteImage(uploadedImages[lightboxIndex]);
                                if (lightboxIndex >= uploadedImages.length - 1) {
                                    setLightboxIndex(Math.max(0, uploadedImages.length - 2));
                                }
                            }}
                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-lg px-3 py-1 transition"
                        >
                            Удалить
                        </button>
                    )}
                </div>
                
                {/* Navigation arrows at bottom */}
                {uploadedImages.length > 1 && (
                    <div className="flex items-center gap-8 mb-4">
                        <button
                            onClick={(e) => { e.stopPropagation(); prevImage(); }}
                            className="text-white text-4xl hover:text-gray-300 p-2"
                        >
                            ‹
                        </button>
                        <span className="text-white text-lg">
                            {lightboxIndex + 1} / {uploadedImages.length}
                        </span>
                        <button
                            onClick={(e) => { e.stopPropagation(); nextImage(); }}
                            className="text-white text-4xl hover:text-gray-300 p-2"
                        >
                            ›
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Оборудование</h1>
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                    {error}
                </div>
            )}

            <div>
                <div className="border-b border-gray-200 mb-6 relative">
                    <nav className="tab-nav -mb-px flex space-x-8 overflow-x-auto pl-8 pr-8">
                        {allTabs.map(tab => (
                            <div key={tab.id} className="flex items-center flex-shrink-0">
                                <button
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                                {customTabs.find(ct => ct.id === tab.id) && (
                                    <button
                                        onClick={() => closeCustomTab(tab.id)}
                                        className="ml-1 text-gray-400 hover:text-gray-600"
                                        title="Закрыть вкладку"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        ))}
                    </nav>
                    <button
                        onClick={() => {
                            const nav = document.querySelector('.tab-nav');
                            if (nav) nav.scrollBy({ left: -200, behavior: 'smooth' });
                        }}
                        className="absolute left-0 top-0 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
                        title="Прокрутить влево"
                    >
                        ‹
                    </button>
                    <button
                        onClick={() => {
                            const nav = document.querySelector('.tab-nav');
                            if (nav) nav.scrollBy({ left: 200, behavior: 'smooth' });
                        }}
                        className="absolute right-0 top-0 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
                        title="Прокрутить вправо"
                    >
                        ›
                    </button>
                </div>

                {activeTab === 'nomenclature' && (
                    <>
                        <div className="bg-gray-200 rounded-lg p-4 mb-6">
                            <div className="flex justify-end mb-4">
                                {hasPermission('equipment_create') && (
                                    <button
                                        onClick={() => {
                                            resetForm();
                                            setSelectedEquipment({ id: 'new', name: '', productCode: null, purchasePrice: null, sellingPrice: null, description: '', images: [] });
                                            setIsEditing(true);
                                        }}
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                                    >
                                        Новое оборудование
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    placeholder="Поиск по ID, названию или коду..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <div className="relative equipment-column-settings">
                                    <button
                                        onClick={() => setShowEquipmentColumnSettings(!showEquipmentColumnSettings)}
                                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition"
                                    >
                                        Настройки столбцов
                                    </button>
                                    {showEquipmentColumnSettings && (
                                        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-10 equipment-column-settings">
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
                                                                    onClick={() => moveEquipmentUp(index)}
                                                                    disabled={index === 0}
                                                                    className="px-2 py-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-xs rounded"
                                                                >
                                                                    ↑
                                                                </button>
                                                                <button
                                                                    onClick={() => moveEquipmentDown(index)}
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
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200" style={{ tableLayout: 'fixed' }}>
                                <thead className="bg-gray-50">
                                    <tr>
                                        {displayEquipmentColumns.map(column => (
                                            <th key={column} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[120px]" style={{ resize: 'horizontal', overflow: 'auto' }}>
                                                {getEquipmentColumnLabel(column)}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredEquipment.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => {
                                            setSelectedEquipment(item);
                                            setIsEditing(false);
                                        }}>
                                            {displayEquipmentColumns.map(column => (
                                                <td key={column} className="px-6 py-4 whitespace-nowrap">
                                                    {getEquipmentCellContent(item, column)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {selectedEquipment && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closeEquipmentDetail}>
                        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <h2 className="text-2xl font-bold">
                                        {isEditing ? 'Редактирование оборудования' : 'Карточка оборудования'}
                                    </h2>
                                    <button
                                        onClick={closeEquipmentDetail}
                                        className="text-gray-500 hover:text-gray-700 text-2xl"
                                    >
                                        ×
                                    </button>
                                </div>
                                
                                {error && (
                                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                                        {error}
                                    </div>
                                )}
                                
                                {isEditing ? (
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Код товара</label>
                                            <input
                                                type="number"
                                                value={formData.productCode}
                                                onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Цена продажи</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={formData.sellingPrice}
                                                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Цена закупки</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={formData.purchasePrice}
                                                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                rows="4"
                                                placeholder="Введите описание оборудования..."
                                            />
                                        </div>
                                        
                                        {hasPermission('equipment_edit') && selectedEquipment.id !== 'new' && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Изображения</label>
                                                <div className="flex items-center gap-4">
                                                    <input
                                                        type="file"
                                                        ref={fileInputRef}
                                                        accept="image/*"
                                                        multiple
                                                        onChange={handleImageUpload}
                                                        className="hidden"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        disabled={isUploading}
                                                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition disabled:opacity-50"
                                                    >
                                                        {isUploading ? 'Загрузка...' : 'Добавить изображения'}
                                                    </button>
                                                    <span className="text-sm text-gray-500">
                                                        ({uploadedImages.length} изображений)
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Поддерживаются: JPEG, PNG, GIF, WebP. Максимум 10MB на файл.
                                                </p>
                                            </div>
                                        )}
                                        
                                        <div className="flex gap-2 pt-4">
                                            <button
                                                type="submit"
                                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition"
                                            >
                                                Сохранить
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setIsEditing(false)}
                                                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
                                            >
                                                Отмена
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="flex gap-6">
                                        <div className="w-1/3">
                                            {renderImageGallery()}
                                        </div>
                                        
                                        <div className="w-2/3">
                                            <div className="mb-4">
                                                <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedEquipment.name}</h3>
                                                <div className="flex gap-4 text-sm text-gray-500">
                                                    <span>ID: {selectedEquipment.id}</span>
                                                    {selectedEquipment.productCode && (
                                                        <span>Код товара: {selectedEquipment.productCode}</span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div className="bg-gray-50 p-4 rounded-lg">
                                                    <span className="block text-sm text-gray-500 mb-1">Цена закупки</span>
                                                    <span className="text-lg font-semibold text-gray-900">
                                                        {selectedEquipment.purchasePrice ? `${selectedEquipment.purchasePrice} ₽` : '-'}
                                                    </span>
                                                </div>
                                                <div className="bg-gray-50 p-4 rounded-lg">
                                                    <span className="block text-sm text-gray-500 mb-1">Цена продажи</span>
                                                    <span className="text-lg font-semibold text-gray-900">
                                                        {selectedEquipment.sellingPrice ? `${selectedEquipment.sellingPrice} ₽` : '-'}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <span className="block text-sm text-gray-500 mb-1">Описание</span>
                                                <p className="text-gray-900">
                                                    {selectedEquipment.description || 'Описание отсутствует'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {!isEditing && (
                                    <div className="mt-6 flex justify-end gap-3">
                                        <button
                                            onClick={closeEquipmentDetail}
                                            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition"
                                        >
                                            Закрыть
                                        </button>
                                        {hasPermission('equipment_delete') && selectedEquipment.id !== 'new' && (
                                            <button
                                                onClick={() => {
                                                    setEquipmentToDelete(selectedEquipment);
                                                    setShowDeleteConfirm(true);
                                                }}
                                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
                                            >
                                                Удалить
                                            </button>
                                        )}
                                        {hasPermission('equipment_edit') && selectedEquipment.id !== 'new' && (
                                            <button
                                                onClick={() => {
                                                    setFormData({
                                                        name: selectedEquipment.name,
                                                        productCode: selectedEquipment.productCode || '',
                                                        sellingPrice: selectedEquipment.sellingPrice || '',
                                                        purchasePrice: selectedEquipment.purchasePrice || '',
                                                        description: selectedEquipment.description || '',
                                                    });
                                                    setIsEditing(true);
                                                }}
                                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
                                            >
                                                Редактировать
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {renderLightbox()}

                {activeTab === 'expense-history' && (
                    <div>
                        <div className="bg-gray-200 rounded-lg p-4 mb-6">
                            <div className="flex justify-end gap-2">
                                <div className="relative expense-history-column-settings">
                                    <button
                                        onClick={() => setShowExpenseHistoryColumnSettings(!showExpenseHistoryColumnSettings)}
                                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition"
                                    >
                                        Настройки столбцов
                                    </button>
                                    {showExpenseHistoryColumnSettings && (
                                        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-10 expense-history-column-settings" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                            <div className="p-4">
                                                <h4 className="font-medium mb-2">Настройки столбцов</h4>
                                                {expenseHistoryColumnOrder.map((column, index) => (
                                                    <div key={column} className="flex items-center justify-between mb-2">
                                                        <label className="flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={expenseHistoryVisibleColumns[column]}
                                                                onChange={() => handleExpenseHistoryColumnToggle(column)}
                                                                className="mr-2"
                                                            />
                                                            {getExpenseHistoryColumnLabel(column)}
                                                        </label>
                                                        {expenseHistoryVisibleColumns[column] && (
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => moveExpenseHistoryUp(index)}
                                                                    disabled={index === 0}
                                                                    className="px-2 py-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-xs rounded"
                                                                >
                                                                    ↑
                                                                </button>
                                                                <button
                                                                    onClick={() => moveExpenseHistoryDown(index)}
                                                                    disabled={index === expenseHistoryColumnOrder.length - 1}
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
                                <button
                                    onClick={fetchExpenseHistory}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                                >
                                    Обновить
                                </button>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {displayExpenseHistoryColumns.map(column => (
                                            <th key={column} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                {getExpenseHistoryColumnLabel(column)}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {expenseHistory.length === 0 ? (
                                        <tr>
                                            <td colSpan={displayExpenseHistoryColumns.length} className="px-6 py-4 text-center text-gray-500">
                                                Нет данных о расходе оборудования
                                            </td>
                                        </tr>
                                    ) : (
                                        expenseHistory.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                {displayExpenseHistoryColumns.map(column => (
                                                    <td key={column} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {column === 'bidId' && (
                                                            <button
                                                                onClick={() => navigate(`/dashboard/bids/${item.bid?.id}`)}
                                                                className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
                                                            >
                                                                №{item.bid?.id || '-'}
                                                            </button>
                                                        )}
                                                        {column === 'bidTema' && (item.bid?.tema || '-')}
                                                        {column === 'clientObject' && (
                                                            item.bid?.clientObject?.address || 
                                                            item.bid?.clientObject?.name || 
                                                            item.bid?.clientObject?.brandModel || 
                                                            '-'
                                                        )}
                                                        {column === 'client' && (item.bid?.client?.name || '-')}
                                                        {column === 'equipmentName' && (item.equipment?.name || '-')}
                                                        {column === 'imei' && (item.imei || '-')}
                                                        {column === 'quantity' && (item.quantity || 1)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'return-history' && (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="p-6 pb-0 flex justify-between items-center">
                            <h3 className="text-xl font-bold">История возврата</h3>
                            <button
                                onClick={fetchReturnHistory}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                            >
                                Обновить
                            </button>
                        </div>
                        <div className="overflow-x-auto p-6">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Номер заявки</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Тема заявки</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Клиент</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Объект</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Оборудование</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IMEI</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Кол-во</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Причина возврата</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Кто вернул</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Кто составил заявку</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата возврата</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {returnHistory.length === 0 ? (
                                        <tr>
                                            <td colSpan={11} className="px-6 py-8 text-center text-gray-500">
                                                Нет записей о возврате оборудования
                                            </td>
                                        </tr>
                                    ) : (
                                        returnHistory.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <button
                                                        onClick={() => navigate(`/dashboard/bids/${item.bidId}`)}
                                                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
                                                    >
                                                        №{item.bidId}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {item.bidTema}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {item.client}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {item.clientObject}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {item.equipmentName}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {item.imei}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {item.quantity}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {item.returnReason}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {item.returnedBy}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {item.createdBy}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(item.createdAt).toLocaleString('ru-RU')}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={showDeleteConfirm}
                title="Удаление оборудования"
                message={`Вы уверены, что хотите удалить оборудование "${equipmentToDelete?.name}"?`}
                confirmText="Удалить"
                cancelText="Отмена"
                onConfirm={() => {
                    if (equipmentToDelete) {
                        handleDelete(equipmentToDelete);
                        closeEquipmentDetail();
                    }
                    setShowDeleteConfirm(false);
                    setEquipmentToDelete(null);
                }}
                onCancel={() => {
                    setShowDeleteConfirm(false);
                    setEquipmentToDelete(null);
                }}
                confirmButtonColor="red"
            />
        </div>
    );
};

export default Equipment;
