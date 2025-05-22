import './TempPolicies.css';
const Policies = () => {
  return (
    <div className="policies-container">
      <h1 className="policies-heading">Our Policies</h1>

      <section className="policy-section">
        <h2>Return Policies</h2>
        <ul>
          <li>
            To exchange a product, please send us photos of the damaged item. We will evaluate the damage and decide on the best way to exchange or return the product.
          </li>
          <li>
            If the item is not in stock for replacement, we will issue a full refund.
          </li>
          <li>
            If we are unable to provide a replacement due to stock unavailability, a 100% refund will be issued.
          </li>
          <li>
            <strong>Note:</strong> To be eligible for a replacement, the customer must upload a proper unboxing video along with images of the product.
          </li>
        </ul>
      </section>
      <section className="policy-section">
        <h2>Order Cancellation</h2>
        <ul>
          <li>
            Please note that if the item has already shipped, the order cannot be cancelled.
          </li>
        </ul>
      </section>
    </div>
  );
};
export default Policies;
