import { useEffect, useState } from 'react';
import { useWebSocket, playNotificationSound } from '../hooks/useWebSocket';

/**
 * Компонент уведомления о новой заявке
 * Отображается в правом нижнем углу экрана
 */
function BidNotification({ bid, onDismiss }) {
    if (!bid) return null;

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                backgroundColor: '#10b981',
                color: 'white',
                padding: '16px 24px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                zIndex: 9999,
                maxWidth: '400px',
                animation: 'slideIn 0.3s ease-out',
                cursor: 'pointer',
            }}
            onClick={onDismiss}
            title="Нажмите для закрытия"
        >
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
            }}>
                <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                }}>
                    <span style={{
                        backgroundColor: 'white',
                        color: '#10b981',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                    }}>
                        Новая заявка
                    </span>
                </span>
                <span style={{
                    fontSize: '18px',
                    fontWeight: '700',
                }}>
                    №{bid.id}
                </span>
                <span style={{
                    fontSize: '14px',
                    opacity: 0.95,
                    wordBreak: 'break-word',
                }}>
                    {bid.tema}
                </span>
                {bid.clientName && (
                    <span style={{
                        fontSize: '12px',
                        opacity: 0.8,
                        marginTop: '4px',
                    }}>
                        Клиент: {bid.clientName}
                    </span>
                )}
            </div>

            <style>{`
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
}

/**
 * Контейнер уведомлений - подключается к WebSocket и отображает уведомления
 */
export default function BidNotificationContainer() {
    const [currentBid, setCurrentBid] = useState(null);
    const [hasPendingBid, setHasPendingBid] = useState(false);

    const handleNewBid = (bid) => {
        // Воспроизводим звук
        playNotificationSound();
        
        // Показываем уведомление
        setCurrentBid(bid);
        setHasPendingBid(true);

        // Автоматически скрываем через 8 секунд
        setTimeout(() => {
            setCurrentBid(null);
        }, 8000);
    };

    const { lastBid } = useWebSocket(handleNewBid);

    // Если есть новое уведомление из WebSocket, обновляем
    useEffect(() => {
        if (lastBid) {
            handleNewBid(lastBid);
        }
    }, [lastBid]);

    const handleDismiss = () => {
        setCurrentBid(null);
        setHasPendingBid(false);
    };

    // Не рендерим ничего если нет активного уведомления
    if (!currentBid) return null;

    return (
        <BidNotification 
            bid={currentBid} 
            onDismiss={handleDismiss}
        />
    );
}
