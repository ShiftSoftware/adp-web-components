import { h } from '@stencil/core';
import Loader from '../assets/loader.svg';
import cn from '~lib/cn';

type Props = {
  isLoading: boolean;
};

export default function Loading({ isLoading }: Props) {
  return (
    <div class={cn('loading-spinner absolute', { hide: !isLoading })}>
      <img class="spin" src={Loader} />
    </div>
  );
}
