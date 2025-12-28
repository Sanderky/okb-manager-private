export const openGoogleMaps = (location: string | undefined | null) => {
  if (location) {
    const address = encodeURIComponent(location);
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${address}`,
      '_blank'
    );
  }
};
