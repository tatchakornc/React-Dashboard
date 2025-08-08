import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';

const QRCodeScanner = ({ onScanResult, onError, isActive = true }) => {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    const initializeScanner = async () => {
      try {
        // Request camera permission
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment' // ใช้กล้องหลัง
          } 
        });
        setHasPermission(true);
        
        // Stop the test stream
        stream.getTracks().forEach(track => track.stop());
        
        // Initialize the reader
        readerRef.current = new BrowserMultiFormatReader();
        startScanning();
      } catch (error) {
        console.error('Camera permission error:', error);
        setHasPermission(false);
        if (onError) {
          onError('ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตการใช้งานกล้อง');
        }
      }
    };

    initializeScanner();

    return () => {
      stopScanning();
    };
  }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  const startScanning = async () => {
    if (!readerRef.current || !videoRef.current || isScanning) return;

    try {
      setIsScanning(true);
      await readerRef.current.decodeFromVideoDevice(
        undefined, // Use default camera
        videoRef.current,
        (result, error) => {
          if (result) {
            console.log('QR Code scanned:', result.getText());
            if (onScanResult) {
              onScanResult(result.getText());
            }
          }
          if (error && error.name !== 'NotFoundException') {
            console.error('Scan error:', error);
          }
        }
      );
    } catch (error) {
      console.error('Scanner initialization error:', error);
      setIsScanning(false);
      if (onError) {
        onError('เกิดข้อผิดพลาดในการเริ่มสแกน');
      }
    }
  };

  const stopScanning = () => {
    if (readerRef.current) {
      readerRef.current.reset();
    }
    setIsScanning(false);
  };

  if (hasPermission === false) {
    return (
      <div className="qr-scanner-error">
        <div className="error-icon">
          <i className="fas fa-camera-slash"></i>
        </div>
        <h3>ไม่สามารถเข้าถึงกล้องได้</h3>
        <p>กรุณาอนุญาตการใช้งานกล้องเพื่อสแกน QR Code</p>
        <button 
          className="btn btn-primary"
          onClick={() => window.location.reload()}
        >
          ลองใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  if (hasPermission === null) {
    return (
      <div className="qr-scanner-loading">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
        </div>
        <p>กำลังขออนุญาตใช้งานกล้อง...</p>
      </div>
    );
  }

  return (
    <div className="qr-scanner">
      <div className="scanner-container">
        <video 
          ref={videoRef} 
          className="scanner-video"
          playsInline
          muted
        />
        <div className="scanner-overlay">
          <div className="scanner-frame">
            <div className="corner top-left"></div>
            <div className="corner top-right"></div>
            <div className="corner bottom-left"></div>
            <div className="corner bottom-right"></div>
          </div>
        </div>
        <div className="scanner-instructions">
          <p>วาง QR Code ให้อยู่ในกรอบ</p>
          <small>กล้องจะสแกนอัตโนมัติ</small>
        </div>
      </div>
    </div>
  );
};

export default QRCodeScanner;
