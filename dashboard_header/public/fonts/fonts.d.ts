// Kibana's bundler turns an imported .woff2 into a URL (or a data: URL for files under 8 KB).
declare module '*.woff2' {
  const src: string;
  export default src;
}
