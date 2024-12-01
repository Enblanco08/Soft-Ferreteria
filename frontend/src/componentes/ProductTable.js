import React from 'react';

const ProductTable = () => {
  return (
    <table>
      <thead>
        <tr>
          <th>Código de Barras</th>
          <th>Descripción del Producto</th>
          <th>Precio Venta</th>
          <th>Cantidad</th>
          <th>Importe</th>
          <th>Existencia</th>
        </tr>
      </thead>
      <tbody>
        {/* Aquí se mapearían los productos agregados */}
      </tbody>
    </table>
  );
};

export default ProductTable;