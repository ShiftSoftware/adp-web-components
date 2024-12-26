import { h } from '@stencil/core';

import StatusCard from './StatusCard';
import { Warranty } from '~types/vehicle-information';

type Props = {
  warranty: Warranty;
  isAuthorized: boolean;
  unInvoicedByBrokerName?: string 
};

export default function CardsContainer({ warranty, isAuthorized, unInvoicedByBrokerName }: Props) {
  return (
    <div class="warranty-tags mx-auto pt-3">
      <StatusCard state={isAuthorized ? 'success' : 'reject'} desc={isAuthorized ? 'Authorized' : 'Unauthorized'} />
      <StatusCard state={warranty.hasActiveWarranty ? 'success' : 'reject'} desc={warranty.hasActiveWarranty ? 'Has Active Warranty' : "Doesn't Have Active Warranty" } />
      {unInvoicedByBrokerName && <StatusCard className='span-entire-2nd-row' state='warning' icon={true} desc={ `Warranty is not Active because this Vehicle is not Invoiced by the following Trusted Business Partner: ${unInvoicedByBrokerName}`} />}
      {warranty.warrantyStartDate && <StatusCard state={warranty?.hasActiveWarranty ? 'success' : 'reject'} icon={false} from desc={warranty.warrantyStartDate} />}
      {warranty.warrantyEndDate && <StatusCard state={warranty?.hasActiveWarranty ? 'success' : 'reject'} icon={false} to desc={warranty.warrantyEndDate} />}
    </div>
  );
}
