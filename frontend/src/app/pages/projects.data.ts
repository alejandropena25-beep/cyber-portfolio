export const categories = ['Cybersecurity', 'Development', 'DevOps'] as const;
export type ProjectCategory = (typeof categories)[number];
export interface Project {
  readonly slug: string;
  readonly title: string;
  readonly category: ProjectCategory;
  readonly summary: string;
  readonly description: string;
}
// Ejemplos para validar la interfaz. El contenido real pertenece a la Fase 2.
export const projects: readonly Project[] = [
  {
    slug: 'security-notebook',
    title: 'Cuaderno de seguridad',
    category: 'Cybersecurity',
    summary: 'Un espacio para organizar conceptos y observaciones sobre seguridad.',
    description:
      'Ejemplo de presentación de un proyecto de ciberseguridad. Los objetivos, evidencias y resultados reales se incorporarán durante la fase de contenido.',
  },
  {
    slug: 'portfolio-interface',
    title: 'Interfaz del portfolio',
    category: 'Development',
    summary: 'Navegación y componentes para una experiencia accesible y responsive.',
    description:
      'Ejemplo de ficha de desarrollo. Esta base permite mostrar una descripción y una categoría sin depender de un servicio externo.',
  },
  {
    slug: 'delivery-map',
    title: 'Mapa de entrega',
    category: 'DevOps',
    summary: 'Una propuesta visual para documentar el recorrido del software.',
    description:
      'Ejemplo de contenido de la categoría DevOps. No representa infraestructura ni automatizaciones implementadas en este repositorio.',
  },
];
