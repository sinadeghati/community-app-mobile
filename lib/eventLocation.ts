export type EventAddressInput = {
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
};

export const formatEventAddress = ({
  streetAddress = "",
  city = "",
  state = "",
  zipCode = "",
  country = "",
}: EventAddressInput) => {
  const street = streetAddress.trim();
  const cityPart = city.trim();
  const statePart = state.trim().toUpperCase();
  const zipPart = zipCode.trim();
  const countryPart = country.trim();

  const cityStateZip = [cityPart, statePart, zipPart].filter(Boolean).join(", ");
  const withStreet = street
    ? `${street}, ${cityStateZip}`
    : cityStateZip;

  if (!withStreet) return "";
  if (!countryPart || /^united states$/i.test(countryPart) || countryPart === "USA") {
    return withStreet;
  }

  return `${withStreet}, ${countryPart}`;
};

export const isValidEventZipCode = (zipCode: string) =>
  /^\d{5}(-\d{4})?$/.test(zipCode.trim());

export const hasMinimumEventAddress = (input: EventAddressInput) =>
  Boolean(input.city?.trim() && input.state?.trim());
