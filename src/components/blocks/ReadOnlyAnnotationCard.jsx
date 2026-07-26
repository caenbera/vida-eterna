import React, { forwardRef } from 'react';
import { ANNOTATION_KINDS } from '../../lib/annotationKinds';
import { readAnnotation } from '../../lib/annotationData';
import AnnotationCardFrame from '../annotations/AnnotationCardFrame';
import AnnotationFieldsReadOnly from '../annotations/AnnotationFieldsReadOnly';

// Tarjeta de solo lectura para el sitio público, anclada cerca de la palabra
// anotada (mismo marco visual y línea conectora que el editor de admin).
const ReadOnlyAnnotationCard = forwardRef(({ card, onClose, style }, ref) => {
  const { kindId, fields } = readAnnotation(card.dataset);
  const kind = ANNOTATION_KINDS[kindId];
  if (!kind) return null;

  return (
    <AnnotationCardFrame ref={ref} kind={kind} onClose={onClose} style={style}>
      <AnnotationFieldsReadOnly kind={kind} dataset={fields} />
    </AnnotationCardFrame>
  );
});

export default ReadOnlyAnnotationCard;
