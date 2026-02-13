/**
 * Главный компонент приложения App
 *
 * Этот компонент настраивает маршрутизацию всего приложения,
 * предоставляет контекст аутентификации и определяет все доступные маршруты.
 */

// Импорт компонентов маршрутизации из React Router
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// Импорт провайдера аутентификации
import { AuthProvider } from './context/AuthContext.jsx';
// Импорт компонента защищенного маршрута
import ProtectedRoute from './components/ProtectedRoute';
// Импорт компонента защиты прав доступа
import PermissionRoute from './components/PermissionRoute';
// Импорт хука прав доступа
import { usePermissions } from './hooks/usePermissions.js';
// Импорт всех компонентов страниц
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Clients from './components/Clients';
import Bids from './components/Bids';
import ClientDetail from './components/ClientDetail';
import BidDetail from './components/BidDetail';
import ClientObjectDetail from './components/ClientObjectDetail';
import Objects from './components/Objects';
import Equipment from './components/Equipment';
import SupplierCreate from './components/SupplierCreate';
import Settings from './components/Settings';
import Salary from './components/Salary';
import Analytics from './components/Analytics';
import Contracts from './components/Contracts';
import BidNotification from './components/BidNotification';
import { ErrorProvider } from './components/ErrorModal';
// Импорт глобальных стилей
import './index.css';

function App() {
    return (
        // BrowserRouter для клиентской маршрутизации
        <Router>
            {/* Провайдер контекста аутентификации для всего приложения */}
            <AuthProvider>
                <ErrorProvider>
                    {/* Уведомления о новых заявках */}
                    <BidNotification />
                    <Routes>
                        {/* Маршрут для страницы входа (доступен без аутентификации) */}
                        <Route path="/login" element={<Login />} />

                        {/* Защищенный маршрут для дашборда (требует аутентификации) */}
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <Dashboard />
                                </ProtectedRoute>
                            }
                        >
                            {/* Вложенные маршруты дашборда (отображаются в Outlet компонента Dashboard) */}
                            <Route index element={<Navigate to="/dashboard/bids" replace />} /> {/* Перенаправление по умолчанию */}
                            <Route path="clients" element={<Clients />} /> {/* Список клиентов */}
                            <Route path="clients/:id" element={<ClientDetail />} /> {/* Детали клиента */}
                            <Route path="client-objects/:id" element={<ClientObjectDetail />} /> {/* Детали объекта клиента */}
                            <Route path="objects" element={<Objects />} /> {/* Список объектов клиентов */}
                            <Route path="bids" element={<Bids />} /> {/* Список заявок */}
                            <Route path="bids/:id" element={<BidDetail />} /> {/* Детали заявки */}
                            <Route
                                path="equipment"
                                element={
                                    <PermissionRoute permissions="tab_warehouse">
                                        <Equipment />
                                    </PermissionRoute>
                                }
                            /> {/* Список оборудования */}
                            <Route path="suppliers/create" element={<SupplierCreate />} /> {/* Создание поставщика */}
                            <Route
                                path="salary"
                                element={
                                    <PermissionRoute permissions="tab_salary">
                                        <Salary />
                                    </PermissionRoute>
                                }
                            /> {/* Зарплата */}
                            <Route path="analytics" element={<Analytics />} /> {/* Аналитика */}
                            <Route path="settings" element={<Settings />} /> {/* Настройки */}
                            <Route path="contracts" element={<Contracts />} /> {/* Договоры */}
                        </Route>

                        {/* Перенаправление с корневого пути на дашборд */}
                        <Route path="/" element={<Navigate to="/dashboard/bids" replace />} />
                        {/* Перенаправление для всех неизвестных маршрутов */}
                        <Route path="*" element={<Navigate to="/dashboard/bids" replace />} />
                    </Routes>
                </ErrorProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;