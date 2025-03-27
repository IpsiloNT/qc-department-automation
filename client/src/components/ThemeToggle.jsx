// ThemeToggle.jsx
import './ThemeToggle.css';

export default function ThemeToggle() {
    const toggleTheme = () => {
        const root = document.documentElement;
        const currentTheme = root.classList.contains('dark-theme') ? 'light' : 'dark';
        root.classList.toggle('dark-theme');
        localStorage.setItem('theme', currentTheme);
    };

    return (
        <div className="theme-toggle-bar">
            <div className="theme-toggle">
                <label className="switch">
                    <input type="checkbox" onChange={toggleTheme}
                           defaultChecked={localStorage.getItem('theme') === 'dark'} />
                    <span className="slider round"></span>
                </label>
            </div>
        </div>
    );
}
