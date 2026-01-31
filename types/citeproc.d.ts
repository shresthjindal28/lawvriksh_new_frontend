declare module 'citeproc' {
  export class CSL {
    constructor(styleXml: string, localeXml: string, locale: string);
    makeCitationCluster(citations: any[]): string;
    makeBibliography(citations: any[]): [string[], string[]] | null;
  }
}
