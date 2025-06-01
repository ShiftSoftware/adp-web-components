import { InferType } from 'yup';
import { h } from '@stencil/core';

import { VehicleInformation } from '~types/vehicle-information';

import StatusCard from './StatusCard';

import RejectIcon from '../assets/x-mark.svg';

import warrantySchema from '~locales/vehicleLookup/warranty/type';
import cn from '~lib/cn';

type Props = {
  isLoading: boolean;
  isAuthorized: boolean;
  unInvoicedByBrokerName?: string;
  vehicleInformation: VehicleInformation;
  warrantyLocale: InferType<typeof warrantySchema>;
};

export default function CardsContainer({ isLoading, vehicleInformation, isAuthorized, unInvoicedByBrokerName, warrantyLocale }: Props) {
  return (
    <div class="tags-container mx-auto pt-3">
      <flexible-container isOpened={isLoading || !!vehicleInformation?.saleInformation?.companyName}>
        <div style={{ paddingBottom: '12px' }}>
          <div class="shift-skeleton !rounded-[4px]">
            <div class="card warning-card">
              <p class="no-padding flex gap-2">
                <span class="font-semibold">Dealer:</span> {vehicleInformation?.saleInformation?.companyName || '...'} ({vehicleInformation?.saleInformation?.countryName || '...'})
              </p>
            </div>
          </div>
        </div>
      </flexible-container>

      <flexible-container classes={cn({ loading: isLoading || !unInvoicedByBrokerName })} isOpened={isLoading || !!unInvoicedByBrokerName}>
        <div style={{ paddingBottom: '12px' }}>
          <div class="shift-skeleton">
            <div class="card warning-card">
              <img src={RejectIcon} />

              <p>{unInvoicedByBrokerName ? warrantyLocale.notInvoiced + unInvoicedByBrokerName : '...'}</p>
            </div>
          </div>
        </div>
      </flexible-container>

      <div class="warranty-tags">
        <StatusCard
          state={vehicleInformation ? (isAuthorized ? 'success' : 'reject') : 'idle'}
          desc={vehicleInformation ? (isAuthorized ? warrantyLocale.authorized : warrantyLocale.unauthorized) : '...'}
        />

        <StatusCard
          state={vehicleInformation ? (vehicleInformation?.warranty.hasActiveWarranty ? 'success' : 'reject') : 'idle'}
          desc={vehicleInformation ? (vehicleInformation?.warranty.hasActiveWarranty ? warrantyLocale.activeWarranty : warrantyLocale.notActiveWarranty) : '...'}
        />

        <StatusCard
          from
          icon={false}
          fromDesc={warrantyLocale.from}
          desc={vehicleInformation?.warranty.warrantyStartDate || '...'}
          opened={!!vehicleInformation?.warranty.warrantyStartDate || !vehicleInformation || isLoading}
          state={!!vehicleInformation ? (vehicleInformation?.warranty?.hasActiveWarranty ? 'success' : 'reject') : 'idle'}
        />

        <StatusCard
          to
          icon={false}
          toDesc={warrantyLocale.to}
          desc={vehicleInformation?.warranty.warrantyEndDate || '...'}
          opened={!!vehicleInformation?.warranty.warrantyEndDate || !vehicleInformation || isLoading}
          state={!!vehicleInformation ? (vehicleInformation?.warranty?.hasActiveWarranty ? 'success' : 'reject') : 'idle'}
        />
      </div>
    </div>
  );
}
