type FormElementStructure = {
  id: string;
  class: string;
  element: '' | 'div' | string;
  children: FormElementStructure[];
};

export type StructureArray = (string | StructureArray)[];

export type StructureObject = FormElementStructure | null;
