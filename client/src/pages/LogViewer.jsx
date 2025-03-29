// client/src/pages/LogViewer.jsx
import { useEffect, useState } from 'react';
import './AdminPanel.css';
import './LogViewer.css';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function LogViewer() {
    const [logs, setLogs] = useState([]);
    const [filters, setFilters] = useState({
        user: '',
        entity: '',
        action: '',
        date_from: '',
        date_to: ''
    });
    const [loading, setLoading] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const navigate = useNavigate();

    // 🔐 Проверка авторизации и роли
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || user.role !== 'Администратор') {
            navigate('/login');
        }
    }, []);

    useEffect(() => {
        loadLogs();
        if (autoRefresh) {
            const interval = setInterval(() => loadLogs(), 10000);
            return () => clearInterval(interval);
        }
    }, [filters, page, autoRefresh]);

    const loadLogs = async () => {
        setLoading(true);
        const query = new URLSearchParams({ ...filters }).toString();
        const res = await fetch(`http://localhost:3001/api/admin/logs?page=${page}&pageSize=${pageSize}&${query}`);
        const data = await res.json();
        setLogs(data.data || []); // ✅ добавлена защита на data
        setLoading(false);
    };

    const handleFilterChange = (e) => {
        setPage(1);
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const exportCSV = () => {
        const csv = logs.map(log =>
            [
                new Date(log.timestamp).toLocaleString(),
                log.login,
                log.role_name,
                log.action,
                log.entity,
                log.entity_id,
                log.request_method,
                log.status_code,
                log.ip_address,
                log.user_agent,
                log.description
            ].map(v => `"${v || ''}"`).join(',')
        );
        const header = ['Дата', 'Пользователь', 'Роль', 'Действие', 'Сущность', 'ID', 'Метод', 'Статус', 'IP', 'UA', 'Описание'];
        const blob = new Blob(
            [header.join(',') + '\n' + csv.join('\n')],
            { type: 'text/csv;charset=utf-8' }
        );
        saveAs(blob, `logs-${Date.now()}.csv`);
    };

    const exportExcel = () => {
        const exportData = logs.map(log => ({
            'Дата': new Date(log.timestamp).toLocaleString(),
            'Пользователь': log.login,
            'Роль': log.role_name,
            'Действие': log.action,
            'Сущность': log.entity,
            'ID': log.entity_id,
            'Метод': log.request_method,
            'Статус': log.status_code,
            'IP': log.ip_address,
            'UA': log.user_agent,
            'Описание': log.description
        }));
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Логи');
        XLSX.writeFile(workbook, `logs-${Date.now()}.xlsx`);
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.text('System Logs', 14, 15);
        const tableData = logs.map(log => [
            new Date(log.timestamp).toLocaleString(),
            log.login,
            log.role_name,
            log.action,
            log.entity,
            log.entity_id,
            log.status_code,
            log.ip_address
        ]);
        doc.autoTable({
            head: [['Дата', 'Пользователь', 'Роль', 'Действие', 'Объект', 'ID', 'Статус', 'IP']],
            body: tableData,
            startY: 20
        });
        doc.save(`logs-${Date.now()}.pdf`);
    };

    return (
        <div className="admin-panel">
            <h1>📊 Логи системы</h1>

            <div className="log-controls">
                <input type="text" name="user" placeholder="Поиск по логину" onChange={handleFilterChange} />
                <input type="text" name="entity" placeholder="Сущность" onChange={handleFilterChange} />
                <input type="text" name="action" placeholder="Действие" onChange={handleFilterChange} />
                <input type="date" name="date_from" onChange={handleFilterChange} />
                <input type="date" name="date_to" onChange={handleFilterChange} />

                <div className="quick-filters">
                    <button onClick={() => setFilters({ ...filters, action: 'login' })}>🔐 Входы</button>
                    <button onClick={() => setFilters({ ...filters, status_code: '500' })}>🚨 Ошибки</button>
                    <button onClick={() => setFilters({ ...filters, date_from: new Date(Date.now() - 86400000).toISOString().slice(0, 10) })}>🕒 24ч</button>
                </div>

                <div className="export-group">
                    <button onClick={exportCSV}>📥 CSV</button>
                    <button onClick={exportExcel}>📊 Excel</button>
                    <button onClick={exportPDF}>🧾 PDF</button>
                </div>

                <label>
                    🔁 Автообновление
                    <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
                </label>
            </div>

            {loading ? <p>Загрузка...</p> : (
                <table className="log-table">
                    <thead>
                    <tr>
                        <th>🕓 Время</th>
                        <th>👤 Пользователь</th>
                        <th>🔐 Роль</th>
                        <th>⚡ Действие</th>
                        <th>📦 Сущность</th>
                        <th>📌 ID</th>
                        <th>🌐 IP</th>
                        <th>🧭 Агент</th>
                        <th>✅ Код</th>
                        <th>📝 Описание</th>
                    </tr>
                    </thead>
                    <tbody>
                    {logs.map((log, i) => (
                        <tr key={i} className={
                            log.status_code >= 500 ? 'error-row' :
                                log.status_code >= 400 ? 'warn-row' : ''
                        }>
                            <td>{new Date(log.timestamp).toLocaleString()}</td>
                            <td>{log.login || '—'}</td>
                            <td>{log.role_name || '—'}</td>
                            <td>{log.action}</td>
                            <td>{log.entity || '—'}</td>
                            <td>{log.entity_id || '—'}</td>
                            <td>{log.ip_address}</td>
                            <td>{log.user_agent?.slice(0, 50)}...</td>
                            <td>{log.status_code}</td>
                            <td>{log.description}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}

            <div className="pagination">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>⬅</button>
                <span>Стр. {page}</span>
                <button onClick={() => setPage(p => p + 1)}>➡</button>
            </div>
        </div>
    );
}
