import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CryptoDash from './pages/CryptoDash';
import PriceAlert from './pages/PriceAlert';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<CryptoDash />} />
                <Route path="/alerts" element={<PriceAlert />} />
            </Routes>
        </Router>
    );
}

export default App;