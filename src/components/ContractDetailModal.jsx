/**
 * ContractDetailModal Component
 * 
 * Модальное окно для отображения детальной информации о договоре.
 */

import { X } from 'lucide-react';

const ContractDetailModal = ({ contract, onClose }) => {
    if (!contract) return null;

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const calculateRemainingDays = () => {
        if (!contract.contractEndDate) return '-';
        const now = new Date();
        const end = new Date(contract.contractEndDate);
        const diffMs = end - now;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
            return <span className="text-red-500 font-medium">Истёк ({Math.abs(diffDays)} дн.)</span>;
        } else if (diffDays <= 7) {
            return <span className="text-orange-500 font-medium">{diffDays} дн.</span>;
        } else {
            return <span className="text-green-500">{diffDays} дн.</span>;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Договор № {contract.id}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Основная информация */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                            Основная информация
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Номер договора</p>
                                <p className="font-medium">{contract.contractNumber || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Номер заявки</p>
                                <p className="font-medium text-blue-600">{contract.id}</p>
                            </div>
                        </div>
                    </div>

                    {/* Клиент и ответственный */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                            Клиент и ответственный
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Клиент</p>
                                <p className="font-medium">{contract.clientName || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Ответственный</p>
                                <p className="font-medium">{contract.responsibleName || '-'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Объект и оборудование */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                            Объект и оборудование
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Объект</p>
                                <p className="font-medium">
                                    {contract.clientObject 
                                        ? `${contract.clientObject.brandModel} ${contract.clientObject.stateNumber ? `(${contract.clientObject.stateNumber})` : ''}`
                                        : '-'}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Оборудование</p>
                                    <p className="font-medium">{contract.equipmentName || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">IMEI</p>
                                    <p className="font-medium font-mono text-sm">{contract.imei || '-'}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Количество</p>
                                <p className="font-medium">{contract.quantity || '-'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Сроки договора */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                            Сроки договора
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Дата окончания договора</p>
                                <p className="font-medium">{formatDate(contract.contractEndDate)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Остаток времени</p>
                                <p className="font-medium">{calculateRemainingDays()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Даты */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                            Даты
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Создан</p>
                                <p className="font-medium">{formatDate(contract.createdAt)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Обновлён</p>
                                <p className="font-medium">{formatDate(contract.updatedAt)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                    >
                        Закрыть
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ContractDetailModal;
