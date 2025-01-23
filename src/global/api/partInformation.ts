import { MockJson } from '~types/components';
import { PartInformation } from '~types/part-information';

export interface PartInformationInterface {
  isDev: boolean;
  baseUrl: string;
  queryString?: string;
  abortController: AbortController;
  networkTimeoutRef: ReturnType<typeof setTimeout>;
  loadedResponse?: (response: PartInformation) => void;
}

type GetPartInformationProps = {
  partNumber: string;
  notAvailableMessage?: string;
  mockData: MockJson<PartInformation>;
  scopedTimeoutRef: ReturnType<typeof setTimeout>;
  middlewareCallback?: (PartInformation) => void;
};

export const getPartInformation = async (component: PartInformationInterface, generalProps: GetPartInformationProps, headers: any = {}): Promise<PartInformation> => {
  const { notAvailableMessage, mockData, partNumber, scopedTimeoutRef, middlewareCallback } = generalProps;

  const { isDev, baseUrl, queryString, abortController, networkTimeoutRef, loadedResponse } = component;

  const handleResult = (newPartInformation: PartInformation): PartInformation => {
    if (networkTimeoutRef === scopedTimeoutRef) {
      if (!newPartInformation && partNumber) throw new Error(notAvailableMessage || 'wrongResponseFormat');

      if (loadedResponse) loadedResponse(newPartInformation);
      if (middlewareCallback) middlewareCallback(newPartInformation);
      return newPartInformation;
    }
  };

  if (isDev) {
    const newData = mockData[partNumber];

    return handleResult(newData);
  } else {
    if (!baseUrl) throw new Error('noBaseUrl');

    const response = await fetch(`${baseUrl}${partNumber}?${queryString}`, { signal: abortController.signal, headers: headers });

    const newData = (await response.json()) as PartInformation;

    return handleResult(newData);
  }
};
