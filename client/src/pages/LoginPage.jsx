import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import ThemeToggle from '../components/ThemeToggle';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('http://localhost:3001/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                setError('Неверный логин или пароль');
                return;
            }

            const data = await response.json();
            console.log('✅ Успешный вход:', data);

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));

            setError('');

            // 🔁 Перенаправление по роли
            if (data.role === 'Администратор') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            console.error('❌ Ошибка:', err);
            setError('Ошибка соединения с сервером');
        }
    };

    return (
        <>
            <ThemeToggle />
            <div className="login-container">
                <div className="logo">
                    <img src="/Logo.png" alt="Логотип Завода Металлист" />
                </div>
                <h2>Вход в систему</h2>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="username">Имя пользователя</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Пароль</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
                    <button type="submit">Войти</button>
                </form>
            </div>
        </>
    );
}
