import { object, string } from 'yup';

export const generalTicketTypesSchema = object({
  TLP: string().required(),
  Complaint: string().required(),
  PartInquiry: string().required(),
  SalesCampaign: string().required(),
  GeneralInquiry: string().required(),
  ServiceCampaign: string().required(),
  InstallmentPayment: string().required(),
  ServicePriceInquiry: string().required(),
});
