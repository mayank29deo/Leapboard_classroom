import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import TeacherRoom from './pages/TeacherRoom';
import ChildRoom from './pages/ChildRoom';
import ParentView from './pages/ParentView';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/teacher" element={<TeacherRoom />} />
        <Route path="/child" element={<ChildRoom />} />
        <Route path="/parent" element={<ParentView />} />
      </Routes>
    </BrowserRouter>
  );
}
