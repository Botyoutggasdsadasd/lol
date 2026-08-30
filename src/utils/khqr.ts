import QRCode from 'qrcode';

// CRC-16/CCITT-FALSE implementation for EMVCo / KHQR Standard
function calculateCRC16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0');
}

function formatTLV(tag: string, value: string): string {
  const length = value.length.toString().padStart(2, '0');
  return `${tag}${length}${value}`;
}

export interface KHQROptions {
  merchantName?: string;
  merchantCity?: string;
  bakongAccountId?: string;
  amount: number;
  currency?: 'USD' | 'KHR';
  billNumber?: string;
  storeLabel?: string;
  terminalLabel?: string;
}

export function generateKHQRPayload(options: KHQROptions): string {
  const {
    merchantName = 'UCHIRO STORE',
    merchantCity = 'Phnom Penh',
    bakongAccountId = 'uchiro_store@aclb',
    amount,
    currency = 'USD',
    billNumber = `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
    storeLabel = 'Uchiro Market',
    terminalLabel = 'POS-01',
  } = options;

  const formattedAmount = amount.toFixed(2);
  const currencyCode = currency === 'USD' ? '840' : '116';

  // Sub-tags for Tag 29 (Merchant Account Information)
  const tag29_00 = formatTLV('00', bakongAccountId);
  const tag29_01 = formatTLV('01', 'UCHIRO STORE KHQR');
  const tag29Value = `${tag29_00}${tag29_01}`;

  // Sub-tags for Tag 62 (Additional Data Field Template)
  const tag62_01 = formatTLV('01', billNumber);
  const tag62_02 = formatTLV('02', 'Online Game Assets');
  const tag62_03 = formatTLV('03', storeLabel);
  const tag62_07 = formatTLV('07', terminalLabel);
  const tag62Value = `${tag62_01}${tag62_02}${tag62_03}${tag62_07}`;

  let payload = '';
  payload += formatTLV('00', '01'); // Payload Format Indicator
  payload += formatTLV('01', '12'); // Dynamic QR Point of Initiation (12 for Dynamic, 11 for Static)
  payload += formatTLV('29', tag29Value); // Merchant Account Information (Bakong)
  payload += formatTLV('52', '5999'); // Merchant Category Code (General / Digital Goods)
  payload += formatTLV('53', currencyCode); // Transaction Currency (840 = USD)
  payload += formatTLV('54', formattedAmount); // Transaction Amount
  payload += formatTLV('58', 'KH'); // Country Code (Cambodia)
  payload += formatTLV('59', merchantName); // Merchant Name
  payload += formatTLV('60', merchantCity); // Merchant City
  payload += formatTLV('62', tag62Value); // Additional Data Field

  // Add Tag 63 with length 04 and calculate CRC
  const payloadToCrc = `${payload}6304`;
  const crc = calculateCRC16(payloadToCrc);
  return `${payloadToCrc}${crc}`;
}

export async function generateQRCodeDataURL(text: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 400,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate QR code:', err);
    return '';
  }
}

export async function generateKHQRDataURL(optionsOrText: KHQROptions | string): Promise<string> {
  const payload = typeof optionsOrText === 'string' ? optionsOrText : generateKHQRPayload(optionsOrText);
  return generateQRCodeDataURL(payload);
}
