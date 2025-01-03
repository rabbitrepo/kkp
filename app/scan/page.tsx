'use client'

import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Camera, CameraType } from './Camera';
import { LifeLine } from 'react-loading-indicators';
import axios from 'axios';
import { json } from 'stream/consumers';

const Wrapper = styled.div`
  position: fixed;
  width: 100%;
  height: 100%;
  z-index: 1;
`;

const Control = styled.div`
  position: fixed;
  display: flex;
  right: 0;
  width: 20%;
  min-width: 130px;
  min-height: 130px;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  z-index: 10;
  display: flex;
  align-items: center; // Keep this for vertical centering
  justify-content: center;
  padding: 50px;
  box-sizing: border-box;
  flex-direction: column-reverse;

  @media (max-aspect-ratio: 1/1) {
    flex-direction: row;
    bottom: 0;
    width: 100%;
    height: 20%;
    justify-content: center; 
  }

  @media (max-width: 400px) {
    padding: 10px;
  }
`;

const Button = styled.button`
  outline: none;
  color: white;
  opacity: 1;
  background: transparent;
  background-color: transparent;
  padding: 0;
  text-shadow: 0px 0px 4px black;
  pointer-events: auto;
  cursor: pointer;
  z-index: 2;
  filter: invert(100%);
  border: none;

  &:hover {
    opacity: 0.7;
  }
`;

const TakePhotoButton = styled(Button)`
  background: url('https://img.icons8.com/ios/50/000000/compact-camera.png');
  background-position: center;
  background-size: 50px;
  background-repeat: no-repeat;
  width: 80px;
  height: 80px;
  border: solid 4px black;
  border-radius: 50%;

  &:hover {
    background-color: rgba(0, 0, 0, 0.3);
  }
`;

const TorchButton = styled(Button)`
  background: url('https://img.icons8.com/ios/50/000000/light.png');
  background-position: center;
  background-size: 50px;
  background-repeat: no-repeat;
  width: 80px;
  height: 80px;
  border: solid 4px black;
  border-radius: 50%;

  &.toggled {
    background-color: rgba(0, 0, 0, 0.3);
  }
`;

const ChangeFacingCameraButton = styled(Button)`
  background: url(https://img.icons8.com/ios/50/000000/switch-camera.png);
  background-position: center;
  background-size: 40px;
  background-repeat: no-repeat;
  width: 40px;
  height: 40px;
  padding: 40px;
  &:disabled {
    opacity: 0;
    cursor: default;
    padding: 60px;
  }
  @media (max-width: 400px) {
    padding: 40px 5px;
    &:disabled {
      padding: 40px 25px;
    }
  }
`;

const ImagePreview = styled.div<{ $image: string | null }>`
  width: 120px;
  height: 120px;
  ${({ $image }) => ($image ? `background-image: url(${$image});` : '')}
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;

  @media (max-width: 400px) {
    width: 50px;
    height: 120px;
  }
`;

const FullScreenImagePreview = styled.div<{ $image: string | null }>`
  width: 100%;
  height: 100%;
  z-index: 100;
  position: absolute;
  background-color: black;
  ${({ $image }) => ($image ? `background-image: url(${$image});` : '')}
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
`;

const App = () => {
  const [numberOfCameras, setNumberOfCameras] = useState(0);
  const [image, setImage] = useState<string | null>(null);
  const [showImage, setShowImage] = useState<boolean>(false);
  const camera = useRef<CameraType>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((i) => i.kind === 'videoinput');
      setDevices(videoDevices);
    })();
  }, []);

  const handleTakePhoto = async () => {
    if (camera.current) {
      setLoading(true); // Set loading to true when starting the photo process
      const photo = camera.current.takePhoto();
      alert(process.env.NEXT_PUBLIC_SERVER_URL)
      // Convert base64 to Blob
      const byteString = atob(photo.split(',')[1]);
      const mimeString = photo.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });

      // Create FormData and append the blob
      const formData = new FormData();
      formData.append('test_image', blob, 'photo.jpg');

      // Make the HTTP request
      try {
        const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/recognize`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        alert('success')
        alert(JSON.stringify(response.data)); // Alert the response
      } catch (error) {
        console.error('Error uploading photo:', error);
        alert('Error uploading photo');
        alert(JSON.stringify(error))
      } finally {
        setLoading(false); // Set loading to false after the request completes
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-fill">
        <LifeLine color="#2563eb" size="medium" text="" textColor="" />
      </div>
    );
  }

  return (
    <Wrapper>
      {showImage ? (
        <FullScreenImagePreview
          $image={image} // Use transient prop
          onClick={() => {
            setShowImage(!showImage);
          }}
        />
      ) : (
        <Camera
          ref={camera}
          $aspectRatio="cover" // Use transient prop
          numberOfCamerasCallback={(i) => setNumberOfCameras(i)}
          videoSourceDeviceId={activeDeviceId}
          errorMessages={{
            noCameraAccessible: 'No camera device accessible. Please connect your camera or try a different browser.',
            permissionDenied: 'Permission denied. Please refresh and give camera permission.',
            switchCamera: 'It is not possible to switch camera to different one because there is only one video device accessible.',
            canvas: 'Canvas is not supported.',
          }}
          videoReadyCallback={() => {
            console.log('Video feed ready.');
          }}
        />
      )}
      <Control>
        {/* <TakePhotoButton
          onClick={() => {
            if (camera.current) {
              const photo = camera.current.takePhoto();
              console.log(photo);
              alert(photo)
              setImage(photo as string);
            }
          }}
        /> */}
        <TakePhotoButton onClick={handleTakePhoto} />
      </Control>
    </Wrapper>
  );
};

export default App;