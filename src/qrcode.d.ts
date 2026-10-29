declare module 'qrcode' {
  interface QrOptions {
    width?: number;
    margin?: number;
  }

  const QRCode: {
    toDataURL(text: string, options?: QrOptions): Promise<string>;
  };

  export default QRCode;
}
