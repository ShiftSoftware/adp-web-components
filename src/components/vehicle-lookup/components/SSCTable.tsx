import { h } from '@stencil/core';
import XIcon from '../assets/x-mark.svg';
import CheckIcon from '../assets/check.svg';
import { SSC } from '~types/vehicle-information';

type Props = {
  ssc: SSC[];
};
export default function SSCTable({ ssc }: Props) {
  return (
    <div class="wrapper-table">
      <div class="header">SSC Campings</div>
      <div class="ssc-table-container">
        <table class="ssc-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Description</th>
              <th>Repair Status</th>
              <th>OP-Codes</th>
              <th>Part Number</th>
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
                <td>{sscItem.opCode}</td>
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
