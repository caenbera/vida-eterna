// Lista compartida de categorías de estudio (admin y biblioteca pública).
export const CATEGORIES = [
  { id: 'deidad', name: 'Deidad y Persona de Cristo', icon: 'fa-crown' },
  { id: 'salvacion', name: 'Salvación y Justicia', icon: 'fa-cross' },
  { id: 'ley', name: 'La Ley y los Dos Pactos', icon: 'fa-scroll' },
  { id: 'cruz', name: 'Cristo y el Significado de la Cruz', icon: 'fa-cross' },
  { id: 'profecia', name: 'Profecía y Eventos Finales', icon: 'fa-cloud-sun' },
  { id: 'vida', name: 'Vida y Crecimiento Cristiano', icon: 'fa-seedling' },
  { id: 'doctrinas', name: 'Doctrinas y Administración Divina', icon: 'fa-university' },
  { id: 'reino', name: 'El Reino y el Evangelio', icon: 'fa-crown' },
];

export function getCategoryName(id) {
  return CATEGORIES.find((c) => c.id === id)?.name || id;
}

export function getCategoryIcon(id) {
  return CATEGORIES.find((c) => c.id === id)?.icon || 'fa-book';
}
