/**
 * Registry of standard action tooltips used across the Vuetify UI.
 * Use these constants to locate elements via tooltips reliably.
 */
export const ACTION_TOOLTIPS = {
  brands: {
    view:   "Ver esta Marca",
    delete: "Eliminar esta Marca"
  },
  sizes: {
    view:   "Ver esta Talla",
    delete: "Eliminar esta Talla"
  },
  discounts: {
    view:   "Ver este Descuento",
    delete: "Eliminar este Descuento"
  },
  surcharges: {
    view:   "Ver este Recargo",
    delete: "Eliminar este Recargo"
  },
  subsidiaries: {
    view:   "Ver esta Sucursal",
    delete: "Eliminar esta Sucursal"
  },
  warehouses: {
    view:   "Ver esta Bodega",
    delete: "Eliminar esta Bodega"
  },
  dispatchTypes: {
    view: "Detalles"
  },
  receivableAccounts: {
    view: "Ver esta cuenta",
    addPayment: "Agregar Abono"
  },
  products: {
    view: "Ver este Producto"
  },
  sales: {
    cancel: "Anular esta Venta"
  },
  people: {
    view:   "Ver esta Persona",
    delete: "Eliminar esta Persona"
  },
  waybills: {
    view: "Ver esta Guia"
  }
} as const;

/**
 * Type representing all the tooltip categories.
 */
export type ActionTooltipCategory = keyof typeof ACTION_TOOLTIPS;


