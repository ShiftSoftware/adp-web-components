import { h } from '@stencil/core';

import XIcon from '../assets/x-mark.svg';
import CheckIcon from '../assets/check.svg';

import { Locale } from '~types/a';
import { SSC } from '~types/vehicle-information';

type Props = {
  ssc: SSC[];
  locale: Locale;
};
export default function SSCTable({ ssc, locale }: Props) {
  const warrantyLocale = locale.vehicleLookup.warranty;

  return (
    <div class="wrapper-table">
      <div class="header">{warrantyLocale.sscCampings}</div>
      <div class="ssc-table-container">
        <table class="ssc-table">
          <thead>
            <tr>
              <th>{warrantyLocale.sscTableCode}</th>
              <th>{warrantyLocale.sscTableDescription}</th>
              <th>{warrantyLocale.sscTableRepairStatus}</th>
              <th>{warrantyLocale.sscTableOPCode}</th>
              <th>{warrantyLocale.sscTablePartNumber}</th>
            </tr>
          </thead>
          <tbody>
            {ssc.map(sscItem => (
              <tr class="transition" key={sscItem.sscCode}>
                <td>{sscItem.sscCode}</td>
                <td>{sscItem.description}</td>
                <td>
                  <div class="table-cell-container">
                    <img class="table-status-icon" src={sscItem.repaired ? CheckIcon : XIcon} /> {sscItem?.repairDate}
                  </div>
                </td>
                <td>
                  <div class="table-cell-container table-cell-labors-container">
                    {!!sscItem.labors.length
                      ? sscItem.labors.map(labor => (
                          <div key={labor.laborCode} class="success">
                            {labor.laborCode}
                          </div>
                        ))
                      : '...'}
                  </div>
                </td>
                <td>
                  <div class="table-cell-container table-cell-parts-container">
                    {!!sscItem.parts.length
                      ? sscItem.parts.map(part => (
                          <div key={part.partNumber} class={part.isAvailable ? 'success' : 'reject'}>
                            {part.partNumber}
                          </div>
                        ))
                      : '...'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
