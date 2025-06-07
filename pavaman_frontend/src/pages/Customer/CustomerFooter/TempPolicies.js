import './TempPolicies.css';
const Policies = () => {
  return (
    <div className="policies-container">
      <h1 className="policies-heading">Our Policies</h1>

      <section className="policy-section">
        <h2>Return Policies</h2>
        <ul>
          <li>
            We provide a seven-day return policy for equipment, beginning on the date of delivery to the customer.
          </li>
          <li>
            Anything beyond 7 days of delivery will not be eligible for return.
          </li>
          <li>
            <strong>Note:</strong> Uploading the appropriate unboxing video and pictures of the products is required if the customer needs to replace the item/product.
          </li>
          <li>
            We will give a 100% refund if we don't have the product in stock to replace it.
          </li>
        </ul>
      </section>
      <section className="policy-section">
        <h2>Order Cancellation</h2>
        <ul>
          <li>
            Please be noted that orders cannot be cancelled once the item has been shipped.
          </li>
        </ul>
      </section>
    </div>
  );
};
export default Policies;
