import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import DCR from './pages/DCR';
import PAR from './pages/PushAuthRequest';
import TokenRequest from './pages/TokenRequest';
import Home from './pages/Home';
import AppNavBar from './components/NavBar';

function App() {
  return (
    <div className="App">
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css"
        integrity="sha384-rbsA2VBKQhggwzxH7pPCaAqO46MgnOM80zW1RWuH61DGLwZJEdK2Kadq2F9CUG65"
        crossOrigin="anonymous"
      />
      <BrowserRouter>
        <AppNavBar />
        <Routes>
          <Route path="*" element={<Home />} />
          <Route path="/dcr" element={<DCR />} />
          <Route path="/par" element={<PAR />} />
          <Route path="/token" element={<TokenRequest />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
