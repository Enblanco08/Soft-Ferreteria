import React, { useState } from 'react';

const ProductInput = () => {
  const [codigoProducto, setCodigoProducto] = useState('');

  const handleAddProduct = () => {
    // Lógica para agregar el producto a la tabla
    console.log(`Agregando producto con código: ${codigoProducto}`);
  };

  return (
    <div className="product-input">
      <input
        type="text"
        placeholder="Código del Producto"
        value={codigoProducto}
        onChange={(e) => setCodigoProducto(e.target.value)}
      />
      <button onClick={handleAddProduct}>ENTER - Agregar Producto</button>
    </div>
  );
};

export default ProductInput;