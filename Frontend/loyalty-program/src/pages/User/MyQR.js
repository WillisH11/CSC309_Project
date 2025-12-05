import React from "react";
import {QRCodeCanvas} from "qrcode.react";
import { useAuth } from "../../Contexts/AuthContext";
import "./MyQR.css";

export default function MyQR() {
  const { user } = useAuth();  // get logged-in user

  if (!user) return <h2>Loading...</h2>;

  const qrValue = JSON.stringify({
    type: "user",
    userId: user.id,
    utorid: user.utorid,
  });

  return (
    <div className="qr-container">
      <h1>My QR Code</h1>
      <p>Show this QR code to the cashier to start a transaction.</p>

      <div className="qr-box">
        <QRCodeCanvas
          value={qrValue}
          size={240}
          bgColor="#ffffff"
          fgColor="#000000"
          level="H"
        />
      </div>

      <p className="qr-uid">User ID: {user.id}</p>
    </div>
  );
}
