import { AnyObjectSchema } from 'yup';

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
  el: HTMLElement;
  renderControl: {};
  isLoading: boolean;
  formSubmit: (formValues: T) => void;
}

type FieldType = 'text';

type ValidationType = 'onSubmit' | 'always';

interface Field {
  name: string;
  isError: boolean;
  disabled: boolean;
  errorMessage: string;
  onInput: (event: InputEvent) => void;
}

export interface FormStateOptions {
  validationType?: ValidationType;
}

export class FormHook<T> {
  private isSubmitted = false;
  private context: FormHookInterface<T>;
  private schemaObject: AnyObjectSchema;
  private validationType: ValidationType = 'onSubmit';
  private subscribedFields: { [key: string]: Field } = {};
  formErrors: { [key: string]: string } = {};

  formController;

  constructor(context: FormHookInterface<T>, schemaObject: AnyObjectSchema, formStateOptions?: FormStateOptions) {
    this.context = context;
    this.schemaObject = schemaObject;
    this.formController = { onSubmit: this.onSubmit };
    if (formStateOptions?.validationType) this.validationType = formStateOptions.validationType;
  }

  getFormErrors = () => this.formErrors;

  getValues = () => {
    const form = this.context.el.shadowRoot.querySelector('form') as HTMLFormElement;
    const formData = new FormData(form);
    const formObject = Object.fromEntries(formData.entries() as Iterable<[string, FormDataEntryValue]>);

    return formObject;
  };

  private focusFirstInput = (errorFields: Partial<Field>[]) => {
    if (errorFields.length) {
      const domElements = errorFields.map(field => this.context.el.shadowRoot.querySelector(`input[name="${field.name}"]`)).filter(dom => dom) as HTMLInputElement[];

      const sortedDomElements = domElements.sort((a, b) => {
        if (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) return -1; // a comes before b

        if (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_PRECEDING) return 1; // b comes before a

        return 0; // They are the same
      });

      if (sortedDomElements[0]) sortedDomElements[0].focus();
    }
  };

  onSubmit = (formEvent: SubmitEvent) => {
    formEvent.preventDefault();
    (async () => {
      try {
        this.isSubmitted = true;
        this.context.isLoading = true;
        this.signal({ isError: false });
        const formObject = this.getValues();
        const values = await this.schemaObject.validate(formObject, { abortEarly: false, strict: true });
        await this.context.formSubmit(values);
      } catch (error) {
        if (error.name === 'ValidationError') {
          this.formErrors = {};
          const errorFields: Partial<Field>[] = [];

          error.inner.forEach((element: { path: string; message: string }) => {
            if (element.path) {
              this.formErrors[element.path] = element.message;
              if (!errorFields.find(field => field.name === element.path))
                errorFields.push({
                  isError: true,
                  name: element.path,
                  errorMessage: element.message,
                });
            }
          });
          this.signal(errorFields);
          this.focusFirstInput(errorFields);
        } else console.error('Unexpected Error:', error);
      } finally {
        this.context.isLoading = false;
      }
    })();
  };

  newController = (name: string, fieldType: FieldType) => {
    if (fieldType === 'text')
      this.subscribedFields[name] = {
        name,
        isError: false,
        disabled: false,
        errorMessage: '',
        onInput: (event: InputEvent) => {
          const value = (event.target as HTMLInputElement).value;
          this.onChanges(name, value);
        },
      };

    return this.subscribedFields[name];
  };

  private signal = (partialSignal: Partial<Field> | Partial<Field>[]) => {
    if (Array.isArray(partialSignal)) {
      partialSignal.forEach(field => {
        if (this.subscribedFields[field.name]) Object.assign(this.subscribedFields[field.name], field);
      });
    } else {
      Object.values(this.subscribedFields).forEach(field => Object.assign(field, partialSignal));
    }
  };

  private onChanges = async (name: string, value: string) => {
    if (!this.isSubmitted && this.validationType !== 'always') return;
    const wasError = this.subscribedFields[name].isError;

    try {
      // @ts-ignore
      this.schemaObject.fields[name].validateSync(value);
      this.signal([{ name, isError: false }]);
      if (wasError !== false) this.context.renderControl = {};
    } catch (error) {
      if (error.message) {
        this.signal([{ name, isError: true, errorMessage: error.message }]);
        this.context.renderControl = {};
      }
    }
  };
}
