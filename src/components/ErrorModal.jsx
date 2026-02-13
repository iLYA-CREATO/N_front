import { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';

/**
 * Компонент ErrorModal - красивое окно ошибки, которое поворачивается к мышке
 * 
 * @param {boolean} isOpen - состояние открытости модального окна
 * @param {string} message - сообщение об ошибке
 * @param {string} errorDetails - детали ошибки для отображения
 * @param {function} onClose - функция закрытия модального окна
 */
function ErrorModal({ isOpen, message, errorDetails, onClose }) {
    const modalRef = useRef(null);
    const [rotation, setRotation] = useState({ rotateX: 0, rotateY: 0 });
    const [copied, setCopied] = useState(false);
    const targetRotation = useRef({ rotateX: 0, rotateY: 0 });
    const animationFrame = useRef(null);
    
    // Максимальный угол поворота в градусах
    const MAX_ROTATION = 25;
    // Коэффициент плавности (0-1, чем меньше - тем плавнее)
    const SMOOTH_FACTOR = 0.08;
    
    // Функция ограничения угла поворота
    const clampRotation = (angle) => {
        return Math.max(-MAX_ROTATION, Math.min(MAX_ROTATION, angle));
    };
    
    // Функция линейной интерполяции
    const lerp = (start, end, factor) => {
        return start + (end - start) * factor;
    };

    // Отслеживание позиции мыши для поворота модального окна
    useEffect(() => {
        if (!isOpen) return;

        const handleMouseMove = (e) => {
            const modal = modalRef.current;
            if (!modal) return;

            const rect = modal.getBoundingClientRect();
            const modalCenterX = rect.left + rect.width / 2;
            const modalCenterY = rect.top + rect.height / 2;
            
            // Нормализованная позиция мыши относительно центра модального окна (-1 до 1)
            const normalizedX = (e.clientX - modalCenterX) / (rect.width / 2);
            const normalizedY = (e.clientY - modalCenterY) / (rect.height / 2);
            
            // Вычисляем угол поворота (Y - влево/вправо, X - вверх/вниз)
            const clampedX = clampRotation(normalizedX * MAX_ROTATION);
            const clampedY = clampRotation(normalizedY * MAX_ROTATION);
            
            targetRotation.current = {
                rotateX: -clampedY,
                rotateY: clampedX
            };
        };

        const animate = () => {
            setRotation(prev => ({
                rotateX: lerp(prev.rotateX, targetRotation.current.rotateX, SMOOTH_FACTOR),
                rotateY: lerp(prev.rotateY, targetRotation.current.rotateY, SMOOTH_FACTOR)
            }));
            animationFrame.current = requestAnimationFrame(animate);
        };
        
        animationFrame.current = requestAnimationFrame(animate);

        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (animationFrame.current) {
                cancelAnimationFrame(animationFrame.current);
            }
        };
    }, [isOpen]);

    const handleCopyError = useCallback(() => {
        const errorText = `Ошибка: ${message}\n\nДетали:\n${errorDetails || 'Нет дополнительных деталей'}\n\nКонсоль:\n${consoleErrorLogs.join('\n')}`;
        
        navigator.clipboard.writeText(errorText).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(err => {
            console.error('Ошибка копирования:', err);
        });
    }, [message, errorDetails]);

    if (!isOpen) return null;

    return (
        <>
            {/* Затемняющий фон, блокирующий взаимодействие с задним планом */}
            <div className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm pointer-events-auto" />
            
            {/* Контейнер модального окна */}
            <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
                <div
                    ref={modalRef}
                    className="bg-gradient-to-br from-red-900 via-red-800 to-red-950 rounded-2xl shadow-2xl border-4 border-red-500 p-8 max-w-lg w-full mx-4 pointer-events-auto"
                    style={{
                        transform: `perspective(1000px) rotateX(${rotation.rotateX}deg) rotateY(${rotation.rotateY}deg)`,
                        transformOrigin: 'center center',
                        transition: 'transform 0.1s ease-out',
                    }}
                >
                    {/* Заголовок ошибки */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-600 rounded-full mb-4 shadow-lg">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-4xl font-bold text-red-500 mb-2 tracking-wider animate-pulse">
                            ОШИБКА
                        </h2>
                        <div className="h-1 bg-red-500 rounded-full w-24 mx-auto"></div>
                    </div>

                    {/* Сообщение об ошибке */}
                    <div className="bg-red-950/50 rounded-xl p-4 mb-6 border border-red-700/50">
                        <p className="text-red-200 text-lg text-center leading-relaxed">
                            {message}
                        </p>
                        {errorDetails && (
                            <p className="text-red-300/70 text-sm text-center mt-3 font-mono">
                                {errorDetails}
                            </p>
                        )}
                    </div>

                    {/* Детали ошибки (консоль) */}
                    {consoleErrorLogs.length > 0 && (
                        <div className="mb-6">
                            <details className="group">
                                <summary className="cursor-pointer text-red-300 hover:text-red-200 text-sm flex items-center gap-2 transition-colors">
                                    <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    Показать детали консоли
                                </summary>
                                <div className="mt-2 bg-black/40 rounded-lg p-3 max-h-48 overflow-auto">
                                    <pre className="text-red-400 text-xs font-mono whitespace-pre-wrap break-all">
                                        {consoleErrorLogs.join('\n')}
                                    </pre>
                                </div>
                            </details>
                        </div>
                    )}

                    {/* Кнопки действий */}
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={handleCopyError}
                            className="px-6 py-3 bg-red-700 hover:bg-red-600 text-white font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-red-600/30 transform hover:-translate-y-0.5"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                            {copied ? 'Скопировано!' : 'Копировать консоль'}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-gray-600/30 transform hover:-translate-y-0.5"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Закрыть
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

// Хранилище ошибок консоли
let consoleErrorLogs = [];

// Перехват ошибок консоли
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args) => {
    const errorMessage = args.map(arg => {
        if (arg instanceof Error) return arg.message;
        if (typeof arg === 'object') return JSON.stringify(arg, null, 2);
        return String(arg);
    }).join('\n');
    
    consoleErrorLogs.push(`[ERROR] ${new Date().toISOString()} - ${errorMessage}`);
    originalConsoleError.apply(console, args);
};

console.warn = (...args) => {
    const warnMessage = args.map(arg => {
        if (arg instanceof Error) return arg.message;
        if (typeof arg === 'object') return JSON.stringify(arg, null, 2);
        return String(arg);
    }).join('\n');
    
    consoleErrorLogs.push(`[WARN] ${new Date().toISOString()} - ${warnMessage}`);
    originalConsoleWarn.apply(console, args);
};

export function getConsoleErrors() {
    return consoleErrorLogs.join('\n');
}

export function clearConsoleErrors() {
    consoleErrorLogs = [];
}

const ErrorContext = createContext(null);

export function ErrorProvider({ children }) {
    const [error, setError] = useState(null);
    const [isOpen, setIsOpen] = useState(false);

    const showError = useCallback((message, details = '') => {
        setError({ message, details });
        setIsOpen(true);
    }, []);

    const closeError = useCallback(() => {
        setIsOpen(false);
        setError(null);
    }, []);

    return (
        <ErrorContext.Provider value={{ showError, closeError, isOpen, error }}>
            {children}
            <ErrorModal
                isOpen={isOpen}
                message={error?.message || ''}
                errorDetails={error?.details || ''}
                onClose={closeError}
            />
        </ErrorContext.Provider>
    );
}

export function useError() {
    const context = useContext(ErrorContext);
    if (!context) {
        throw new Error('useError must be used within an ErrorProvider');
    }
    return context;
}
