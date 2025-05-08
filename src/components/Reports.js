import React from 'react';

const Reports = ({ products }) => {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Reports</h2>
      <div className="bg-gray-800/50 backdrop-blur-md p-6 rounded-xl shadow-lg border border-gray-700/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-700/50">
              <th className="p-2">Product</th>
              <th className="p-2">Item</th>
              <th className="p-2">Material Cost</th>
              <th className="p-2">Weight per Unit</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr key={index} className="border-t border-gray-600">
                <td className="p-2">{product.productName}</td>
                <td className="p-2">{product.item}</td>
                <td className="p-2">{product.materialCost} KES</td>
                <td className="p-2">{product.weightPerUnit} {product.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;