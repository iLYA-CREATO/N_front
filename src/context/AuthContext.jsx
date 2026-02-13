import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Проверка, залогинен ли пользователь при монтировании
        const token = localStorage.getItem('token');

        if (token) {
            // Попытка получить информацию о текущем пользователе
            getMe()
                .then((response) => {
                    const userData = response.data.user;
                    localStorage.setItem('user', JSON.stringify(userData));
                    setUser(userData);
                })
                .catch((error) => {
                    console.error('Failed to fetch user info:', error);
                    // Если пользователь не найден (404), очищаем недействительный токен и данные пользователя
                    if (error.response && error.response.status === 404) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        setUser(null);
                    } else {
                        // Для других ошибок, используем сохраненного пользователя, если доступен
                        const savedUser = localStorage.getItem('user');
                        if (savedUser) {
                            setUser(JSON.parse(savedUser));
                        }
                    }
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, []);

    const login = (userData, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const value = {
        user,
        login,
        logout,
        isAuthenticated: !!user,
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};