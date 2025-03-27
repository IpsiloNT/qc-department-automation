import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminPanel.css';

function toggleTheme() {
    const root = document.documentElement;
    const currentTheme = root.classList.contains('dark-theme') ? 'light' : 'dark';
    root.classList.toggle('dark-theme');
    localStorage.setItem('theme', currentTheme);
}

export default function AdminPanel() {
    const navigate = useNavigate();
    const [roles, setRoles] = useState([]);
    const [editingUserId, setEditingUserId] = useState(null);
    const [editedUser, setEditedUser] = useState({});
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || user.role !== 'Администратор') navigate('/login');

        loadUsers();
        loadRoles();

        const storedTheme = localStorage.getItem('theme');
        if (storedTheme === 'dark') {
            document.documentElement.classList.add('dark-theme');
        }
    }, []);

    const loadUsers = async () => {
        const res = await fetch('http://localhost:3001/api/admin/users');
        const data = await res.json();
        setUsers(data);
    };

    const loadRoles = async () => {
        const res = await fetch('http://localhost:3001/api/admin/roles');
        const data = await res.json();
        setRoles(data);
    };

    const startEdit = (user) => {
        const fullName = `${user.last_name || ''} ${user.first_name || ''} ${user.patronymic || ''}`.trim();
        setEditingUserId(user.user_id);
        setEditedUser({ ...user, fullName });
    };

    const cancelEdit = () => {
        setEditingUserId(null);
        setEditedUser({});
    };

    const saveUser = async (id) => {
        const res = await fetch(`http://localhost:3001/api/admin/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                login: editedUser.login,
                role: editedUser.role,
                fullName: editedUser.fullName,
                position: editedUser.position
            })
        });

        if (res.ok) {
            await loadUsers();
            setEditingUserId(null);
        } else {
            alert('Ошибка при сохранении изменений');
        }
    };

    const resetPassword = async (id) => {
        if (!confirm('Сбросить пароль пользователю?')) return;
        const res = await fetch(`http://localhost:3001/api/admin/users/${id}/reset-password`, { method: 'PUT' });
        const data = await res.json();
        if (res.ok) alert('Пароль сброшен: 123456');
        else alert(data.message || 'Ошибка сброса пароля');
    };

    const deleteUser = async (id) => {
        if (!confirm('Удалить пользователя?')) return;
        const res = await fetch(`http://localhost:3001/api/admin/users/${id}`, { method: 'DELETE' });
        if (res.ok) await loadUsers();
        else alert('Ошибка при удалении пользователя');
    };

    return (
        <div className="admin-container">
            <aside className="sidebar">
                <h2>⚙️ Меню</h2>
                <ul>
                    <li>🧑‍💼 Пользователи и роли</li>
                    <li>📋 Маршрутные карты</li>
                    <li>🧾 Журнал и замеры</li>
                    <li>🛠️ Справочники</li>
                    <li>📑 Документы</li>
                    <li>🧾 Логирование</li>
                    <li>🧠 Дополнительно</li>
                </ul>
            </aside>
            <div className="theme-toggle-bar">
                <div className="theme-toggle">
                    <label className="switch">
                        <input type="checkbox" onChange={toggleTheme}/>
                        <span className="slider round"></span>
                    </label>
                </div>
            </div>


            <main className="admin-panel">
                <h1>👑 Админ-панель</h1>
                <h2>👥 Управление пользователями</h2>
                <table>
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>ФИО</th>
                        <th>Должность</th>
                        <th>Логин</th>
                        <th>Пароль</th>
                        <th>Роль</th>
                        <th>Действия</th>
                    </tr>
                    </thead>
                    <tbody>
                    {users.map((user) => (
                        <tr key={user.user_id}>
                            <td>{user.user_id}</td>
                            <td>{editingUserId === user.user_id ? (
                                <input value={editedUser.fullName} onChange={(e) =>
                                    setEditedUser((prev) => ({...prev, fullName: e.target.value}))}/>
                            ) : (
                                `${user.last_name || ''} ${user.first_name || ''} ${user.patronymic || ''}`.trim()
                            )}</td>
                            <td>{editingUserId === user.user_id ? (
                                <input value={editedUser.position || ''} onChange={(e) =>
                                    setEditedUser((prev) => ({...prev, position: e.target.value}))}/>
                            ) : (
                                user.position || '—'
                            )}</td>
                            <td>{editingUserId === user.user_id ? (
                                <input value={editedUser.login} onChange={(e) =>
                                    setEditedUser((prev) => ({...prev, login: e.target.value}))}/>
                            ) : (
                                user.login
                            )}</td>
                            <td>{user.password}</td>
                            <td>{editingUserId === user.user_id ? (
                                <select value={editedUser.role} onChange={(e) =>
                                    setEditedUser((prev) => ({...prev, role: e.target.value}))}>
                                    {roles.map((r) => (
                                        <option key={r.name} value={r.name}>{r.name}</option>
                                    ))}
                                </select>
                            ) : (
                                user.role
                            )}</td>
                            <td>{editingUserId === user.user_id ? (
                                <>
                                    <button onClick={() => saveUser(user.user_id)}>💾 Сохранить</button>
                                    <button onClick={cancelEdit}>❌ Отмена</button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => startEdit(user)}>✏️ Изменить</button>
                                    <button onClick={() => resetPassword(user.user_id)}>🔁 Сброс пароля</button>
                                    <button onClick={() => deleteUser(user.user_id)}>🗑️ Удалить</button>
                                </>
                            )}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                <footer className="admin-footer">
                    <div className="footer-content">
                        <p>© {new Date().getFullYear()} ОТК Завод Металлист</p>
                        <p>Информационная система | Разработка с ❤️</p>
                    </div>
                </footer>
            </main>
        </div>
    );
}
