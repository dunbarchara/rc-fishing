import { useRef } from 'react';
import { ReactSketchCanvas } from 'react-sketch-canvas';
import type { ReactSketchCanvasRef } from 'react-sketch-canvas';

interface Props {
  onSave: (pngDataUrl: string) => void | Promise<void>;
  saving?: boolean;
}

export default function DrawingCanvas({ onSave, saving = false }: Props) {
  // Reference to interact with the canvas
  const canvasRef = useRef<ReactSketchCanvasRef>(null);

  const handleSave = async () => {
    // Export drawing from canvas as Base64 string
    const imageData = await canvasRef.current?.exportImage('png');
    if (!imageData) return;
    await onSave(imageData);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      <h2 className="text-xl font-bold mb-2">Draw Something</h2>

      {/* The wrapper enforces the square shape and disables native mobile scrolling */}
      <div style={{
          width: '100%',
          maxWidth: '400px',
          aspectRatio: '1 / 1',
          touchAction: 'none'
      }}>
        <ReactSketchCanvas
          ref={canvasRef}
          style={{ border: '2px solid #333', borderRadius: '8px' }}
          width="100%"
          height="100%"
          strokeWidth={4}
          strokeColor="#000000"
          canvasColor="#ffffff"
        />
      </div>

      {/* Controls */}
      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button
          onClick={() => canvasRef.current?.clearCanvas()}
          className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
        >
          Clear
        </button>
        <button
          onClick={() => canvasRef.current?.undo()}
          className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
        >
          Undo
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-1 rounded transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save & Fetch Drawing'}
        </button>
      </div>
    </div>
  );
}
