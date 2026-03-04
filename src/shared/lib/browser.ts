import { getSignedUrl } from "../api/storage";

export const openGoogleMaps = (location: string | undefined | null) => {
  if (location) {
    const address = encodeURIComponent(location);
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${address}`,
      '_blank'
    );
  }
};

export const openFileInNewTab = async (
  path: string | undefined
): Promise<void> => {
  if (!path) {
    console.warn('Cannot open file: path is missing');
    return;
  }

  try {
    const signedUrl = await getSignedUrl(path);
    if (signedUrl) {
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    }
  } catch (error) {
    console.error('Error opening file in new tab:', error);
  }
};

export const downloadBlobAsFile = (blob: Blob, fileName: string): void => {
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
};

export const openUrlInNewTab = (url: string): void => {
  window.open(url, '_blank', 'noopener,noreferrer');
};


