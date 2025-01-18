export type PartInformation = {
  localName: string;
  partNumber: string;
  tmcPart: TMCPart;
  stockParts: StockPart[];
  deadStock: DeadStock[];
};

export type TMCPart = {
  hiddenFields: string[];
  warrantyPrice: number;
  specialPrice: number;
  salesPrice: number;
  pnc: string;
  pncLocalName: string;
  binCode: string;
  dimension1: number;
  dimension2: number;
  dimension3: number;
  netWeight: number;
  grossWeight: number;
  cubicMeasure: number;
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
  hiddenFields: string[];
  localDescription: string;
  fob: number;
  partDescription: string;
  supersededTo: string;
  supersededFrom: string;
  quantityLookUpResult: string;
  price: number;
  group: string;
  locationID: string;
  locationName: string;
};
