import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createSupplier } from '../services/api';

const SupplierCreate = ({ closeTab }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || '/dashboard/equipment/arrival';

    const [formData, setFormData] = useState({
        name: '',
        entityType: 'individual', // individual or legal
        inn: '',
        phone: '',
        email: '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await createSupplier(formData);
            // Закрываем вкладку и передаем данные нового поставщика
            closeTab();
            // При необходимости можно передать данные обратно
        } catch (error) {
            console.error('Error creating supplier:', error);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Создание поставщика</h2>
                <button
                    onClick={closeTab}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                >
                    Назад
                </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6 max-w-md">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Тип</label>
                        <select
                            value={formData.entityType}
                            onChange={(e) => setFormData({ ...formData, entityType: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="individual">Физическое лицо</option>
                            <option value="legal">Юридическое лицо</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ИНН</label>
                        <input
                            type="text"
                            value={formData.inn}
                            onChange={(e) => setFormData({ ...formData, inn: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex gap-2 pt-4">
                        <button
                            type="submit"
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition"
                        >
                            Создать поставщика
                        </button>
                        <button
                            type="button"
                            onClick={closeTab}
                            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
                        >
                            Отмена
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SupplierCreate;