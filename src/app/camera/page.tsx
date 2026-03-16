'use client';

import dynamic from 'next/dynamic';

const CameraViewer = dynamic(() => import('@/components/video/camera-viewer'), { ssr: false });

export default function CameraPage() {
  return (
    <div className="w-full">
      <CameraViewer />
    </div>
  );
}
