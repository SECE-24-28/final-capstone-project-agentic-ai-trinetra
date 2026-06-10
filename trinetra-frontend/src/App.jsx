import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';

function Login() {
  return (
    <div style={{ color: 'white', padding: '50px' }}>
      Login Page
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;