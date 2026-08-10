import { Link } from 'react-router-dom';


const Navbar = () => {
    return (
        <nav style={{ padding: '1rem', background: '#333', color: 'white', display: 'flex', gap: '15px' }}>
            <h2>LIS Admin</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Inicio</Link>
                <Link to="/equipos" style={{ color: 'white', textDecoration: 'none' }}>Equipos</Link>
                <Link to="/reservas" style={{ color: 'white', textDecoration: 'none' }}>Reservas</Link>
            </div>
        </nav>
    );
};

export default Navbar;