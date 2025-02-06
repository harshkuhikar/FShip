// backend/netlify/functions/generate-pdf.js
const axios = require("axios");
const PDFDocument = require("pdfkit");

const FSHIP_API_URL = "https://capi-qc.fship.in";
const FSHIP_API_KEY = "085c36066064af83c66b9dbf44d190d40feec79f437bc1c1cb";

// Handler function for Netlify
exports.handler = async (event, context) => {
  const { waybill } = JSON.parse(event.body);

  try {
    // Fetch data from FShip API
    const response = await axios.post(
      `${FSHIP_API_URL}/api/shippinglabel`,
      { waybill },
      {
        headers: {
          signature: FSHIP_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    // Create PDF
    const doc = new PDFDocument({ size: "A4" });

    // Set headers for the PDF response
    const res = {
      statusCode: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="shipping_label.pdf"`,
      },
      body: "",
    };

    // Pipe the PDF to response
    doc.pipe(res.body);

    // Add content to PDF
    doc.fontSize(20).text("FShip Shipping Label", { align: "center" });

    if (response.data.resultDetails && response.data.resultDetails[waybill]) {
      doc
        .fontSize(12)
        .text(
          `Waybill Number: ${response.data.resultDetails[waybill].AWBNumber}`,
          { align: "left" }
        );
      doc.text(
        `Customer Name: ${response.data.resultDetails[waybill].ConsigneeDetails.CustomerName}`
      );
      doc.text(
        `Address: ${response.data.resultDetails[waybill].ConsigneeDetails.CustomerAddress1}`
      );
    } else {
      doc.text("No data found for the provided waybill number.");
    }

    // Finalize the PDF
    doc.end();

    return res;
  } catch (error) {
    console.error("Error generating PDF:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate PDF" }),
    };
  }
};
