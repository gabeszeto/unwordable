import '../styles.css'
import useThemeMode from './hooks/useThemeMode';

export default function ThemeToggle() {
    const { mode, setMode } = useThemeMode();

    const cycle = () => {
        setMode(mode === 'system' ? 'light' : mode === 'light' ? 'dark' : 'system');
    };

    // Optional: accessible labels/icons
    const label =
        mode === 'system' ? 'Theme: System' :
            mode === 'light' ? 'Theme: Light' : 'Theme: Dark';

    const icon =
        mode === 'system' ? '💻' :
            mode === 'light' ? '🌞' : '🌙';

    return (
        <button
            className="theme-toggle"
            type="button"
            onClick={cycle}
            aria-label={`${label} (click to change)`}
            title={`${label} (click to change)`}
        >
            <span className="tt-ico">{icon}</span>
            <span className="tt-label">{mode}</span>
        </button>
    );
}
