import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../../../assets/images/DK-slogan-for-Mail-01.png';
import signatureImg from '../../../assets/images/signature.png';
import stampImg from '../../../assets/images/stamp.png';

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
        doc.addImage(logo, 'PNG', 14, 10, 50, 20);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Tax Invoice', 105, 15, { align: 'center' });
        let y = 40;
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
        doc.text(`GSTIN: 36AAMCP6691B1Z5`, 14, y);
        const billing = invoice["Billing To"];
        const delivery = invoice["Delivery To"];
        y += 10;
        doc.setFont('helvetica', 'bold');
        doc.text('Order Details:', 14, y);
        doc.text('Bill To / Ship To:', 105, y);

        doc.setFont('helvetica', 'normal');
        y += 5;
        let yLeft = y;
        let yRight = y;
        doc.text(`Order ID: ${invoice.order_id}`, 14, yLeft);
        yLeft += 5;
        doc.text(`Order Date: ${invoice.order_date}`, 14, yLeft);
        yLeft += 5;
        doc.text(`${delivery.name}`, 105, yRight);
        yRight += 5;
        const deliveryAddress = delivery.address.split('\n');
        deliveryAddress.forEach(line => {
            const splitLines = doc.splitTextToSize(line, 90);
            splitLines.forEach(subLine => {
                doc.text(subLine, 105, yRight);
                yRight += 5;
            });
        });
        doc.text(`Invoice No: ${invoice.invoice_number}`, 14, yLeft);
        yLeft += 5;
        doc.text(`Invoice Date: ${invoice.invoice_date}`, 14, yLeft);
        y = Math.max(yLeft, yRight) + 5;
        autoTable(doc, {
            startY: y + 10,
            head: [[
                'S.No',
                'Product Title',
                'HSN',
                'Qty',
                'Gross Amount',
                'Discount',
                'GST',
                'Total'
            ]],
            body: invoice.items.map((item, i) => ([
                i + 1,
                item.product_name,
                item.hsn,
                item.quantity,
                Number(item.price).toFixed(2),
                Number(item.discount).toFixed(2),
                Number(item.gst_amount).toFixed(2),
                Number(item.final_price).toFixed(2),
            ])),

            headStyles: {
                fillColor: [68, 80, 130],
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
        doc.text(`Grand Total:  INR ${Number(invoice.grand_total).toFixed(2)}`, 150, totalY);
        doc.setFont('helvetica', 'normal');
        doc.text(`Payment Mode: ${invoice.payment_mode}`, 150, totalY + 7);
        doc.addImage(signatureImg, 'PNG', 140, totalY + 10, 30, 15);
        doc.addImage(stampImg, 'PNG', 170, totalY + 10, 30, 30);

        doc.setFont('helvetica', 'italic');
        doc.text('Authorized Signatory', 150, totalY + 50);

        const footerY = totalY + 60;
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