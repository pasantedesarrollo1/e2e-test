export const extrasSeed = {
  extrasManager: {
    category: {
      name: "Extras Alitas",
    },
    products: {
      searchTerm: "alitas",
      baseProduct: "Caja de alitas de pollo",
      items: {
        sinStock: { name: "extra alitas sin stock" },
        conStock: { name: "extra alitas stock" },
      }
    },
    messages: {
      categoryCreated: "Categoría Creada",
      categoryDeleted: "Categoría extra eliminada",
      cannotDelete: "No se puede eliminar una categoría con productos relacionados",
      changesSaved: "Cambios de productos extra guardados",
      relationDeleted: "Relación eliminada",
      noCategories: "Aún no hay categorías",
      loadingProducts: "Cargando productos disponibles",
      outOfStockLabel: "Sin stock disponible",
      outOfStockToast: "No hay stock disponible para este acompañamiento"
    }
  }
};
