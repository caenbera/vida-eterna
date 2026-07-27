import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Library from './views/Library';
import StudyCover from './views/StudyCover';
import StudyOutline from './views/StudyOutline';
import StudyTopic from './views/StudyTopic';
import AdminLogin from './views/AdminLogin';
import AdminLayout from './views/admin/AdminLayout';
import AdminPanel from './views/admin/AdminPanel';
import AdminLibrary from './views/admin/AdminLibrary';
import StudyCreate from './views/admin/StudyCreate';
import StudyConstructor from './views/admin/StudyConstructor';
import BlockEditor from './views/admin/BlockEditor';
import AccordionBuilder from './views/admin/AccordionBuilder';
import Templates from './views/admin/Templates';
import Configuracion from './views/admin/Configuracion';
import AdminHelp from './views/admin/AdminHelp';

function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas públicas (Usuario) */}
        <Route path="/" element={<Library />} />
        <Route path="/study/:studyId" element={<StudyCover />} />
        <Route path="/study/:studyId/bosquejo" element={<StudyOutline />} />
        <Route path="/study/:studyId/tema/:sectionId/:subtopicId" element={<StudyTopic />} />

        {/* Rutas de Administrador */}
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminPanel />} />
          <Route path="estudios" element={<AdminLibrary />} />
          <Route path="estudios/nuevo" element={<StudyCreate />} />
          <Route path="estudios/:id/constructor" element={<StudyConstructor />} />
          <Route path="estudios/:id/constructor/bloque/:blockId" element={<BlockEditor />} />
          <Route path="estudios/:id/constructor/acordeon/:blockId" element={<AccordionBuilder />} />
          <Route path="plantillas" element={<Templates />} />
          <Route path="configuracion" element={<Configuracion />} />
          <Route path="ayuda" element={<AdminHelp />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
