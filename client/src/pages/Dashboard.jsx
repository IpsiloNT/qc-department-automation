import { useEffect, useState } from 'react';
import './Dashboard.css';

export default function Dashboard() {
    const [routeCards, setRouteCards] = useState([]);
    const [expandedCards, setExpandedCards] = useState({});
    const [measurements, setMeasurements] = useState({});

    useEffect(() => {
        fetch('http://localhost:3001/api/route-cards')
            .then(res => res.json())
            .then(data => setRouteCards(data))
            .catch(err => console.error('Ошибка загрузки маршрутных карт:', err));
    }, []);

    const toggleCard = (number) => {
        setExpandedCards(prev => ({ ...prev, [number]: !prev[number] }));
    };

    const handleInputChange = (detailKey, field, value) => {
        setMeasurements(prev => ({
            ...prev,
            [detailKey]: { ...prev[detailKey], [field]: value }
        }));
    };

    const submitMeasurement = async (detail) => {
        const key = `${detail.year_letter}${detail.number}`;
        const data = measurements[key];
        if (!data || !data.diameter || !data.width || !data.height || !data.weight || !data.thickness || !data.status_id) {
            alert('Пожалуйста, заполните все поля замера');
            return;
        }

        const payload = {
            number: detail.number,
            year_letter: detail.year_letter,
            detail_id: detail.detail_id,
            journal_id: prompt("Введите ID записи в журнале:"),
            route_card_number: detail.route_card_number,
            measurements: {
                diameter: parseFloat(data.diameter),
                width: parseFloat(data.width),
                height: parseFloat(data.height),
                thickness: parseFloat(data.thickness),
                weight: parseFloat(data.weight)
            },
            status_id: parseInt(data.status_id),
            is_defect: parseInt(data.status_id) === 2
        };

        if (payload.is_defect) {
            payload.defect_reason_id = parseInt(prompt("Причина брака (reason_id):"));
            payload.defect_description = prompt("Описание дефекта:");
            payload.correction_method = prompt("Метод исправления:");
            payload.nonconformity_id = parseInt(prompt("Несоответствие (nonconformity_id):"));
        }

        try {
            const response = await fetch('http://localhost:3001/api/measure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Ошибка при отправке замеров');
            alert('✅ Замеры успешно сохранены!');
        } catch (error) {
            console.error('Ошибка:', error);
            alert('❌ Ошибка при сохранении замеров');
        }
    };

    return (
        <div className="dashboard-container">
            <h1>📋 Маршрутные карты</h1>
            {routeCards.map(card => (
                <div key={card.route_card_number} className="route-card">
                    <h2>Маршрутная карта № {card.route_card_number}</h2>
                    <p><strong>Заказ:</strong> {card.order_number}</p>
                    <p><strong>Дата:</strong> {new Date(card.date).toLocaleDateString()}</p>
                    <p><strong>Закрытие:</strong> {new Date(card.close_date).toLocaleDateString()}</p>
                    <p><strong>Количество:</strong> {card.quantity}</p>

                    <button onClick={() => toggleCard(card.route_card_number)}>
                        {expandedCards[card.route_card_number] ? '🔽 Свернуть детали' : '▶️ Развернуть детали'}
                    </button>

                    {expandedCards[card.route_card_number] && (
                        <div className="details-list">
                            <h3>🛠️ Детали:</h3>
                            {card.details.map((d, i) => {
                                const key = `${d.year_letter}${d.number}`;
                                const values = measurements[key] || {};
                                return (
                                    <div className="detail-item" key={i}>
                                        <p><strong>📐 Чертеж:</strong> {d.drawing_number}</p>
                                        <p><strong>🔩 Название:</strong> {d.name}</p>
                                        <p><strong>🆔 Деталь:</strong> {key}</p>
                                        <p><strong>📏 Размеры по КД:</strong> Ø{d.diameter} × {d.width} × {d.height}</p>
                                        <p><strong>⚖️ Масса по КД:</strong> {d.weight} кг</p>
                                        <p><strong>🟢 Статус:</strong> {d.status}</p>

                                        <div className="measure-form">
                                            <h4>📋 Ввод фактических замеров:</h4>
                                            <div className="measure-fields">
                                                <div><label>Ø Диаметр</label>
                                                    <input type="number" step="0.001" value={values.diameter || ''} onChange={(e) => handleInputChange(key, 'diameter', e.target.value)} />
                                                </div>
                                                <div><label>↔️ Ширина</label>
                                                    <input type="number" step="0.001" value={values.width || ''} onChange={(e) => handleInputChange(key, 'width', e.target.value)} />
                                                </div>
                                                <div><label>↕️ Высота</label>
                                                    <input type="number" step="0.001" value={values.height || ''} onChange={(e) => handleInputChange(key, 'height', e.target.value)} />
                                                </div>
                                                <div><label>🧱 Толщина</label>
                                                    <input type="number" step="0.001" value={values.thickness || ''} onChange={(e) => handleInputChange(key, 'thickness', e.target.value)} />
                                                </div>
                                                <div><label>⚖️ Масса</label>
                                                    <input type="number" step="0.001" value={values.weight || ''} onChange={(e) => handleInputChange(key, 'weight', e.target.value)} />
                                                </div>
                                                <div>
                                                    <label>📌 Статус:</label>
                                                    <select value={values.status_id || ''} onChange={(e) => handleInputChange(key, 'status_id', e.target.value)}>
                                                        <option value="">Выбрать</option>
                                                        <option value="1">Годен</option>
                                                        <option value="2">Брак</option>
                                                        <option value="3">Требует доработки</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <button onClick={() => submitMeasurement({ ...d, route_card_number: card.route_card_number })}>✅ Сохранить замер</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );

}
