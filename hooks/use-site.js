import { useContext, createContext } from 'react';

// Avoid importing package.json in the client bundle

import { removeLastTrailingSlash } from 'lib/util';

export const SiteContext = createContext();

/**
 * useSiteContext
 */

export function useSiteContext(data) {
  let homepage = process.env.NEXT_PUBLIC_HOMEPAGE || '';

  // Trim the trailing slash from the end of homepage to avoid
  // double // issues throughout the metadata

  homepage = removeLastTrailingSlash(homepage);

  return {
    ...data,
    homepage,
  };
}

/**
 * useSite
 */

export default function useSite() {
  const site = useContext(SiteContext);
  return site;
}
