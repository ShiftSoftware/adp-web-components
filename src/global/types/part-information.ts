export type PartInformation = {
  partNumber: string,
  tmcPart: TMCPart;
  stockParts: StockPart[];
  deadStock: DeadStock[];
};

export type TMCPart = {
  partDescription: string;
  group: string;
};

export type DeadStock = {
  companyIntegrationID: string,
  companyName: string;
  branchDeadStock: BranchDeadStock[];
};

export type BranchDeadStock = {
  companyBranchIntegrationID: string,
  companyBranchName: string;
  quantity: number
};

export type StockPart = {
  partDescription: string;
  supersededTo: string;
  supersededFrom: string;
  quantityLookUpResult: string;
  price: number;
  group: string;
  locationID: string;
  locationName: string;
};
