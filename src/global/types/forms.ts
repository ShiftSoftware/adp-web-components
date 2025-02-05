type FormElementStructure = {
  element: 'div';
  id?: string;
  class?: string;
  children: FormElementStructure[];
};

export type StructureObject = FormElementStructure | null;
