export const usersSeed = {
  crud: {
    name: "test nuevo usuario",
    identity: "1283728925",
    identityType: "CEDULA",
    roleCases: [
      { label: "Cliente", roles: [/^Cliente$/i] },
      { label: "Empleado", roles: [/^Empleado$/i] },
      { label: "Proveedor", roles: [/^Proveedor$/i] },
      { label: "Cliente y Empleado", roles: [/^Cliente$/i, /^Empleado$/i] },
      { label: "Cliente y Proveedor", roles: [/^Cliente$/i, /^Proveedor$/i] },
      { label: "Empleado y Proveedor", roles: [/^Empleado$/i, /^Proveedor$/i] },
      { label: "Cliente, Empleado y Proveedor", roles: [/^Cliente$/i, /^Empleado$/i, /^Proveedor$/i] }
    ]
  }
};