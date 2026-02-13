/**
 * Компонент BidDetail - отображает детали заявки (bid), позволяет
 * изменять клиента, объект клиента и статус заявки.
 */

// Импорты React хуков для управления состоянием и эффектами
import { useState, useEffect, useRef } from 'react';
// Импорты из React Router для получения параметров URL и навигации
import { useParams, useNavigate } from 'react-router-dom';
// Импорты функций API для взаимодействия с сервером
import { getBid, getBids, getClients, updateBid, getClientObjects, getComments, createComment, updateComment, deleteComment, getBidSpecifications, createBidSpecification, updateBidSpecification, deleteBidSpecification, getUsers, getSpecifications, getSpecificationCategories, getSpecificationCategoriesTree, getBidHistory, getBidStatuses, getBidStatusTransitions, getEquipment, getBidEquipment, createBidEquipment, updateBidEquipment, deleteBidEquipment, createBid, createBatchBids, getBidTypes, getClientEquipmentByClient, createClientEquipment, getRoles, getBidFiles, uploadBidFiles, deleteBidFile, getContractByBid, createContract, deleteContract } from '../services/api';
import { UPLOADS_URL } from '../services/config';
// Импорт функций для уведомлений
import { createNotification } from '../services/api';
// Импорт хука аутентификации
import { useAuth } from '../context/AuthContext';
// Импорт хука для проверки разрешений
import { usePermissions } from '../hooks/usePermissions';
// Импорт иконок из Lucide React
import { Trash2, Paperclip, Upload, File, Download, X, Image as ImageIcon, ZoomIn, ZoomOut, RotateCw, Maximize2, RefreshCw, Bold, Italic, Underline, Strikethrough, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Undo, Redo, RotateCcw, FileText } from 'lucide-react';

// Компонент редактора Rich Text
import RichTextEditor from './RichTextEditor';

// Основной компонент BidDetail
const BidDetail = () => {
    // Получение ID заявки из параметров URL
    const { id } = useParams();
    // Хук для навигации между страницами
    const navigate = useNavigate();
    // Хук аутентификации
    const { user } = useAuth();
    // Хук для проверки разрешений
    const { hasPermission } = usePermissions();
    const [bid, setBid] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [activeTab, setActiveTab] = useState('comments');
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingCommentContent, setEditingCommentContent] = useState('');
    const [bidSpecifications, setBidSpecifications] = useState([]);
    const [showAddSpecModal, setShowAddSpecModal] = useState(false);
    const [editingSpec, setEditingSpec] = useState(null);
    const [viewingSpec, setViewingSpec] = useState(null);
    const [showViewSpecModal, setShowViewSpecModal] = useState(false);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [specifications, setSpecifications] = useState([]);
    const [specCategories, setSpecCategories] = useState([]);
    const [expandedCategories, setExpandedCategories] = useState(new Set());
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [history, setHistory] = useState([]);
    const [updNumber, setUpdNumber] = useState('');
    const [updDate, setUpdDate] = useState('');
    const [editingUpd, setEditingUpd] = useState(false);
    const [contract, setContract] = useState('');
    const [editingContract, setEditingContract] = useState(false);
    const [workAddress, setWorkAddress] = useState('');
    const [editingWorkAddress, setEditingWorkAddress] = useState(false);
    const [bidStatuses, setBidStatuses] = useState([]);
    const [bidStatusTransitions, setBidStatusTransitions] = useState([]);
    const [bidEquipment, setBidEquipment] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
    const [editingEquipment, setEditingEquipment] = useState(null);
    const [showDeleteEquipmentModal, setShowDeleteEquipmentModal] = useState(false);
    const [equipmentToDelete, setEquipmentToDelete] = useState(null);
    const [deletionReason, setDeletionReason] = useState('');

    const [childBids, setChildBids] = useState([]);
    const [showCreateChildBidModal, setShowCreateChildBidModal] = useState(false);
    const [isCloneMode, setIsCloneMode] = useState(false);
    const [clients, setClients] = useState([]);
    const [clientObjects, setClientObjects] = useState([]);
    const [bidTypes, setBidTypes] = useState([]);
    const [roles, setRoles] = useState([]);

    const [remainingTime, setRemainingTime] = useState(null);
    const [bidFiles, setBidFiles] = useState([]);
    const [missingFiles, setMissingFiles] = useState(new Set());
    const [uploadingFile, setUploadingFile] = useState(false);
    const [showDeleteFileModal, setShowDeleteFileModal] = useState(false);
    const [fileToDelete, setFileToDelete] = useState(null);
    const [showImageViewer, setShowImageViewer] = useState(false);
    const [currentImage, setCurrentImage] = useState(null);
    const [imageZoom, setImageZoom] = useState(100);
    const [imageRotation, setImageRotation] = useState(0);
    const [imagePan, setImagePan] = useState({ x: 0, y: 0 });
    const [isMiddleDragging, setIsMiddleDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [expandedFileGroups, setExpandedFileGroups] = useState(new Set());
    const imageContainerRef = useRef(null);
    
    // Contract state
    const [contracts, setContracts] = useState([]);
    const [editingContractId, setEditingContractId] = useState(null);
    const [showContractModal, setShowContractModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [contractViewMode, setContractViewMode] = useState(false);
    const [contractFormData, setContractFormData] = useState({
        bidEquipmentId: null,
        clientName: '',
        responsibleName: '',
        clientObject: '',
        equipmentName: '',
        imei: '',
        quantity: 1,
        contractEndDate: '',
    });
    
    const [childBidFormData, setChildBidFormData] = useState({
        clientId: '',
        title: '',
        bidTypeId: '',
        description: '',
        clientObjectId: '',
        workAddress: '',
        contactFullName: '',
        contactPhone: '',
        parentId: '',
        plannedResolutionDate: '',
        plannedReactionTimeMinutes: '',
        assignedAt: '',
        plannedDurationMinutes: '',
        amount: 0,
    });

    // State for batch replication
    const [isBatchMode, setIsBatchMode] = useState(false);
    const [selectedClientObjects, setSelectedClientObjects] = useState([]);

    // Note: batch mode is only available on the main Bids tab, not in child bid modal

    // Функция сброса формы дочерней заявки
    const resetChildBidForm = () => {
        setChildBidFormData({
            clientId: '',
            title: '',
            bidTypeId: '',
            description: '',
            clientObjectId: '',
            workAddress: '',
            contactFullName: '',
            contactPhone: '',
            parentId: '',
            plannedResolutionDate: '',
            plannedReactionTimeMinutes: '',
            assignedAt: '',
            plannedDurationMinutes: '',
            amount: 0,
        });
        setClientObjects([]);
    };

    // История изменений описания для undo/redo
    const [childDescHistory, setChildDescHistory] = useState([]);
    const [childDescHistoryIndex, setChildDescHistoryIndex] = useState(-1);

    // Функция добавления в историю описания
    const addToChildDescHistory = (newValue) => {
        setChildDescHistory(prev => {
            const newHistory = prev.slice(0, childDescHistoryIndex + 1);
            return [...newHistory, newValue];
        });
        setChildDescHistoryIndex(prev => prev + 1);
    };

    // Функция форматирования текста описания
    const formatChildDescription = (action) => {
        const textarea = document.getElementById('child-description-textarea');
        if (!textarea) return;
        
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = childBidFormData.description;
        const selectedText = text.substring(start, end);
        
        let newText;
        let cursorPosition = end;
        
        switch (action) {
            case 'bold':
                newText = text.substring(0, start) + '**' + selectedText + '**' + text.substring(end);
                cursorPosition = end + 4;
                break;
            case 'italic':
                newText = text.substring(0, start) + '_' + selectedText + '_' + text.substring(end);
                cursorPosition = end + 2;
                break;
            case 'underline':
                newText = text.substring(0, start) + '__' + selectedText + '__' + text.substring(end);
                cursorPosition = end + 4;
                break;
            case 'strikeThrough':
                newText = text.substring(0, start) + '~~' + selectedText + '~~' + text.substring(end);
                cursorPosition = end + 4;
                break;
            case 'unorderedList':
                newText = text.substring(0, start) + '• ' + selectedText.replace(/\n/g, '\n• ') + text.substring(end);
                break;
            case 'orderedList':
                newText = text.substring(0, start) + '1. ' + selectedText.replace(/\n/g, (match, offset) => offset > 0 ? '\n' + (selectedText.substring(0, offset).split('\n').length) + '. ' : '1. ') + text.substring(end);
                break;
            case 'alignLeft':
            case 'alignCenter':
            case 'alignRight':
                return;
            default:
                return;
        }
        
        addToChildDescHistory(newText);
        setChildBidFormData(prev => ({ ...prev, description: newText }));
        
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(cursorPosition, cursorPosition);
        }, 0);
    };

    // Функция undo для описания
    const undoChildDescription = () => {
        if (childDescHistoryIndex > 0) {
            const newIndex = childDescHistoryIndex - 1;
            setChildDescHistoryIndex(newIndex);
            setChildBidFormData(prev => ({ ...prev, description: childDescHistory[newIndex] }));
        }
    };

    // Функция redo для описания
    const redoChildDescription = () => {
        if (childDescHistoryIndex < childDescHistory.length - 1) {
            const newIndex = childDescHistoryIndex + 1;
            setChildDescHistoryIndex(newIndex);
            setChildBidFormData(prev => ({ ...prev, description: childDescHistory[newIndex] }));
        }
    };

    // Функция очистки форматирования описания
    const clearChildDescriptionFormatting = () => {
        const text = childBidFormData.description;
        const cleanText = text
            .replace(/\*\*/g, '')
            .replace(/__/g, '')
            .replace(/~~/g, '')
            .replace(/_/g, '')
            .replace(/• /g, '')
            .replace(/\d+\. /g, '');
        
        addToChildDescHistory(cleanText);
        setChildBidFormData(prev => ({ ...prev, description: cleanText }));
    };

    // Обновление истории при изменении описания
    const handleChildDescriptionChange = (e) => {
        const newValue = e.target.value;
        addToChildDescHistory(newValue);
        setChildBidFormData(prev => ({ ...prev, description: newValue }));
    };

    useEffect(() => {
        fetchBid();
        fetchComments();
        fetchBidSpecifications();
        fetchBidEquipment();
        fetchEquipment();
        fetchUsers();
        fetchRoles();
        fetchSpecifications();
        fetchSpecCategories();
        fetchHistory();
        fetchChildBids();
        fetchClients();
        fetchBidTypes();
        fetchBidFiles();
        fetchContract();
    }, [id]);

    useEffect(() => {
        if (bid) {
            fetchBidStatuses();
            fetchBidStatusTransitions();
        }
    }, [bid]);

    useEffect(() => {
        fetchClientObjects(childBidFormData.clientId);
        setChildBidFormData(prev => ({ ...prev, clientObjectId: '' }));
    }, [childBidFormData.clientId]);
    
    // Обновление оставшегося времени каждую минуту
    useEffect(() => {
        const updateRemainingTime = () => {
            if (bid?.statusMetadata?.deadlines?.deadline) {
                setRemainingTime(formatRemainingTime(bid.statusMetadata.deadlines.deadline));
            }
        };
        
        updateRemainingTime();
        const interval = setInterval(updateRemainingTime, 60000); // Обновлять каждую минуту
        
        return () => clearInterval(interval);
    }, [bid]);
    useEffect(() => {
        if (bid) {
            setUpdNumber(bid.updNumber || '');
            setUpdDate(bid.updDate ? new Date(bid.updDate).toISOString().split('T')[0] : '');
            setContract(bid.contract || '');
            setWorkAddress(bid.workAddress || '');
        }
    }, [bid]);

    // Закрытие выпадающего списка при клике вне него
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showStatusDropdown && !event.target.closest('.status-dropdown-container')) {
                setShowStatusDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showStatusDropdown]);


    const fetchBid = async () => {
        try {
            const response = await getBid(id);
            setBid(response.data);
            fetchEquipment(); // Fetch equipment for this bid's client
            // Логируем данные заявки при открытии
            console.log('Открытие заявки ID:', id);
            console.log('Данные заявки:', {
                clientId: response.data.clientId,
                clientName: response.data.clientName,
                tema: response.data.title,
                amount: response.data.amount,
                status: response.data.status,
                description: response.data.description,
                clientObjectId: response.data.clientObjectId,
                updNumber: response.data.updNumber,
                updDate: response.data.updDate,
                contract: response.data.contract,
                bidTypeName: response.data.bidType ? response.data.bidType.name : 'Не указан',
                creatorName: response.data.creatorName,
                createdAt: response.data.createdAt,
                updatedAt: response.data.updatedAt,
            });
        } catch (error) {
            setError('Заявка не найдена');
            console.error('Error fetching bid:', error);
        } finally {
            setLoading(false);
        }
    };




    const fetchComments = async () => {
        try {
            const response = await getComments(id);
            setComments(response.data);
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    };

    const fetchBidSpecifications = async () => {
        try {
            const response = await getBidSpecifications(id);
            setBidSpecifications(response.data);
        } catch (error) {
            console.error('Error fetching bid specifications:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await getUsers();
            setAvailableUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchSpecifications = async () => {
        try {
            const response = await getSpecifications();
            setSpecifications(response.data);
        } catch (error) {
            console.error('Error fetching specifications:', error);
        }
    };

    const fetchSpecCategories = async () => {
        try {
            const response = await getSpecificationCategoriesTree();
            setSpecCategories(response.data);
        } catch (error) {
            console.error('Error fetching specification categories:', error);
        }
    };

    const fetchBidEquipment = async () => {
        try {
            const response = await getBidEquipment(id);
            setBidEquipment(response.data);
        } catch (error) {
            console.error('Error fetching bid equipment:', error);
        }
    };

    const fetchEquipment = async () => {
        try {
            const response = await getEquipment();
            setEquipment(response.data);
        } catch (error) {
            console.error('Error fetching equipment:', error);
        }
    };

    const fetchHistory = async () => {
        try {
            const response = await getBidHistory(id);
            setHistory(response.data);
        } catch (error) {
            console.error('Error fetching bid history:', error);
        }
    };

    const fetchChildBids = async () => {
        try {
            // Use the existing getBids API but filter by parentId
            const response = await getBids();
            // Ensure response.data is an array before filtering
            const bidsData = Array.isArray(response.data) ? response.data : [];
            const childBids = bidsData.filter(b => b.parentId === parseInt(id));
            setChildBids(childBids);
        } catch (error) {
            console.error('Error fetching child bids:', error);
            setChildBids([]);
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

    const fetchClientObjects = async (clientId) => {
        if (!clientId) {
            setClientObjects([]);
            return;
        }
        try {
            const response = await getClientObjects(clientId);
            setClientObjects(response.data);
        } catch (error) {
            console.error('Error fetching client objects:', error);
            setClientObjects([]);
        }
    };

    const fetchBidTypes = async () => {
        try {
            const response = await getBidTypes();
            setBidTypes(response.data);
        } catch (error) {
            console.error('Error fetching bid types:', error);
        }
    };

    const fetchRoles = async () => {
        try {
            const response = await getRoles();
            setRoles(response.data);
        } catch (error) {
            console.error('Error fetching roles:', error);
        }
    };

    const fetchBidFiles = async () => {
        try {
            const response = await getBidFiles(id);
            const decodedFiles = response.data.map(file => ({
                ...file,
                path: `${UPLOADS_URL}/bids/${id}/${decodeURIComponent(file.name)}`
            }));
            setBidFiles(decodedFiles);
            
            // Check which files actually exist on the server (silent check)
            const missing = new Set();
            
            // Helper function to check file existence silently
            const checkFileExists = (url, fileName) => {
                return new Promise((resolve) => {
                    // For images, use Image object
                    if (url.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i)) {
                        const img = new Image();
                        img.onload = () => resolve(true);
                        img.onerror = () => {
                            console.info(`📁 Файл отсутствует: ${fileName}`);
                            resolve(false);
                        };
                        img.src = url;
                    } else {
                        // For other files, use XMLHttpRequest
                        const xhr = new XMLHttpRequest();
                        xhr.open('HEAD', url, true);
                        xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 400);
                        xhr.onerror = () => {
                            console.info(`📁 Файл отсутствует: ${fileName}`);
                            resolve(false);
                        };
                        xhr.ontimeout = () => {
                            console.info(`📁 Файл отсутствует (таймаут): ${fileName}`);
                            resolve(false);
                        };
                        xhr.timeout = 5000;
                        xhr.send();
                    }
                });
            };
            
            // Check all files
            for (const file of decodedFiles) {
                const exists = await checkFileExists(file.path, file.originalName || file.name);
                if (!exists) {
                    missing.add(file.name);
                }
            }
            
            setMissingFiles(missing);
        } catch (error) {
            console.error('Error fetching bid files:', error);
        }
    };

    const fetchContract = async () => {
        try {
            const response = await getContractByBid(id);
            if (response.data && response.data.data) {
                // Backend returns an array of contracts
                const contractsData = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
                setContracts(contractsData);
                // Initialize form data for new contract from bid and equipment
                const firstEquipment = bidEquipment && bidEquipment.length > 0 ? bidEquipment[0] : null;
                setContractFormData({
                    clientName: bid?.clientName || '',
                    responsibleName: user?.fullName || bid?.responsibleName || bid?.currentResponsibleName || '',
                    clientObject: bid?.clientObject ? `${bid.clientObject.brandModel} ${bid.clientObject.stateNumber || ''}` : '',
                    equipmentName: firstEquipment?.equipment?.name || '',
                    imei: firstEquipment?.imei || '',
                    quantity: firstEquipment?.quantity || 1,
                    contractEndDate: bid?.plannedResolutionDate ? new Date(bid.plannedResolutionDate).toISOString().split('T')[0] : '',
                });
            } else {
                setContracts([]);
                // Initialize form data from bid and equipment
                const firstEquipment = bidEquipment && bidEquipment.length > 0 ? bidEquipment[0] : null;
                setContractFormData({
                    clientName: bid?.clientName || '',
                    responsibleName: user?.fullName || bid?.responsibleName || bid?.currentResponsibleName || '',
                    clientObject: bid?.clientObject ? `${bid.clientObject.brandModel} ${bid.clientObject.stateNumber || ''}` : '',
                    equipmentName: firstEquipment?.equipment?.name || '',
                    imei: firstEquipment?.imei || '',
                    quantity: firstEquipment?.quantity || 1,
                    contractEndDate: bid?.plannedResolutionDate ? new Date(bid.plannedResolutionDate).toISOString().split('T')[0] : '',
                });
            }
        } catch (error) {
            console.error('Error fetching contracts:', error);
        }
    };

    const handleCreateContract = async () => {
        try {
            // Don't send contractNumber - it will be auto-generated by backend for new contracts
            const { contractNumber, ...dataToSend } = contractFormData;
            
            if (editingContractId) {
                // Update existing contract
                await updateContract(editingContractId, dataToSend);
            } else {
                // Create new contract
                await createContract({
                    bidId: parseInt(id),
                    ...dataToSend,
                });
            }
            setShowContractModal(false);
            fetchContract();
        } catch (error) {
            console.error('Error saving contract:', error);
        }
    };

    const handleDeleteContract = async (contractId) => {
        if (!contractId) return;
        try {
            await deleteContract(contractId);
            fetchContract();
            setShowContractModal(false);
            setEditingContractId(null);
        } catch (error) {
            console.error('Error deleting contract:', error);
        }
    };

    const fileInputRef = useRef(null);

    const handleUploadFile = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        try {
            setUploadingFile(true);
            await uploadBidFiles(id, files);
            await fetchBidFiles();
        } catch (error) {
            console.error('Error uploading files:', error);
            alert('Ошибка при загрузке файлов: ' + (error.response?.data?.message || error.message));
        } finally {
            setUploadingFile(false);
        }
    };

    // Группировка файлов по дате загрузки
    const groupFilesByDate = (files) => {
        const groups = {};
        files.forEach(file => {
            const date = new Date(file.createdAt);
            const dateKey = date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
            const timeKey = date.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit'
            });
            const groupKey = `${dateKey}_${timeKey}`;
            
            if (!groups[groupKey]) {
                groups[groupKey] = {
                    dateKey,
                    timeKey,
                    uploaderName: file.uploaderName,
                    files: []
                };
            }
            groups[groupKey].files.push(file);
        });
        return Object.values(groups).sort((a, b) => {
            const dateA = new Date(a.dateKey + ' ' + a.timeKey);
            const dateB = new Date(b.dateKey + ' ' + b.timeKey);
            return dateB - dateA;
        });
    };

    // Переключение состояния группы файлов
    const toggleFileGroup = (groupKey) => {
        const newExpanded = new Set(expandedFileGroups);
        if (newExpanded.has(groupKey)) {
            newExpanded.delete(groupKey);
        } else {
            newExpanded.add(groupKey);
        }
        setExpandedFileGroups(newExpanded);
    };

    const handleDeleteFile = (fileName) => {
        setFileToDelete(fileName);
        setShowDeleteFileModal(true);
    };
    
    const confirmDeleteFile = async () => {
        if (!fileToDelete) return;
        
        try {
            await deleteBidFile(id, fileToDelete);
            await fetchBidFiles();
        } catch (error) {
            console.error('Error deleting file:', error);
            alert('Ошибка при удалении файла');
        } finally {
            setShowDeleteFileModal(false);
            setFileToDelete(null);
        }
    };
    
    const deleteAllMissingFiles = async () => {
        if (missingFiles.size === 0) return;
        
        const confirmDelete = window.confirm(`Удалить все отсутствующие файлы (${missingFiles.size} шт.)?`);
        if (!confirmDelete) return;
        
        try {
            // Delete each missing file
            const deletePromises = Array.from(missingFiles).map(fileName => 
                deleteBidFile(id, fileName).catch(error => {
                    console.error(`Error deleting file ${fileName}:`, error);
                })
            );
            
            await Promise.all(deletePromises);
            await fetchBidFiles();
            alert(`Удалено файлов: ${missingFiles.size}`);
        } catch (error) {
            console.error('Error deleting missing files:', error);
            alert('Ошибка при удалении файлов');
        }
    };

    const handleDownloadFile = async (file) => {
        try {
            // Используем новый аутентифицированный endpoint для скачивания
            const response = await fetch(`/api/bids/${id}/files/${encodeURIComponent(file.name)}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = file.originalName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } else {
                throw new Error('Failed to download file');
            }
        } catch (error) {
            console.error('Ошибка при скачивании файла:', error);
            // Fallback: открываем в новой вкладке с аутентификацией
            const link = document.createElement('a');
            link.href = `/api/bids/${id}/files/${encodeURIComponent(file.name)}`;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const openImageViewer = (file) => {
        setCurrentImage(file);
        setImageZoom(100);
        setImageRotation(0);
        setImagePan({ x: 0, y: 0 });
        setShowImageViewer(true);
        document.body.style.overflow = 'hidden';
    };

    const closeImageViewer = () => {
        setShowImageViewer(false);
        setCurrentImage(null);
        setImagePan({ x: 0, y: 0 });
        document.body.style.overflow = '';
    };

    // Non-passive wheel event listener for zoom
    useEffect(() => {
        const container = imageContainerRef.current;
        if (!container) return;

        const handleWheel = (e) => {
            e.preventDefault();
            
            const delta = e.deltaY > 0 ? -10 : 10;
            const newZoom = Math.min(Math.max(imageZoom + delta, 25), 300);
            setImageZoom(newZoom);
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        
        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, [showImageViewer, imageZoom]);

    const handleZoomIn = () => {
        setImageZoom(prev => Math.min(prev + 25, 300));
    };

    const handleZoomOut = () => {
        setImageZoom(prev => Math.max(prev - 25, 25));
    };

    const handleWheelZoom = (e) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const delta = e.deltaY > 0 ? -10 : 10;
        const newZoom = Math.min(Math.max(imageZoom + delta, 25), 300);
        
        // Zoom towards cursor position
        const zoomRatio = newZoom / imageZoom;
        setImagePan({
            x: mouseX - (mouseX - imagePan.x) * zoomRatio,
            y: mouseY - (mouseY - imagePan.y) * zoomRatio
        });
        setImageZoom(newZoom);
    };

    const handleRotate = () => {
        setImageRotation(prev => (prev + 90) % 360);
    };

    const handleMouseDown = (e) => {
        // Middle mouse button (button 1) for panning
        if (e.button === 1) {
            e.preventDefault();
            setIsMiddleDragging(true);
            setDragStart({ x: e.clientX - imagePan.x, y: e.clientY - imagePan.y });
        }
    };

    const handleMouseMove = (e) => {
        // Track mouse position for zoom-to-cursor
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        
        if (isMiddleDragging) {
            setImagePan({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = (e) => {
        // Middle mouse button release
        if (e.button === 1) {
            setIsMiddleDragging(false);
        }
    };

    const fetchBidStatuses = async () => {
        if (bid && bid.bidTypeId) {
            try {
                const response = await getBidStatuses(bid.bidTypeId);
                setBidStatuses(response.data);
            } catch (error) {
                console.error('Error fetching bid statuses:', error);
            }
        }
    };

    const fetchBidStatusTransitions = async () => {
        if (bid && bid.bidTypeId) {
            try {
                const response = await getBidStatusTransitions(bid.bidTypeId);
                setBidStatusTransitions(response.data);
            } catch (error) {
                console.error('Error fetching bid status transitions:', error);
            }
        }
    };


    // Получение отображаемого имени ответственного (пользователь или роль)
    const getResponsibleDisplayName = () => {
        // Если есть ответственный пользователь, показываем его
        if (bid.bidTypeResponsibleName) {
            return bid.bidTypeResponsibleName;
        }
        
        // Иначе ищем роль в текущем статусе
        if (bid.bidTypeStatuses && bid.status) {
            const currentStatus = bid.bidTypeStatuses.find(s => s.name === bid.status);
            if (currentStatus && currentStatus.responsibleRoleId) {
                const role = roles.find(r => r.id === parseInt(currentStatus.responsibleRoleId));
                if (role) {
                    return `Роль: ${role.name}`;
                }
            }
        }
        
        return 'Не указан';
    };
    const getAvailableStatuses = () => {
        if (!bid || !bidStatuses.length || !bidStatusTransitions.length) return [];

        // Найти текущий статус по имени
        const currentStatus = bidStatuses.find(status => status.name === bid.status);
        if (!currentStatus) return [];

        // Найти все доступные переходы из текущего статуса
        const availableTransitions = bidStatusTransitions.filter(
            transition => transition.fromPosition === currentStatus.position
        );

        // Получить статусы для этих переходов
        return availableTransitions.map(transition => {
            return bidStatuses.find(status => status.position === transition.toPosition);
        }).filter(Boolean); // Убрать null/undefined
    };

    // Функция для получения цвета статуса из bidTypeStatuses
    const getStatusColorFromBid = (statusName) => {
        if (!bid || !bid.bidTypeStatuses) return null;
        const statusConfig = bid.bidTypeStatuses.find(s => s.name === statusName);
        return statusConfig?.color || null;
    };

    // Функция для затемнения цвета (для hover эффекта)
    const adjustColor = (color, amount) => {
        return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
    };





    const handleChangeStatus = async (newStatus) => {
        try {
            // Если меняется статус, автоматически назначаем текущего пользователя ответственным
            // если для нового статуса не назначен конкретный пользователь
            const newStatusConfig = bid.bidTypeStatuses?.find(s => s.name === newStatus);
            const needsAutoAssign = !newStatusConfig?.responsibleUserId;
            
            await updateBid(id, { 
                status: newStatus,
                ...(needsAutoAssign && { currentResponsibleUserId: user?.id })
            });
            fetchBid();
            fetchHistory();
        } catch (error) {
            console.error('Error changing status:', error);
        }
    };


    const handleSubmitComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            await createComment(id, { content: newComment });
            setNewComment('');
            fetchComments();
            fetchHistory();
        } catch (error) {
            console.error('Error creating comment:', error);
            alert('Ошибка при добавлении комментария. Возможно, истек срок действия токена.');
        }
    };

    const handleEditComment = (comment) => {
        setEditingCommentId(comment.id);
        setEditingCommentContent(comment.content);
    };

    const handleCancelEdit = () => {
        setEditingCommentId(null);
        setEditingCommentContent('');
    };

    const handleSaveEdit = async () => {
        if (!editingCommentContent.trim()) return;
        try {
            await updateComment(id, editingCommentId, { content: editingCommentContent.trim() });
            setEditingCommentId(null);
            setEditingCommentContent('');
            fetchComments();
            fetchHistory();
        } catch (error) {
            console.error('Error updating comment:', error);
            alert('Ошибка при обновлении комментария. Возможно, истек срок действия токена.');
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!confirm('Вы уверены, что хотите удалить этот комментарий?')) return;
        try {
            await deleteComment(id, commentId);
            fetchComments();
            fetchHistory();
        } catch (error) {
            console.error('Error deleting comment:', error);
            alert('Ошибка при удалении комментария. Возможно, истек срок действия токена.');
        }
    };

    const handleDeleteSpec = async (specId) => {
        if (!confirm('Вы уверены, что хотите удалить эту спецификацию?')) return;
        try {
            await deleteBidSpecification(id, specId);
            fetchBidSpecifications();
            fetchHistory();
        } catch (error) {
            console.error('Error deleting specification:', error);
            alert('Ошибка при удалении спецификации.');
        }
    };

    const handleDeleteEquipment = (equipment) => {
        setEquipmentToDelete(equipment);
        setDeletionReason('');
        setShowDeleteEquipmentModal(true);
    };

    const confirmDeleteEquipment = async () => {
        if (!equipmentToDelete) return;
        try {
            await deleteBidEquipment(equipmentToDelete.id, deletionReason);
            setShowDeleteEquipmentModal(false);
            setEquipmentToDelete(null);
            setDeletionReason('');
            fetchBidEquipment();
            fetchHistory();
        } catch (error) {
            console.error('Error deleting equipment:', error);
            alert('Ошибка при удалении оборудования.');
        }
    };

    const handleUpdateBid = async (updates) => {
        try {
            await updateBid(id, updates);
            fetchBid();
            fetchHistory();
        } catch (error) {
            console.error('Error updating bid:', error);
            alert('Ошибка при обновлении заявки.');
        }
    };

    const handleSaveSpec = async (specData) => {
        try {
            if (editingSpec) {
                await updateBidSpecification(id, editingSpec.id, specData);
            } else {
                await createBidSpecification(id, specData);
                
                // Создаем уведомление о добавлении спецификации
                const spec = specifications.find(s => s.id.toString() === specData.specificationId);
                await createNotification({
                    userId: bid.createdBy,
                    title: 'Добавлена спецификация',
                    message: `В заявку №${bid.id} добавлена спецификация "${spec?.name || 'Спецификация'}"`,
                    type: 'specification_added',
                    bidId: bid.id,
                });
            }
            setShowAddSpecModal(false);
            setEditingSpec(null);
            fetchBidSpecifications();
            fetchHistory();
        } catch (error) {
            console.error('Error saving specification:', error);
            alert('Ошибка при сохранении спецификации.');
        }
    };

    const handleSaveEquipment = async (equipmentData) => {
        try {
            if (editingEquipment) {
                await updateBidEquipment(editingEquipment.id, equipmentData);
            } else {
                // First, ensure the equipment is assigned to the client
                const clientEquipmentResponse = await getClientEquipmentByClient(bid.clientId);
                const clientHasEquipment = clientEquipmentResponse.data.some(ce => ce.equipmentId === parseInt(equipmentData.equipmentId));

                if (!clientHasEquipment) {
                    // Assign equipment to client
                    await createClientEquipment({
                        clientId: bid.clientId,
                        equipmentId: equipmentData.equipmentId
                    });
                }

                // Then create bid equipment
                await createBidEquipment({ ...equipmentData, bidId: id });

                // Создаем уведомление о добавлении оборудования
                const equip = clientEquipmentResponse.data.find(e => e.equipment && e.equipment.id.toString() === equipmentData.equipmentId);
                await createNotification({
                    userId: bid.createdBy,
                    title: 'Добавлено оборудование',
                    message: `В заявку №${bid.id} добавлено оборудование "${equip?.name || 'Оборудование'}"`,
                    type: 'equipment_added',
                    bidId: bid.id,
                });
            }
            setShowAddEquipmentModal(false);
            setEditingEquipment(null);
            fetchBidEquipment();
            fetchHistory();
        } catch (error) {
            console.error('Error saving equipment:', error);
            alert('Ошибка при сохранении оборудования.');
        }
    };


    const getDefaultPlannedResolutionDate = () => {
        const fiveDaysFromNow = new Date();
        fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
        return fiveDaysFromNow.toISOString().slice(0, 16);
    };


    const handleCreateChildBid = async (e) => {
        e.preventDefault();
        if (!childBidFormData.title.trim()) return;

        try {
            await createBid({
                clientId: childBidFormData.clientId,
                title: childBidFormData.title,
                description: childBidFormData.description,
                bidTypeId: childBidFormData.bidTypeId ? parseInt(childBidFormData.bidTypeId) : null,
                amount: childBidFormData.amount,
                workAddress: childBidFormData.workAddress,
                contactFullName: childBidFormData.contactFullName,
                contactPhone: childBidFormData.contactPhone,
                parentId: isCloneMode ? null : parseInt(id),
                plannedResolutionDate: childBidFormData.plannedResolutionDate,
                plannedReactionTimeMinutes: childBidFormData.plannedReactionTimeMinutes,
                assignedAt: childBidFormData.assignedAt,
                plannedDurationMinutes: childBidFormData.plannedDurationMinutes,
                clientObjectId: childBidFormData.clientObjectId || null,
                status: 'Открыта',
            });

            setShowCreateChildBidModal(false);
            setIsCloneMode(false);
            setChildBidFormData({
                clientId: '',
                title: '',
                bidTypeId: '',
                description: '',
                clientObjectId: '',
                workAddress: '',
                contactFullName: '',
                contactPhone: '',
                parentId: '',
                plannedResolutionDate: getDefaultPlannedResolutionDate(),
                plannedReactionTimeMinutes: '',
                assignedAt: '',
                plannedDurationMinutes: '',
                amount: 0,
            });
            if (!isCloneMode) {
                fetchChildBids(); // Refresh the child bids list only for child bids
            }
        } catch (error) {
            console.error('Error creating bid:', error);
            alert('Ошибка при создании дочерней заявки.');
        }
    };

    // Функция для форматирования оставшегося времени
    const formatRemainingTime = (deadline) => {
        if (!deadline) return null;
        
        const now = new Date();
        const deadlineDate = new Date(deadline);
        const diff = deadlineDate - now;
        
        if (diff <= 0) {
            return { text: 'Превышено', color: 'text-red-600', bgColor: 'bg-red-100' };
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) {
            return { 
                text: `${days}д ${hours}ч ${minutes}м`, 
                color: days > 2 ? 'text-green-600' : 'text-yellow-600',
                bgColor: days > 2 ? 'bg-green-100' : 'bg-yellow-100'
            };
        }
        if (hours > 0) {
            return { 
                text: `${hours}ч ${minutes}м`, 
                color: hours > 5 ? 'text-green-600' : 'text-orange-600',
                bgColor: hours > 5 ? 'bg-green-100' : 'bg-orange-100'
            };
        }
        return { 
            text: `${minutes}м`, 
            color: 'text-red-600',
            bgColor: 'bg-red-100'
        };
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-500">Загрузка...</div>
            </div>
        );
    }

    if (error || !bid) {
        return (
            <div className="text-center py-8">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={() => navigate('/dashboard/bids')}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                >
                    Вернуться к заявкам
                </button>
            </div>
        );
    }

    const formattedCreatedAt = bid.createdAt ? new Date(bid.createdAt).toLocaleString('ru-RU', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }) : '';

    return (
        <div className="flex min-h-screen">
            <div className="flex-1 p-4">
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => navigate('/dashboard/bids')}
                        className="text-black text-sm px-2 py-1 flex items-center"
                    >
                        <span className="text-blue-500 mr-1 font-bold">←</span> Назад
                    </button>
                </div>

                {/* Header with bid number and theme */}
                <div className="mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">
                        №{bid.id} {bid.tema}
                    </h1>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Клиент</label>
                            <p
                                className="text-gray-900 text-lg cursor-pointer hover:text-blue-600 transition"
                                onClick={() => navigate(`/dashboard/clients/${bid.clientId}`)}
                            >
                                {bid.clientName}
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Объект обслуживания</label>
                            <div className="text-gray-900">
                                {bid.clientObject ? (
                                    <div>
                                        <p className="font-medium">{bid.clientObject.brandModel}</p>
                                        <p className="text-sm text-gray-600">Гос. номер: {bid.clientObject.stateNumber || 'N/A'}</p>
                                    </div>
                                ) : (
                                    <p className="text-gray-500">Не назначен</p>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Заявку составил/ла</label>
                            <p className="text-gray-900 text-lg">{bid.creatorName}</p>
                        </div>
                        {bid.parent && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Родительская заявка</label>
                                <p
                                    className="text-gray-900 text-lg cursor-pointer hover:text-blue-600 transition"
                                    onClick={() => navigate(`/dashboard/bids/${bid.parent.id}`)}
                                >
                                    №{bid.parent.id} {bid.parent.tema}
                                </p>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">№, дата УПД</label>
                            {editingUpd ? (
                                <div className="flex flex-wrap gap-2">
                                    <input
                                        type="text"
                                        value={updNumber}
                                        onChange={(e) => setUpdNumber(e.target.value)}
                                        className="flex-1 min-w-[200px] max-w-[300px] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Номер УПД"
                                    />
                                    <div className="flex flex-wrap gap-1 sm:gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => {
                                                handleUpdateBid({ updNumber });
                                                setEditingUpd(false);
                                            }}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 sm:px-3 sm:py-2 text-sm rounded-lg whitespace-nowrap"
                                        >
                                            Сохранить
                                        </button>
                                        <button
                                            onClick={() => {
                                                setUpdNumber(bid.updNumber || '');
                                                setEditingUpd(false);
                                            }}
                                            className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 sm:px-3 sm:py-2 text-sm rounded-lg whitespace-nowrap"
                                        >
                                            Отмена
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <p className="text-gray-900">{updNumber || 'Не указан'}</p>
                                    <button
                                        onClick={() => setEditingUpd(true)}
                                        className="text-blue-500 hover:text-blue-700"
                                    >
                                        ✏️
                                    </button>
                                </div>
                            )}
                        </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Адрес проведения работ</label>
                            {editingWorkAddress ? (
                                <div className="flex flex-wrap gap-2">
                                    <input
                                        type="text"
                                        value={workAddress}
                                        onChange={(e) => setWorkAddress(e.target.value)}
                                        className="flex-1 min-w-[200px] max-w-[400px] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Введите адрес..."
                                    />
                                    {/* Quick city buttons */}
                                    <div className="flex flex-wrap gap-1 sm:gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => {
                                                handleUpdateBid({ workAddress });
                                                setEditingWorkAddress(false);
                                            }}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 sm:px-3 sm:py-2 text-sm rounded-lg whitespace-nowrap"
                                        >
                                            Сохранить
                                        </button>
                                        <button
                                            onClick={() => {
                                                setWorkAddress(bid.workAddress || '');
                                                setEditingWorkAddress(false);
                                            }}
                                            className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 sm:px-3 sm:py-2 text-sm rounded-lg whitespace-nowrap"
                                        >
                                            Отмена
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <p className="text-gray-900">{workAddress || 'Не указан'}</p>
                                    <button
                                        onClick={() => setEditingWorkAddress(true)}
                                        className="text-blue-500 hover:text-blue-700"
                                    >
                                        ✏️
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        {/* Description Section */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                            <p className="text-gray-900">{bid.description || 'Нет описания'}</p>
                        </div>
                    </div>
                </div>

                {/* Equipment Section */}
                <div className="bg-white rounded-lg shadow p-4 mt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Оборудование</h3>
                        {hasPermission('bid_equipment_add') && (
                            <button
                                onClick={() => setShowAddEquipmentModal(true)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition text-sm"
                            >
                                Добавить оборудование
                            </button>
                        )}
                    </div>
                    {bidEquipment.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-300">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-4 py-2 border-b text-left">Оборудование</th>
                                        <th className="px-4 py-2 border-b text-left">IMEI</th>
                                        <th className="px-4 py-2 border-b text-left">Количество</th>
                                        <th className="px-4 py-2 border-b text-left">Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bidEquipment.map(eq => (
                                        <tr
                                            key={eq.id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="px-4 py-2 border-b">{eq.equipment.name}</td>
                                            <td className="px-4 py-2 border-b">{eq.imei || '-'}</td>
                                            <td className="px-4 py-2 border-b">{eq.quantity}</td>
                                            <td className="px-4 py-2 border-b">
                                                <button
                                                    onClick={() => {
                                                        setEditingEquipment(eq);
                                                        setShowAddEquipmentModal(true);
                                                    }}
                                                    className="text-blue-500 hover:text-blue-700 mr-2"
                                                >
                                                    Редактировать
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteEquipment(eq)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    Удалить
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-4">Оборудование не добавлено</p>
                    )}
                </div>

                {/* Tabs Section */}
                <div className="bg-white rounded-lg shadow p-4 mt-6">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            {[
                                { id: 'comments', label: 'Коментарии' },
                                { id: 'files', label: 'Файлы' },
                                { id: 'nested', label: 'Вложенные заявки' },
                                { id: 'spec', label: 'Спецификация' },
                                { id: 'contracts', label: 'Договоры' },
                                { id: 'print', label: 'Печатная форма' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                        activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                    <div className="mt-4">
                        {activeTab === 'comments' && (
                            <div>
                                <div className="mb-4">
                                    <form onSubmit={handleSubmitComment} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="Напишите комментарий..."
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                        <button
                                            type="submit"
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                                        >
                                            Добавить
                                        </button>
                                    </form>
                                </div>
                                <div className="space-y-4">
                                     {comments.length > 0 ? (
                                         comments.map(comment => (
                                             <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                                                 <div className="flex justify-between items-start mb-2">
                                                     <p className="font-medium text-gray-900">{comment.user.fullName}</p>
                                                     <div className="flex items-center space-x-2">
                                                         <p className="text-sm text-gray-500">
                                                             {new Date(comment.createdAt).toLocaleString('ru-RU', {
                                                                 year: 'numeric',
                                                                 month: 'short',
                                                                 day: '2-digit',
                                                                 hour: '2-digit',
                                                                 minute: '2-digit'
                                                             })}
                                                         </p>
                                                         {user && comment.userId === user.id && (
                                                             <div className="flex space-x-1">
                                                                 <button
                                                                     onClick={() => handleEditComment(comment)}
                                                                     className="text-blue-500 hover:text-blue-700 text-sm"
                                                                     title="Редактировать"
                                                                 >
                                                                     ✏️
                                                                 </button>
                                                                 <button
                                                                     onClick={() => handleDeleteComment(comment.id)}
                                                                     className="text-red-500 hover:text-red-700 text-sm"
                                                                     title="Удалить"
                                                                 >
                                                                     <Trash2 size={16} />
                                                                 </button>
                                                             </div>
                                                         )}
                                                     </div>
                                                 </div>
                                                 {editingCommentId === comment.id ? (
                                                     <div className="space-y-2">
                                                         <textarea
                                                             value={editingCommentContent}
                                                             onChange={(e) => setEditingCommentContent(e.target.value)}
                                                             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                             rows={3}
                                                         />
                                                         <div className="flex space-x-2">
                                                             <button
                                                                 onClick={handleSaveEdit}
                                                                 className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                                                             >
                                                                 Сохранить
                                                             </button>
                                                             <button
                                                                 onClick={handleCancelEdit}
                                                                 className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                                                             >
                                                                 Отмена
                                                             </button>
                                                         </div>
                                                     </div>
                                                 ) : (
                                                     <p className="text-gray-700">{comment.content}</p>
                                                 )}
                                             </div>
                                         ))
                                     ) : (
                                         <p className="text-gray-500 text-center py-4">Комментариев пока нет</p>
                                     )}
                                 </div>
                            </div>
                        )}
                        {activeTab === 'files' && (
                            <div>
                                <div className="mb-4 flex items-center space-x-4">
                                    <label className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-2">
                                        <Upload size={18} />
                                        {uploadingFile ? 'Загрузка...' : 'Добавить файлы'}
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            onChange={handleUploadFile}
                                            className="hidden"
                                            accept="*/*"
                                            disabled={uploadingFile}
                                        />
                                    </label>
                                    {missingFiles.size > 0 && (
                                        <button
                                            onClick={deleteAllMissingFiles}
                                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
                                        >
                                            <Trash2 size={18} />
                                            Удалить отсутствующие ({missingFiles.size})
                                        </button>
                                    )}
                                </div>
                                {(() => {
                                    // Проверяем, является ли файл изображением
                                    const isImage = (fileName) => {
                                        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
                                        const ext = fileName.split('.').pop().toLowerCase();
                                        return imageExtensions.includes(ext);
                                    };
                                    
                                    // Группируем файлы по дате и времени загрузки
                                    const fileGroups = groupFilesByDate(bidFiles);
                                    
                                    return fileGroups.length > 0 ? (
                                        <div className="space-y-3">
                                            {fileGroups.map((group, groupIndex) => {
                                                const isExpanded = expandedFileGroups.has(`${group.dateKey}_${group.timeKey}`);
                                                const allFilesMissing = group.files.every(f => missingFiles.has(f.name));
                                                
                                                return (
                                                    <div key={groupIndex} className={`rounded-lg border overflow-hidden ${allFilesMissing ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-200'}`}>
                                                        {/* Заголовок группы - сворачиваемый */}
                                                        <div 
                                                            className={`p-3 border-b cursor-pointer flex items-center justify-between ${allFilesMissing ? 'bg-red-100 border-red-300' : 'bg-gray-100 border-gray-200'}`}
                                                            onClick={() => toggleFileGroup(`${group.dateKey}_${group.timeKey}`)}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="text-center">
                                                                    <p className="text-sm font-medium text-gray-800">{group.dateKey}</p>
                                                                    <p className="text-xs text-gray-600">{group.timeKey}</p>
                                                                </div>
                                                                <div className="border-l border-gray-300 pl-3">
                                                                    <p className="text-sm font-medium text-gray-800">
                                                                        {group.files.length} {group.files.length === 1 ? 'файл' : group.files.length <= 4 ? 'файла' : 'файлов'}
                                                                    </p>
                                                                    <p className="text-xs text-gray-600">
                                                                        {group.uploaderName || 'Неизвестный пользователь'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {allFilesMissing && (
                                                                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                                                                        {group.files.length} отсутствует
                                                                    </span>
                                                                )}
                                                                <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                                    </svg>
                                                                </span>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Содержимое группы */}
                                                        {isExpanded && (
                                                            <div className="p-3 space-y-2">
                                                                {group.files.map((file, index) => {
                                                                    const isMissing = missingFiles.has(file.name);
                                                                    
                                                                    return (
                                                                        <div key={index} className={`rounded border overflow-hidden ${isMissing ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
                                                                            {isImage(file.originalName) ? (
                                                                                <div>
                                                                                    <div className={`p-2 border-b ${isMissing ? 'bg-red-100 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                                                                                        <p className="text-sm font-medium text-gray-700 truncate" title={file.originalName}>
                                                                                            {file.originalName}
                                                                                        </p>
                                                                                    </div>
                                                                                    {isMissing ? (
                                                                                        <div className="w-full h-32 bg-red-100 flex items-center justify-center">
                                                                                            <div className="text-center">
                                                                                                <File size={32} className="text-red-400 mx-auto mb-1" />
                                                                                                <p className="text-red-600 text-sm font-medium">{file.originalName}</p>
                                                                                                <p className="text-red-500 text-xs">Файл не найден</p>
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <img 
                                                                                            src={file.path} 
                                                                                            alt={file.originalName}
                                                                                            className="w-full h-20 object-contain bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                                                                                            onClick={() => openImageViewer(file)}
                                                                                        />
                                                                                    )}
                                                                                    <div className={`p-2 border-t ${isMissing ? 'bg-red-100 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                                                                                        <div className="flex items-center justify-between">
                                                                                            <p className="text-xs text-gray-600">
                                                                                                {file.size ? (file.size > 1024 * 1024 ? (file.size / (1024 * 1024)).toFixed(2) + ' МБ' : file.size > 1024 ? (file.size / 1024).toFixed(2) + ' КБ' : file.size + ' Б') : ''}
                                                                                            </p>
                                                                                            <div className="flex gap-2">
                                                                                                {!isMissing && (
                                                                                                    <button
                                                                                                        onClick={() => handleDownloadFile(file)}
                                                                                                        className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                                                                                                    >
                                                                                                        <Download size={12} />
                                                                                                        Скачать
                                                                                                    </button>
                                                                                                )}
                                                                                                <button
                                                                                                    onClick={() => handleDeleteFile(file.name)}
                                                                                                    className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                                                                                                >
                                                                                                    Удалить
                                                                                                </button>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <div className={`p-2 ${isMissing ? 'bg-red-50' : ''}`}>
                                                                                    <div className="flex items-center justify-between">
                                                                                        <div className="flex items-center space-x-2">
                                                                                            <File size={24} className={isMissing ? 'text-red-400' : 'text-blue-500'} />
                                                                                            <div>
                                                                                                <p className="font-medium text-gray-900 text-sm truncate" title={file.originalName}>
                                                                                                    {file.originalName}
                                                                                                </p>
                                                                                                <p className="text-xs text-gray-500">
                                                                                                    {file.size ? (file.size > 1024 * 1024 
                                                                                                        ? `${(file.size / (1024 * 1024)).toFixed(2)} МБ`
                                                                                                        : file.size > 1024 
                                                                                                            ? `${(file.size / 1024).toFixed(2)} КБ`
                                                                                                            : `${file.size} Б`) : 'Размер неизвестен'}
                                                                                                </p>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="flex gap-2">
                                                                                            {!isMissing && (
                                                                                                <button
                                                                                                    onClick={() => handleDownloadFile(file)}
                                                                                                    className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                                                                                                >
                                                                                                    <Download size={12} />
                                                                                                    Скачать
                                                                                                </button>
                                                                                            )}
                                                                                            <button
                                                                                                onClick={() => handleDeleteFile(file.name)}
                                                                                                className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                                                                                            >
                                                                                                Удалить
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-center py-8">Файлов пока нет</p>
                                    );
                                })()}
                            </div>
                        )}
                         {activeTab === 'nested' && (
                            <div>
                                {childBids.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full bg-white border border-gray-300">
                                            <thead>
                                                <tr className="bg-gray-50">
                                                    <th className="px-4 py-2 border-b text-left">ID</th>
                                                    <th className="px-4 py-2 border-b text-left">Тип</th>
                                                    <th className="px-4 py-2 border-b text-left">Тема</th>
                                                    <th className="px-4 py-2 border-b text-left">Статус</th>
                                                    <th className="px-4 py-2 border-b text-left">Создано</th>
                                                    <th className="px-4 py-2 border-b text-left">Действия</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {childBids.map(childBid => (
                                                    <tr
                                                        key={childBid.id}
                                                        className="hover:bg-gray-50 cursor-pointer"
                                                        onClick={() => navigate(`/dashboard/bids/${childBid.id}`)}
                                                    >
                                                        <td className="px-4 py-2 border-b">{childBid.id}</td>
                                                        <td className="px-4 py-2 border-b">Дочерняя заявка</td>
                                                        <td className="px-4 py-2 border-b">{childBid.title}</td>
                                                        <td className="px-4 py-2 border-b">{childBid.status}</td>
                                                        <td className="px-4 py-2 border-b">
                                                            {new Date(childBid.createdAt).toLocaleDateString('ru-RU')}
                                                        </td>
                                                        <td className="px-4 py-2 border-b">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate(`/dashboard/bids/${childBid.id}`);
                                                                }}
                                                                className="text-blue-500 hover:text-blue-700"
                                                            >
                                                                Перейти
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-4">Вложенных заявок нет</p>
                                )}
                            </div>
                        )}
                        {activeTab === 'spec' && (
                            <div>
                                <div className="mb-4 flex items-center space-x-4">
                                    <button
                                        onClick={() => setShowAddSpecModal(true)}
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                                    >
                                        Добавить спецификацию
                                    </button>
                                </div>
                                {bidSpecifications.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full bg-white border border-gray-300">
                                            <thead>
                                                <tr className="bg-gray-50">
                                                    <th className="px-4 py-2 border-b text-left">№</th>
                                                    <th className="px-4 py-2 border-b text-left">Название</th>
                                                    <th className="px-4 py-2 border-b text-left">%</th>
                                                    <th className="px-4 py-2 border-b text-left">Стоимость</th>
                                                    <th className="px-4 py-2 border-b text-left">Исполнитель</th>
                                                    <th className="px-4 py-2 border-b text-left">Действия</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {bidSpecifications.map((spec, index) => (
                                                     <tr
                                                         key={spec.id}
                                                         className="hover:bg-gray-50 cursor-pointer"
                                                         onClick={() => {
                                                             setViewingSpec(spec);
                                                             setShowViewSpecModal(true);
                                                         }}
                                                     >
                                                         <td className="px-4 py-2 border-b">{index + 1}</td>
                                                         <td className="px-4 py-2 border-b">{spec.specification.name}</td>
                                                         <td className="px-4 py-2 border-b">{spec.discount || 0}%</td>
                                                         <td className="px-4 py-2 border-b">{(spec.specification.cost * (1 - (spec.discount || 0) / 100)).toFixed(2)} руб.</td>
                                                         <td className="px-4 py-2 border-b">{spec.executors && spec.executors.length > 0 ? spec.executors.map(e => e.fullName).join(', ') : 'Не назначены'}</td>
                                                         <td className="px-4 py-2 border-b">
                                                             <button
                                                                 onClick={(e) => {
                                                                     e.stopPropagation();
                                                                     setEditingSpec(spec);
                                                                     setShowAddSpecModal(true);
                                                                 }}
                                                                 className="text-blue-500 hover:text-blue-700 mr-2"
                                                             >
                                                                 Редактировать
                                                             </button>
                                                             <button
                                                                 onClick={(e) => {
                                                                     e.stopPropagation();
                                                                     handleDeleteSpec(spec.id);
                                                                 }}
                                                                 className="text-red-500 hover:text-red-700"
                                                             >
                                                                 Удалить
                                                             </button>
                                                         </td>
                                                     </tr>
                                                 ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-4">Спецификации не добавлены</p>
                                )}

                                {/* Earnings Summary */}
                                {bidSpecifications.length > 0 && (
                                    <div className="mt-6">
                                        <h4 className="text-lg font-semibold text-gray-800 mb-4">Сводка заработка</h4>
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            {(() => {
                                                const earnings = {};
                                                bidSpecifications.forEach(spec => {
                                                    const discountRate = spec.discount || 0;
                                                    const cost = spec.specification.cost * (1 - discountRate / 100);
                                                    const users = spec.executors || [];
                                                    const share = cost / users.length;
                                                    users.forEach(user => {
                                                        if (!earnings[user.id]) {
                                                            earnings[user.id] = { user, total: 0 };
                                                        }
                                                        earnings[user.id].total += share;
                                                    });
                                                });
                                                const sortedEarnings = Object.values(earnings).sort((a, b) => b.total - a.total);
                                                return sortedEarnings.length > 0 ? (
                                                    <table className="min-w-full bg-white border border-gray-300">
                                                        <thead>
                                                            <tr className="bg-gray-100">
                                                                <th className="px-4 py-2 border-b text-left">Пользователь</th>
                                                                <th className="px-4 py-2 border-b text-left">Заработок</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {sortedEarnings.map(({ user, total }) => (
                                                                <tr key={user.id} className="hover:bg-gray-50">
                                                                    <td className="px-4 py-2 border-b font-medium">{user.fullName}</td>
                                                                    <td className="px-4 py-2 border-b text-green-600 font-semibold">{total.toFixed(2)} руб.</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                ) : (
                                                    <p className="text-gray-500">Нет данных о заработке</p>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {activeTab === 'contracts' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Договоры</label>
                                {contracts && contracts.length > 0 ? (
                                    <div className="space-y-2">
                                        {contracts.map((contract) => (
                                            <div 
                                                key={contract.id} 
                                                className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition"
                                                onClick={() => {
                                                    setContractFormData({
                                                        bidEquipmentId: contract.bidEquipmentId || null,
                                                        contractNumber: contract.contractNumber || '',
                                                        clientName: contract.clientName || bid?.clientName || '',
                                                        responsibleName: contract.responsibleName || user?.fullName || bid?.currentResponsibleName || '',
                                                        clientObject: contract.clientObject || (bid?.clientObject ? `${bid.clientObject.brandModel} ${bid.clientObject.stateNumber || ''}` : ''),
                                                        equipmentName: contract.equipmentName || '',
                                                        imei: contract.imei || '',
                                                        quantity: contract.quantity || 1,
                                                        contractEndDate: contract.contractEndDate ? new Date(contract.contractEndDate).toISOString().split('T')[0] : '',
                                                    });
                                                    setEditingContractId(contract.id);
                                                    setContractViewMode(true);
                                                    setShowContractModal(true);
                                                }}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <FileText size={18} className="text-green-500" />
                                                    <span className="text-green-600 font-medium">Договор №{contract.contractNumber}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm">Нет договоров</p>
                                )}
                                
                                {/* Add New Contract Button */}
                                {(() => {
                                    const contractedEquipmentIds = contracts && contracts.length > 0 
                                        ? contracts.map(c => c.bidEquipmentId).filter(id => id !== null)
                                        : [];
                                    const availableEquipment = bidEquipment && bidEquipment.length > 0 
                                        ? bidEquipment.filter(eq => !contractedEquipmentIds.includes(eq.id))
                                        : [];
                                    const canAddContract = availableEquipment.length > 0;
                                    
                                    return (
                                        <button
                                            onClick={() => {
                                                const firstAvailable = availableEquipment.length > 0 ? availableEquipment[0] : null;
                                                setContractFormData({
                                                    bidEquipmentId: firstAvailable?.id || null,
                                                    clientName: bid?.clientName || '',
                                                    responsibleName: user?.fullName || bid?.responsibleName || bid?.currentResponsibleName || '',
                                                    clientObject: bid?.clientObject ? `${bid.clientObject.brandModel} ${bid.clientObject.stateNumber || ''}` : '',
                                                    equipmentName: firstAvailable?.equipment?.name || '',
                                                    imei: firstAvailable?.imei || '',
                                                    quantity: firstAvailable?.quantity || 1,
                                                    contractEndDate: bid?.plannedResolutionDate ? new Date(bid.plannedResolutionDate).toISOString().split('T')[0] : '',
                                                });
                                                setEditingContractId(null);
                                                setContractViewMode(false);
                                                setShowContractModal(true);
                                            }}
                                            disabled={!canAddContract}
                                            className={`${canAddContract ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 cursor-not-allowed'} text-white px-4 py-2 rounded-lg transition text-sm flex items-center gap-2 mt-3 w-full justify-center`}
                                        >
                                            <FileText size={18} />
                                            {canAddContract ? 'Добавить договор' : 'Все оборудование имеет договор'}
                                        </button>
                                    );
                                })()}
                            </div>
                        )}
                        {activeTab === 'print' && (
                            <div className="text-center py-8">
                                <p className="text-gray-500">Печатная форма в разработке</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="w-64 bg-white shadow pb-4 pt-0 ml-4 relative">
                <div className="mb-4 relative status-dropdown-container">
                    <div 
                        className="w-full p-2 text-lg text-left text-white cursor-pointer"
                        style={{ backgroundColor: getStatusColorFromBid(bid.status) || '#7a7777' }}
                        onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                    >
                        {bid.status}
                    </div>

                    {/* Status Dropdown */}
                    {showStatusDropdown && (
                        <div className="absolute top-full left-0 right-0 bg-white/80 border border-gray-300 shadow-lg z-10 mt-1 p-1">
                            <div className="py-1 space-y-1">
                                {getAvailableStatuses().map(status => (
                                    <button
                                        key={status.position}
                                        onClick={() => {
                                            handleChangeStatus(status.name);
                                            setShowStatusDropdown(false);
                                        }}
                                        className="w-full text-left px-4 py-2 transition-colors text-white"
                                        style={{ backgroundColor: status.color || '#7a7777' }}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = status.color ? adjustColor(status.color, -10) : '#6a6666'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = status.color || '#7a7777'}
                                    >
                                        {status.name}
                                    </button>
                                ))}
                                {getAvailableStatuses().length === 0 && (
                                    <div className="px-4 py-2 text-gray-500 text-sm">
                                        Нет доступных статусов для перехода
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className='p-2'>
                    <label className="block text-xs text-gray-500 mb-1">Тип заявки</label>
                    <p className="text-gray-900">{bid.bidType ? bid.bidType.name : 'Не указан'}</p>
                </div>
                <div className='p-2'>
                    <label className="block text-xs text-gray-500 mb-1">Дата и время создания</label>
                    <p className="text-gray-900">{formattedCreatedAt}</p>
                </div>
                <div className='p-2'>
                    <label className="block text-xs text-gray-500 mb-1">Ответственный</label>
                    <p className="text-gray-900">{getResponsibleDisplayName()}</p>
                </div>
                
                {/* SLA Section */}
                <div className='border-t border-gray-200 my-2'></div>
                
                {/* Оставшееся время */}
                {remainingTime && bid.status !== 'Закрыта' && (
                    <div className='p-2'>
                        <label className="block text-xs text-gray-500 mb-1">Осталось времени</label>
                        <div className={`px-3 py-2 rounded-lg text-sm font-medium ${remainingTime.bgColor} ${remainingTime.color}`}>
                            ⏱️ {remainingTime.text}
                        </div>
                    </div>
                )}
                
                <div className='p-2'>
                    <label className="block text-xs text-gray-500 mb-1">Плановое время реакции (SLA)</label>
                    <p className="text-gray-900">
                        {bid.plannedReactionTimeMinutes ? `${bid.plannedReactionTimeMinutes} мин.` : (bid.bidType?.plannedReactionTimeMinutes ? `${bid.bidType.plannedReactionTimeMinutes} мин.` : 'Не указано')}
                    </p>
                </div>

                <div className='p-2'>
                    <label className="block text-xs text-gray-500 mb-1">Плановая продолжительность (минуты)</label>
                    <p className="text-gray-900">
                        {bid.plannedDurationMinutes ? `${bid.plannedDurationMinutes} мин.` : (bid.bidType?.plannedDurationMinutes ? `${bid.bidType.plannedDurationMinutes} мин.` : 'Не указано')}
                    </p>
                </div>
                <div className='p-2'>
                    <button
                        onClick={() => setShowHistoryModal(true)}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                    >
                        История
                    </button>
                </div>
                {hasPermission('bid_create') && (
                    <>
                        <div className='p-2'>
                            <button
                                onClick={() => {
                                    // Pre-fill form with parent bid data except title
                                    setChildBidFormData({
                                        clientId: bid.clientId.toString(),
                                        title: '',
                                        bidTypeId: bid.bidTypeId ? bid.bidTypeId.toString() : '',
                                        description: bid.description || '',
                                        clientObjectId: bid.clientObjectId ? bid.clientObjectId.toString() : '',
                                        workAddress: bid.workAddress || '',
                                        contactFullName: bid.contactFullName || '',
                                        contactPhone: bid.contactPhone || '',
                                        parentId: id,
                                        plannedResolutionDate: getDefaultPlannedResolutionDate(),
                                        plannedReactionTimeMinutes: bid.plannedReactionTimeMinutes ? bid.plannedReactionTimeMinutes.toString() : '',
                                        assignedAt: bid.assignedAt ? new Date(bid.assignedAt).toISOString().slice(0, 16) : '',
                                        plannedDurationMinutes: bid.plannedDurationMinutes ? bid.plannedDurationMinutes.toString() : '',
                                        amount: bid.amount || 0,
                                    });
                                    // Load client objects for the selected client
                                    if (bid.clientId) {
                                        fetchClientObjects(bid.clientId.toString());
                                    }
                                    setIsCloneMode(false);
                                    setShowCreateChildBidModal(true);
                                }}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                            >
                                Создать заявку
                            </button>
                        </div>
                        <div className='p-2'>
                            <button
                                onClick={() => {
                                    // Pre-fill form with current bid data for cloning
                                    setChildBidFormData({
                                        clientId: bid.clientId.toString(),
                                        title: bid.tema || '',
                                        bidTypeId: bid.bidTypeId ? bid.bidTypeId.toString() : '',
                                        description: bid.description || '',
                                        clientObjectId: bid.clientObjectId ? bid.clientObjectId.toString() : '',
                                        workAddress: bid.workAddress || '',
                                        contactFullName: bid.contactFullName || '',
                                        contactPhone: bid.contactPhone || '',
                                        parentId: '',
                                        plannedResolutionDate: getDefaultPlannedResolutionDate(),
                                        plannedReactionTimeMinutes: bid.plannedReactionTimeMinutes ? bid.plannedReactionTimeMinutes.toString() : '',
                                        assignedAt: bid.assignedAt ? new Date(bid.assignedAt).toISOString().slice(0, 16) : '',
                                        plannedDurationMinutes: bid.plannedDurationMinutes ? bid.plannedDurationMinutes.toString() : '',
                                        amount: bid.amount || 0,
                                    });
                                    // Load client objects for the selected client
                                    if (bid.clientId) {
                                        fetchClientObjects(bid.clientId.toString());
                                    }
                                    setIsCloneMode(true);
                                    setShowCreateChildBidModal(true);
                                }}
                                className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
                            >
                                Клонировать заявку
                            </button>
                        </div>
                    </>
                )}
            </div>







            {/* Add/Edit Specification Modal */}
            {showAddSpecModal && (
                <SpecificationModal
                    isOpen={showAddSpecModal}
                    onClose={() => {
                        setShowAddSpecModal(false);
                        setEditingSpec(null);
                    }}
                    onSave={handleSaveSpec}
                    editingSpec={editingSpec}
                    specCategories={specCategories}
                    specifications={specifications}
                    availableUsers={availableUsers}
                    currentUser={user}
                    expandedCategories={expandedCategories}
                    setExpandedCategories={setExpandedCategories}
                />
            )}

            {/* Add/Edit Equipment Modal */}
            {showAddEquipmentModal && (
                <EquipmentModal
                    isOpen={showAddEquipmentModal}
                    onClose={() => {
                        setShowAddEquipmentModal(false);
                        setEditingEquipment(null);
                    }}
                    onSave={handleSaveEquipment}
                    editingEquipment={editingEquipment}
                    equipment={equipment}
                />
            )}

            {/* Delete File Confirmation Modal */}
            <DeleteFileModal
                isOpen={showDeleteFileModal}
                onClose={() => {
                    setShowDeleteFileModal(false);
                    setFileToDelete(null);
                }}
                onConfirm={confirmDeleteFile}
                fileName={bidFiles.find(f => f.name === fileToDelete)?.originalName || fileToDelete}
            />

            {/* Delete Equipment Confirmation Modal */}
            <DeleteEquipmentModal
                isOpen={showDeleteEquipmentModal}
                onClose={() => {
                    setShowDeleteEquipmentModal(false);
                    setEquipmentToDelete(null);
                    setDeletionReason('');
                }}
                onConfirm={confirmDeleteEquipment}
                equipment={equipmentToDelete}
                reason={deletionReason}
                setReason={setDeletionReason}
            />

            {/* Contract Modal */}
            <ContractModal
                isOpen={showContractModal}
                onClose={() => {
                    setShowContractModal(false);
                    setEditingContractId(null);
                    setContractViewMode(false);
                }}
                onSave={handleCreateContract}
                onDelete={handleDeleteContract}
                showDeleteModal={showDeleteModal}
                setShowDeleteModal={setShowDeleteModal}
                formData={contractFormData}
                setFormData={setContractFormData}
                bid={bid}
                bidEquipment={bidEquipment}
                user={user}
                editingContractId={editingContractId}
                contracts={contracts}
                contractToDelete={contracts?.find(c => c.id === editingContractId)}
                contractViewMode={contractViewMode}
                setContractViewMode={setContractViewMode}
            />

            {/* Image Viewer Modal */}
            {showImageViewer && currentImage && (
                <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 overflow-hidden">
                    {/* Header with controls */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-10">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{currentImage.originalName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleZoomOut}
                                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                                title="Уменьшить"
                            >
                                <ZoomOut size={20} />
                            </button>
                            <span className="text-sm w-12 text-center">{imageZoom}%</span>
                            <button
                                onClick={handleZoomIn}
                                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                                title="Увеличить"
                            >
                                <ZoomIn size={20} />
                            </button>
                            <button
                                onClick={handleRotate}
                                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors ml-2"
                                title="Повернуть"
                            >
                                <RotateCw size={20} />
                            </button>
                            <button
                                onClick={closeImageViewer}
                                className="p-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors ml-4"
                                title="Закрыть"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                    
                    {/* Image container */}
                    <div 
                        ref={imageContainerRef}
                        className="w-full h-full flex items-center justify-center p-4"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        style={{ cursor: isMiddleDragging ? 'move' : 'default' }}
                    >
                        <img
                            src={currentImage.path}
                            alt={currentImage.originalName}
                            style={{
                                transform: `rotate(${imageRotation}deg) scale(${imageZoom / 100}) translate(${imagePan.x}px, ${imagePan.y}px)`,
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                                transition: isMiddleDragging ? 'none' : 'transform 0.3s ease'
                            }}
                        />
                    </div>
                </div>
            )}

            {/* View Specification Modal */}
            {showViewSpecModal && viewingSpec && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4">Просмотр спецификации</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
                                <p className="text-gray-900">{viewingSpec.specification.category.name}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Спецификация</label>
                                <p className="text-gray-900">{viewingSpec.specification.name}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Стандартная цена(руб)</label>
                                <p className="text-gray-900">{viewingSpec.specification.cost} руб.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Цена с учётом скидки(руб)</label>
                                <p className="text-green-600 font-semibold">
                                    {Math.round(viewingSpec.specification.cost * (1 - (viewingSpec.discount || 0) / 100))} руб.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Скидка</label>
                                <p className="text-gray-900">{viewingSpec.discount || 0}%</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Исполнители</label>
                                <p className="text-gray-900">
                                    {viewingSpec.executors && viewingSpec.executors.length > 0
                                        ? viewingSpec.executors.map(e => e.fullName).join(', ')
                                        : 'Не назначены'
                                    }
                                </p>
                            </div>


                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Дата создания</label>
                                <p className="text-gray-900">
                                    {new Date(viewingSpec.createdAt).toLocaleString('ru-RU', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-2 mt-6">
                            <button
                                onClick={() => {
                                    setShowViewSpecModal(false);
                                    setViewingSpec(null);
                                }}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                            >
                                Закрыть
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistoryModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4">История заявки</h3>
                        {history.length > 0 ? (
                            <div className="space-y-4">
                                {history.map((item, index) => (
                                    <div key={index} className="border-b pb-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium text-gray-900">{item.action}</p>
                                                <p className="text-sm text-gray-600">Кто: {item.user}</p>
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                {new Date(item.date).toLocaleString('ru-RU', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-4">История пуста</p>
                        )}
                        <div className="flex justify-end space-x-2 mt-6">
                            <button
                                onClick={() => setShowHistoryModal(false)}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                            >
                                Закрыть
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Create Child Bid Modal */}
            {showCreateChildBidModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-[95vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">
                            {isCloneMode ? 'Клонировать заявку' : 'Создать дочернюю заявку'}
                        </h3>
                        
                        <form onSubmit={handleCreateChildBid} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Клиент</label>
                                <select
                                    value={childBidFormData.clientId}
                                    onChange={(e) => {
                                        setChildBidFormData({ ...childBidFormData, clientId: e.target.value, clientObjectId: '' });
                                    }}
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
                            
                            {/* Object Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Объект обслуживания</label>
                                <select
                                    value={childBidFormData.clientObjectId}
                                    onChange={(e) => setChildBidFormData({ ...childBidFormData, clientObjectId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">
                                        {childBidFormData.clientId ? 'Выберите объект (необязательно)' : 'Сначала выберите клиента'}
                                    </option>
                                    {clientObjects.map((obj) => (
                                        <option key={obj.id} value={obj.id}>
                                            {obj.brandModel} {obj.stateNumber ? `(${obj.stateNumber})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Тема</label>
                                <input
                                    type="text"
                                    value={childBidFormData.title}
                                    onChange={(e) => setChildBidFormData({ ...childBidFormData, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Тип заявки</label>
                                <select
                                    value={childBidFormData.bidTypeId}
                                    onChange={(e) => setChildBidFormData({ ...childBidFormData, bidTypeId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Выберите тип заявки</option>
                                    {bidTypes.map((bidType) => (
                                        <option key={bidType.id} value={bidType.id}>
                                            {bidType.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                                <RichTextEditor
                                    value={childBidFormData.description || ''}
                                    onChange={(html) => setChildBidFormData({ ...childBidFormData, description: html })}
                                    placeholder="Введите описание заявки..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Адрес проведения работ</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={childBidFormData.workAddress}
                                        onChange={(e) => setChildBidFormData({ ...childBidFormData, workAddress: e.target.value })}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Введите адрес проведения работ"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ФИО и номер телефона</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={childBidFormData.contactFullName}
                                        onChange={(e) => setChildBidFormData({ ...childBidFormData, contactFullName: e.target.value })}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="ФИО контактного лица"
                                    />
                                    <input
                                        type="text"
                                        value={childBidFormData.contactPhone}
                                        onChange={(e) => setChildBidFormData({ ...childBidFormData, contactPhone: e.target.value })}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Номер телефона"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        resetChildBidForm();
                                        setShowCreateChildBidModal(false);
                                    }}
                                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
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

// Компонент модального окна спецификаций
const SpecificationModal = ({
    isOpen,
    onClose,
    onSave,
    editingSpec,
    specCategories,
    specifications,
    availableUsers,
    currentUser,
    expandedCategories,
    setExpandedCategories
}) => {
    const [selectedSpecId, setSelectedSpecId] = useState(editingSpec?.specificationId || '');
    const [executorIds, setExecutorIds] = useState(editingSpec?.executorIds || []);
    const [selectedExecutor, setSelectedExecutor] = useState('');
    const [discount, setDiscount] = useState(editingSpec?.discount || 0);

    const selectedSpec = specifications.find(s => s.id === parseInt(selectedSpecId));


    const addExecutor = () => {
        if (selectedExecutor && !executorIds.includes(parseInt(selectedExecutor))) {
            setExecutorIds([...executorIds, parseInt(selectedExecutor)]);
            setSelectedExecutor('');
        }
    };

    const removeExecutor = (id) => {
        setExecutorIds(executorIds.filter(eId => eId !== id));
    };

    const handleSave = () => {
        if (!selectedSpecId) {
            alert('Выберите спецификацию');
            return;
        }
        onSave({
            specificationId: selectedSpecId,
            executorIds: executorIds,
            discount: parseFloat(discount) || 0,
        });
    };

    const toggleCategory = (categoryId) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(categoryId)) {
            newExpanded.delete(categoryId);
        } else {
            newExpanded.add(categoryId);
        }
        setExpandedCategories(newExpanded);
    };

    const CategoryTree = ({ category, specifications, selectedSpecId, setSelectedSpecId, expandedCategories, toggleCategory, level }) => {
        const categorySpecs = specifications.filter(s => s.categoryId === category.id);
        const hasChildren = category.children && category.children.length > 0;
        const hasSpecs = categorySpecs.length > 0;
        const isExpanded = expandedCategories.has(category.id);

        return (
            <div>
                <div
                    className="flex items-center p-3 bg-gray-50 border-b cursor-pointer hover:bg-gray-100"
                    style={{ paddingLeft: `${12 + level * 20}px` }}
                    onClick={() => toggleCategory(category.id)}
                >
                    {(hasChildren || hasSpecs) && <span className="mr-2">{isExpanded ? '▼' : '▶'}</span>}
                    {!(hasChildren || hasSpecs) && <span className="mr-2 w-4"></span>}
                    <span className="font-medium">{category.name}</span>
                    <span className="ml-auto text-sm text-gray-500">({categorySpecs.length})</span>
                </div>
                {isExpanded && (
                    <div>
                        {categorySpecs.map(spec => (
                            <div
                                key={spec.id}
                                className={`p-2 cursor-pointer hover:bg-blue-50 ${
                                    selectedSpecId === spec.id.toString() ? 'bg-blue-100' : ''
                                }`}
                                style={{ paddingLeft: `${32 + level * 20}px` }}
                                onClick={() => setSelectedSpecId(spec.id.toString())}
                            >
                                <span>{spec.name}</span>
                            </div>
                        ))}
                        {category.children && category.children.map(child => (
                            <CategoryTree
                                key={child.id}
                                category={child}
                                specifications={specifications}
                                selectedSpecId={selectedSpecId}
                                setSelectedSpecId={setSelectedSpecId}
                                expandedCategories={expandedCategories}
                                toggleCategory={toggleCategory}
                                level={level + 1}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-semibold mb-4">
                    {editingSpec ? 'Редактировать спецификацию' : 'Добавить спецификацию'}
                </h3>

                {/* Specification Selection */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Выберите спецификацию</label>
                    <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto">
                        {specCategories.map(category => (
                            <CategoryTree
                                key={category.id}
                                category={category}
                                specifications={specifications}
                                selectedSpecId={selectedSpecId}
                                setSelectedSpecId={setSelectedSpecId}
                                expandedCategories={expandedCategories}
                                toggleCategory={toggleCategory}
                                level={0}
                            />
                        ))}
                    </div>
                </div>

                {/* Cost Display */}
                {selectedSpec && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Стоимость</label>
                        <div className="space-y-1">
                            <input
                                type="text"
                                value={`${selectedSpec.cost} руб.`}
                                readOnly
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                            />
                            {discount !== 0 && (
                                <div className="text-sm text-gray-600">
                                    С учетом скидки: {(selectedSpec.cost * (1 - discount / 100)).toFixed(2)} руб.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Discount */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Скидка (%)</label>
                    <input
                        type="number"
                        value={discount}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                    />
                </div>

                {/* Executors */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Исполнители</label>
                    <div className="flex space-x-2 mb-2">
                        <select
                            value={selectedExecutor}
                            onChange={(e) => setSelectedExecutor(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Выберите исполнителя</option>
                            {availableUsers.filter(user => !executorIds.includes(user.id)).map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.fullName}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={addExecutor}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                            disabled={!selectedExecutor}
                        >
                            Добавить
                        </button>
                    </div>
                    {executorIds.length > 0 && (
                        <div className="space-y-1">
                            {executorIds.map(id => {
                                const user = availableUsers.find(u => u.id === id);
                                return (
                                    <div key={id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                        <span>{user ? user.fullName : 'Неизвестный пользователь'}</span>
                                        <button
                                            onClick={() => removeExecutor(id)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            Удалить
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>


                {/* Buttons */}
                <div className="flex justify-end space-x-2">
                    <button
                        onClick={onClose}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={handleSave}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                    >
                        {editingSpec ? 'Сохранить' : 'Добавить'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Компонент модального окна оборудования
const EquipmentModal = ({
    isOpen,
    onClose,
    onSave,
    editingEquipment,
    equipment
}) => {
    const [selectedEquipmentId, setSelectedEquipmentId] = useState(editingEquipment?.equipmentId || '');
    const [imei, setImei] = useState(editingEquipment?.imei || '');
    const [quantity, setQuantity] = useState(editingEquipment?.quantity || 1);

    const selectedEquipment = equipment.find(e => e.id === parseInt(selectedEquipmentId));

    const handleSave = () => {
        if (!selectedEquipmentId) {
            alert('Выберите оборудование');
            return;
        }
        onSave({
            equipmentId: selectedEquipmentId,
            imei: imei.trim() || null,
            quantity: parseInt(quantity) || 1,
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">
                    {editingEquipment ? 'Редактировать оборудование' : 'Добавить оборудование'}
                </h3>

                {/* Equipment Selection */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Оборудование</label>
                    <select
                        value={selectedEquipmentId}
                        onChange={(e) => setSelectedEquipmentId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    >
                        <option value="">Выберите оборудование</option>
                        {equipment.map(eq => (
                            <option key={eq.id} value={eq.id}>
                                {eq.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* IMEI */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">IMEI (необязательно)</label>
                    <input
                        type="text"
                        value={imei}
                        onChange={(e) => setImei(e.target.value)}
                        placeholder="Введите IMEI"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Quantity */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Количество</label>
                    <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                {/* Buttons */}
                <div className="flex justify-end space-x-2">
                    <button
                        onClick={onClose}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={handleSave}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                    >
                        {editingEquipment ? 'Сохранить' : 'Добавить'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Компонент модального окна подтверждения удаления файла
const DeleteFileModal = ({ isOpen, onClose, onConfirm, fileName }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-red-100 p-3 rounded-full">
                        <Trash2 size={24} className="text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                        Подтверждение удаления
                    </h3>
                </div>
                
                <p className="text-gray-600 mb-6">
                    Вы уверены, что хотите удалить файл <span className="font-medium text-gray-900">{fileName}</span>?
                    <br />
                    <span className="text-sm text-gray-500">Это действие нельзя отменить.</span>
                </p>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
                    >
                        Удалить
                    </button>
                </div>
            </div>
        </div>
    );
};

// Component for equipment deletion modal with reason
const DeleteEquipmentModal = ({ isOpen, onClose, onConfirm, equipment, reason, setReason }) => {
    if (!isOpen || !equipment) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-red-100 p-3 rounded-full">
                        <Trash2 size={24} className="text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                        Удаление оборудования
                    </h3>
                </div>
                
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Оборудование для удаления:
                    </label>
                    <p className="text-gray-900 font-medium">{equipment.equipment?.name || 'Оборудование'}</p>
                    {equipment.imei && (
                        <p className="text-sm text-gray-600">IMEI: {equipment.imei}</p>
                    )}
                    {equipment.quantity > 1 && (
                        <p className="text-sm text-gray-600">Количество: {equipment.quantity}</p>
                    )}
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Причина удаления <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Укажите причину удаления оборудования..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        required
                    />
                </div>

                <p className="text-sm text-gray-500 mb-6">
                    Причина будет сохранена в истории возврата оборудования.
                </p>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={!reason.trim()}
                        className={`px-4 py-2 rounded-lg transition ${
                            reason.trim() 
                                ? 'bg-red-500 hover:bg-red-600 text-white' 
                                : 'bg-red-300 text-white cursor-not-allowed'
                        }`}
                    >
                        Удалить
                    </button>
                </div>
            </div>
        </div>
    );
};

// Component for contract deletion modal
const DeleteContractModal = ({ isOpen, onClose, onConfirm, contract }) => {
    if (!isOpen || !contract) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-red-100 p-3 rounded-full">
                        <Trash2 size={24} className="text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                        Удаление договора
                    </h3>
                </div>
                
                <p className="text-gray-600 mb-6">
                    Вы уверены, что хотите удалить договор <span className="font-medium text-gray-900">{contract.contractNumber}</span>?
                    <br />
                    <span className="text-sm text-gray-500">Это действие нельзя отменить.</span>
                </p>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
                    >
                        Удалить
                    </button>
                </div>
            </div>
        </div>
    );
};

// Contract Modal Component
const ContractModal = ({ isOpen, onClose, onSave, onDelete, showDeleteModal, setShowDeleteModal, formData, setFormData, bid, bidEquipment, user, editingContractId, contracts, contractToDelete, contractViewMode, setContractViewMode }) => {
    if (!isOpen) return null;

    // Determine mode: view mode (existing contract being viewed) vs edit mode (creating/editing)
    const isViewMode = contractViewMode && editingContractId !== null;
    const isEditing = editingContractId !== null && !contractViewMode;
    
    // Pre-fill client object info if not already set
    const clientObjectInfo = bid?.clientObject ? 
        `${bid.clientObject.brandModel} ${bid.clientObject.stateNumber || ''}` : '';
    
    // Current user name for responsible field
    const currentUserName = user?.fullName || '';
    
    // Get IDs of equipment that already have contracts
    const contractedEquipmentIds = contracts && contracts.length > 0 
        ? contracts.map(c => c.bidEquipmentId).filter(id => id !== null)
        : [];
    
    // Create equipment options from bidEquipment
    // Only include equipment that doesn't have a contract (unless we're editing)
    const equipmentOptions = bidEquipment && bidEquipment.length > 0 ? 
        bidEquipment.map(e => ({
            id: e.id,
            name: e.equipment?.name || 'Неизвестное оборудование',
            imei: e.imei || '',
            quantity: e.quantity || 1,
            hasContract: contractedEquipmentIds.includes(e.id)
        })) : [];
    
    // Filter equipment options: show all when editing, only uncontracted when creating
    const visibleEquipmentOptions = isEditing 
        ? equipmentOptions 
        : equipmentOptions.filter(eq => !eq.hasContract);
    
    // Find selected equipment details
    const selectedEquipment = equipmentOptions.find(e => e.id === formData.bidEquipmentId);

    // Handle equipment selection
    const handleEquipmentChange = (e) => {
        const selectedId = parseInt(e.target.value);
        const equipment = equipmentOptions.find(eq => eq.id === selectedId);
        if (equipment) {
            setFormData(prev => ({
                ...prev,
                bidEquipmentId: selectedId,
                equipmentName: equipment.name,
                imei: equipment.imei,
                quantity: equipment.quantity
            }));
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-green-100 p-3 rounded-full">
                        <FileText size={24} className="text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                        {isViewMode ? 'Договор' : isEditing ? 'Редактирование договора' : 'Новый договор'}
                    </h3>
                    {isViewMode && (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                            №{formData.contractNumber}
                        </span>
                    )}
                </div>
                
                <div className="space-y-4">
                    {/* Client - Disabled */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Клиент
                        </label>
                        <input
                            type="text"
                            value={formData.clientName || bid?.clientName || ''}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                    </div>

                    {/* Responsible - Auto-filled with current user */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ответственный
                        </label>
                        <input
                            type="text"
                            value={currentUserName || formData.responsibleName || ''}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                    </div>

                    {/* Client Object - Disabled */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Объект
                        </label>
                        <input
                            type="text"
                            value={formData.clientObject || clientObjectInfo || ''}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                    </div>

                    {/* Equipment - Display in view mode, dropdown in edit mode */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Оборудование {isViewMode ? '' : <span className="text-red-500">*</span>}
                        </label>
                        {isViewMode ? (
                            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-900">
                                {formData.equipmentName || 'Не указано'}
                            </div>
                        ) : (
                            <>
                                <select
                                    value={selectedEquipment?.id || ''}
                                    onChange={handleEquipmentChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                    disabled={isEditing && !selectedEquipment?.hasContract}
                                >
                                    <option value="">Выберите оборудование</option>
                                    {visibleEquipmentOptions.map(eq => (
                                        <option key={eq.id} value={eq.id} disabled={eq.hasContract && !isEditing}>
                                            {eq.name} {eq.imei ? `(IMEI: ${eq.imei})` : ''} x{eq.quantity}{eq.hasContract ? ' ✓' : ''}
                                        </option>
                                    ))}
                                </select>
                                {visibleEquipmentOptions.length === 0 && !isEditing && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Все оборудование уже имеет договор
                                    </p>
                                )}
                                {equipmentOptions.length === 0 && (
                                    <p className="text-xs text-red-500 mt-1">
                                        В заявке нет оборудования
                                    </p>
                                )}
                            </>
                        )}
                    </div>

                    {/* IMEI - Auto-filled and Disabled */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            IMEI
                        </label>
                        <input
                            type="text"
                            value={formData.imei}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                    </div>

                    {/* Quantity - Auto-filled and Disabled */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Количество
                        </label>
                        <input
                            type="number"
                            value={formData.quantity}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                    </div>

                    {/* Contract End Date - Display in view mode, date picker in edit mode */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Срок договора
                        </label>
                        {isViewMode ? (
                            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-900">
                                {formData.contractEndDate ? new Date(formData.contractEndDate).toLocaleDateString('ru-RU') : 'Не указан'}
                            </div>
                        ) : (
                            <input
                                type="date"
                                value={formData.contractEndDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, contractEndDate: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    {/* Edit Button - Only in view mode */}
                    {isViewMode && onDelete && (
                        <button
                            onClick={() => setContractViewMode(false)}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
                        >
                            Редактировать
                        </button>
                    )}
                    
                    {/* Delete Button with Custom Modal */}
                    {isEditing && !isViewMode && onDelete && (
                        <>
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition"
                            >
                                Удалить
                            </button>
                            <DeleteContractModal
                                isOpen={showDeleteModal}
                                onClose={() => setShowDeleteModal(false)}
                                onConfirm={() => {
                                    onDelete(editingContractId);
                                    setShowDeleteModal(false);
                                    onClose();
                                }}
                                contract={contractToDelete}
                            />
                        </>
                    )}
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                    >
                        {isViewMode ? 'Закрыть' : 'Отмена'}
                    </button>
                    {!isViewMode && (
                        <button
                            onClick={onSave}
                            disabled={!formData.equipmentName}
                            className={`px-4 py-2 rounded-lg transition ${
                                formData.equipmentName
                                    ? 'bg-green-500 hover:bg-green-600 text-white'
                                    : 'bg-green-300 text-white cursor-not-allowed'
                            }`}
                        >
                            {isEditing ? 'Сохранить' : 'Создать'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BidDetail;

