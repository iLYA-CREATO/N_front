import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * WebSocket хук с fallback на polling
 */
export function useWebSocket(onNewBid) {
    const [isConnected, setIsConnected] = useState(false);
    const [lastBid, setLastBid] = useState(null);
    const [usePolling, setUsePolling] = useState(false);
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const pollingIntervalRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 3;

    const connect = useCallback(() => {
        // Получаем URL WebSocket сервера
        let wsUrl;
        
        if (import.meta.env.VITE_WS_URL) {
            wsUrl = import.meta.env.VITE_WS_URL;
        } else if (import.meta.env.VITE_API_URL) {
            const apiUrl = import.meta.env.VITE_API_URL;
            wsUrl = apiUrl.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:');
        } else {
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            wsUrl = `${wsProtocol}//${window.location.host}`;
        }
        
        // Закрываем существующее соединение
        if (wsRef.current) {
            wsRef.current.close();
        }

        // Если уже переключились на polling, не пытаемся переподключиться
        if (usePolling) {
            return;
        }

        try {
            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                console.log('🔌 WebSocket подключен');
                setIsConnected(true);
                reconnectAttemptsRef.current = 0;
            };

            wsRef.current.onclose = () => {
                console.log('🔌 WebSocket отключен');
                setIsConnected(false);
                
                reconnectAttemptsRef.current++;
                
                // Если превышено количество попыток, переключаемся на polling
                if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
                    console.log('📡 Переключение на polling режим');
                    setUsePolling(true);
                    return;
                }
                
                // Попытка переподключения через 3 секунды
                reconnectTimeoutRef.current = setTimeout(() => {
                    console.log(`🔄 Попытка переподключения WebSocket (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
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
    }, [onNewBid, usePolling]);

    // Polling fallback - проверяем новые заявки каждые 10 секунд
    const startPolling = useCallback(async () => {
        if (pollingIntervalRef.current) {
            return;
        }
        
        const pollForNewBids = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.host}/api`;
                const response = await fetch(`${apiUrl}/bids?sortBy=createdAt&sortOrder=desc&limit=1`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.data && data.data.length > 0) {
                        const latestBid = data.data[0];
                        // Проверяем,是新 заявка (создана менее 30 секунд назад)
                        const bidTime = new Date(latestBid.createdAt);
                        const now = new Date();
                        const diffSeconds = (now - bidTime) / 1000;
                        
                        if (diffSeconds < 30) {
                            console.log('📩 Polling: обнаружена новая заявка:', latestBid);
                            setLastBid({
                                id: latestBid.id,
                                tema: latestBid.title || latestBid.tema,
                                status: latestBid.status,
                                clientName: latestBid.clientName,
                                createdAt: latestBid.createdAt,
                            });
                            if (onNewBid) {
                                onNewBid({
                                    id: latestBid.id,
                                    tema: latestBid.title || latestBid.tema,
                                    status: latestBid.status,
                                    clientName: latestBid.clientName,
                                    createdAt: latestBid.createdAt,
                                });
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Polling ошибка:', error);
            }
        };
        
        // Сразу проверяем, потом каждые 10 секунд
        pollForNewBids();
        pollingIntervalRef.current = setInterval(pollForNewBids, 10000);
    }, [onNewBid]);

    const stopPolling = useCallback(() => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (usePolling) {
            startPolling();
        } else {
            connect();
        }

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
            stopPolling();
        };
    }, [connect, usePolling, startPolling, stopPolling]);

    const dismissBid = useCallback(() => {
        setLastBid(null);
    }, []);

    return {
        isConnected: usePolling ? 'polling' : isConnected,
        lastBid,
        dismissBid,
        reconnect: connect,
        usePolling,
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
