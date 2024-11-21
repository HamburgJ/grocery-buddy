import { env } from '../config/environment';

export const getMerchantDisplay = (merchant) => {
  if (!merchant) return null;
  
  if (env.NO_EXTERNAL) {
    return merchant.name;
  }
  
  if (env.NO_MERCHANT_IMAGES) {
    return <span className="text-sm text-gray-700">{merchant.name}</span>;
  }
  
  return merchant.logo_url ? (
    <img
      src={merchant.logo_url}
      alt={merchant.name}
      className="w-6 h-6 object-contain"
    />
  ) : merchant.name;
};

export const getItemImage = (imageUrl, altText) => {
  if (env.NO_EXTERNAL) {
    return null;
  }
  
  return imageUrl;
}; 