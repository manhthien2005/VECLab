import styles from './science-backdrop.module.css'

/** Decorative chemistry/technology linework, kept outside the reading surface. */
export function ScienceBackdrop() {
  return <svg className={styles.background} data-science-backdrop="true" viewBox="0 0 1400 1800" preserveAspectRatio="xMidYMin slice" fill="none" aria-hidden="true" focusable="false">
    <g stroke="currentColor" strokeWidth="1.1" opacity=".22">
      <path d="m1150 55 30-17 30 17v34l-30 17-30-17Zm60 0 30-17 30 17v34l-30 17-30-17Zm-30 51 30-17 30 17v34l-30 17-30-17Zm60 0 30-17 30 17v34l-30 17-30-17Z" />
      <path d="M1400 30h-70l-24 42h-36M1400 195h-85l-30-52h-45M1265 230v68l-33 33h-80" />
      <path d="m40 600 24-14 24 14v28l-24 14-24-14Zm48 0 24-14 24 14v28l-24 14-24-14Zm-24 42 24-14 24 14v28l-24 14-24-14ZM0 740h66l26-45h50" />
      <path d="m1300 1080 27-16 27 16v32l-27 16-27-16Zm-54 0 27-16 27 16v32l-27 16-27-16ZM1400 1230h-80l-25-44h-90" />
      <path d="M40 1400h55l32 55h110m-120-23 26-15 26 15v30l-26 15-26-15Zm52 0 26-15 26 15v30l-26 15-26-15Z" />
      <path d="m1310 490 19-11 19 11v22l-19 11-19-11Zm38 0 24-14m-24 36 24 14m-62-25h-28" />
    </g>
    <g fill="currentColor" opacity=".28">
      <circle cx="1152" cy="331" r="3"/><circle cx="142" cy="695" r="3"/><circle cx="1205" cy="1186" r="3"/>
      <circle cx="1306" cy="72" r="2"/><circle cx="1282" cy="501" r="3"/><circle cx="237" cy="1455" r="3"/>
      <circle cx="1370" cy="355" r="1.2"/><circle cx="1348" cy="375" r="1.2"/><circle cx="1370" cy="395" r="1.2"/>
      <circle cx="22" cy="1180" r="1.2"/><circle cx="42" cy="1200" r="1.2"/><circle cx="22" cy="1220" r="1.2"/>
    </g>
  </svg>
}
