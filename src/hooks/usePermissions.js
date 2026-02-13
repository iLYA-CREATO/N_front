import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Хук для проверки прав доступа пользователя
 * @returns {Object} Объект с методами проверки прав
 */
export const usePermissions = () => {
    const { user } = useAuth();

    /**
     * Проверяет, имеет ли пользователь указанное право
     * @param {string} permission - Название права (например, 'user_create', 'tab_warehouse')
     * @returns {boolean} true если право есть, false если нет
     */
    const hasPermission = useCallback((permission) => {
        // Админы имеют все права автоматически
        if (user?.role === 'Админ') {
            return true;
        }
        // Проверяем наличие права в permissions пользователя
        return user?.permissions?.[permission] === true;
    }, [user?.permissions, user?.role]);

    /**
     * Проверяет, имеет ли пользователь хотя бы одно из указанных прав
     * @param {string[]} permissions - Массив названий прав
     * @returns {boolean} true если есть хотя бы одно право, false если нет
     */
    const hasAnyPermission = useCallback((permissions) => {
        return permissions.some(permission => hasPermission(permission));
    }, [hasPermission]);

    /**
     * Проверяет, имеет ли пользователь все указанные права
     * @param {string[]} permissions - Массив названий прав
     * @returns {boolean} true если есть все права, false если нет
     */
    const hasAllPermissions = useCallback((permissions) => {
        return permissions.every(permission => hasPermission(permission));
    }, [hasPermission]);

    /**
     * Проверяет, доступна ли вкладка для пользователя
     * @param {string} tabName - Название вкладки ('warehouse' или 'salary')
     * @returns {boolean} true если вкладка доступна, false если нет
     */
    const canAccessTab = useCallback((tabName) => {
        const tabPermissions = {
            warehouse: 'tab_warehouse',
            salary: 'tab_salary'
        };

        return hasPermission(tabPermissions[tabName]);
    }, [hasPermission]);

    return {
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        canAccessTab,
        permissions: user?.permissions || {},
        isAdmin: user?.role === 'Админ'
    };
};