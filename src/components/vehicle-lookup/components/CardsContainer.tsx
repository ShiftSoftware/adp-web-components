import { h } from '@stencil/core';

import { Locale } from '~types/locales';
import { Warranty } from '~types/vehicle-information';

import StatusCard from './StatusCard';

type Props = {
  locale: Locale;
  warranty: Warranty;
  isAuthorized: boolean;
  unInvoicedByBrokerName?: string;
};

export default function CardsContainer({ warranty, isAuthorized, unInvoicedByBrokerName, locale }: Props) {
  const warrantyLocale = locale.vehicleLookup.warranty;
  return (
    <div class="warranty-tags mx-auto pt-3">
      <StatusCard state={isAuthorized ? 'success' : 'reject'} desc={isAuthorized ? warrantyLocale.authorized : warrantyLocale.unauthorized} />
      <StatusCard state={warranty.hasActiveWarranty ? 'success' : 'reject'} desc={warranty.hasActiveWarranty ? warrantyLocale.activeWarranty : warrantyLocale.notActiveWarranty} />
      {unInvoicedByBrokerName && <StatusCard className="span-entire-2nd-row" state="warning" icon={true} desc={warrantyLocale.notInvoiced + unInvoicedByBrokerName} />}
      {warranty.warrantyStartDate && (
        <StatusCard state={warranty?.hasActiveWarranty ? 'success' : 'reject'} icon={false} from fromDesc={warrantyLocale.from} desc={warranty.warrantyStartDate} />
      )}
      {warranty.warrantyEndDate && (
        <StatusCard state={warranty?.hasActiveWarranty ? 'success' : 'reject'} icon={false} to toDesc={warrantyLocale.to} desc={warranty.warrantyEndDate} />
      )}
    </div>
  );
}
