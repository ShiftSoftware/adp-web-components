import { InferType } from 'yup';
import { h } from '@stencil/core';

import { VehicleInformation } from '~types/vehicle-information';

import StatusCard from './StatusCard';

import warrantySchema from '~locales/vehicleLookup/warranty/type';

type Props = {
  isLoading: boolean;
  isAuthorized: boolean;
  unInvoicedByBrokerName?: string;
  vehicleInformation: VehicleInformation;
  warrantyLocale: InferType<typeof warrantySchema>;
};

export default function CardsContainer({ isLoading, vehicleInformation, isAuthorized, unInvoicedByBrokerName, warrantyLocale }: Props) {
  return (
    <div class="warranty-tags mx-auto pt-3">
      <div class="shift-skeleton !rounded-[4px] span-entire-1st-row">
        <div class="card warning-card">
          <p class="no-padding flex gap-2">
            <span class="font-semibold">Dealer:</span> {vehicleInformation?.saleInformation?.companyName || '...'} ({vehicleInformation?.saleInformation?.countryName || '...'})
          </p>
        </div>
      </div>

      <div style={{ 'grid-column': '1 / -1' }}>
        <StatusCard
          state="warning"
          icon={!!unInvoicedByBrokerName}
          opened={isLoading || !!unInvoicedByBrokerName || !vehicleInformation}
          desc={unInvoicedByBrokerName ? warrantyLocale.notInvoiced + unInvoicedByBrokerName : '...'}
        />
      </div>

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
  );
}
