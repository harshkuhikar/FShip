const express = require("express");
const axios = require("axios");
const PDFDocument = require("pdfkit");
const cors = require("cors");
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const FSHIP_API_URL = "https://capi-qc.fship.in";
const FSHIP_API_KEY = "085c36066064af83c66b9dbf44d190d40feec79f437bc1c1cb";

// Endpoint to generate PDF
app.post("/generate-pdf", async (req, res) => {
  const { waybill } = req.body;
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

    console.log("API Response:", response.data); // Log the API response

    // Create PDF
    const doc = new PDFDocument({ size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="shipping_label.pdf"`
    );

    // Pipe the PDF to the response
    doc.pipe(res);

    // Add content to PDF
    doc.fontSize(20).text("FShip Shipping Label", { align: "center" });

    // Check if the response contains the expected data
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

    // Finalize the PDF and end the stream
    doc.end();
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
});
