import { h } from '@stencil/core';
import Loader from '~assets/loader.svg';
import cn from '~lib/cn';

type Props = {
  isLoading: boolean;
};

export default function Loading({ isLoading }: Props) {
  return (
    <div class={cn('size-full transition-all z-50 duration-100 flex items-center justify-center pointer-events-none absolute ', { 'opacity-0': !isLoading })}>
      <img class="animate-spin-2s size-[40px]" src={Loader} />
    </div>
  );
}
