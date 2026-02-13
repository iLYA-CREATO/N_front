import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginAPI } from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [credentials, setCredentials] = useState({
        username: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await loginAPI(credentials);
            login(response.data.user, response.data.token);
            navigate('/dashboard/bids');
        } catch (err) {
            setError(err.response?.data?.message || 'Вход не удался');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-100 via-blue-200 to-blue-400 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
                <h1 className="text-3xl font-bold text-blue-600 mb-6 text-center" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                    Navi Desk
                </h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Имя пользователя
                        </label>
                        <input
                            type="text"
                            value={credentials.username}
                            onChange={(e) =>
                                setCredentials({ ...credentials, username: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Введите имя пользователя"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Пароль
                        </label>
                        <input
                            type="password"
                            value={credentials.password}
                            onChange={(e) =>
                                setCredentials({ ...credentials, password: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Введите пароль"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50"
                    >
                        {loading ? 'Вход...' : 'Войти'}
                    </button>
                </form>


            </div>
        </div>
    );
};

export default Login;