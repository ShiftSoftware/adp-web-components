import { h } from '@stencil/core';

import { Locale } from '~types/locales';
import { VehicleInformation } from '~types/vehicle-information';

import StatusCard from './StatusCard';

type Props = {
  locale: Locale;
  vehicleInformation: VehicleInformation;
  isAuthorized: boolean;
  unInvoicedByBrokerName?: string;
};

export default function CardsContainer({ vehicleInformation, isAuthorized, unInvoicedByBrokerName, locale }: Props) {
  const warrantyLocale = locale.vehicleLookup.warranty;
  return (
    <div class="warranty-tags mx-auto pt-3">

      <div class='card warning-card span-entire-1st-row'>
        <p class="no-padding flex gap-2">
          <span class="font-semibold">Dealer:</span> {vehicleInformation?.saleInformation?.companyName} ({vehicleInformation?.saleInformation?.countryName})
        </p>
      </div>


      <StatusCard state={isAuthorized ? 'success' : 'reject'} desc={isAuthorized ? warrantyLocale.authorized : warrantyLocale.unauthorized} />
      <StatusCard state={vehicleInformation?.warranty.hasActiveWarranty ? 'success' : 'reject'} desc={vehicleInformation?.warranty.hasActiveWarranty ? warrantyLocale.activeWarranty : warrantyLocale.notActiveWarranty} />
      {unInvoicedByBrokerName && <StatusCard className="span-entire-2nd-row" state="warning" icon={true} desc={warrantyLocale.notInvoiced + unInvoicedByBrokerName} />}
      {vehicleInformation?.warranty.warrantyStartDate && (
        <StatusCard state={vehicleInformation?.warranty?.hasActiveWarranty ? 'success' : 'reject'} icon={false} from fromDesc={warrantyLocale.from} desc={vehicleInformation?.warranty.warrantyStartDate} />
      )}
      {vehicleInformation?.warranty.warrantyEndDate && (
        <StatusCard state={vehicleInformation?.warranty?.hasActiveWarranty ? 'success' : 'reject'} icon={false} to toDesc={warrantyLocale.to} desc={vehicleInformation?.warranty.warrantyEndDate} />
      )}
    </div>
  );
}
