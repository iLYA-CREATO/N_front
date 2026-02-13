import { useState, useEffect } from 'react';

/**
 * Компонент ConfirmModal - модальное окно подтверждения действия
 * 
 * @param {boolean} isOpen - состояние открытости модального окна
 * @param {string} title - заголовок модального окна
 * @param {string} message - сообщение подтверждения
 * @param {string} confirmText - текст кнопки подтверждения (по умолчанию "Удалить")
 * @param {string} cancelText - текст кнопки отмены (по умолчанию "Отмена")
 * @param {function} onConfirm - функция при подтверждении
 * @param {function} onCancel - функция при отмене
 * @param {string} confirmButtonColor - цвет кнопки подтверждения (red, blue, etc.)
 */
function ConfirmModal({ 
    isOpen, 
    title = 'Подтверждение', 
    message = 'Вы уверены?', 
    confirmText = 'Удалить',
    cancelText = 'Отмена',
    onConfirm, 
    onCancel,
    confirmButtonColor = 'red'
}) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        }
    }, [isOpen]);

    if (!isVisible) return null;

    const handleConfirm = () => {
        onConfirm();
        setIsVisible(false);
    };

    const handleCancel = () => {
        onCancel();
        setIsVisible(false);
    };

    const handleAnimationEnd = () => {
        if (!isOpen) {
            setIsVisible(false);
        }
    };

    const colorClasses = {
        red: 'bg-red-500 hover:bg-red-600 focus:ring-red-500',
        blue: 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500',
        green: 'bg-green-500 hover:bg-green-600 focus:ring-green-500',
    };

    return (
        <>
            {/* Затемняющий фон */}
            <div 
                className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
                onClick={handleCancel}
            />
            
            {/* Контейнер модального окна */}
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <div 
                    className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Заголовок */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            confirmButtonColor === 'red' ? 'bg-red-100' : 'bg-blue-100'
                        }`}>
                            <svg 
                                className={`w-6 h-6 ${confirmButtonColor === 'red' ? 'text-red-500' : 'text-blue-500'}`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                                />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                    </div>

                    {/* Сообщение */}
                    <p className="text-gray-600 mb-6">{message}</p>

                    {/* Кнопки */}
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={handleConfirm}
                            className={`px-4 py-2 ${colorClasses[confirmButtonColor] || colorClasses.red} text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ConfirmModal;
