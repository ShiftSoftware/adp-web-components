import { h } from '@stencil/core';
import SuccessIcon from '../assets/check.svg';
import RejectIcon from '../assets/x-mark.svg';

import cn from '~lib/cn';

type Props = {
  desc: string;
  to?: boolean;
  from?: boolean;
  className?: string;
  icon?: boolean;
  state?: 'idle' | 'warning' | 'success' | 'reject';
};

export default function StatusCard({ desc, className, from, to, state = 'idle', icon = true }: Props) {
  return (
    <div class={cn('card', className, `${state}-card`)}>
      {icon && state === 'reject' && <img src={RejectIcon} />}
      {icon && state === 'warning' && <img src={RejectIcon} />}
      {icon && state === 'success' && <img src={SuccessIcon} />}
      {from && (
        <p class="no-padding">
          <span class="font-semibold pr-1">From:</span> {desc}
        </p>
      )}
      {to && (
        <p class="no-padding">
          <span class="font-semibold pr-1">To:</span> {desc}
        </p>
      )}
      {!from && !to && <p class={state === 'idle' ? 'no-padding' : ''}>{desc}</p>}
    </div>
  );
}
