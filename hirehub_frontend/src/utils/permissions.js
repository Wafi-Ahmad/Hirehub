export const USER_TYPES = {
  NORMAL: 'Normal',
  COMPANY: 'Company'
};

export const hasPermission = (userType, requiredType) => {
  if (!userType) return false;
  if (Array.isArray(requiredType)) {
    return requiredType.includes(userType);
  }
  return userType === requiredType;
};

export const isNormalUser = (userType) => userType === USER_TYPES.NORMAL;
export const isCompanyUser = (userType) => userType === USER_TYPES.COMPANY; 