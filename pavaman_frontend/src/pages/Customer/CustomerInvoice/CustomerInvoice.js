// InvoiceGenerator.js
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import signatureImg from '../../../assets/images/aviation-logo.png';
import API_BASE_URL from "../../../config";
const generateInvoicePDF = async (customerId, order, mode = 'download') => {
    try {
        const response = await fetch(`${API_BASE_URL}/generate-invoice-for-customer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customer_id: customerId,
                product_order_id: order.product_order_id,
            }),
        });

        const result = await response.json();

        if (result.status_code !== 200 || !result.invoices?.length) {
            alert('No invoice data available.');
            return;
        }

        const invoice = result.invoices[0];
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Tax Invoice', 105, 15, { align: 'center' });
        let y = 25;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Sold By: Pavaman Aviation`, 14, y);

        y += 5;
        doc.setFont('helvetica', 'normal');
        doc.text(`Ship-from Address:`, 14, y);

        const addressLines = [
            "Survey 37, 2nd floor, Kapil Kavuri Hub.144,",
            "Financial District, Nanakramguda,",
            "Hyderabad, Telangana 500032"
        ];
        addressLines.forEach(line => {
            y += 5;
            doc.text(line, 14, y);
        });

        y += 5;
        doc.setFont('helvetica', 'bold');
        doc.text(`GSTIN: XXABCDEFGH1Z1`, 14, y);
        const billing = invoice["Billing To"];
        const delivery = invoice["Delivery To"];

        y += 10;
        doc.setFont('helvetica', 'bold');
        doc.text('Bill To:', 14, y);
        doc.text('Ship To:', 105, y);

        doc.setFont('helvetica', 'normal');
        y += 5;
        doc.text(`${billing.name}`, 14, y);
        doc.text(`${delivery.name}`, 105, y);

        y += 5;
        doc.text(`Phone: ${billing.phone}`, 14, y);
        doc.text(`Phone: ${delivery.phone}`, 105, y);

        y += 5;
        const deliveryAddress = delivery.address.split('\n');
        deliveryAddress.forEach(line => {
            const splitLines = doc.splitTextToSize(line, 90); 
            splitLines.forEach(subLine => {
                doc.text(subLine, 105, y);
                y += 5;
            });
        });

        y += 5;
        doc.setFont('helvetica', 'bold');
        doc.text(`Invoice No: ${invoice.invoice_number}`, 14, y);
        doc.text(`Invoice Date: ${invoice.invoice_date}`, 105, y);

        y += 5;
        doc.text(`Order ID: ${invoice.order_id}`, 14, y);
        doc.text(`Order Date: ${invoice.order_date}`, 105, y);

        autoTable(doc, {
            startY: y + 10,
            head: [[
                'Product Title',
                'Qty',
                'Price',
                'Discount%',
                'Gross Amount',
                'GST (%)',
                'Total'
            ]],
            body: invoice.items.map(item => ([
                item.product_name,
                item.quantity,
                item.price,
                item.discount_percent,
                item.gross_amount,
                item.gst,
                item.total_price
            ])),
            headStyles: {
                fillColor: [68, 80, 162],
                textColor: [255, 255, 255],
                fontSize: 10,
                halign: 'center',
                fontStyle: 'bold',
                fontFamily: 'helvetica'
            },
            styles: {
                fontSize: 9,
                halign: 'center',
                cellPadding: 3,
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            willDrawCell: (data) => {
                if (data.section === 'head') {
                    doc.setFont('helvetica', 'bold');
                } else if (data.section === 'body') {
                    doc.setFont('helvetica', 'normal');
                }
            }
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const totalY = doc.lastAutoTable.finalY + 10;

        doc.setFont('helvetica', 'bold');
        doc.text(`Grand Total  ${invoice.grand_total}`, 150, totalY);

        doc.setFont('helvetica', 'normal');
        doc.text(`Payment Mode: ${invoice.payment_mode}`, 150, totalY + 7);
        doc.addImage(signatureImg, 'PNG', 150, totalY + 10, 40, 15);

        doc.setFont('helvetica', 'italic');
        doc.text('Authorized Signatory', 150, totalY + 35);

        const footerY = totalY + 40;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('*Keep this invoice and manufacturer box for warranty purposes.', 14, footerY);
        doc.text('The goods sold are intended for end-user consumption and not for re-sale.', 14, footerY + 5);
        doc.text('For support, contact us at: support@yourstore.com', 14, footerY + 10);

        if (mode === 'view') {
            doc.output('dataurlnewwindow'); 
        } else {
            doc.save(`Invoice_${invoice.invoice_number}.pdf`);
        }

    } catch (error) {
        console.error("PDF generation error:", error);
        alert("Failed to generate invoice.");
    }
};

export default generateInvoicePDF;