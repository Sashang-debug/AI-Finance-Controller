import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ImportData from './pages/ImportData';
import ReconciliationRuns from './pages/ReconciliationRuns';
import RunDetails from './pages/RunDetails';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="import" element={<ImportData />} />
          <Route path="runs" element={<ReconciliationRuns />} />
          <Route path="runs/:id" element={<RunDetails />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
