import { useState, useEffect, useRef } from 'react';
import { createBackup, getBackups, downloadBackup, restoreBackup, deleteBackup } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';

const BackupManagement = () => {
    const { hasPermission } = usePermissions();
    const [backups, setBackups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState(null);
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [selectedBackup, setSelectedBackup] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchBackups();
    }, []);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const fetchBackups = async () => {
        try {
            const response = await getBackups();
            setBackups(response.data.backups);
        } catch (error) {
            console.error('Error fetching backups:', error);
            setNotification({ type: 'error', message: 'Ошибка загрузки списка бэкапов' });
        }
    };

    const handleCreateBackup = async () => {
        setLoading(true);
        try {
            await createBackup();
            setNotification({ type: 'success', message: 'Бэкап успешно создан' });
            fetchBackups();
        } catch (error) {
            console.error('Error creating backup:', error);
            setNotification({ type: 'error', message: 'Ошибка создания бэкапа' });
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadBackup = async (filename) => {
        try {
            const response = await downloadBackup(filename);
            // Download is handled by the browser
        } catch (error) {
            console.error('Error downloading backup:', error);
            setNotification({ type: 'error', message: 'Ошибка скачивания бэкапа' });
        }
    };

    const handleDeleteBackup = async (filename) => {
        if (!confirm(`Вы уверены, что хотите удалить бэкап "${filename}"?`)) {
            return;
        }

        try {
            await deleteBackup(filename);
            setNotification({ type: 'success', message: 'Бэкап успешно удален' });
            fetchBackups();
        } catch (error) {
            console.error('Error deleting backup:', error);
            setNotification({ type: 'error', message: 'Ошибка удаления бэкапа' });
        }
    };

    const handleRestoreBackup = async (filename) => {
        setSelectedBackup(filename);
        setShowRestoreModal(true);
    };

    const confirmRestore = async () => {
        setLoading(true);
        try {
            await restoreBackup(selectedBackup);
            setNotification({ type: 'success', message: 'Бэкап успешно восстановлен' });
            setShowRestoreModal(false);
            setSelectedBackup(null);
        } catch (error) {
            console.error('Error restoring backup:', error);
            setNotification({ type: 'error', message: 'Ошибка восстановления бэкапа' });
        } finally {
            setLoading(false);
        }
    };

    const handleFileRestore = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('backupFile', file);

        setLoading(true);
        try {
            await restoreBackup(formData);
            setNotification({ type: 'success', message: 'Бэкап из файла успешно восстановлен' });
        } catch (error) {
            console.error('Error restoring from file:', error);
            setNotification({ type: 'error', message: 'Ошибка восстановления из файла' });
        } finally {
            setLoading(false);
            event.target.value = null; // Reset file input
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('ru-RU');
    };

    return (
        <>
            <div>
                <h3 className="text-lg font-semibold mb-4">Управление бэкапами</h3>

                {/* Notification */}
                {notification && (
                    <div className={`mb-4 p-4 rounded-lg ${
                        notification.type === 'success'
                            ? 'bg-green-100 border border-green-400 text-green-700'
                            : 'bg-red-100 border border-red-400 text-red-700'
                    }`}>
                        {notification.message}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={handleCreateBackup}
                        disabled={loading}
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg transition"
                    >
                        {loading ? 'Создание...' : 'Создать бэкап'}
                    </button>
                    <button
                        onClick={handleFileRestore}
                        disabled={loading}
                        className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-4 py-2 rounded-lg transition"
                    >
                        Восстановить из файла
                    </button>
                </div>

                {/* Backups List */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-md font-semibold mb-4">Список бэкапов</h4>
                    {backups.length === 0 ? (
                        <p className="text-gray-500">Бэкапов пока нет</p>
                    ) : (
                        <div className="space-y-2">
                            {backups.map((backup) => (
                                <div key={backup.filename} className="bg-white p-4 rounded-lg border flex justify-between items-center">
                                    <div>
                                        <div className="font-medium">{backup.filename}</div>
                                        <div className="text-sm text-gray-600">
                                            Размер: {formatFileSize(backup.size)} |
                                            Создан: {formatDate(backup.createdAt)} |
                                            Изменен: {formatDate(backup.modifiedAt)}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleDownloadBackup(backup.filename)}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition"
                                        >
                                            Скачать
                                        </button>
                                        <button
                                            onClick={() => handleRestoreBackup(backup.filename)}
                                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition"
                                        >
                                            Восстановить
                                        </button>
                                        <button
                                            onClick={() => handleDeleteBackup(backup.filename)}
                                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition"
                                        >
                                            Удалить
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Hidden file input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".sql,.dump"
                    style={{ display: 'none' }}
                />
            </div>

            {/* Restore Confirmation Modal */}
            {showRestoreModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Подтверждение восстановления</h3>
                            <p className="text-gray-600 mb-4">
                                Вы уверены, что хотите восстановить базу данных из бэкапа "{selectedBackup}"?
                                Это действие заменит текущие данные.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={confirmRestore}
                                    disabled={loading}
                                    className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white py-2 rounded-lg transition"
                                >
                                    {loading ? 'Восстановление...' : 'Восстановить'}
                                </button>
                                <button
                                    onClick={() => setShowRestoreModal(false)}
                                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
                                >
                                    Отмена
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default BackupManagement;