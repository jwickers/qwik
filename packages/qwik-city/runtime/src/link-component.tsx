import { component$, Slot, type QwikIntrinsicElements, untrack, event$ } from '@builder.io/qwik';
import { getClientNavPath, getPrefetchDataset } from './utils';
import { loadClientData } from './use-endpoint';
import { useLocation, useNavigate } from './use-functions';

/**
 * @public
 */
export const Link = component$<LinkProps>((props) => {
  const nav = useNavigate();
  const loc = useLocation();
  const originalHref = props.href;
  const { onClick$, reload, ...linkProps } = (() => props)();
  const clientNavPath = untrack(() => getClientNavPath(linkProps, loc));
  const prefetchDataset = untrack(() => getPrefetchDataset(props, clientNavPath, loc));
  linkProps['preventdefault:click'] = !!clientNavPath;
  linkProps.href = clientNavPath || originalHref;
  const onPrefetch =
    prefetchDataset != null
      ? event$((ev: any, elm: HTMLAnchorElement) =>
          prefetchLinkResources(elm as HTMLAnchorElement, ev.type === 'qvisible')
        )
      : undefined;
  const handleClick = event$(async (event: any, elm: HTMLAnchorElement) => {
    if (elm.href && !event._qwik_nav_handled) {
      elm.setAttribute('aria-pressed', 'true');
      await nav(elm.href, reload);
      elm.removeAttribute('aria-pressed');
      event._qwik_nav_handled = true;
    }
  });
  return (
    <a
      {...linkProps}
      onClick$={[onClick$, handleClick]}
      data-prefetch={prefetchDataset}
      onMouseOver$={onPrefetch}
      onFocus$={onPrefetch}
      onQVisible$={onPrefetch}
    >
      <Slot />
    </a>
  );
});

/**
 * Client-side only
 */
export const prefetchLinkResources = (elm: HTMLAnchorElement, isOnVisible?: boolean) => {
  if (elm && elm.href && elm.hasAttribute('data-prefetch')) {
    if (!windowInnerWidth) {
      windowInnerWidth = innerWidth;
    }

    if (!isOnVisible || (isOnVisible && windowInnerWidth < 520)) {
      // either this is a mouseover event, probably on desktop
      // or the link is visible, and the viewport width is less than X
      loadClientData(new URL(elm.href), elm);
    }
  }
};

let windowInnerWidth = 0;

type AnchorAttributes = QwikIntrinsicElements['a'];

/**
 * @public
 */
export interface LinkProps extends AnchorAttributes {
  prefetch?: boolean;
  reload?: boolean;
}
