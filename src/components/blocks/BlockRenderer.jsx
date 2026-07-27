import React from 'react';
import TextoBlock from './TextoBlock';
import VersiculoBlock from './VersiculoBlock';
import NotaBlock from './NotaBlock';
import DestacadoBlock from './DestacadoBlock';
import AcordeonBlock from './AcordeonBlock';
import PreguntaBlock from './PreguntaBlock';
import ConclusionBlock from './ConclusionBlock';
import SeparadorBlock from './SeparadorBlock';
import CitaBlock from './CitaBlock';

const COMPONENTS = {
  texto: TextoBlock,
  versiculo: VersiculoBlock,
  nota: NotaBlock,
  destacado: DestacadoBlock,
  acordeon: AcordeonBlock,
  pregunta: PreguntaBlock,
  conclusion: ConclusionBlock,
  separador: SeparadorBlock,
  cita: CitaBlock,
};

// Renderiza en modo lectura una lista de bloques (usado por la página de Tema del usuario
// y por la vista previa del Constructor de administrador).
const BlockRenderer = ({ blocks, studyId, contextId }) => (
  <>
    {(blocks || []).map((block) => {
      const Comp = COMPONENTS[block.type];
      if (!Comp) return null;
      return <Comp key={block.id} block={block} studyId={studyId} contextId={contextId} />;
    })}
  </>
);

export default BlockRenderer;
