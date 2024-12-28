import { MockJson } from '~types/components';
import { VehicleInformation } from '~types/vehicle-information';

const vehicleRequestHeaders = {
  cityId: 'City-Id',
  userId: 'User-Id',
  companyId: 'Company-Id',
  customerName: 'Customer-Name',
  customerPhone: 'Customer-Phone',
  customerEmail: 'Customer-Email',
  companyBranchId: 'Company-Branch-Id',
  cityIntegrationId: 'City-Integration-Id',
  brandIntegrationId: 'Brand-Integration-Id',
  companyIntegrationId: 'Company-Integration-Id',
  companyBranchIntegrationId: 'Company-Branch-Integration-Id'
} as const;

type VehicleRequestHeaders = Partial<Record<keyof typeof vehicleRequestHeaders, string>>;

export interface VehicleInformationInterface extends VehicleRequestHeaders {
  isDev: boolean;
  baseUrl: string;
  queryString?: string;
  abortController: AbortController;
  networkTimeoutRef: ReturnType<typeof setTimeout>;
  loadedResponse?: (response: VehicleInformation) => void;
}

type GetVehicleInformationProps = {
  vin: string;
  notAvailableMessage?: string;
  mockData: MockJson<VehicleInformation>;
  scopedTimeoutRef: ReturnType<typeof setTimeout>;
  middlewareCallback?: (VehicleInformation) => void;
};

export const getVehicleInformation = async (component: VehicleInformationInterface, generalProps: GetVehicleInformationProps): Promise<VehicleInformation> => {
  const { notAvailableMessage, mockData, vin, scopedTimeoutRef, middlewareCallback } = generalProps;

  const { isDev, baseUrl, queryString, abortController, networkTimeoutRef, loadedResponse } = component;

  const handleResult = (newVehicleInformation: VehicleInformation): VehicleInformation => {
    if (networkTimeoutRef === scopedTimeoutRef) {
      if (!newVehicleInformation && vin) throw new Error(notAvailableMessage || 'Wrong response format');

      if (loadedResponse) loadedResponse(newVehicleInformation);
      if (middlewareCallback) middlewareCallback(newVehicleInformation);
      return newVehicleInformation;
    }
  };

  if (isDev) {
    const newData = mockData[vin];

    return handleResult(newData);
  } else {
    if (!baseUrl) throw new Error('Please provide base-url');

    const headers = {};

    Object.entries(vehicleRequestHeaders).forEach(([componentHeaderKey, headerField]) => {
      if (component[componentHeaderKey]) headers[headerField] = component[componentHeaderKey];
    });

    const response = await fetch(`${baseUrl}${vin}?${queryString}`, { signal: abortController.signal, headers: headers });

    const newData = (await response.json()) as VehicleInformation;

    return handleResult(newData);
  }
};
