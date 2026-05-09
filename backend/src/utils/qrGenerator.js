import QRCode from "qrcode";

export async function generateQrPngBuffer(url) {
  const buffer = await QRCode.toBuffer(url, {
    errorCorrectionLevel: "H",
    width: 300,
    color: {
      dark: "#3D2314",
      light: "#FFFFFF",
    },
    type: "png",
  });

  return buffer;
}
