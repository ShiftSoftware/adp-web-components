import { object, string } from 'yup';

export const paintThicknessSchema = object({
  paintThickness: string().required(),
  noData: string().required(),
  part: string().required(),
  left: string().required(),
  right: string().required(),
  noImageGroups: string().required(),
  expand: string().required(),
});
