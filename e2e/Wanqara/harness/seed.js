import { tenantSeed } from "./seeds/tenant-seed.js";
import { peopleSeed } from "./seeds/people-seed.js";
import { inventorySeed } from "./seeds/inventory-seed.js";
import { financialSeed } from "./seeds/financial-seed.js";
import { salesSeed } from "./seeds/sales-seed.js";
import { restaurantSeed } from "./seeds/restaurant-seed.js";
import { usersSeed } from "./seeds/users-seed.js";

export const SEED = {
  ...tenantSeed,
  ...peopleSeed,
  ...inventorySeed,
  ...financialSeed,
  ...salesSeed,
  ...restaurantSeed,
  users: usersSeed,
};

export const getDynamicDocumentType = (authType) => {
  const currentSubsidiary = SEED.subsidiaries[authType].name;
  return currentSubsidiary === "Wanqara 001" 
    ? SEED.documentTypes.facturaElectronica 
    : SEED.documentTypes.recibos;
};

export const getElectronicInvoicingAuthType = () => {
  if (SEED.subsidiaries.retail.name === "Wanqara 001") return "retail";
  if (SEED.subsidiaries.restaurant.name === "Wanqara 001") return "restaurant";
  return "dispatch"; 
};