import { object } from 'yup';
import formsSchema from './type';
import contactUsSchema from './contactUs/type';

const formWrapperSchema = object({
  ...formsSchema.fields,
  contactUs: contactUsSchema,
});

export default formWrapperSchema;
