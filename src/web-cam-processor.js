import { useEffect, useRef } from "react";
import * as faceapi from "face-api.js";

export default function WebcamFrameProcessor() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const processingRef = useRef(false);
  const selfieRef = useRef();
  const selfieFacedetection = useRef(null);
  let lastFrameTime = 0;

  async function detectSelfieFace() {
    if (selfieRef.current) {
      const detection = await faceapi
        .detectSingleFace(
          selfieRef.current,
          new faceapi.TinyFaceDetectorOptions()
        )
        .withFaceLandmarks()
        .withFaceDescriptor();
      selfieFacedetection.current = detection;
      console.log("Selfie face detection", selfieFacedetection);
    }
  }

  useEffect(() => {
    async function startWebcam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing webcam:", error);
      }
    }

    startWebcam();
    detectSelfieFace();
  }, []);

  const processFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    // Get image data
    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Call another function with the frame data
    handleFrame();

    if (processingRef.current) {
      requestAnimationFrame(processFrame);
    }
  };

  const handleFrame = async () => {
    if (!canvasRef.current) return;
    await detectSelfieFace();

    // Measure FPS
    const now = performance.now();
    const delta = now - lastFrameTime;
    const fps = 1000 / delta;
    lastFrameTime = now;

    console.log("FPS: ", Math.round(fps));

    // Use the canvasRef directly for face detection
    const videoFaceDetection = await faceapi
      .detectSingleFace(
        canvasRef.current,
        new faceapi.TinyFaceDetectorOptions()
      )
      .withFaceLandmarks()
      .withFaceDescriptor();

    // Ensure selfieFaceDetection is ready
    if (selfieFacedetection.current && videoFaceDetection) {
      const distance = faceapi.euclideanDistance(
        videoFaceDetection.descriptor,
        selfieFacedetection.current.descriptor
      );
      console.log("Distance: ", distance);
    } else {
      console.log("Face not detected in frame or selfie.");
    }
  };

  const startProcessing = () => {
    if (!processingRef.current) {
      processingRef.current = true;
      processFrame();
    }
  };

  const stopProcessing = () => {
    processingRef.current = false;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="gallery">
        <img
          ref={selfieRef}
          src={require("./images/selfie.jpg")}
          alt="Selfie"
          height="auto"
        />
      </div>
      <video ref={videoRef} autoPlay playsInline className="border" />
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <div className="mt-2">
        <button
          onClick={startProcessing}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Start Processing
        </button>
        <button
          onClick={stopProcessing}
          className="px-4 py-2 bg-red-500 text-white rounded ml-2"
        >
          Stop Processing
        </button>
      </div>
    </div>
  );
}
