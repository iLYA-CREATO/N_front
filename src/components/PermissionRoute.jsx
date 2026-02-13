import { Navigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions.js';

/**
 * Компонент для защиты маршрутов на основе прав доступа
 * @param {Object} props - Свойства компонента
 * @param {React.Component} props.children - Дочерний компонент для рендеринга
 * @param {string|string[]} props.permissions - Требуемые права (строка или массив строк)
 * @param {string} props.requireAll - Если true, требуется все права из массива, иначе достаточно одного
 * @param {string} props.fallback - Путь для перенаправления при отсутствии прав
 * @returns {React.Component} Дочерний компонент или перенаправление
 */
const PermissionRoute = ({
    children,
    permissions,
    requireAll = false,
    fallback = '/dashboard/clients'
}) => {
    const { hasPermission, hasAllPermissions, hasAnyPermission } = usePermissions();

    // Если permissions не указаны, разрешаем доступ
    if (!permissions) {
        return children;
    }

    // Проверяем права
    let hasAccess = false;
    if (Array.isArray(permissions)) {
        hasAccess = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
    } else {
        hasAccess = hasPermission(permissions);
    }

    // Если прав нет, перенаправляем
    if (!hasAccess) {
        return <Navigate to={fallback} replace />;
    }

    return children;
};

export default PermissionRoute;