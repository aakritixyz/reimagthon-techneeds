const paths = {
  arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
  diagonal: <path d="M7 17 17 7M7 7h10v10" />,
  code: <path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-14-2 16" />,
  nodes: <><circle cx="12" cy="5" r="2.5" /><circle cx="5" cy="18" r="2.5" /><circle cx="19" cy="18" r="2.5" /><path d="m10.8 7.4-4.6 8.2m7-8.2 4.6 8.2M7.5 18h9" /></>,
  spark: <path d="M12 2c0 6 4 10 10 10-6 0-10 4-10 10 0-6-4-10-10-10 6 0 10-4 10-10Z" />,
  people: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2m1-15a3 3 0 0 1 0 6m2 3a4 4 0 0 1 3 4v2" /></>,
  layers: <path d="m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5" />,
  chart: <path d="M4 4v16h16M8 15l4-4 3 2 5-6m-5 0h5v5" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  cap: <path d="m2 9 10-5 10 5-10 5-10-5Zm4 2v5c3 3 9 3 12 0v-5m4-2v6" />,
  play: <path d="m8 5 12 7-12 7V5Z" />,
  checklist: <path d="m3 7 2 2 4-4m3 3h9M3 16l2 2 4-4m3 3h9" />,
  check: <path d="m5 12 4 4L19 6" />,
  browser: <><rect x="2.5" y="4" width="19" height="16" rx="2.5" /><path d="M3 9h18M6 6.5h.2m2.8 0h.2m1.3 6-2 2 2 2m3-4 2 2-2 2" /></>,
  phone: <><rect x="6" y="2.5" width="12" height="19" rx="3" /><path d="M10 5.5h4M11 18.5h2" /></>,
  braces: <path d="M9 4H7.5A1.5 1.5 0 0 0 6 5.5v4A2.5 2.5 0 0 1 3.5 12 2.5 2.5 0 0 1 6 14.5v4A1.5 1.5 0 0 0 7.5 20H9m6-16h1.5A1.5 1.5 0 0 1 18 5.5v4a2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0-2.5 2.5v4a1.5 1.5 0 0 1-1.5 1.5H15" />,
  coffee: <path d="M4.5 9h12v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V9Zm12 1h2a2 2 0 1 1 0 4h-2M3 21h16M8 3v3m4-4v4" />,
  chip: <><rect x="5" y="5" width="14" height="14" rx="2" /><path d="M9 5V2m6 3V2M9 22v-3m6 3v-3M2 9h3m-3 6h3m14-6h3m-3 6h3m-8-5-3 4m-2-1h.01m7-2h.01" /></>,
  trophy: <path d="M8 4h8v6a4 4 0 0 1-8 0V4Zm0 2H4v2a3 3 0 0 0 4 3m8-5h4v2a3 3 0 0 1-4 3m-4 3v4m-4 2h8" />,
  crown: <path d="m3 7 4 4 5-6 5 6 4-4-2 11H5L3 7Z" />,
  flame: <path d="M12 2c2 5 7 6 7 12a7 7 0 0 1-14 0c0-3 2-5 4-7 0 3 1 3 2 3 1-2 1-5 1-8Z" />,
  search: <><circle cx="10.5" cy="10.5" r="5.5" /><path d="m15 15 4 4" /></>,
  headset: <><path d="M5 6h14a2.5 2.5 0 0 1 2.4 2l1 6a2.5 2.5 0 0 1-2.5 3h-3a3 3 0 0 1-2.4-1.2l-.9-1.2a2 2 0 0 0-3.2 0l-.9 1.2A3 3 0 0 1 7.1 17h-3a2.5 2.5 0 0 1-2.5-3l1-6A2.5 2.5 0 0 1 5 6Z" /><path d="M7 11h2m6 0h2" /></>,
};

export function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}
