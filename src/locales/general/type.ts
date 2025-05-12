import yupTypeMapper from '~lib/yup-type-mapper';

const generalLocalSchema = yupTypeMapper(['close', 'submit', 'noSelectOptions', 'formSubmittedSuccessfully']);

export default generalLocalSchema;
