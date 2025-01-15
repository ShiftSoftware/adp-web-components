export type PartInformation = {
  partNumber: string;
  tmcPart: TMCPart;
  stockParts: StockPart[];
  deadStock: DeadStock[];
};

export type TMCPart = {
  warrantyPrice: number;
  specialPrice: number;
  salesPrice: number;
  pnc: string;
  pncLocalName: string;
  binCode: string;
  dimension1: string;
  dimension2: string;
  dimension3: string;
  netWeight: string;
  grossWeight: string;
  cubicMeasure: string;
  hsCode: string;
  uzHsCode: string;
  origin: string;
  partDescription: string;
  group: string;
};

export type DeadStock = {
  companyIntegrationID: string;
  companyName: string;
  branchDeadStock: BranchDeadStock[];
};

export type BranchDeadStock = {
  companyBranchIntegrationID: string;
  companyBranchName: string;
  quantity: number;
};

export type StockPart = {
  localDescription: string;
  retailPrice: string;
  partDescription: string;
  supersededTo: string;
  supersededFrom: string;
  quantityLookUpResult: string;
  price: number;
  group: string;
  locationID: string;
  locationName: string;
};
