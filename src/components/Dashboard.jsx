/**
 * Dashboard Component
 *
 * Основной компонент дашборда с боковой навигацией.
 * Отображает боковую панель с меню и основную область для дочерних компонентов.
 * Включает специальный режим для страницы настроек.
 * Полная поддержка мобильных устройств.
 */

// Импорт компонентов и хуков из React Router
import { NavLink, Outlet, useLocation } from 'react-router-dom';
// Импорт иконок из Lucide React
import { User, Shield, Tag, Folder, FileText, Target, Settings, DoorOpen, ClipboardList, Users, Building, Package, DollarSign, LogOut, Cog, ChevronLeft, ChevronRight, Bell, BarChart2, Menu, X } from 'lucide-react';
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
    // Состояние для свернутой/развернутой боковой панели (десктоп)
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    // Состояние для показа мобильного меню
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

    // Определение основных навигационных элементов
    const mainNavItems = [
        { id: 'bids', path: '/dashboard/bids', label: 'Заявки', icon: ClipboardList, permission: null },
        { id: 'clients', path: '/dashboard/clients', label: 'Клиенты', icon: Users, permission: null },
        { id: 'contracts', path: '/dashboard/contracts', label: 'Договоры', icon: FileText, permission: null },
        { id: 'objects', path: '/dashboard/objects', label: 'Объекты', icon: Building, permission: null },
        { id: 'equipment', path: '/dashboard/equipment', label: 'Оборудование', icon: Package, permission: 'tab_warehouse' },
        { id: 'salary', path: '/dashboard/salary', label: 'З/П', icon: DollarSign, permission: 'tab_salary' },
        { id: 'analytics', path: '/dashboard/analytics', label: 'Аналитика', icon: BarChart2, permission: null },
    ];

    // Установка активной вкладки на первую доступную при входе на страницу настроек
    useEffect(() => {
        if (isSettings && activeSettingsTab === 'user') {
            const firstAvailableTab = availableSettingsTabs.find(tab => hasPermission(tab.permission));
            if (firstAvailableTab && firstAvailableTab.id !== 'user') {
                setActiveSettingsTab(firstAvailableTab.id);
            }
        }
    }, [isSettings, activeSettingsTab]);

    // Закрытие мобильного меню при изменении маршрута
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

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

    // Функция для закрытия мобильного меню
    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    // Вычисление отступа для десктопа
    const desktopMainMargin = isSettings 
        ? (isSidebarCollapsed ? 'ml-16' : 'ml-56')
        : (isSidebarCollapsed ? 'ml-16' : 'ml-64');

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Мобильная шапка */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-20 flex items-center justify-between px-4">
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="p-2 rounded-lg hover:bg-gray-100 mobile-tap"
                >
                    <Menu size={24} />
                </button>
                <span className="font-semibold text-gray-800">CRM System</span>
                <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`relative p-2 rounded-lg mobile-tap ${unreadCount > 0 ? 'text-orange-500' : 'text-gray-600'}`}
                >
                    <Bell size={24} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {unreadCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Мобильное меню (sidebar overlay) */}
            <div className={`mobile-sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`} onClick={closeMobileMenu} />
            <aside className={`mobile-sidebar ${isMobileMenuOpen ? 'active' : ''}`}>
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <span className="font-semibold text-gray-800">Меню</span>
                    <button onClick={closeMobileMenu} className="p-2 rounded-lg hover:bg-gray-100 mobile-tap">
                        <X size={24} />
                    </button>
                </div>
                <nav className="p-4">
                    <div className="space-y-2">
                        {/* Навигация по основным разделам */}
                        {mainNavItems.map(item => {
                            const Icon = item.icon;
                            if (item.permission && !canAccessTab(item.permission.replace('tab_', ''))) return null;
                            return (
                                <NavLink
                                    key={item.id}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
                                            isActive
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'text-gray-600 hover:bg-gray-100'
                                        }`
                                    }
                                    onClick={closeMobileMenu}
                                >
                                    <Icon size={20} />
                                    <span>{item.label}</span>
                                </NavLink>
                            );
                        })}
                        <div className="border-t border-gray-200 my-4"></div>
                        {/* Настройки в мобильном меню */}
                        <NavLink
                            to="/dashboard/settings"
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
                                    isActive
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`
                            }
                            onClick={closeMobileMenu}
                        >
                            <Cog size={20} />
                            <span>Настройки</span>
                        </NavLink>
                        {/* Выход в мобильном меню */}
                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition text-red-600 hover:bg-red-50"
                        >
                            <LogOut size={20} />
                            <span>Выйти</span>
                        </button>
                    </div>
                </nav>
            </aside>

            {/* Десктопная боковая панель */}
            <aside className="desktop-sidebar hidden md:flex flex-col fixed left-0 top-0 h-screen bg-sky-50 transition-all duration-300 z-10"
                style={{ width: isSettings ? (isSidebarCollapsed ? '4rem' : '14rem') : (isSidebarCollapsed ? '4rem' : '16rem') }}
            >
                {/* Условный рендеринг: если на странице настроек */}
                {isSettings ? (
                    <div className="p-4">
                        <button
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            className={`mb-4 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition font-medium ${isSidebarCollapsed ? 'flex justify-center items-center w-full p-2' : 'px-4 py-2 w-full'}`}
                            title={isSidebarCollapsed ? "Развернуть панель" : "Свернуть панель"}
                        >
                            {isSidebarCollapsed ? '→' : '← Свернуть'}
                        </button>
                        <button
                            onClick={() => window.history.back()}
                            className={`mb-4 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition font-medium ${isSidebarCollapsed ? 'flex justify-center items-center w-full p-2' : 'px-4 py-2 w-full'}`}
                            title="Вернуться"
                        >
                            {isSidebarCollapsed ? <DoorOpen size={20} /> : 'Вернуться'}
                        </button>
                        <nav className="space-y-2">
                            {availableSettingsTabs
                                .filter(tab => hasPermission(tab.permission) || user?.role === 'Админ')
                                .map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveSettingsTab(tab.id)}
                                        className={`${isSidebarCollapsed ? 'flex justify-center px-2 py-2' : 'w-full text-left px-4 py-2'} rounded-lg font-medium transition ${
                                            activeSettingsTab === tab.id
                                                ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-500'
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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
                        <div className={`p-4 border-b border-gray-200 ${isSidebarCollapsed ? 'flex justify-center' : ''}`}>
                            <button
                                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                                className={`${isSidebarCollapsed ? 'flex justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded transition-all' : 'flex items-center px-4 py-2 gap-2 rounded-lg font-medium transition text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                                title={isSidebarCollapsed ? "Развернуть" : "Свернуть"}
                            >
                                {isSidebarCollapsed ? <ChevronRight size={20} /> : <><ChevronLeft size={20} /> <span>Свернуть</span></>}
                            </button>
                        </div>
                        <nav className="flex-1 p-4">
                            <div className="space-y-2">
                                {mainNavItems.map(item => {
                                    const Icon = item.icon;
                                    if (item.permission && !canAccessTab(item.permission.replace('tab_', ''))) return null;
                                    return (
                                        <NavLink
                                            key={item.id}
                                            to={item.path}
                                            className={({ isActive }) =>
                                                `${isActive ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-500' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'} ${isSidebarCollapsed ? 'flex justify-center p-2' : 'flex items-center px-4 py-2 gap-2'} rounded-lg font-medium transition`
                                            }
                                            title={isSidebarCollapsed ? item.label : ""}
                                        >
                                            <Icon size={20} />
                                            {!isSidebarCollapsed && <span>{item.label}</span>}
                                        </NavLink>
                                    );
                                })}
                            </div>
                        </nav>
                        <div className="p-4 border-t border-gray-200">
                            <NavLink
                                to="/dashboard/settings"
                                className={({ isActive }) =>
                                    `${isActive ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-500' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'} ${isSidebarCollapsed ? 'flex justify-center p-2' : 'flex items-center px-4 py-2 gap-2'} rounded-lg font-medium transition`
                                }
                                title={isSidebarCollapsed ? "Настройки" : ""}
                            >
                                <Cog size={20} />
                                {!isSidebarCollapsed && <span>Настройки</span>}
                            </NavLink>
                        </div>
                    </>
                )}
            </aside>

            {/* Десктопная верхняя панель */}
            <div className="hidden md:flex fixed top-0 bg-sky-50 justify-end items-center h-16 px-4 gap-4 z-10"
                style={{ left: isSettings ? (isSidebarCollapsed ? '4rem' : '14rem') : (isSidebarCollapsed ? '4rem' : '16rem'), width: `calc(100% - ${isSettings ? (isSidebarCollapsed ? '4rem' : '14rem') : (isSidebarCollapsed ? '4rem' : '16rem')})` }}
            >
                <div className="flex items-center gap-2 text-gray-700 font-medium mr-4">
                    <User size={20} />
                    <span className="hidden lg:inline">{user?.fullName}</span>
                </div>
                <button
                    onClick={() => {
                        setShowNotifications(!showNotifications);
                        if (!showNotifications) fetchNotifications();
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
                                <div className="p-8 text-center text-gray-500">Загрузка...</div>
                            ) : notifications.length > 0 ? (
                                notifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 hover:bg-gray-50 cursor-pointer transition ${!notification.isRead ? 'bg-blue-50' : ''}`}
                                        onClick={async () => {
                                            if (!notification.isRead) {
                                                await markNotificationAsRead(notification.id);
                                                setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
                                                setUnreadCount(prev => Math.max(0, prev - 1));
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
                                                <p className={`font-medium text-sm ${!notification.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                                                <p className="text-xs text-gray-400 mt-2">
                                                    {new Date(notification.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-gray-500">Нет уведомлений</div>
                            )}
                        </div>
                    </div>
                )}
                <button
                    onClick={logout}
                    className="hidden lg:flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition"
                >
                    <LogOut size={20} /> Выйти
                </button>
            </div>

            {/* Основная область */}
            <main className={`pt-16 md:pt-16 h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] ${desktopMainMargin} transition-all duration-300`}>
                <div className="p-4 md:p-8 h-full overflow-auto">
                    <Outlet key={activeSettingsTab} context={{ activeSettingsTab }} />
                </div>
            </main>

            {/* Мобильная нижняя панель навигации */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 pb-safe">
                <div className="flex justify-around items-center py-2">
                    {mainNavItems.slice(0, 5).map(item => {
                        const Icon = item.icon;
                        if (item.permission && !canAccessTab(item.permission.replace('tab_', ''))) return null;
                        return (
                            <NavLink
                                key={item.id}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex flex-col items-center px-3 py-2 rounded-lg transition ${
                                        isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                                    }`
                                }
                            >
                                <Icon size={24} />
                                <span className="text-xs mt-1">{item.label}</span>
                            </NavLink>
                        );
                    })}
                    <NavLink
                        to="/dashboard/settings"
                        className={({ isActive }) =>
                            `flex flex-col items-center px-3 py-2 rounded-lg transition ${
                                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                            }`
                        }
                    >
                        <Settings size={24} />
                        <span className="text-xs mt-1">Настройки</span>
                    </NavLink>
                </div>
            </nav>
        </div>
    );
};

export default Dashboard;
