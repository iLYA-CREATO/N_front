/**
 * Dashboard Component
 *
 * Основной компонент дашборда с боковой навигацией.
 * Отображает боковую панель с меню и основную область для дочерних компонентов.
 * Включает специальный режим для страницы настроек.
 */

// Импорт компонентов и хуков из React Router
import { NavLink, Outlet, useLocation } from 'react-router-dom';
// Импорт иконок из Lucide React
import { User, Shield, Tag, Folder, FileText, Target, Settings, DoorOpen, ClipboardList, Users, Building, Package, DollarSign, LogOut, Cog, ChevronLeft, ChevronRight, Bell, BarChart2 } from 'lucide-react';
// Импорт хука состояния
import { useState, useEffect, useMemo } from 'react';
// Импорт хука аутентификации
import { useAuth } from '../context/AuthContext.jsx';
// Импорт хука прав доступа
import { usePermissions } from '../hooks/usePermissions.js';
// Импорт хука ошибок
import { useError } from './ErrorModal.jsx';
// Импорт API функций для уведомлений
import { getNotifications, markNotificationAsRead } from '../services/api';

const Dashboard = () => {
    // Получение данных пользователя и функции выхода из контекста аутентификации
    const { user, logout } = useAuth();
    // Хук для проверки прав доступа
    const { canAccessTab, hasPermission } = usePermissions();
    // Хук для отображения ошибок
    const { showError } = useError();
    // Хук для получения текущего пути
    const location = useLocation();
    // Проверка, находится ли пользователь на странице настроек
    const isSettings = location.pathname === '/dashboard/settings';
    // Состояние для активной вкладки в настройках
    const [activeSettingsTab, setActiveSettingsTab] = useState('user');
    // Состояние для свернутой/развернутой боковой панели
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    // Состояние для показа уведомлений
    const [showNotifications, setShowNotifications] = useState(false);
    const [notificationFilter, setNotificationFilter] = useState('all');
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loadingNotifications, setLoadingNotifications] = useState(false);

    // Определение доступных вкладок настроек
    const availableSettingsTabs = [
        { id: 'user', permission: 'settings_user_button', label: 'Пользователь' },
        { id: 'roles', permission: 'settings_role_button', label: 'Роли' },
        { id: 'subject-forms', permission: 'settings_subject_forms_button', label: 'Субъекты пред. деятельности' },
        { id: 'client-attributes', permission: 'settings_client_attributes_button', label: 'Атрибуты клиентов' },
        { id: 'specification-categories', permission: 'settings_spec_category_button', label: 'Категории спецификаций' },
        { id: 'specifications', permission: 'settings_spec_button', label: 'Спецификации' },
        { id: 'bid-types', permission: 'settings_bid_type_button', label: 'Тип Заявки' },
        { id: 'administration', permission: 'settings_administration_button', label: 'Администрирование' },
    ];

    // Установка активной вкладки на первую доступную при входе на страницу настроек
    useEffect(() => {
        if (isSettings && activeSettingsTab === 'user') { // Только если мы еще не переключались
            const firstAvailableTab = availableSettingsTabs.find(tab => hasPermission(tab.permission));
            if (firstAvailableTab && firstAvailableTab.id !== 'user') {
                setActiveSettingsTab(firstAvailableTab.id);
            }
        }
    }, [isSettings, activeSettingsTab]);

    // Закрытие панели уведомлений при клике вне её
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showNotifications && !event.target.closest('.notification-panel') && !event.target.closest('.notification-button')) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showNotifications]);

    // Функция для загрузки уведомлений
    const fetchNotifications = async () => {
        try {
            setLoadingNotifications(true);
            const response = await getNotifications(notificationFilter);
            if (response.data.success) {
                setNotifications(response.data.data);
                setUnreadCount(response.data.unreadCount);
            }
        } catch (error) {
            console.error('Ошибка при загрузке уведомлений:', error);
        } finally {
            setLoadingNotifications(false);
        }
    };

    // Загрузка уведомлений при изменении фильтра
    useEffect(() => {
        fetchNotifications();
    }, [notificationFilter]);

    // Функция для получения иконки для вкладки настроек
    const getSettingsIcon = useMemo(() => (tabId) => {
        const icons = {
            'user': <User key="user-icon" size={20} />,
            'roles': <Shield key="roles-icon" size={20} />,
            'client-attributes': <Tag key="client-attributes-icon" size={20} />,
            'specification-categories': <Folder key="specification-categories-icon" size={20} />,
            'specifications': <FileText key="specifications-icon" size={20} />,
            'bid-types': <Target key="bid-types-icon" size={20} />,
            'administration': <Settings key="administration-icon" size={20} />
        };
        return icons[tabId] || <Settings key="default-settings-icon" size={20} />;
    }, []);

    // Функция для получения иконки для основной навигации
    const getNavIcon = useMemo(() => (navId) => {
        const icons = {
            'bids': <ClipboardList key="bids-icon" size={20} />,
            'clients': <Users key="clients-icon" size={20} />,
            'contracts': <FileText key="contracts-icon" size={20} />,
            'objects': <Building key="objects-icon" size={20} />,
            'equipment': <Package key="equipment-icon" size={20} />,
            'salary': <DollarSign key="salary-icon" size={20} />,
            'analytics': <BarChart2 key="analytics-icon" size={20} />,
            'settings': <Cog key="settings-icon" size={20} />,
            'logout': <LogOut key="logout-icon" size={20} />
        };
        return icons[navId] || <Cog key="default-nav-icon" size={20} />;
    }, []);

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Верхняя панель с кнопкой выхода */}
            <div className="fixed top-0 bg-sky-50 flex justify-end items-center h-16 px-4 gap-4 z-10" style={{ left: `${isSettings ? (isSidebarCollapsed ? 4 : 14) : isSidebarCollapsed ? 4 : 16}rem`, width: `calc(100% - ${isSettings ? (isSidebarCollapsed ? 4 : 14) : isSidebarCollapsed ? 4 : 16}rem)`, transition: 'left 0.3s, width 0.3s' }}>
                <div className="flex items-center gap-2 text-gray-700 font-medium mr-4">
                    <User size={20} />
                    {user?.fullName}
                </div>
                <button
                    onClick={() => {
                        setShowNotifications(!showNotifications);
                        if (!showNotifications) {
                            fetchNotifications();
                        }
                    }}
                    className={`notification_button relative flex items-center justify-center w-10 h-10 rounded-lg transition ${
                        unreadCount > 0 
                            ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                    title="Уведомления"
                >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {unreadCount}
                        </span>
                    )}
                </button>
                {/* Панель уведомлений */}
                {showNotifications && (
                    <div className="notification_panel absolute top-16 right-4 w-80 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium">Уведомления</h4>
                                <select
                                    value={notificationFilter}
                                    onChange={(e) => setNotificationFilter(e.target.value)}
                                    className="text-sm border border-gray-300 rounded px-2 py-1"
                                >
                                    <option value="all">Все</option>
                                    <option value="unread">Непрочитанные</option>
                                    <option value="bid_created">Создана заявка</option>
                                    <option value="equipment_added">Добавлено оборудование</option>
                                    <option value="specification_added">Добавлена спецификация</option>
                                </select>
                            </div>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {loadingNotifications ? (
                                <div className="p-8 text-center text-gray-500">
                                    Загрузка...
                                </div>
                            ) : notifications.length > 0 ? (
                                notifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 hover:bg-gray-50 cursor-pointer transition ${
                                            !notification.isRead ? 'bg-blue-50' : ''
                                        }`}
                                        onClick={async () => {
                                            if (!notification.isRead) {
                                                try {
                                                    await markNotificationAsRead(notification.id);
                                                    setNotifications(prev =>
                                                        prev.map(n =>
                                                            n.id === notification.id ? { ...n, isRead: true } : n
                                                        )
                                                    );
                                                    setUnreadCount(prev => Math.max(0, prev - 1));
                                                } catch (error) {
                                                    console.error('Ошибка при отметке уведомления:', error);
                                                }
                                            }
                                        }}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`w-2 h-2 rounded-full mt-2 ${
                                                notification.type === 'overdue' ? 'bg-red-500' :
                                                notification.type === 'bid_created' ? 'bg-blue-500' :
                                                notification.type === 'equipment_added' ? 'bg-orange-500' :
                                                notification.type === 'specification_added' ? 'bg-green-500' :
                                                'bg-gray-500'
                                            }`}></div>
                                            <div className="flex-1">
                                                <p className={`font-medium text-sm ${
                                                    !notification.isRead ? 'text-gray-900' : 'text-gray-600'
                                                }`}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-2">
                                                    {new Date(notification.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                            {!notification.isRead && (
                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-gray-500">
                                    Нет уведомлений
                                </div>
                            )}
                        </div>
                    </div>
                )}
                <button
                    onClick={logout}
                    className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition"
                >
                    <LogOut size={20} /> Выйти
                </button>
            </div>
            {/* Боковая панель: ширина зависит от состояния свернутости и страницы настроек */}
            <aside className={`${isSettings ? `${isSidebarCollapsed ? 'w-16' : 'w-56'} px-4 py-6 bg-sky-50 fixed left-0 top-0 h-screen transition-all duration-300` : `${isSidebarCollapsed ? 'w-16' : 'w-64'} bg-sky-50 flex flex-col fixed left-0 top-0 h-screen transition-all duration-300`}`}>
                {/* Условный рендеринг: если на странице настроек */}
                {isSettings ? (
                    <div>
                        {/* Кнопка сворачивания/разворачивания боковой панели */}
                        <button
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            className={`mb-4 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition font-medium ${isSidebarCollapsed ? 'flex justify-center items-center w-full p-2 text-lg' : 'px-4 py-2 w-full'}`}
                            title={isSidebarCollapsed ? "Развернуть панель" : "Свернуть панель"}
                        >
                            {isSidebarCollapsed ? '→' : '← Свернуть панель'}
                        </button>
                        {/* Кнопка возврата на предыдущую страницу */}
                        <button
                            onClick={() => window.history.back()}
                            className={`mb-4 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition font-medium ${isSidebarCollapsed ? 'flex justify-center items-center w-full p-2' : 'px-4 py-2 w-full'}`}
                            title="Вернуться"
                        >
                            {isSidebarCollapsed ? <DoorOpen size={20} /> : 'Вернуться'}
                        </button>
                        {/* Навигация по вкладкам настроек */}
                        <nav className="space-y-2">
                            {availableSettingsTabs
                                .filter(tab => hasPermission(tab.permission) || user?.role === 'Админ')
                                .map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveSettingsTab(tab.id)}
                                        className={`${isSidebarCollapsed ? 'flex justify-center px-2 py-2' : 'w-full text-left px-4 py-2'} rounded-lg font-medium transition ${
                                            activeSettingsTab === tab.id
                                                ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-500' // Активная вкладка
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' // Неактивная
                                        }`}
                                        title={isSidebarCollapsed ? tab.label : ""}
                                    >
                                        {isSidebarCollapsed ? getSettingsIcon(tab.id) : tab.label}
                                    </button>
                                ))}
                        </nav>
                    </div>
                ) : (
                    <>
                        {/* Логотип в верхней части боковой панели */}
                        <div className={`p-6 border-b border-gray-200 ${isSidebarCollapsed && !isSettings ? 'flex justify-center' : ''}`}>
                            {!isSettings && (
                                <button
                                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                                    className={`${isSidebarCollapsed ? 'flex justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded transition-all' : 'flex items-center px-4 py-2 gap-2 rounded-lg font-medium transition text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                                    title={isSidebarCollapsed ? "Развернуть" : "Свернуть"}
                                >
                                    {isSidebarCollapsed ? <ChevronRight size={20} /> : <><ChevronLeft size={20} /> <span className={`transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>Свернуть</span></>}
                                </button>
                            )}
                        </div>

                        {/* Основная навигация */}
                        <nav className="flex-1 px-4 py-6">
                            <div className="space-y-2">
                                {/* Ссылка на страницу заявок */}
                                <NavLink
                                    to="/dashboard/bids"
                                    className={({ isActive }) =>
                                        `${
                                            isActive
                                                ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-500' // Активная ссылка
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' // Неактивная
                                        } ${isSidebarCollapsed ? 'flex justify-center p-2' : 'flex items-center px-4 py-2 gap-2'} rounded-lg font-medium transition`
                                    }
                                    title={isSidebarCollapsed ? "Заявки" : ""}
                                >
                                    {getNavIcon('bids')} <span className={`transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>Заявки</span>
                                </NavLink>
                                {/* Ссылка на страницу клиентов */}
                                <NavLink
                                    to="/dashboard/clients"
                                    className={({ isActive }) =>
                                        `${
                                            isActive
                                                ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-500'
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                        } ${isSidebarCollapsed ? 'flex justify-center p-2' : 'flex items-center px-4 py-2 gap-2'} rounded-lg font-medium transition`
                                    }
                                    title={isSidebarCollapsed ? "Клиенты" : ""}
                                >
                                    {getNavIcon('clients')} <span className={`transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>Клиенты</span>
                                </NavLink>
                                {/* Ссылка на страницу договоров */}
                                <NavLink
                                    to="/dashboard/contracts"
                                    className={({ isActive }) =>
                                        `${
                                            isActive
                                                ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-500'
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                        } ${isSidebarCollapsed ? 'flex justify-center p-2' : 'flex items-center px-4 py-2 gap-2'} rounded-lg font-medium transition`
                                    }
                                    title={isSidebarCollapsed ? "Договоры" : ""}
                                >
                                    {getNavIcon('contracts')} <span className={`transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>Договоры</span>
                                </NavLink>
                                {/* Ссылка на страницу объектов */}
                                <NavLink
                                    to="/dashboard/objects"
                                    className={({ isActive }) =>
                                        `${
                                            isActive
                                                ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-500'
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                        } ${isSidebarCollapsed ? 'flex justify-center p-2' : 'flex items-center px-4 py-2 gap-2'} rounded-lg font-medium transition`
                                    }
                                    title={isSidebarCollapsed ? "Объекты" : ""}
                                >
                                    {getNavIcon('objects')} <span className={`transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>Объекты</span>
                                </NavLink>
                                {/* Ссылка на страницу оборудования */}
                                {canAccessTab('warehouse') && (
                                    <NavLink
                                        to="/dashboard/equipment"
                                        className={({ isActive }) =>
                                            `${
                                                isActive
                                                    ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-500'
                                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                            } ${isSidebarCollapsed ? 'flex justify-center p-2' : 'flex items-center px-4 py-2 gap-2'} rounded-lg font-medium transition`
                                        }
                                        title={isSidebarCollapsed ? "Оборудование" : ""}
                                    >
                                        {getNavIcon('equipment')} <span className={`transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>Оборудование</span>
                                    </NavLink>
                                )}
                                {/* Ссылка на страницу зарплаты */}
                                {canAccessTab('salary') && (
                                    <NavLink
                                        to="/dashboard/salary"
                                        className={({ isActive }) =>
                                            `${
                                                isActive
                                                    ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-500'
                                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                            } ${isSidebarCollapsed ? 'flex justify-center p-2' : 'flex items-center px-4 py-2 gap-2'} rounded-lg font-medium transition`
                                        }
                                        title={isSidebarCollapsed ? "Зарплата" : ""}
                                    >
                                        {getNavIcon('salary')} <span className={`transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>З/П</span>
                                    </NavLink>
                                )}
                                {/* Ссылка на страницу аналитики */}
                                <NavLink
                                    to="/dashboard/analytics"
                                    className={({ isActive }) =>
                                        `${
                                            isActive
                                                ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-500'
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                        } ${isSidebarCollapsed ? 'flex justify-center p-2' : 'flex items-center px-4 py-2 gap-2'} rounded-lg font-medium transition`
                                    }
                                    title={isSidebarCollapsed ? "Аналитика" : ""}
                                >
                                    {getNavIcon('analytics')} <span className={`transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>Аналитика</span>
                                </NavLink>
                            </div>
                        </nav>

                        {/* Нижняя часть боковой панели с настройками */}
                        <div className="p-4 border-t border-gray-200">
                            <NavLink
                                to="/dashboard/settings"
                                className={({ isActive }) =>
                                    `${isActive ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-500' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'} ${isSidebarCollapsed ? 'flex justify-center p-2' : 'flex items-center px-4 py-2 gap-2'} rounded-lg font-medium transition`
                                }
                                title={isSidebarCollapsed ? "Настройки" : ""}
                            >
                                {getNavIcon('settings')} <span className={`transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>Настройки</span>
                            </NavLink>
                        </div>

                    </>
                )}
            </aside>

            {/* Основная область для отображения дочерних компонентов */}
            <main className={`mt-16 h-[calc(100vh-4rem)] ${isSettings ? (isSidebarCollapsed ? 'ml-16' : 'ml-48') : isSidebarCollapsed ? 'ml-16' : 'ml-64'} transition-all duration-300`}>
                <div className="p-8 h-full overflow-auto">
                    <Outlet key={activeSettingsTab} context={{ activeSettingsTab }} /> {/* Передача контекста дочерним маршрутам */}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;