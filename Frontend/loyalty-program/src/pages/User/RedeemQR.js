import React from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useParams } from "react-router-dom";
import "./RedeemQR.css";

export default function RedeemQR() {
  // Get transaction ID from URL
  const { requestId } = useParams();

  if (!requestId) {
    return <h2 style={{ textAlign: "center", marginTop: "2rem" }}>Invalid redemption request.</h2>;
  }

  const qrValue = JSON.stringify({
    type: "redemption",
    requestId: Number(requestId),
  });

  return (
    <div className="qr-page-container">
      <h1>Redemption QR</h1>
      <p>Show this to a cashier to complete your redemption.</p>

      <div className="qr-box">
        <QRCodeCanvas
          value={qrValue}
          size={240}
          bgColor="#ffffff"
          fgColor="#000000"
          level="H"
        />
      </div>

      <p className="qr-id">Request ID: {requestId}</p>
    </div>
  );
}
