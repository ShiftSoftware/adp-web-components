import { LanguageKeys, Locale } from '~types/locales';

export interface FormInputInterface {
  name: string;
  label: string;
  class: string;
  isError: boolean;
  disabled: boolean;
  labelClass: string;
  errorClass: string;
  errorMessage: string;
  containerClass: string;
}

export interface FormHookInterface<T> {
  locale: Locale;
  el: HTMLElement;
  structure: string;
  renderControl: {};
  isLoading: boolean;
  language: LanguageKeys;
  structureObject: StructureObject;
  formSubmit: (formValues: T) => void;
}

export type FieldType = 'text';

export type FormElementMapper = Record<string, FieldType>;

export type ValidationType = 'onSubmit' | 'always';

export interface Field {
  name: string;
  isError: boolean;
  disabled: boolean;
  fieldType: FieldType;
  errorMessage: string;
  inputChanges: (event: InputEvent) => void;
}

export type FieldControllers = Record<string, Field>;

export interface FormStateOptions {
  validationType?: ValidationType;
}

type FormElementStructure = {
  id: string;
  class: string;
  children: FormElementStructure[];
  element: '' | 'div' | 'slot' | 'submit' | 'button' | string;
};

export type StructureArray = (string | StructureArray)[];

export type StructureObject = FormElementStructure | null;

export type FormFieldParams = Record<string, any>;
