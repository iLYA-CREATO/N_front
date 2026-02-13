/**
 * Clients Component
 *
 * Этот компонент управляет отображением и созданием клиентов.
 * Показывает список клиентов, позволяет искать и фильтровать, а также добавлять новых клиентов.
 * Сохраняет настройки поиска, фильтров и столбцов в localStorage.
 */

// Импорт хуков React для управления состоянием и эффектами
import { useState, useEffect } from 'react';
// Импорт хука для навигации между маршрутами
import { useNavigate } from 'react-router-dom';
// Импорт функций API для работы с клиентами и пользователями
import { getClients, createClient, getUsers, getEnabledClientAttributes, getSubjectForms } from '../services/api';
// Импорт хука для проверки разрешений
import { usePermissions } from '../hooks/usePermissions';

const Clients = () => {
    // Хук для навигации
    const navigate = useNavigate();
    // Хук для проверки разрешений
    const { hasPermission } = usePermissions();

    // Состояние для списка клиентов
    const [clients, setClients] = useState([]);
    // Состояние для списка пользователей (для выбора ответственного)
    const [users, setUsers] = useState([]);
    // Состояние для списка форм субъектов
    const [subjectForms, setSubjectForms] = useState([]);
    // Состояние для показа модального окна создания клиента
    const [showModal, setShowModal] = useState(false);
    // Состояние для данных формы создания клиента
    const [formData, setFormData] = useState({
        name: '',         // Имя клиента
        email: '',        // Email клиента
        phone: '',        // Телефон клиента
        subjectForm: '',  // Форма субъекта
        responsibleId: '', // ID ответственного пользователя
    });
    // Состояние для поискового запроса (сохранение в localStorage)
    const [searchQuery, setSearchQuery] = useState(localStorage.getItem('clientsSearchQuery') || '');
    // Состояние для фильтра по ответственному (сохранение в localStorage)
    const [responsibleFilter, setResponsibleFilter] = useState(localStorage.getItem('clientsResponsibleFilter') || '');
    // Состояние для видимых фильтров (сохранение в localStorage)
    const [visibleFilters, setVisibleFilters] = useState(() => {
        const saved = localStorage.getItem('clientsVisibleFilters');
        return saved ? JSON.parse(saved) : { responsible: false }; // По умолчанию фильтр ответственного скрыт
    });
    // Состояние для показа модального окна выбора фильтров
    const [showFilterModal, setShowFilterModal] = useState(false);

    // Определение всех возможных колонок
    const allColumns = ['name', 'email', 'phone', 'subjectForm', 'responsible', 'bidsCount', 'objectsCount'];
    // Загрузка начальных состояний из localStorage
    const savedColumns = localStorage.getItem('clientsVisibleColumns');
    const defaultVisibleColumns = {
        name: true,
        email: true,
        phone: true,
        subjectForm: true,
        responsible: true,
        bidsCount: true,
        objectsCount: true,
    };
    const initialVisibleColumns = savedColumns ? { ...defaultVisibleColumns, ...JSON.parse(savedColumns) } : defaultVisibleColumns;
    const savedOrder = localStorage.getItem('clientsColumnOrder');
    let initialColumnOrder = savedOrder ? JSON.parse(savedOrder).filter(col => allColumns.includes(col)) : allColumns;

    // Ensure all new columns are included in the order
    allColumns.forEach(col => {
        if (!initialColumnOrder.includes(col)) {
            initialColumnOrder.push(col);
        }
    });

    // Состояние для порядка колонок
    const [columnOrder, setColumnOrder] = useState(initialColumnOrder);
    // Состояние для видимых колонок в таблице
    const [visibleColumns, setVisibleColumns] = useState(initialVisibleColumns);
    // Состояние для показа выпадающего списка настроек колонок
    const [showColumnSettings, setShowColumnSettings] = useState(false);

    // useEffect для загрузки клиентов с debounce при изменении поиска или фильтра
    useEffect(() => {
        const timeout = setTimeout(() => fetchClients(searchQuery, responsibleFilter), 300); // Задержка 300мс для оптимизации
        return () => clearTimeout(timeout); // Очистка таймера при изменении зависимостей
    }, [searchQuery, responsibleFilter]); // Зависимости: поиск и фильтр

    // useEffect для загрузки списка пользователей при монтировании компонента
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await getUsers(); // Получение пользователей с сервера
                setUsers(response.data); // Сохранение в состояние
            } catch (error) {
                console.error('Error fetching users:', error); // Логирование ошибки
            }
        };
        fetchUsers(); // Вызов функции
    }, []); // Пустой массив зависимостей - выполняется один раз при монтировании

    // useEffect для загрузки списка форм субъектов при монтировании компонента
    useEffect(() => {
        const fetchSubjectForms = async () => {
            try {
                const response = await getSubjectForms(); // Получение форм субъектов с сервера
                setSubjectForms(response.data); // Сохранение в состояние
            } catch (error) {
                console.error('Error fetching subject forms:', error); // Логирование ошибки
            }
        };
        fetchSubjectForms(); // Вызов функции
    }, []); // Пустой массив зависимостей - выполняется один раз при монтировании

    // useEffect для сохранения настроек колонок в localStorage
    useEffect(() => {
        localStorage.setItem('clientsVisibleColumns', JSON.stringify(visibleColumns));
    }, [visibleColumns]);

    // useEffect to save column order to localStorage
    useEffect(() => {
        localStorage.setItem('clientsColumnOrder', JSON.stringify(columnOrder));
    }, [columnOrder]);

    // useEffect to close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showColumnSettings && !event.target.closest('.column-settings')) {
                setShowColumnSettings(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showColumnSettings]);

    // Функция для загрузки клиентов с параметрами поиска и фильтра
    const fetchClients = async (search = '', responsibleId = '') => {
        console.log('Fetching clients...'); // Логирование начала загрузки
        try {
            const response = await getClients(search, responsibleId); // Вызов API с параметрами
            console.log('Clients response:', response); // Логирование ответа
            setClients(response.data); // Сохранение данных в состояние
            console.log('Clients set:', response.data); // Логирование установки данных
        } catch (error) {
            console.error('Error fetching clients:', error); // Логирование ошибки
            console.error('Error details:', error.response); // Детали ошибки
        }
    };

    // Обработчик отправки формы создания клиента
    const handleSubmit = async (e) => {
        e.preventDefault(); // Предотвращение перезагрузки страницы
        try {
            await createClient(formData); // Отправка данных на сервер
            fetchClients(); // Перезагрузка списка клиентов
            resetForm(); // Сброс формы
        } catch (error) {
            console.error('Error saving client:', error); // Логирование ошибки
        }
    };

    // Обработчик клика по клиенту для просмотра деталей
    const handleView = (client) => {
        navigate(`/dashboard/clients/${client.id}`); // Переход на страницу деталей клиента
    };

    // Функция сброса формы к начальному состоянию
    const resetForm = () => {
        setFormData({ // Сброс данных формы
            name: '',
            email: '',
            phone: '',
            subjectForm: '',
            responsibleId: '',
        });
        setShowModal(false); // Скрытие модального окна
    };

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
            case 'name': return 'Имя';
            case 'email': return 'Email';
            case 'phone': return 'Телефон';
            case 'subjectForm': return 'Форма субъекта';
            case 'responsible': return 'Ответственный';
            case 'bidsCount': return 'Заявок';
            case 'objectsCount': return 'Объектов';
            default: return column;
        }
    };

    // Функция для получения содержимого ячейки
    const getCellContent = (client, column) => {
        switch (column) {
            case 'name': return client.name;
            case 'email': return client.email;
            case 'phone': return client.phone;
            case 'subjectForm': return client.subjectForm || '-';
            case 'responsible': return client.responsible ? client.responsible.fullName || client.responsible.email : 'Не назначен';
            case 'bidsCount': return client._count?.bids || 0;
            case 'objectsCount': return client._count?.clientObjects || 0;
            default: return '';
        }
    };

    // Определение видимых столбцов в порядке columnOrder
    const displayColumns = columnOrder.filter(col => visibleColumns[col]);

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Клиенты</h1>

            {/* Карточка с фильтрами и элементами управления */}
            <div className="bg-gray-200 rounded-lg p-4 mb-6">
                {/* Кнопка создания нового клиента */}
                <div className="flex justify-end mb-4">
                    {hasPermission('client_create') && (
                        <button
                            onClick={() => setShowModal(true)} // Открытие модального окна создания клиента
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                        >
                            + Добавить клиента
                        </button>
                    )}
                </div>
                {/* Панель поиска и фильтров */}
                <div className="mb-4 flex gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Поиск по имени..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)} // Обновление поискового запроса
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
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
                    <button
                        onClick={() => setShowFilterModal(true)} // Открытие модального окна выбора фильтров
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                    >
                        Добавить фильтр
                    </button>
                </div>

                {/* Фильтр по ответственному, показывается если включен */}
                {visibleFilters.responsible && (
                    <div className="flex items-center gap-2">
                        <select
                            value={responsibleFilter}
                            onChange={(e) => setResponsibleFilter(e.target.value)} // Обновление фильтра
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Все ответственные</option>
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.fullName || user.username} {/* Отображение полного имени или username */}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={() => {
                                setVisibleFilters({ ...visibleFilters, responsible: false }); // Скрытие фильтра
                                setResponsibleFilter(''); // Сброс фильтра
                            }}
                            className="text-red-500 hover:text-red-700"
                        >
                            X {/* Кнопка удаления фильтра */}
                        </button>
                    </div>
                )}
            </div>

            {/* Таблица с клиентами */}
            <div className="bg-white rounded-lg shadow overflow-x-auto table-container flex-1 min-h-0">
                <table className="divide-y divide-gray-200" style={{ minWidth: `${displayColumns.length * 120}px` }}>
                    <thead className="bg-gray-50">
                    <tr>
                        {displayColumns.map(column => (
                            <th key={column} className="px-6 py-3 text-left text-xs font-medium text-gray-500 resize-x overflow-auto cursor-pointer hover:bg-gray-100 transition" style={{ minWidth: '1px' }}>
                                {getColumnLabel(column)}
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {/* Отображение списка клиентов */}
                    {clients.map((client) => (
                        <tr key={client.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleView(client)}>
                            {displayColumns.map(column => (
                                <td key={column} className="px-6 py-4 whitespace-nowrap">
                                    {getCellContent(client, column)}
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Модальное окно выбора фильтров */}
            {showFilterModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Выберите фильтр</h3>
                        <div className="space-y-2">
                            <button
                                onClick={() => {
                                    setVisibleFilters({ ...visibleFilters, responsible: true }); // Включение фильтра по ответственному
                                    setShowFilterModal(false); // Закрытие модального окна
                                }}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition"
                            >
                                Ответственный
                            </button>
                        </div>
                        <div className="flex gap-2 pt-4">
                            <button
                                onClick={() => setShowFilterModal(false)} // Закрытие модального окна
                                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
                            >
                                Закрыть
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Модальное окно создания нового клиента */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">
                            Добавить нового клиента
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4"> {/* Форма с обработчиком отправки */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Форма субъекта</label>
                                <select
                                    value={formData.subjectForm}
                                    onChange={(e) => setFormData({ ...formData, subjectForm: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Выберите форму субъекта</option>
                                    {subjectForms.map((sf) => (
                                        <option key={sf.id} value={sf.name}>{sf.name}</option>
                                    ))}
                                </select>
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
                </div>
            )}
        </div>
    );
};

export default Clients;