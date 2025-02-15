import { LanguageKeys, Locale } from '~types/locales';

export interface FormHookInterface<T> {
  locale: Locale;
  el: HTMLElement;
  structure: string;
  renderControl: {};
  isLoading: boolean;
  errorMessage: string;
  language: LanguageKeys;
  structureObject: StructureObject;
  formSubmit: (formValues: T) => void;
}

export type FormSelectItem = {
  value: string;
  label: string;
};

export type FormInputChanges = (event: InputEvent | string) => void;

export type FormSelectFetcher = (language: string, signal: AbortSignal) => FormSelectItem[];

export type FieldType = 'text' | 'select' | 'number' | 'text-area';

export type FormElementMapper = Record<string, FieldType>;

export type ValidationType = 'onSubmit' | 'always';

export interface Field {
  name: string;
  isError: boolean;
  disabled: boolean;
  isRequired: boolean;
  fieldType: FieldType;
  errorMessage: string;
  inputChanges: FormInputChanges;
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

export type LocaleFormKeys = 'contactUs';

export type Params = {
  [key: string]: any;
  formLocaleName: LocaleFormKeys;
};

export type FormFieldParams = Record<string, Params>;

export interface FormElement {
  reset: (newValue?: string) => void;
}

export type Subscribers = { name: string; context: FormElement }[];
