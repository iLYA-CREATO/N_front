/**
 * API Service Module
 *
 * Этот модуль настраивает Axios для взаимодействия с backend API.
 * Включает интерцепторы для автоматического добавления токена и обработки ошибок аутентификации.
 * Экспортирует функции для всех API endpoints.
 */

// Импорт Axios для HTTP-запросов
import axios from 'axios';
import { API_URL } from './config';

// Создание экземпляра Axios с базовой конфигурацией
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json', // Установка типа контента по умолчанию
    },
});

// Интерцептор запросов: добавление токена аутентификации
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token'); // Получение токена из localStorage
        if (token) {
            config.headers.Authorization = `Bearer ${token}`; // Добавление токена в заголовок
        }
        return config;
    },
    (error) => {
        return Promise.reject(error); // Пропуск ошибки дальше
    }
);

// Интерцептор ответов: обработка ошибок аутентификации
api.interceptors.response.use(
    (response) => response, // Успешный ответ пропускается
    (error) => {
        if (error.response && error.response.status === 401) { // Если 401 Unauthorized
            localStorage.removeItem('token'); // Удаление токена
            localStorage.removeItem('user'); // Удаление данных пользователя
            window.location.href = '/login'; // Перенаправление на страницу входа
        }
        return Promise.reject(error); // Пропуск ошибки дальше
    }
);

// === АУТЕНТИФИКАЦИЯ ===
// Функции для входа, регистрации и получения текущего пользователя
export const login = (credentials) => api.post('/auth/login', credentials); // Вход в систему
export const register = (userData) => api.post('/auth/register', userData); // Регистрация нового пользователя
export const getMe = () => api.get('/auth/me'); // Получение данных текущего пользователя

// === КЛИЕНТЫ ===
// CRUD-операции для клиентов
export const getClients = (search = '', responsibleId = '') => {
    const params = {};
    if (search) params.name = search; // Поиск по имени
    if (responsibleId) params.responsibleId = responsibleId; // Фильтр по ответственному
    return api.get('/clients', { params });
};
export const getClient = (id) => api.get(`/clients/${id}`); // Получение клиента по ID
export const createClient = (data) => api.post('/clients', data); // Создание нового клиента
export const updateClient = (id, data) => api.put(`/clients/${id}`, data); // Обновление клиента
export const deleteClient = (id) => api.delete(`/clients/${id}`); // Удаление клиента
export const bulkUploadClients = (data) => api.post('/clients/bulk-upload', data); // Массовый импорт клиентов
export const bulkUploadClientObjects = (data) => api.post('/client-objects/bulk-upload', data); // Массовый импорт объектов клиентов

// === АТРИБУТЫ КЛИЕНТОВ ===
export const getClientAttributes = () => api.get('/client-attributes'); // Получение всех атрибутов клиентов
export const getEnabledClientAttributes = () => api.get('/client-attributes/enabled'); // Получение включенных атрибутов клиентов
export const createClientAttribute = (data) => api.post('/client-attributes', data); // Создание нового атрибута клиента
export const updateClientAttribute = (id, data) => api.put(`/client-attributes/${id}`, data); // Обновление атрибута клиента
export const deleteClientAttribute = (id) => api.delete(`/client-attributes/${id}`); // Удаление атрибута клиента

// === ЗАЯВКИ ===
// CRUD-операции для заявок
export const getBids = (params = {}) => api.get(`/bids`, { params }); // Получение всех заявок с пагинацией
export const getBid = (id) => api.get(`/bids/${id}`); // Получение заявки по ID
export const createBid = (data) => api.post('/bids', data); // Создание новой заявки
export const createBatchBids = (data) => api.post('/bids/batch', data); // Создание нескольких заявок (тиражирование)
export const updateBid = (id, data) => api.put(`/bids/${id}`, data); // Обновление заявки
export const deleteBid = (id) => api.delete(`/bids/${id}`); // Удаление заявки
export const assignEquipmentToBid = (bidId, data) => api.post(`/bids/${bidId}/equipment`, data); // Назначение оборудования на заявку
export const returnEquipmentFromBid = (bidId, data) => api.post(`/bids/${bidId}/equipment/return`, data); // Возврат оборудования с заявки
export const getComments = (bidId) => api.get(`/bids/${bidId}/comments`); // Получение комментариев к заявке
export const createComment = (bidId, data) => api.post(`/bids/${bidId}/comments`, data); // Создание комментария к заявке
export const updateComment = (bidId, commentId, data) => api.put(`/bids/${bidId}/comments/${commentId}`, data); // Обновление комментария к заявке
export const deleteComment = (bidId, commentId) => api.delete(`/bids/${bidId}/comments/${commentId}`); // Удаление комментария к заявке

// === ФАЙЛЫ ЗАЯВОК ===
// Получение списка файлов заявки
export const getBidFiles = (bidId) => api.get(`/bids/${bidId}/files`);
// Загрузка файлов к заявке (один или несколько)
export const uploadBidFiles = async (bidId, files) => {
    const formData = new FormData();
    // Добавляем каждый файл в FormData
    for (const file of files) {
        formData.append('files', file);
    }
    return api.post(`/bids/${bidId}/files`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};
// Удаление файла заявки
export const deleteBidFile = (bidId, fileName) => api.delete(`/bids/${bidId}/files/${encodeURIComponent(fileName)}`);

// === ТИПЫ ЗАЯВОК ===
// CRUD-операции для типов заявок
export const getBidTypes = () => api.get('/bid-types'); // Получение всех типов заявок
export const getBidType = (id) => api.get(`/bid-types/${id}`); // Получение типа заявки по ID
export const createBidType = (data) => api.post('/bid-types', data); // Создание нового типа заявки
export const updateBidType = (id, data) => api.put(`/bid-types/${id}`, data); // Обновление типа заявки
export const deleteBidType = (id) => api.delete(`/bid-types/${id}`); // Удаление типа заявки

// === СТАТУСЫ ЗАЯВОК ===
// CRUD-операции для статусов заявок
export const getBidStatuses = (bidTypeId) => api.get(`/bid-types/${bidTypeId}/statuses`); // Получение всех статусов заявок для типа
export const getBidStatus = (id) => api.get(`/bid-types/${id}`); // Получение статуса заявки по ID (теперь через bidType)
export const createBidStatus = (bidTypeId, data) => api.post(`/bid-types/${bidTypeId}/statuses`, data); // Создание нового статуса заявки
export const updateBidStatus = (bidTypeId, position, data) => api.put(`/bid-types/${bidTypeId}/statuses/${position}`, data); // Обновление статуса заявки
export const deleteBidStatus = (bidTypeId, position) => api.delete(`/bid-types/${bidTypeId}/statuses/${position}`); // Удаление статуса заявки
export const getBidStatusTransitions = (bidTypeId) => api.get(`/bid-types/${bidTypeId}/transitions`); // Получение переходов статусов
export const createBidStatusTransition = (bidTypeId, data) => api.post(`/bid-types/${bidTypeId}/transitions`, data); // Создание перехода статуса
export const deleteBidStatusTransition = (bidTypeId, fromPosition, toPosition) => api.delete(`/bid-types/${bidTypeId}/transitions/${fromPosition}/${toPosition}`); // Удаление перехода статуса

// === ОБОРУДОВАНИЕ ===
// CRUD-операции для оборудования
export const getEquipment = () => api.get('/equipment'); // Получение всего оборудования
export const getEquipmentById = (id) => api.get(`/equipment/${id}`); // Получение оборудования по ID
export const createEquipment = (data) => api.post('/equipment', data); // Создание нового оборудования
export const updateEquipment = (id, data) => api.put(`/equipment/${id}`, data); // Обновление оборудования
export const deleteEquipment = (id) => api.delete(`/equipment/${id}`); // Удаление оборудования

// === ИЗОБРАЖЕНИЯ ОБОРУДОВАНИЯ ===
// Загрузка изображений оборудования
export const uploadEquipmentImages = async (equipmentId, files) => {
    const formData = new FormData();
    for (const file of files) {
        formData.append('images', file);
    }
    return api.post(`/equipment/${equipmentId}/images`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};
// Удаление изображения оборудования
export const deleteEquipmentImage = (equipmentId, filename) => 
    api.delete(`/equipment/${equipmentId}/images/${encodeURIComponent(filename)}`);

// Изменение порядка изображений
export const reorderEquipmentImages = (equipmentId, newOrder) => 
    api.put(`/equipment/${equipmentId}/images/reorder`, { newOrder });

// === ОБОРУДОВАНИЕ ЗАЯВОК ===
// CRUD-операции для оборудования заявок
export const getBidEquipment = (bidId) => api.get(`/bid-equipment/bid/${bidId}`); // Получение оборудования заявки
export const getExpenseHistory = () => api.get('/bid-equipment/expense-history'); // Получение истории расхода оборудования
export const getReturnHistory = () => api.get('/bid-equipment/return-history'); // Получение истории возврата оборудования
export const createBidEquipment = (data) => api.post('/bid-equipment', data); // Создание оборудования заявки
export const updateBidEquipment = (id, data) => api.put(`/bid-equipment/${id}`, data); // Обновление оборудования заявки
export const deleteBidEquipment = (id, returnReason) => api.delete(`/bid-equipment/${id}`, { data: { returnReason } }); // Удаление оборудования заявки

// CRUD-операции для оборудования клиентов
export const getClientEquipment = () => api.get('/client-equipment'); // Получение всего оборудования клиентов
export const getClientEquipmentByClient = (clientId) => api.get(`/client-equipment/client/${clientId}`); // Получение оборудования клиента
export const createClientEquipment = (data) => api.post('/client-equipment', data); // Создание оборудования клиента
export const deleteClientEquipment = (id) => api.delete(`/client-equipment/${id}`); // Удаление оборудования клиента

// === ПОСТАВЩИКИ ===
// CRUD-операции для поставщиков
export const getSuppliers = () => api.get('/suppliers'); // Получение всех поставщиков
export const getSupplier = (id) => api.get(`/suppliers/${id}`); // Получение поставщика по ID
export const createSupplier = (data) => api.post('/suppliers', data); // Создание нового поставщика
export const updateSupplier = (id, data) => api.put(`/suppliers/${id}`, data); // Обновление поставщика
export const deleteSupplier = (id) => api.delete(`/suppliers/${id}`); // Удаление поставщика

// === СКЛАДЫ ===
// CRUD-операции для складов
export const getWarehouses = () => api.get('/warehouses'); // Получение всех складов
export const getWarehouse = (id) => api.get(`/warehouses/${id}`); // Получение склада по ID
export const createWarehouse = (data) => api.post('/warehouses', data); // Создание нового склада
export const updateWarehouse = (id, data) => api.put(`/warehouses/${id}`, data); // Обновление склада
export const deleteWarehouse = (id) => api.delete(`/warehouses/${id}`); // Удаление склада

// === ПОЛЬЗОВАТЕЛИ ===
// CRUD-операции для пользователей
export const getUsers = () => api.get('/users'); // Получение всех пользователей
export const getUser = (id) => api.get(`/users/${id}`); // Получение пользователя по ID
export const createUser = (data) => api.post('/users', data); // Создание нового пользователя
export const updateUser = (id, data) => api.put(`/users/${id}`, data); // Обновление пользователя
export const deleteUser = (id) => api.delete(`/users/${id}`); // Удаление пользователя

// === РОЛИ ===
// CRUD-операции для ролей
export const getRoles = () => api.get('/roles'); // Получение всех ролей
export const getRole = (id) => api.get(`/roles/${id}`); // Получение роли по ID
export const createRole = (data) => api.post('/roles', data); // Создание новой роли
export const updateRole = (id, data) => api.put(`/roles/${id}`, data); // Обновление роли
export const deleteRole = (id) => api.delete(`/roles/${id}`); // Удаление роли

// === ОБЪЕКТЫ КЛИЕНТОВ ===
// CRUD-операции для объектов клиентов (автомобилей)
export const getClientObjects = (clientId = '') => {
    const params = {};
    if (clientId) params.clientId = clientId; // Фильтр по клиенту
    return api.get('/client-objects', { params });
};
export const getClientObject = (id) => api.get(`/client-objects/${id}`); // Получение объекта по ID
export const createClientObject = (data) => api.post('/client-objects', data); // Создание нового объекта
export const updateClientObject = (id, data) => api.put(`/client-objects/${id}`, data); // Обновление объекта
export const deleteClientObject = (id) => api.delete(`/client-objects/${id}`); // Удаление объекта

// === СПЕЦИФИКАЦИИ ===
// CRUD-операции для спецификаций
export const getSpecifications = () => api.get('/specifications'); // Получение всех спецификаций
export const getSpecification = (id) => api.get(`/specifications/${id}`); // Получение спецификации по ID
export const createSpecification = (data) => api.post('/specifications', data); // Создание новой спецификации
export const updateSpecification = (id, data) => api.put(`/specifications/${id}`, data); // Обновление спецификации
export const deleteSpecification = (id) => api.delete(`/specifications/${id}`); // Удаление спецификации

// === СПЕЦИФИКАЦИИ ЗАЯВОК ===
export const getBidSpecifications = (bidId) => api.get(`/bids/${bidId}/specifications`); // Получение спецификаций заявки
export const createBidSpecification = (bidId, data) => api.post(`/bids/${bidId}/specifications`, data); // Создание спецификации заявки
export const updateBidSpecification = (bidId, specId, data) => api.put(`/bids/${bidId}/specifications/${specId}`, data); // Обновление спецификации заявки
export const deleteBidSpecification = (bidId, specId) => api.delete(`/bids/${bidId}/specifications/${specId}`); // Удаление спецификации заявки
export const getBidHistory = (bidId) => api.get(`/bids/${bidId}/history`); // Получение истории заявки

// === КАТЕГОРИИ СПЕЦИФИКАЦИЙ ===
// CRUD-операции для категорий спецификаций
export const getSpecificationCategories = () => api.get('/specification-categories'); // Получение всех категорий
export const getSpecificationCategoriesTree = () => api.get('/specification-categories/tree'); // Получение дерева категорий
export const getSpecificationCategory = (id) => api.get(`/specification-categories/${id}`); // Получение категории по ID
export const createSpecificationCategory = (data) => api.post('/specification-categories', data); // Создание новой категории
export const updateSpecificationCategory = (id, data) => api.put(`/specification-categories/${id}`, data); // Обновление категории
export const deleteSpecificationCategory = (id) => api.delete(`/specification-categories/${id}`); // Удаление категории

// === ЗАРПЛАТА ===
// Отчет по зарплате
export const getSalaryReport = (params) => api.get('/salary/report', { params }); // Получение отчета по зарплате

// === БЭКАПЫ ===
export const createBackup = () => api.post('/backups/create'); // Создание бэкапа
export const getBackups = () => api.get('/backups/list'); // Получение списка бэкапов
export const downloadBackup = (filename) => api.get(`/backups/download/${filename}`, { responseType: 'blob' }); // Скачивание бэкапа
export const restoreBackup = (data) => {
    if (data instanceof FormData) {
        // Восстановление из файла
        return api.post('/backups/restore', data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    } else {
        // Восстановление из существующего бэкапа
        return api.post('/backups/restore', { filename: data });
    }
}; // Восстановление из бэкапа
export const deleteBackup = (filename) => api.delete(`/backups/${filename}`); // Удаление бэкапа

// === АНАЛИТИКА ===
export const getAnalytics = (period = 'all', specificDate = '') => {
    return api.get('/analytics', { params: { period, specificDate } });
}; // Получение статистики аналитики

// === УВЕДОМЛЕНИЯ ===
export const getNotifications = (filter = 'all', limit = 50) => {
    return api.get('/notifications', { params: { filter, limit } });
}; // Получение уведомлений
export const getUnreadNotificationsCount = () => api.get('/notifications/unread-count'); // Получение количества непрочитанных уведомлений
export const markNotificationAsRead = (id) => api.put(`/notifications/${id}/read`); // Пометка уведомления как прочитанного
export const markAllNotificationsAsRead = () => api.put('/notifications/read-all'); // Пометка всех уведомлений как прочитанных
export const deleteNotification = (id) => api.delete(`/notifications/${id}`); // Удаление уведомления
export const createNotification = (data) => api.post('/notifications/create', data); // Создание уведомления

// === ДОГОВОРЫ ===
export const getContracts = (page = 1, limit = 20, search = '') => {
    return api.get('/contracts', { params: { page, limit, search } });
}; // Получение списка договоров

export const getContractByBid = (bidId) => api.get(`/contracts/bid/${bidId}`); // Получение договора по ID заявки

export const createContract = (data) => api.post('/contracts', data); // Создание договора

export const updateContract = (id, data) => api.put(`/contracts/${id}`, data); // Обновление договора

export const deleteContract = (id) => api.delete(`/contracts/${id}`); // Удаление договора

// === ФОРМЫ СУБЪЕКТОВ ===
export const getSubjectForms = () => api.get('/subject-forms'); // Получение всех форм субъектов
export const createSubjectForm = (data) => api.post('/subject-forms', data); // Создание формы субъекта
export const updateSubjectForm = (id, data) => api.put(`/subject-forms/${id}`, data); // Обновление формы субъекта
export const deleteSubjectForm = (id) => api.delete(`/subject-forms/${id}`); // Удаление формы субъекта

export default api;