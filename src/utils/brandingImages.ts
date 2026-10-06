export const MAX_BRANDING_LOGO_DATA_URL_LENGTH = 700_000;

/** Resize and compress a user-selected bitmap to the API's safe data-URL limit. */
export const compressBrandingImage = async (file: File): Promise<string> => {
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('تعذر قراءة ملف الشعار.'));
    reader.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const candidate = new Image();
    candidate.onload = () => resolve(candidate);
    candidate.onerror = () => reject(new Error('تعذر تجهيز صورة الشعار.'));
    candidate.src = source;
  });

  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  if (!sourceWidth || !sourceHeight) throw new Error('أبعاد صورة الشعار غير صالحة.');
  const sourceMaxSide = Math.max(sourceWidth, sourceHeight);
  const preserveTransparency = file.type !== 'image/jpeg';

  for (const scale of [1, 0.88, 0.76, 0.64, 0.52]) {
    const fit = Math.min(1, 720 / sourceMaxSide) * scale;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(sourceWidth * fit));
    canvas.height = Math.max(1, Math.round(sourceHeight * fit));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('تعذر تجهيز مساحة ضغط الشعار.');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    if (preserveTransparency) {
      const png = canvas.toDataURL('image/png');
      if (png.length <= MAX_BRANDING_LOGO_DATA_URL_LENGTH) return png;

      for (const quality of [0.9, 0.82, 0.74]) {
        const webp = canvas.toDataURL('image/webp', quality);
        if (webp.startsWith('data:image/webp;base64,') && webp.length <= MAX_BRANDING_LOGO_DATA_URL_LENGTH) return webp;
      }
    }

    // JPEG has no alpha channel; flatten on white so transparent PNG/WebP logos
    // do not acquire a black background in reports when lossy fallback is needed.
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.86, 0.78, 0.7]) {
      const jpeg = canvas.toDataURL('image/jpeg', quality);
      if (jpeg.length <= MAX_BRANDING_LOGO_DATA_URL_LENGTH) return jpeg;
    }
  }

  throw new Error('تعذر ضغط الشعار إلى الحجم الآمن. اختر صورة أبسط أو أصغر.');
};
