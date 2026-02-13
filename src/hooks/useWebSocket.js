import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * WebSocket хук для подключения к серверу и получения уведомлений
 */
export function useWebSocket(onNewBid) {
    const [isConnected, setIsConnected] = useState(false);
    const [lastBid, setLastBid] = useState(null);
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

    const connect = useCallback(() => {
        // Получаем URL WebSocket сервера
        // Используем VITE_WS_URL если задан, иначе вычисляем из VITE_API_URL или window.location
        let wsUrl;
        
        if (import.meta.env.VITE_WS_URL) {
            wsUrl = import.meta.env.VITE_WS_URL;
        } else if (import.meta.env.VITE_API_URL) {
            // Преобразуем API URL в WebSocket URL
            const apiUrl = import.meta.env.VITE_API_URL;
            wsUrl = apiUrl.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:');
        } else {
            // Используем текущий хост как fallback
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            wsUrl = `${wsProtocol}//${window.location.host}`;
        }
        
        // Закрываем существующее соединение, если оно есть
        if (wsRef.current) {
            wsRef.current.close();
        }

        try {
            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                console.log('🔌 WebSocket подключен');
                setIsConnected(true);
            };

            wsRef.current.onclose = () => {
                console.log('🔌 WebSocket отключен');
                setIsConnected(false);
                
                // Попытка переподключения через 3 секунды
                reconnectTimeoutRef.current = setTimeout(() => {
                    console.log('🔄 Попытка переподключения WebSocket...');
                    connect();
                }, 3000);
            };

            wsRef.current.onerror = (error) => {
                console.error('WebSocket ошибка:', error);
            };

            wsRef.current.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    
                    if (message.type === 'NEW_BID' && message.data) {
                        console.log('📩 Получено уведомление о новой заявке:', message.data);
                        setLastBid(message.data);
                        if (onNewBid) {
                            onNewBid(message.data);
                        }
                    }
                } catch (parseError) {
                    console.error('Ошибка парсинга WebSocket сообщения:', parseError);
                }
            };
        } catch (error) {
            console.error('Ошибка создания WebSocket соединения:', error);
            setIsConnected(false);
        }
    }, [onNewBid]);

    useEffect(() => {
        connect();

        // Очистка при размонтировании
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [connect]);

    const dismissBid = useCallback(() => {
        setLastBid(null);
    }, []);

    return {
        isConnected,
        lastBid,
        dismissBid,
        reconnect: connect,
    };
}

/**
 * Воспроизведение звука уведомления
 */
export function playNotificationSound() {
    try {
        // Создаем AudioContext для воспроизведения звука
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) {
            console.warn('AudioContext не поддерживается в этом браузере');
            return;
        }

        const audioContext = new AudioContext();
        
        // Создаем осциллятор для простого звукового сигнала
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Настройки звука (приятный двойной сигнал)
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.15); // E5
        
        // Громкость
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        // Запуск и остановка
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);

        console.log('🔔 Звук уведомления воспроизведен');
    } catch (error) {
        console.error('Ошибка воспроизведения звука:', error);
    }
}

export default useWebSocket;
