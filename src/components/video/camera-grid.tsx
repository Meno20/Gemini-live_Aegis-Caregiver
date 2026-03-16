'use client';

import { CameraController } from './camera-controller';

export function CameraGrid({ patientId }: { patientId: string }) {
  // Hardcoded multiple rooms for the grid view demonstration
  const rooms = [
    { id: 'living-room', name: 'Living Room' },
    { id: 'kitchen', name: 'Kitchen' },
    { id: 'bedroom', name: 'Bedroom' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Live Camera Feeds</h2>
            <p className="text-sm text-slate-500">Continuous AI monitoring across rooms</p>
         </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {rooms.map(room => (
          <CameraController key={room.id} roomId={room.id} patientId={patientId} />
        ))}
      </div>
    </div>
  );
}
