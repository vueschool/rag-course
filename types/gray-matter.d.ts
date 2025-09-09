declare module "gray-matter" {
  interface GrayMatterData {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  interface GrayMatterResult<T = GrayMatterData> {
    content: string;
    data: T;
    excerpt?: string;
    orig: Buffer | string;
    language?: string;
    matter?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stringify?: (data: any) => string;
  }

  interface GrayMatterOptions {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    excerpt?: boolean | ((file: any, options: any) => string);
    excerpt_separator?: string;
    engines?: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key: string]: any;
    };
    language?: string;
    delimiters?: string | [string, string];
  }

  function matter<T = GrayMatterData>(
    input: string | Buffer,
    options?: GrayMatterOptions
  ): GrayMatterResult<T>;

  export = matter;
}

