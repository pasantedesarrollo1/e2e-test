import { playwrightHarness } from "../settings.js";

export const tenantSeed = {
  subsidiaries: {
    retail:     { name: playwrightHarness.subsidiaries.retail, code: "100" },
    dispatch:   { name: playwrightHarness.subsidiaries.dispatch, code: "101" },
    restaurant: { name: playwrightHarness.subsidiaries.restaurant, code: "102" },
    crud: [
      { type: 'Comercios (Sin Despacho)', name: 'Sucursal Comercios Test', code: '901', isRestaurant: false, hasDispatch: false },
      { type: 'Comercios (Con Despacho)', name: 'Sucursal Despacho Test', code: '902', isRestaurant: false, hasDispatch: true },
      { type: 'Restaurantes (Sin Despacho)', name: 'Sucursal Restaurante Test', code: '903', isRestaurant: true, hasDispatch: false }
    ]
  },
  warehouses: {
    crud: [
      { authType: 'retail', name: 'Bodega Test Ret', code: '1001', address: 'Automated Test Address Ret', description: 'Automated Test Desc Ret' },
      { authType: 'dispatch', name: 'Bodega Test Dis', code: '1002', address: 'Automated Test Address Dis', description: 'Automated Test Desc Dis' },
      { authType: 'restaurant', name: 'Bodega Test Res', code: '1003', address: 'Automated Test Address Res', description: 'Automated Test Desc Res' }
    ]
  },
  dispatchTypes: {
    crud: {
      name: "Tipo Despacho Test",
      type: "Local",
      description: "Test automatizado de tipo de despacho"
    }
  }
};