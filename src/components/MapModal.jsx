/**
 * MapModal Component
 *
 * Модальное окно с картой для выбора адреса проведения работ.
 * Использует Yandex Maps API для отображения карты и поиска адресов.
 */

import { useState, useEffect, useRef } from 'react';

const MapModal = ({ isOpen, onClose, onAddressSelect, initialAddress = '' }) => {
    const [selectedAddress, setSelectedAddress] = useState(initialAddress);
    const [searchQuery, setSearchQuery] = useState('');
    const [map, setMap] = useState(null);
    const [ymaps, setYmaps] = useState(null);
    const [placemark, setPlacemark] = useState(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [mapError, setMapError] = useState(null);
    const [manualAddress, setManualAddress] = useState(initialAddress);
    const mapRef = useRef(null);

    // Инициализация карты при открытии модального окна
    useEffect(() => {
        if (isOpen && !map && window.ymaps) {
            try {
                window.ymaps.ready(() => {
                    const ymapsInstance = window.ymaps;

                    // Создаем карту
                    const mapInstance = new ymapsInstance.Map(mapRef.current, {
                        center: [55.76, 37.64], // Москва по умолчанию
                        zoom: 10,
                        controls: ['zoomControl', 'searchControl']
                    });

                    // Создаем геокодер для поиска адресов
                    const geocoder = new ymapsInstance.geocode('Москва', { results: 1 });

                    geocoder.then((res) => {
                        const firstGeoObject = res.geoObjects.get(0);
                        if (firstGeoObject) {
                            const coords = firstGeoObject.geometry.getCoordinates();
                            mapInstance.setCenter(coords, 10);
                        }
                    });

                    // Обработчик клика по карте
                    mapInstance.events.add('click', (e) => {
                        const coords = e.get('coords');

                        // Геокодирование координат в адрес
                        ymapsInstance.geocode(coords).then((res) => {
                            const firstGeoObject = res.geoObjects.get(0);
                            if (firstGeoObject) {
                                const address = firstGeoObject.getAddressLine();
                                setSelectedAddress(address);
                                setManualAddress(address);

                                // Удаляем предыдущий маркер
                                if (placemark) {
                                    mapInstance.geoObjects.remove(placemark);
                                }

                                // Создаем новый маркер
                                const newPlacemark = new ymapsInstance.Placemark(coords, {
                                    balloonContent: address
                                });
                                mapInstance.geoObjects.add(newPlacemark);
                                setPlacemark(newPlacemark);
                            }
                        });
                    });

                    setMap(mapInstance);
                    setYmaps(ymapsInstance);
                    setMapLoaded(true);
                });
            } catch (error) {
                console.error('Error initializing map:', error);
                setMapError('Ошибка инициализации карты. Вы можете ввести адрес вручную.');
            }
        }
    }, [isOpen, map]);

    // Обновление адреса при изменении initialAddress
    useEffect(() => {
        setSelectedAddress(initialAddress);
        setManualAddress(initialAddress);
    }, [initialAddress]);

    // Функция поиска адреса
    const handleSearch = () => {
        if (!ymaps || !map || !searchQuery.trim()) return;

        ymaps.geocode(searchQuery, { results: 1 }).then((res) => {
            const firstGeoObject = res.geoObjects.get(0);
            if (firstGeoObject) {
                const coords = firstGeoObject.geometry.getCoordinates();
                const address = firstGeoObject.getAddressLine();

                // Центрируем карту на найденном адресе
                map.setCenter(coords, 15);

                // Удаляем предыдущий маркер
                if (placemark) {
                    map.geoObjects.remove(placemark);
                }

                // Создаем новый маркер
                const newPlacemark = new ymapsInstance.Placemark(coords, {
                    balloonContent: address
                });
                map.geoObjects.add(newPlacemark);
                setPlacemark(newPlacemark);

                setSelectedAddress(address);
                setManualAddress(address);
            } else {
                alert('Адрес не найден. Попробуйте уточнить запрос или введите адрес вручную.');
            }
        }).catch((error) => {
            console.error('Ошибка геокодирования:', error);
            alert('Произошла ошибка при поиске адреса. Вы можете ввести адрес вручную.');
        });
    };

    // Функция подтверждения выбора адреса
    const handleConfirm = () => {
        const addressToUse = manualAddress.trim() || selectedAddress.trim();
        if (addressToUse) {
            onAddressSelect(addressToUse);
            onClose();
        } else {
            alert('Пожалуйста, выберите адрес на карте, введите его в поиске или укажите вручную.');
        }
    };

    // Функция сброса выбора
    const handleReset = () => {
        setSelectedAddress('');
        setSearchQuery('');
        setManualAddress('');
        if (placemark && map) {
            map.geoObjects.remove(placemark);
            setPlacemark(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden">
                <h3 className="text-lg font-semibold mb-4">Выберите адрес проведения работ</h3>

                {/* Панель поиска и ручного ввода */}
                <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Введите адрес для поиска..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <button
                            onClick={handleSearch}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                        >
                            Найти
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={manualAddress}
                            onChange={(e) => {
                                setManualAddress(e.target.value);
                                setSelectedAddress(e.target.value);
                            }}
                            placeholder="Или введите адрес вручную..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <button
                            onClick={handleReset}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                        >
                            Сбросить
                        </button>
                    </div>
                </div>

                {/* Выбранный адрес */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Выбранный адрес:
                    </label>
                    <div className="p-2 bg-green-50 border border-green-300 rounded-lg min-h-[2.5rem]">
                        {selectedAddress || manualAddress || 'Адрес не выбран. Кликните на карте, используйте поиск или введите вручную.'}
                    </div>
                </div>

                {/* Карта */}
                <div className="mb-4">
                    <div
                        ref={mapRef}
                        className="w-full h-96 border border-gray-300 rounded-lg"
                        style={{ minHeight: '400px' }}
                    ></div>
                    {mapError && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-300 rounded-lg text-sm text-yellow-800">
                            {mapError}
                        </div>
                    )}
                </div>

                {/* Инструкции */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                        <strong>Инструкция:</strong> Кликните на карте, чтобы выбрать адрес, используйте поиск или просто введите адрес вручную в поле выше.
                    </p>
                </div>

                {/* Кнопки действий */}
                <div className="flex justify-end space-x-2">
                    <button
                        onClick={onClose}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!(selectedAddress.trim() || manualAddress.trim())}
                        className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition"
                    >
                        Выбрать адрес
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MapModal;