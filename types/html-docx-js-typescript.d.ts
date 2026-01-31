declare module 'html-docx-js-typescript' {
  export function asBlob(html: string, options?: any): Promise<Blob | Buffer>;
}
