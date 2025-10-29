declare module "jimp" {
    export interface JimpInstance {
      bitmap: { width: number; height: number };
      clone(): JimpInstance;
      print(font: unknown, x: number, y: number, text: string): void;
      opacity(v: number): JimpInstance;
      quality(v: number): JimpInstance;
      resize(w: number, h: number): JimpInstance;
      getBufferAsync(mime: string): Promise<Buffer>;
    }
  
    export const Jimp: {
      read(src: Buffer | string): Promise<JimpInstance>;
      loadFont(path: string): Promise<unknown>;
      measureText(font: unknown, text: string): number;
      FONT_SANS_64_WHITE: string;
      MIME_JPEG: string;
    };
  }
  