import React from 'react';
import { BLOCK_TYPE_LIST } from '../../lib/blocks';
import { ANNOTATION_KIND_LIST, LINK_CATEGORIES } from '../../lib/annotationKinds';
import { AdminBreadcrumbs } from './AdminLayout';

// Consejos de uso escritos a mano por tipo de bloque (la descripción corta
// de BLOCK_TYPES ya existe en lib/blocks.js; aquí solo se agrega el "cómo
// y cuándo usarlo" para el manual, sin duplicar el label/icono/color).
const BLOCK_TIPS = {
  texto: 'Úsalo para explicaciones generales, introducciones o desarrollo de una idea. Tiene una barra de formato (negrita, cursiva, listas, enlaces).',
  versiculo: 'El texto completo del versículo se anota palabra por palabra con las Herramientas del estudio (ver abajo). Incluye referencia, traducción, un "Contexto exegético" opcional, y en Propiedades puedes activar "Mostrar versículo por versículo".',
  nota: 'Una nota breve para aclarar un punto sin que sea el contenido principal — ideal para observaciones cortas.',
  destacado: 'Resalta visualmente la idea clave de una sección, para que el lector no se la pierda.',
  acordeon: 'Agrupa varios bloques dentro de una sección que se abre/cierra con un clic — útil para contenido opcional ("Profundiza más", preguntas frecuentes) sin alargar la página principal.',
  pregunta: 'Pregunta de reflexión con una etiqueta de nivel (Semilla/Raíz/Fruto/Técnico), una explicación y reflexión separadas para adultos y para niños, y un análisis de conexión opcional.',
  conclusion: 'Cierre o resumen de un punto, sección o unidad completa.',
  separador: 'Solo una línea/espacio visual — no tiene contenido, únicamente ordena visualmente el estudio.',
  cita: 'Igual que Versículo pero para citas de Elena G. White o pioneros adventistas: autor, obra, referencia y enlace a la fuente, más el mismo motor de anotación. Tiene un buscador integrado de EGW Writings que autocompleta todo al elegir un resultado.',
};

const INSTANT_TIPS = {
  resaltar: 'Pinta un fondo de color detrás de la palabra o frase, como un marcador de texto.',
  subrayar: 'Dibuja una línea de color debajo de la palabra o frase.',
  encerrar: 'Dibuja un recuadro de color alrededor de la palabra o frase.',
  color: 'Cambia el color del texto mismo (no el fondo ni el subrayado).',
};

const FORM_TIPS = {
  nota: 'Escribe una nota de interpretación que aparece en una tarjeta al hacer clic en la palabra.',
  referencia: `Agrega filas de referencias relacionadas, cada una con una categoría (${LINK_CATEGORIES.join(', ')}) y la cita bíblica correspondiente.`,
  etiqueta: 'Agrega una etiqueta corta de texto libre sobre la palabra (ej. un nombre, un concepto clave).',
  lexico: 'Guarda hebreo/griego, transliteración, número de Strong, significado, otras apariciones y un enlace a diccionario. Trae un buscador: escribe un número de Strong\'s (ej. H430) o una palabra en inglés y elige un resultado para autocompletar todo.',
  pregunta: 'Liga una pregunta de reflexión a esa palabra o frase específica (distinto del bloque "Pregunta", que es para todo el bloque).',
  comparar: 'Agrega filas de traducción + texto, escritas a mano, para mostrar cómo distintas versiones traducen esa palabra o frase.',
  diccionario: 'Como Léxico pero más simple (sin "otras apariciones") — para un dato o enlace de diccionario puntual.',
};

const STEPS = [
  { title: 'Crear el estudio', text: 'Panel de administración → "Estudios" → "Nuevo estudio" (o desde una plantilla). Completa título, subtítulo, categoría, descripción, y el ícono o imagen de portada.' },
  { title: 'Organizar unidades y subtemas', text: 'En el Constructor, agrega Unidades (secciones) y, dentro de cada una, Subtemas. Un estudio típico tiene varias unidades, cada una con uno o más subtemas.' },
  { title: 'Añadir bloques', text: 'Dentro de un subtema, "Añadir bloque" abre la paleta con los 9 tipos disponibles (ver la lista de abajo) — elige el que necesites para ese punto del contenido.' },
  { title: 'Editar cada bloque', text: 'Haz clic en un bloque para ver sus propiedades básicas ahí mismo, o usa "Editar en pantalla completa" para el editor grande — necesario para Versículo y Cita de escrito, donde están las Herramientas del estudio.' },
  { title: 'Reordenar y guardar', text: 'Arrastra los bloques desde el ícono de agarre (a la izquierda de cada uno) para reordenarlos. Los cambios se guardan automáticamente mientras editas la estructura.' },
  { title: 'Vista previa y publicación', text: '"Vista previa" muestra cómo se ve en el sitio público. "Guardar borrador" mientras trabajas; "Publicar estudio" cuando esté listo para que lo vean los visitantes.' },
  { title: 'Cambiar la portada después', text: 'El botón "Portada del estudio" dentro del Constructor te deja cambiar el ícono o la imagen de portada en cualquier momento, no solo al crear el estudio.' },
];

const TOC = [
  { id: 'flujo', label: 'Flujo general' },
  { id: 'bloques', label: 'Tipos de bloque' },
  { id: 'herramientas', label: 'Herramientas del estudio' },
];

const AdminHelp = () => (
  <div>
    <AdminBreadcrumbs items={[{ label: 'Panel de administración', to: '/admin' }, { label: 'Ayuda' }]} />
    <div className="admin-page-title">Manual del panel de administración</div>
    <div className="admin-page-subtitle">Qué es cada elemento, para qué sirve y cómo usarlo.</div>

    <div className="admin-help-layout">
      <nav className="admin-help-toc">
        {TOC.map((t) => (
          <a key={t.id} href={`#${t.id}`}>{t.label}</a>
        ))}
      </nav>

      <div className="admin-help-content">
        <section id="flujo" className="admin-card">
          <div className="admin-card-title"><i className="fa-solid fa-map-signs"></i> Flujo general para crear un estudio</div>
          <ol className="admin-help-steps">
            {STEPS.map((s, i) => (
              <li key={i}>
                <strong>{s.title}</strong>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="bloques" className="admin-card">
          <div className="admin-card-title"><i className="fa-solid fa-cubes"></i> Tipos de bloque</div>
          <p style={{ color: '#6b7688', fontSize: '0.85rem', marginBottom: '16px' }}>
            Un estudio se arma combinando estos bloques dentro de cada subtema, en el orden que quieras.
          </p>
          <div className="admin-help-block-grid">
            {BLOCK_TYPE_LIST.map((b) => (
              <div key={b.id} className="admin-help-block-item">
                <div className="constructor-block-icon" style={{ background: b.color, width: '38px', height: '38px', fontSize: '1rem' }}>
                  <i className={`fa-solid ${b.icon}`}></i>
                </div>
                <div>
                  <div className="admin-help-block-label">{b.label}</div>
                  <div className="admin-help-block-desc">{b.description}</div>
                  <div className="admin-help-block-tip">{BLOCK_TIPS[b.id]}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="herramientas" className="admin-card">
          <div className="admin-card-title"><i className="fa-solid fa-wand-magic-sparkles"></i> Herramientas del estudio (anotación de palabras)</div>
          <p style={{ color: '#6b7688', fontSize: '0.85rem', marginBottom: '16px' }}>
            Solo funcionan dentro de bloques <strong>Versículo</strong> y <strong>Cita de escrito</strong>. Selecciona una
            palabra o frase (arrastrando el mouse) dentro del texto — el panel "Herramientas del estudio" se activa
            debajo — y haz clic en la herramienta que quieras aplicar. Para volver a ver, editar o borrar una
            anotación ya hecha, haz clic sobre la palabra anotada.
          </p>

          <div className="admin-help-tools-subtitle">Instantáneas (piden un color al hacer clic)</div>
          <div className="admin-help-block-grid">
            {ANNOTATION_KIND_LIST.filter((k) => k.instant).map((k) => (
              <div key={k.id} className="admin-help-block-item">
                <div className="constructor-block-icon" style={{ background: k.color, width: '38px', height: '38px', fontSize: '1rem' }}>
                  <i className={`fa-solid ${k.icon}`}></i>
                </div>
                <div>
                  <div className="admin-help-block-label">{k.label}</div>
                  <div className="admin-help-block-tip">{INSTANT_TIPS[k.id]}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="admin-help-tools-subtitle">Con formulario (abren una tarjeta para llenar datos)</div>
          <div className="admin-help-block-grid">
            {ANNOTATION_KIND_LIST.filter((k) => !k.instant).map((k) => (
              <div key={k.id} className="admin-help-block-item">
                <div className="constructor-block-icon" style={{ background: k.color, width: '38px', height: '38px', fontSize: '1rem' }}>
                  <i className={`fa-solid ${k.icon}`}></i>
                </div>
                <div>
                  <div className="admin-help-block-label">{k.label}</div>
                  <div className="admin-help-block-tip">{FORM_TIPS[k.id]}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  </div>
);

export default AdminHelp;
